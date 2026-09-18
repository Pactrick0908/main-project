import { prisma } from "../lib/prisma.js";
import { WalletService } from "./wallet.service.js";
import { TicketService } from "./ticket.service.js";
import { SolanaService } from "./solana.service.js";

const MONTH_LABELS = [
  "Th1",
  "Th2",
  "Th3",
  "Th4",
  "Th5",
  "Th6",
  "Th7",
  "Th8",
  "Th9",
  "Th10",
  "Th11",
  "Th12",
];

function buildMonthSeries(
  rows: Array<{ amount: number; at: Date }>,
  months = 12,
) {
  const now = new Date();
  const buckets = new Map<string, { label: string; revenue: number }>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      label: `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      revenue: 0,
    });
  }
  for (const row of rows) {
    const at = new Date(row.at);
    const key = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.revenue += row.amount;
  }
  return [...buckets.entries()].map(([key, v]) => ({ key, ...v }));
}

function buildYearSeries(
  rows: Array<{ amount: number; at: Date }>,
  years = 5,
) {
  const nowYear = new Date().getFullYear();
  const buckets = new Map<number, number>();
  for (let y = nowYear - (years - 1); y <= nowYear; y++) {
    buckets.set(y, 0);
  }
  for (const row of rows) {
    const y = new Date(row.at).getFullYear();
    if (buckets.has(y)) buckets.set(y, (buckets.get(y) ?? 0) + row.amount);
  }
  return [...buckets.entries()].map(([year, revenue]) => ({
    key: String(year),
    label: String(year),
    revenue,
  }));
}

export class AdminService {
  static async getDashboard(opts?: {
    organizerId?: number;
    eventId?: number;
    includeWallet?: boolean;
  }) {
    const organizerId = opts?.organizerId;
    const eventId = opts?.eventId;
    const includeWallet = Boolean(opts?.includeWallet);

    if (eventId) {
      const ev = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, organizerId: true, title: true },
      });
      if (!ev) {
        throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
      }
      if (organizerId && ev.organizerId !== organizerId) {
        throw Object.assign(new Error("Không xem được sự kiện này"), {
          status: 403,
        });
      }
    }

    const organizerScope = organizerId ? { event: { organizerId } } : {};
    const ticketScope = {
      ...(eventId ? { eventId } : organizerScope),
    };
    const orderScope = {
      status: "PAID" as const,
      ...(eventId ? { eventId } : organizerScope),
    };
    // Chart always aggregates every event (or all of this organizer), ignoring eventId filter.
    const chartOrderScope = {
      status: "PAID" as const,
      ...organizerScope,
    };
    const chartTicketScope = { ...organizerScope };

    const [
      soldTickets,
      checkedIn,
      paidOrders,
      ticketPrices,
      chartPaidOrders,
      chartTicketPrices,
      eventOptions,
      wallet,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          status: { in: ["sold", "checked_in", "valid"] },
          ...ticketScope,
        },
      }),
      prisma.ticket.count({
        where: { status: "checked_in", ...ticketScope },
      }),
      prisma.order.findMany({
        where: orderScope,
        select: { totalAmount: true, createdAt: true, updatedAt: true },
      }),
      prisma.ticket.findMany({
        where: {
          status: { in: ["sold", "checked_in", "valid"] },
          ...ticketScope,
        },
        select: {
          createdAt: true,
          eventZone: { select: { price: true } },
        },
      }),
      prisma.order.findMany({
        where: chartOrderScope,
        select: { totalAmount: true, createdAt: true, updatedAt: true },
      }),
      prisma.ticket.findMany({
        where: {
          status: { in: ["sold", "checked_in", "valid"] },
          ...chartTicketScope,
        },
        select: {
          createdAt: true,
          eventZone: { select: { price: true } },
        },
      }),
      organizerId
        ? prisma.event.findMany({
            where: { organizerId },
            select: { id: true, title: true, status: true },
            orderBy: { id: "desc" },
          })
        : prisma.event.findMany({
            select: { id: true, title: true, status: true },
            orderBy: { id: "desc" },
          }),
      includeWallet
        ? SolanaService.getHotWalletStatus().catch(() => null)
        : Promise.resolve(null),
    ]);

    const orderRevenue = paidOrders.reduce(
      (sum, o) => sum + Number(o.totalAmount),
      0,
    );
    const ticketRevenue = ticketPrices.reduce(
      (sum, t) => sum + Number(t.eventZone.price),
      0,
    );
    const revenue = orderRevenue > 0 ? orderRevenue : ticketRevenue;

    const seriesSource =
      chartPaidOrders.length > 0
        ? chartPaidOrders.map((o) => ({
            amount: Number(o.totalAmount),
            at: o.updatedAt ?? o.createdAt,
          }))
        : chartTicketPrices.map((t) => ({
            amount: Number(t.eventZone.price),
            at: t.createdAt,
          }));

    return {
      eventId: eventId ?? null,
      soldTickets,
      checkedIn,
      checkInRate: soldTickets
        ? Math.round((checkedIn / soldTickets) * 100)
        : 0,
      revenue,
      events: eventOptions,
      revenueByMonth: buildMonthSeries(seriesSource),
      revenueByYear: buildYearSeries(seriesSource),
      wallet,
    };
  }

  /** Check-in thủ công (mất máy / hết pin) */
  static async manualCheckIn(ticketId: number, adminLabel?: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        event: true,
        eventZone: { include: { zone: true } },
        seat: true,
        user: true,
      },
    });

    if (!ticket) {
      throw Object.assign(new Error("Không tìm thấy vé"), { status: 404 });
    }
    if (ticket.status === "revoked" || ticket.status === "cancelled") {
      throw Object.assign(new Error("Vé đã bị khóa / hủy"), { status: 409 });
    }
    if (ticket.checkedInAt || ticket.status === "checked_in") {
      throw Object.assign(new Error("Vé đã check-in trước đó"), { status: 409 });
    }
    if (!["sold", "valid"].includes(ticket.status ?? "")) {
      throw Object.assign(new Error("Vé chưa ở trạng thái có thể check-in"), {
        status: 409,
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "checked_in",
        checkedInAt: new Date(),
        checkedInBy: adminLabel ?? "admin-manual",
      },
      include: {
        event: true,
        eventZone: { include: { zone: true } },
        seat: true,
        user: true,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      checkedInAt: updated.checkedInAt,
      isCheckedIn: true,
      event: { id: updated.event.id, title: updated.event.title },
      zoneName: updated.eventZone.zone.name,
      ownerName: updated.user?.fullName ?? null,
      ownerEmail: updated.user?.email ?? null,
    };
  }

  static async revokeTicket(ticketId: number, reason?: string) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw Object.assign(new Error("Không tìm thấy vé"), { status: 404 });
    }
    if (ticket.status === "checked_in") {
      throw Object.assign(new Error("Không khóa được vé đã check-in"), {
        status: 409,
      });
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "revoked",
        checkedInBy: reason ? `revoked:${reason}` : "revoked",
      },
    });

    // Invalidate outstanding nonces
    await prisma.ticketNonce.updateMany({
      where: { ticketId, usedAt: null },
      data: { usedAt: new Date() },
    });

    return { id: updated.id, status: updated.status };
  }

  /**
   * Airdrop / vé mời — tìm user theo email hoặc tạo guest từ wallet.
   */
  static async airdrop(params: {
    eventId: number;
    eventZoneId: number;
    email?: string;
    walletAddress?: string;
    organizerId: number;
  }) {
    const eventZone = await prisma.eventZone.findFirst({
      where: { id: params.eventZoneId, eventId: params.eventId },
      include: { zone: true, event: true },
    });
    if (!eventZone) {
      throw Object.assign(new Error("Hạng vé không thuộc sự kiện"), {
        status: 404,
      });
    }

    const sold = await prisma.ticket.count({
      where: {
        eventZoneId: eventZone.id,
        status: { in: ["sold", "checked_in", "valid"] },
      },
    });
    if (sold >= eventZone.totalSeats) {
      throw Object.assign(new Error("Hạng vé đã hết chỗ"), { status: 409 });
    }

    let user =
      params.email
        ? await prisma.user.findUnique({ where: { email: params.email } })
        : null;

    let ownerWallet = params.walletAddress ?? user?.walletAddress ?? null;

    if (!user && params.email) {
      const googleId = `airdrop:${params.email.toLowerCase()}`;
      const wallet = WalletService.createWalletFromGoogle(googleId);
      ownerWallet = wallet.publicKey.toBase58();
      const customerRole = await prisma.role.findUnique({
        where: { name: "customer" },
      });
      user = await prisma.user.create({
        data: {
          email: params.email,
          fullName: params.email.split("@")[0] || "Guest",
          googleId,
          walletAddress: ownerWallet,
          avatarUrl: "",
          ...(customerRole ? { roleId: customerRole.id } : {}),
        },
      });
    }

    if (!ownerWallet) {
      throw Object.assign(new Error("Cần email hoặc địa chỉ ví người nhận"), {
        status: 400,
      });
    }

    let seatId: number | null = null;
    if (eventZone.zone.hasSeats) {
      let seat = await prisma.seat.findFirst({
        where: { zoneId: eventZone.zoneId },
        orderBy: { id: "asc" },
      });
      if (!seat) {
        seat = await prisma.seat.create({
          data: {
            zoneId: eventZone.zoneId,
            rowName: "G",
            seatNumber: sold + 1,
          },
        });
      }
      seatId = seat.id;
    }

    const ticket = await prisma.ticket.create({
      data: {
        eventId: params.eventId,
        eventZoneId: eventZone.id,
        seatId,
        userId: user?.id ?? null,
        ownerWallet,
        status: "sold",
        mintAddress: `airdrop-${Date.now()}`,
      },
      include: {
        event: true,
        eventZone: { include: { zone: true } },
        seat: true,
        user: true,
      },
    });

    return {
      id: ticket.id,
      status: ticket.status,
      ownerWallet: ticket.ownerWallet,
      mintAddress: ticket.mintAddress,
      isCheckedIn: false,
      event: { id: ticket.event.id, title: ticket.event.title },
      zoneName: ticket.eventZone.zone.name,
      price: Number(ticket.eventZone.price),
      seatLabel: ticket.seat
        ? `${ticket.seat.rowName}-${ticket.seat.seatNumber}`
        : null,
      ownerName: ticket.user?.fullName ?? null,
      ownerEmail: ticket.user?.email ?? null,
    };
  }

  static async listTickets(q?: string) {
    const tickets = await TicketService.listAllForAdmin();
    // Also include revoked for admin view
    const revoked = await prisma.ticket.findMany({
      where: { status: "revoked" },
      include: {
        event: true,
        eventZone: { include: { zone: true } },
        seat: true,
        user: true,
      },
      orderBy: { id: "desc" },
      take: 100,
    });

    const revokedMapped = revoked.map((t) => ({
      id: t.id,
      status: t.status,
      ownerWallet: t.ownerWallet,
      mintAddress: t.mintAddress,
      checkedInAt: t.checkedInAt,
      isCheckedIn: false,
      event: { id: t.event.id, title: t.event.title, bannerUrl: t.event.bannerUrl },
      zoneName: t.eventZone.zone.name,
      price: Number(t.eventZone.price),
      seatLabel: t.seat ? `${t.seat.rowName}-${t.seat.seatNumber}` : null,
      ownerName: t.user?.fullName ?? null,
      ownerEmail: t.user?.email ?? null,
    }));

    const all = [...tickets, ...revokedMapped].sort((a, b) => b.id - a.id);
    if (!q?.trim()) return all;

    const needle = q.trim().toLowerCase();
    return all.filter(
      (t) =>
        String(t.id).includes(needle) ||
        t.event.title.toLowerCase().includes(needle) ||
        t.ownerWallet?.toLowerCase().includes(needle) ||
        t.ownerName?.toLowerCase().includes(needle) ||
        t.ownerEmail?.toLowerCase().includes(needle),
    );
  }
}
