import { prisma } from "../lib/prisma.js";
import { WalletService } from "./wallet.service.js";
import { TicketService } from "./ticket.service.js";

export class AdminService {
  static async getDashboard() {
    const [
      soldTickets,
      checkedIn,
      revoked,
      eventsActive,
      eventsTotal,
      recentTickets,
      balance,
      paidOrders,
    ] = await Promise.all([
      prisma.ticket.count({
        where: { status: { in: ["sold", "checked_in", "valid"] } },
      }),
      prisma.ticket.count({ where: { status: "checked_in" } }),
      prisma.ticket.count({ where: { status: "revoked" } }),
      prisma.event.count({
        where: { status: { in: ["open", "active", "published"] } },
      }),
      prisma.event.count(),
      prisma.ticket.findMany({
        where: { status: { in: ["sold", "checked_in", "valid", "revoked"] } },
        include: {
          event: true,
          eventZone: { include: { zone: true } },
          seat: true,
          user: true,
        },
        orderBy: { id: "desc" },
        take: 8,
      }),
      prisma.adminBalance.findFirst({ orderBy: { id: "asc" } }),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true, adminAmount: true, systemAmount: true },
        _count: true,
      }),
    ]);

    const ticketRevenue = await prisma.ticket.findMany({
      where: { status: { in: ["sold", "checked_in", "valid"] } },
      select: { eventZone: { select: { price: true } } },
    });
    const revenueFromTickets = ticketRevenue.reduce(
      (sum, t) => sum + Number(t.eventZone.price),
      0,
    );

    return {
      soldTickets,
      checkedIn,
      revoked,
      checkInRate: soldTickets ? Math.round((checkedIn / soldTickets) * 100) : 0,
      eventsActive,
      eventsTotal,
      revenue: Number(balance?.totalRevenue ?? revenueFromTickets),
      systemRevenue: Number(balance?.systemRevenue ?? 0),
      paidOrders: paidOrders._count,
      orderRevenue: Number(paidOrders._sum.totalAmount ?? 0),
      recentTickets: recentTickets.map((t) => ({
        id: t.id,
        status: t.status,
        ownerWallet: t.ownerWallet,
        checkedInAt: t.checkedInAt,
        isCheckedIn: Boolean(t.checkedInAt) || t.status === "checked_in",
        event: { id: t.event.id, title: t.event.title },
        zoneName: t.eventZone.zone.name,
        price: Number(t.eventZone.price),
        ownerName: t.user?.fullName ?? null,
        ownerEmail: t.user?.email ?? null,
      })),
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
