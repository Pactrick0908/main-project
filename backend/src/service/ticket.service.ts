import { prisma } from "../lib/prisma.js";
import { WalletService } from "./wallet.service.js";
import {
  QR_TTL_MS,
  buildCheckInMessage,
  randomNonce,
  signMessage,
  verifySignature,
} from "../utils/crypto.js";

export type QrPayload = {
  ticketId: number;
  ownerPubkey: string;
  nonce: string;
  expiresAt: number;
  signature: string;
};

function serializeTicket(ticket: {
  id: number;
  status: string | null;
  ownerWallet: string | null;
  mintAddress: string | null;
  checkedInAt: Date | null;
  event: { id: number; title: string; bannerUrl: string | null };
  eventZone: { price: unknown; zone: { name: string } };
  seat: { rowName: string; seatNumber: number } | null;
  user: { fullName: string; email: string } | null;
}) {
  const seatLabel = ticket.seat
    ? `${ticket.seat.rowName}-${ticket.seat.seatNumber}`
    : null;

  return {
    id: ticket.id,
    status: ticket.status,
    ownerWallet: ticket.ownerWallet,
    mintAddress: ticket.mintAddress,
    checkedInAt: ticket.checkedInAt,
    isCheckedIn: Boolean(ticket.checkedInAt) || ticket.status === "checked_in",
    isListed: ticket.status === "listed",
    event: {
      id: ticket.event.id,
      title: ticket.event.title,
      bannerUrl: ticket.event.bannerUrl,
    },
    zoneName: ticket.eventZone.zone.name,
    price: Number(ticket.eventZone.price),
    seatLabel,
    ownerName: ticket.user?.fullName ?? null,
    ownerEmail: ticket.user?.email ?? null,
  };
}

const ticketInclude = {
  event: true,
  eventZone: { include: { zone: true } },
  seat: true,
  user: true,
} as const;

export class TicketService {
  static async listMine(walletAddress: string, userId?: number) {
    const tickets = await prisma.ticket.findMany({
      where: {
        OR: [
          { ownerWallet: walletAddress },
          ...(userId ? [{ userId }] : []),
        ],
        status: { in: ["sold", "checked_in", "valid", "listed"] },
      },
      include: ticketInclude,
      orderBy: { id: "desc" },
    });

    return tickets.map(serializeTicket);
  }

  /** Cấp vé demo cho user đang đăng nhập (để test QR + scanner). */
  static async issueDemoTicket(params: {
    userId: number;
    googleId: string;
    email: string;
    fullName: string;
    walletAddress: string;
  }) {
    let place = await prisma.place.findFirst();
    if (!place) {
      place = await prisma.place.create({
        data: {
          name: "SVĐ Mỹ Đình",
          address: "Đường Lê Đức Thọ, Nam Từ Liêm",
          city: "Hà Nội",
        },
      });
    }

    let zone = await prisma.zone.findFirst({ where: { placeId: place.id } });
    if (!zone) {
      zone = await prisma.zone.create({
        data: {
          placeId: place.id,
          name: "VIP",
          hasSeats: true,
        },
      });
    }

    let event = await prisma.event.findFirst({
      where: { status: "active" },
    });
    if (!event) {
      const organizer =
        (await prisma.user.findFirst({ where: { role: { name: "admin" } } })) ??
        (await prisma.user.findUnique({ where: { id: params.userId } }));

      if (!organizer) {
        throw new Error("Không tìm thấy user để gán organizer");
      }

      event = await prisma.event.create({
        data: {
          organizerId: organizer.id,
          placeId: place.id,
          title: "Đêm Nhạc Indie 2026 (Demo)",
          description: "Sự kiện demo cho Dynamic QR & scanner",
          bannerUrl:
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
          status: "active",
        },
      });
    }

    let eventZone = await prisma.eventZone.findFirst({
      where: { eventId: event.id, zoneId: zone.id },
    });
    if (!eventZone) {
      eventZone = await prisma.eventZone.create({
        data: {
          eventId: event.id,
          zoneId: zone.id,
          price: 1500000,
          totalSeats: 100,
        },
      });
    }

    // Mỗi vé demo cần ghế riêng (unique eventId+seatId)
    const seat = await prisma.seat.create({
      data: {
        zoneId: zone.id,
        rowName: "D",
        seatNumber: Number(`${Date.now() % 100000}${Math.floor(Math.random() * 90 + 10)}`),
      },
    });

    const ticket = await prisma.ticket.create({
      data: {
        eventId: event.id,
        eventZoneId: eventZone.id,
        seatId: seat.id,
        userId: params.userId,
        ownerWallet: params.walletAddress,
        status: "sold",
        mintAddress: `demo-${Date.now()}`,
      },
      include: ticketInclude,
    });

    // Best-effort on-chain mint
    try {
      const { SolanaService } = await import("./solana.service.js");
      await SolanaService.mintTicketOnChain({
        ticketId: ticket.id,
        recipientWallet: params.walletAddress,
      });
      const refreshed = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: ticketInclude,
      });
      if (refreshed) return serializeTicket(refreshed);
    } catch (err: any) {
      console.error(`❌ [Solana] Demo mint #${ticket.id}:`, err?.message);
    }

    return serializeTicket(ticket);
  }

  /**
   * Sinh Dynamic QR: nonce TTL 60s + ký Ed25519 bằng ví ngầm của chủ vé.
   */
  static async issueQrPayload(ticketId: number, requester: {
    walletAddress: string;
    googleId: string;
    userId?: number;
  }): Promise<{ payload: QrPayload; ttlMs: number; ticket: ReturnType<typeof serializeTicket> }> {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });

    if (!ticket) {
      throw Object.assign(new Error("Không tìm thấy vé"), { status: 404 });
    }

    const owns =
      ticket.ownerWallet === requester.walletAddress ||
      (requester.userId != null && ticket.userId === requester.userId);

    if (!owns) {
      throw Object.assign(new Error("Bạn không sở hữu vé này"), { status: 403 });
    }

    if (ticket.checkedInAt || ticket.status === "checked_in") {
      throw Object.assign(new Error("Vé đã được check-in"), { status: 409 });
    }

    if (ticket.status === "listed") {
      throw Object.assign(
        new Error("Vé đang niêm yết trên chợ P2P — hủy bán trước khi lấy QR"),
        { status: 409 },
      );
    }

    if (ticket.status === "revoked" || ticket.status === "cancelled") {
      throw Object.assign(new Error("Vé đã bị hủy / khóa"), { status: 409 });
    }

    const ownerWallet = ticket.ownerWallet ?? requester.walletAddress;
    const expiresAt = Date.now() + QR_TTL_MS;
    const nonce = randomNonce();

    await prisma.ticketNonce.create({
      data: {
        ticketId: ticket.id,
        nonce,
        expiresAt: new Date(expiresAt),
      },
    });

    // Dọn nonce hết hạn cũ (best-effort)
    void prisma.ticketNonce
      .deleteMany({
        where: {
          ticketId: ticket.id,
          expiresAt: { lt: new Date() },
          usedAt: null,
        },
      })
      .catch(() => undefined);

    const keypair = WalletService.createWalletFromGoogle(requester.googleId);
    if (keypair.publicKey.toBase58() !== ownerWallet) {
      // Fallback: vẫn ký bằng ví của requester (custodial đúng googleId)
    }

    const message = buildCheckInMessage(ticket.id, nonce, expiresAt);
    const signature = signMessage(keypair, message);

    const payload: QrPayload = {
      ticketId: ticket.id,
      ownerPubkey: keypair.publicKey.toBase58(),
      nonce,
      expiresAt,
      signature,
    };

    return {
      payload,
      ttlMs: QR_TTL_MS,
      ticket: serializeTicket(ticket),
    };
  }

  static async verifyQr(payload: QrPayload, scannerLabel?: string) {
    const { ticketId, ownerPubkey, nonce, expiresAt, signature } = payload;

    if (!ticketId || !ownerPubkey || !nonce || !expiresAt || !signature) {
      return {
        ok: false as const,
        code: "INVALID_PAYLOAD",
        message: "Dữ liệu QR không hợp lệ",
      };
    }

    if (Date.now() > expiresAt) {
      return {
        ok: false as const,
        code: "EXPIRED",
        message: "Mã QR đã hết hạn — yêu cầu khách mở lại vé",
      };
    }

    const nonceRow = await prisma.ticketNonce.findUnique({ where: { nonce } });
    if (!nonceRow || nonceRow.ticketId !== ticketId) {
      return {
        ok: false as const,
        code: "UNKNOWN_NONCE",
        message: "Nonce không hợp lệ hoặc không thuộc vé này",
      };
    }

    if (nonceRow.usedAt) {
      return {
        ok: false as const,
        code: "NONCE_REUSED",
        message: "Mã QR đã được quét trước đó (có thể là ảnh chụp màn hình)",
      };
    }

    if (nonceRow.expiresAt.getTime() < Date.now()) {
      return {
        ok: false as const,
        code: "EXPIRED",
        message: "Mã QR đã hết hạn",
      };
    }

    const message = buildCheckInMessage(ticketId, nonce, expiresAt);
    if (!verifySignature(message, signature, ownerPubkey)) {
      return {
        ok: false as const,
        code: "BAD_SIGNATURE",
        message: "Chữ ký Ed25519 không hợp lệ",
      };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: ticketInclude,
    });

    if (!ticket) {
      return {
        ok: false as const,
        code: "NOT_FOUND",
        message: "Không tìm thấy vé",
      };
    }

    if (ticket.ownerWallet && ticket.ownerWallet !== ownerPubkey) {
      return {
        ok: false as const,
        code: "OWNER_MISMATCH",
        message: "Ví trên QR không khớp chủ sở hữu vé",
      };
    }

    if (ticket.status === "listed") {
      return {
        ok: false as const,
        code: "LISTED",
        message: "Vé đang niêm yết P2P — không check-in được",
      };
    }

    if (ticket.status === "revoked" || ticket.status === "cancelled") {
      return {
        ok: false as const,
        code: "REVOKED",
        message: "Vé đã bị khóa / hủy",
      };
    }

    if (ticket.checkedInAt || ticket.status === "checked_in") {
      return {
        ok: false as const,
        code: "ALREADY_USED",
        message: `Vé đã check-in lúc ${ticket.checkedInAt?.toLocaleString("vi-VN") ?? "trước đó"}`,
        ticket: serializeTicket(ticket),
      };
    }

    const [updated] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: "checked_in",
          checkedInAt: new Date(),
          checkedInBy: scannerLabel ?? "scanner",
        },
        include: ticketInclude,
      }),
      prisma.ticketNonce.update({
        where: { nonce },
        data: { usedAt: new Date() },
      }),
    ]);

    // Giải ngân escrow P2P nếu có
    try {
      const { MarketplaceService } = await import("./marketplace.service.js");
      await MarketplaceService.releaseEscrow(ticketId, "check_in");
    } catch (err: any) {
      console.error("[P2P] releaseEscrow after check-in:", err?.message);
    }

    return {
      ok: true as const,
      code: "OK",
      message: "Check-in thành công",
      ticket: serializeTicket(updated),
    };
  }

  static async listAllForAdmin() {
    const tickets = await prisma.ticket.findMany({
      where: { status: { in: ["sold", "checked_in", "valid"] } },
      include: ticketInclude,
      orderBy: { id: "desc" },
      take: 200,
    });
    return tickets.map(serializeTicket);
  }
}
