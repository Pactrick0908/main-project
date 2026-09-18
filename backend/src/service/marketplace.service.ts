import { payOS } from "../config/payos.config.js";
import { prisma } from "../lib/prisma.js";
import { RefundService } from "./refund.service.js";
import { SolanaService } from "./solana.service.js";

const TRADE_PAYMENT_TTL_MS = 15 * 60 * 1000;

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

function relativeTime(from: Date) {
  const diff = Date.now() - from.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

const listingInclude = {
  ticket: {
    include: {
      event: {
        include: {
          place: true,
          schedules: { orderBy: { startTime: "asc" as const }, take: 1 },
          eventArtists: { include: { artist: true }, take: 3 },
        },
      },
      eventZone: { include: { zone: true } },
      seat: true,
    },
  },
  seller: true,
} as const;

function serializeListing(
  listing: Awaited<ReturnType<typeof prisma.resaleListing.findFirst>> &
    object,
) {
  const row = listing as any;
  const ticket = row.ticket;
  const event = ticket.event;
  const schedule = event.schedules?.[0];
  const artistNames =
    event.eventArtists
      ?.map((ea: { artist: { stageName: string | null; name: string } }) =>
        ea.artist.stageName || ea.artist.name,
      )
      .filter(Boolean)
      .join(", ") || event.organizerName || "Nghệ sĩ";

  const genre = String(
    event.eventArtists?.[0]?.artist?.genre ?? "",
  ).toLowerCase();
  const category = genre.includes("kpop") || genre.includes("k-pop")
    ? "kpop"
    : genre.includes("rap") || genre.includes("hip")
      ? "rap"
      : genre.includes("indie") || genre.includes("rock")
        ? "indie"
        : genre.includes("edm") || genre.includes("festival")
          ? "edm"
          : "vpop";

  const dateStr = schedule
    ? `${schedule.startTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })} · ${schedule.startTime.toLocaleDateString("vi-VN")}`
    : "Đang cập nhật";

  const seatLabel = ticket.seat
    ? `${ticket.seat.rowName}-${ticket.seat.seatNumber}`
    : null;
  const zoneName = ticket.eventZone.zone.name;
  const seatZone = seatLabel ? `${zoneName} · Ghế ${seatLabel}` : zoneName;

  const pass = Number(row.price);
  const face = Number(row.facePrice);

  return {
    id: row.id,
    listingId: row.id,
    ticketId: ticket.id,
    eventId: event.id,
    title: event.title,
    category,
    artist: artistNames,
    image:
      event.bannerUrl ||
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    date: dateStr,
    location: event.place
      ? `${event.place.name}, ${event.place.city}`
      : "Đang cập nhật",
    seatZone,
    zoneName,
    seatLabel,
    seller: row.seller.fullName,
    sellerId: row.sellerId,
    sellerAvatar:
      row.seller.avatarUrl ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${row.sellerId}`,
    sellerNote: row.note || "",
    originalPrice: formatVnd(face),
    passPrice: formatVnd(pass),
    passPriceNumber: pass,
    facePriceNumber: face,
    mintAddress: ticket.mintAddress,
    verified: true,
    status: row.status,
    createdAt: relativeTime(row.createdAt),
    createdAtIso: row.createdAt.toISOString(),
  };
}

export class MarketplaceService {
  static async listActive(params?: { eventId?: number; q?: string }) {
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (params?.eventId) where.eventId = params.eventId;

    const listings = await prisma.resaleListing.findMany({
      where,
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    let serialized = listings.map((l) => serializeListing(l as any));
    const q = params?.q?.trim().toLowerCase();
    if (q) {
      serialized = serialized.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.seller.toLowerCase().includes(q) ||
          t.seatZone.toLowerCase().includes(q),
      );
    }
    return serialized;
  }

  static async getListing(id: number) {
    const listing = await prisma.resaleListing.findUnique({
      where: { id },
      include: listingInclude,
    });
    if (!listing || !["ACTIVE", "RESERVED"].includes(listing.status)) {
      throw Object.assign(new Error("Không tìm thấy listing"), { status: 404 });
    }
    return serializeListing(listing as any);
  }

  static async createListing(params: {
    sellerId: number;
    ticketId: number;
    price: number;
    bankCode: string;
    bankName: string;
    bankAccountNo: string;
    bankAccountName: string;
    note?: string;
  }) {
    const price = Number(params.price);
    if (!Number.isFinite(price) || price < 1000) {
      throw Object.assign(new Error("Giá pass tối thiểu 1.000đ"), { status: 400 });
    }
    if (
      !params.bankCode?.trim() ||
      !params.bankAccountNo?.trim() ||
      !params.bankAccountName?.trim()
    ) {
      throw Object.assign(new Error("Thiếu thông tin tài khoản nhận tiền"), {
        status: 400,
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.ticketId },
      include: {
        event: true,
        eventZone: true,
        user: true,
      },
    });

    if (!ticket) {
      throw Object.assign(new Error("Không tìm thấy vé"), { status: 404 });
    }
    if (ticket.userId !== params.sellerId) {
      throw Object.assign(new Error("Bạn không sở hữu vé này"), { status: 403 });
    }
    if (ticket.checkedInAt || ticket.status === "checked_in") {
      throw Object.assign(new Error("Vé đã check-in — không thể đăng bán"), {
        status: 409,
      });
    }
    if (ticket.status === "listed") {
      throw Object.assign(new Error("Vé đang được niêm yết"), { status: 409 });
    }
    if (!["sold", "valid"].includes(ticket.status ?? "")) {
      throw Object.assign(new Error("Vé không ở trạng thái có thể bán"), {
        status: 409,
      });
    }
    if (["cancelled", "revoked", "ended"].includes(ticket.event.status ?? "")) {
      throw Object.assign(new Error("Sự kiện đã đóng — không thể đăng bán"), {
        status: 409,
      });
    }

    const active = await prisma.resaleListing.findFirst({
      where: {
        ticketId: ticket.id,
        status: { in: ["ACTIVE", "RESERVED"] },
      },
    });
    if (active) {
      throw Object.assign(new Error("Vé đã có listing đang mở"), { status: 409 });
    }

    const listing = await prisma.$transaction(async (tx) => {
      const created = await tx.resaleListing.create({
        data: {
          ticketId: ticket.id,
          sellerId: params.sellerId,
          eventId: ticket.eventId,
          price,
          facePrice: ticket.eventZone.price,
          bankCode: params.bankCode.trim(),
          bankName: params.bankName.trim(),
          bankAccountNo: params.bankAccountNo.trim(),
          bankAccountName: params.bankAccountName.trim().toUpperCase(),
          note: params.note?.trim() || null,
          status: "ACTIVE",
        },
        include: listingInclude,
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "listed" },
      });

      return created;
    });

    return serializeListing(listing as any);
  }

  static async cancelListing(listingId: number, sellerId: number) {
    const listing = await prisma.resaleListing.findUnique({
      where: { id: listingId },
    });
    if (!listing) {
      throw Object.assign(new Error("Không tìm thấy listing"), { status: 404 });
    }
    if (listing.sellerId !== sellerId) {
      throw Object.assign(new Error("Không phải listing của bạn"), { status: 403 });
    }
    if (listing.status !== "ACTIVE") {
      throw Object.assign(new Error("Chỉ hủy được listing đang ACTIVE"), {
        status: 409,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.resaleListing.update({
        where: { id: listingId },
        data: { status: "CANCELLED" },
      });
      await tx.ticket.update({
        where: { id: listing.ticketId },
        data: { status: "sold" },
      });
    });

    return { id: listingId, status: "CANCELLED" };
  }

  static async createTrade(params: { buyerId: number; listingId: number }) {
    const listing = await prisma.resaleListing.findUnique({
      where: { id: params.listingId },
      include: {
        ticket: { include: { event: true, user: true } },
        seller: true,
      },
    });

    if (!listing || listing.status !== "ACTIVE") {
      throw Object.assign(new Error("Listing không còn mở bán"), { status: 409 });
    }
    if (listing.sellerId === params.buyerId) {
      throw Object.assign(new Error("Không thể tự mua vé của mình"), {
        status: 400,
      });
    }
    if (listing.ticket.status !== "listed") {
      throw Object.assign(new Error("Vé không ở trạng thái niêm yết"), {
        status: 409,
      });
    }

    const buyer = await prisma.user.findUnique({ where: { id: params.buyerId } });
    if (!buyer?.walletAddress) {
      throw Object.assign(new Error("Buyer chưa có ví Solana"), { status: 400 });
    }

    const amount = Number(listing.price);
    const payosOrderCode = Number(
      `9${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`,
    );
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const expiresAt = new Date(Date.now() + TRADE_PAYMENT_TTL_MS);

    const paymentLinkData = {
      orderCode: payosOrderCode,
      amount,
      description: `P2P${payosOrderCode}`.slice(0, 25),
      returnUrl: `${clientUrl}/my-tickets?p2p=success&tradeCode=${payosOrderCode}`,
      cancelUrl: `${clientUrl}/marketplace?p2p=cancelled`,
    };

    let paymentLinkResponse: any;
    try {
      paymentLinkResponse = await payOS.createPaymentLink(paymentLinkData);
    } catch (err: any) {
      console.warn("⚠️ [PayOS P2P] Fallback sandbox:", err?.message);
      paymentLinkResponse = {
        checkoutUrl: `https://pay.payos.vn/web/${payosOrderCode}`,
        qrCode: `00020101021238540010A000000727012600069704150112103891189070520459995303704540${amount}5802VN62210817P2P${payosOrderCode}6304ABCD`,
        paymentLinkId: `mock_p2p_${payosOrderCode}`,
      };
    }

    const trade = await prisma.$transaction(async (tx) => {
      const locked = await tx.resaleListing.updateMany({
        where: { id: listing.id, status: "ACTIVE" },
        data: { status: "RESERVED" },
      });
      if (locked.count !== 1) {
        throw Object.assign(new Error("Listing vừa được người khác giữ chỗ"), {
          status: 409,
        });
      }

      return tx.resaleTrade.create({
        data: {
          listingId: listing.id,
          ticketId: listing.ticketId,
          sellerId: listing.sellerId,
          buyerId: params.buyerId,
          amount,
          payosOrderCode: BigInt(payosOrderCode),
          paymentLinkId: paymentLinkResponse.paymentLinkId,
          escrowStatus: "PENDING_PAYMENT",
          expiresAt,
        },
      });
    });

    return {
      tradeId: trade.id,
      payosOrderCode,
      listingId: listing.id,
      ticketId: listing.ticketId,
      amount,
      escrowStatus: trade.escrowStatus,
      expiresAt: expiresAt.toISOString(),
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      paymentLinkId: paymentLinkResponse.paymentLinkId,
      eventTitle: listing.ticket.event.title,
      sellerName: listing.seller.fullName,
    };
  }

  /**
   * Webhook PAID: chuyển ownership seller → buyer, escrow HELD.
   */
  static async fulfillPaidTrade(payosOrderCode: number | bigint) {
    const trade = await prisma.resaleTrade.findUnique({
      where: { payosOrderCode: BigInt(payosOrderCode) },
      include: {
        listing: true,
        ticket: true,
        buyer: true,
        seller: true,
      },
    });

    if (!trade) return null;

    if (trade.escrowStatus === "HELD" || trade.escrowStatus === "RELEASED") {
      return { tradeId: trade.id, alreadyFulfilled: true, ticketId: trade.ticketId };
    }

    if (trade.escrowStatus !== "PENDING_PAYMENT") {
      throw Object.assign(
        new Error(`Trade không thể fulfill (status=${trade.escrowStatus})`),
        { status: 409 },
      );
    }

    const buyerWallet = trade.buyer.walletAddress;
    if (!buyerWallet) {
      throw Object.assign(new Error("Buyer không có ví"), { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.resaleTrade.update({
        where: { id: trade.id },
        data: {
          escrowStatus: "HELD",
          paidAt: new Date(),
        },
      });

      await tx.resaleListing.update({
        where: { id: trade.listingId },
        data: { status: "SOLD" },
      });

      await tx.ticket.update({
        where: { id: trade.ticketId },
        data: {
          userId: trade.buyerId,
          ownerWallet: buyerWallet,
          status: "sold",
        },
      });

      // Vô hiệu hóa QR của seller cũ
      await tx.ticketNonce.updateMany({
        where: { ticketId: trade.ticketId, usedAt: null },
        data: { usedAt: new Date() },
      });

      if (trade.ticket.originalOrderId) {
        await tx.order.update({
          where: { id: trade.ticket.originalOrderId },
          data: {
            resaleState: "TRANSFERRED",
            primaryRefundBeneficiaryUserId: trade.buyerId,
          },
        });
      }
    });

    SolanaService.recordResaleTransferOnChain({
      tradeId: trade.id,
      fromWallet: trade.seller.walletAddress,
      toWallet: buyerWallet,
    }).catch((err) => {
      console.error(`❌ [Solana P2P] Trade #${trade.id}:`, err?.message);
    });

    return {
      tradeId: trade.id,
      alreadyFulfilled: false,
      ticketId: trade.ticketId,
      buyerId: trade.buyerId,
      sellerId: trade.sellerId,
    };
  }

  static async getTrade(tradeId: number, userId?: number) {
    const trade = await prisma.resaleTrade.findUnique({
      where: { id: tradeId },
      include: {
        listing: true,
        ticket: { include: { event: true } },
        seller: true,
        buyer: true,
      },
    });
    if (!trade) {
      throw Object.assign(new Error("Không tìm thấy trade"), { status: 404 });
    }
    if (
      userId != null &&
      trade.buyerId !== userId &&
      trade.sellerId !== userId
    ) {
      throw Object.assign(new Error("Không có quyền xem trade"), { status: 403 });
    }

    return {
      id: trade.id,
      listingId: trade.listingId,
      ticketId: trade.ticketId,
      sellerId: trade.sellerId,
      buyerId: trade.buyerId,
      amount: Number(trade.amount),
      payosOrderCode: trade.payosOrderCode.toString(),
      escrowStatus: trade.escrowStatus,
      releaseReason: trade.releaseReason,
      paidAt: trade.paidAt,
      releasedAt: trade.releasedAt,
      refundedAt: trade.refundedAt,
      expiresAt: trade.expiresAt,
      eventTitle: trade.ticket.event.title,
      sellerName: trade.seller.fullName,
      buyerName: trade.buyer.fullName,
      solTxSignature: trade.solTxSignature,
    };
  }

  static async getTradeByPayosCode(payosOrderCode: number | bigint) {
    const trade = await prisma.resaleTrade.findUnique({
      where: { payosOrderCode: BigInt(payosOrderCode) },
    });
    if (!trade) return null;
    return this.getTrade(trade.id);
  }

  /** Giải ngân seller sau check-in / event ended. */
  static async releaseEscrow(
    ticketId: number,
    reason: "check_in" | "event_ended" | "manual",
  ) {
    const trade = await prisma.resaleTrade.findFirst({
      where: { ticketId, escrowStatus: "HELD" },
      orderBy: { id: "desc" },
    });
    if (!trade) return null;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { event: true },
    });
    if (ticket?.event.status === "cancelled" && reason !== "manual") {
      throw Object.assign(
        new Error("Sự kiện đã hủy — không giải ngân P2P, dùng settle hủy"),
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await RefundService.recordLedger({
        ticketId,
        userId: trade.sellerId,
        kind: "P2P_RELEASE",
        amount: Number(trade.amount),
        refType: "resale_trade",
        refId: trade.id,
        note: `release:${reason}`,
        tx,
      });

      await tx.resaleTrade.update({
        where: { id: trade.id },
        data: {
          escrowStatus: "RELEASED",
          releaseReason: reason,
          releasedAt: new Date(),
        },
      });

      if (ticket?.originalOrderId) {
        await tx.order.update({
          where: { id: ticket.originalOrderId },
          data: {
            primaryRefundStatus: "BLOCKED_RESOLED",
            primaryRefundBeneficiaryUserId: ticket.userId,
          },
        });
      }
    });

    return { tradeId: trade.id, status: "RELEASED", reason };
  }

  /** Hoàn escrow cho buyer P2P (revoke / hủy sự kiện khi HELD). */
  static async refundEscrow(
    ticketId: number,
    reason: string,
  ) {
    const trade = await prisma.resaleTrade.findFirst({
      where: { ticketId, escrowStatus: "HELD" },
      orderBy: { id: "desc" },
    });
    if (!trade) return null;

    await prisma.$transaction(async (tx) => {
      await RefundService.recordLedger({
        ticketId,
        userId: trade.buyerId,
        kind: "P2P_REFUND",
        amount: Number(trade.amount),
        refType: "resale_trade",
        refId: trade.id,
        note: reason,
        tx,
      });

      await tx.resaleTrade.update({
        where: { id: trade.id },
        data: {
          escrowStatus: "REFUNDED",
          refundedAt: new Date(),
          releaseReason: reason.slice(0, 40),
        },
      });
    });

    return { tradeId: trade.id, status: "REFUNDED", reason };
  }

  /** Hết hạn thanh toán PENDING → trả listing ACTIVE. */
  static async expirePendingTrades() {
    const now = new Date();
    const expired = await prisma.resaleTrade.findMany({
      where: {
        escrowStatus: "PENDING_PAYMENT",
        expiresAt: { lt: now },
      },
      take: 100,
    });

    for (const trade of expired) {
      await prisma.$transaction(async (tx) => {
        await tx.resaleTrade.update({
          where: { id: trade.id },
          data: { escrowStatus: "CANCELLED" },
        });
        await tx.resaleListing.updateMany({
          where: { id: trade.listingId, status: "RESERVED" },
          data: { status: "ACTIVE" },
        });
      });
    }

    return { expired: expired.length };
  }

  /**
   * BTC hủy sự kiện: hủy listing, unwind HELD (refund buyer P2P),
   * không RELEASE; đánh dấu entitlement hoàn sơ cấp.
   */
  static async settleEventCancellation(eventId: number) {
    await prisma.resaleListing.updateMany({
      where: { eventId, status: { in: ["ACTIVE", "RESERVED"] } },
      data: { status: "CANCELLED" },
    });

    const pendingTrades = await prisma.resaleTrade.findMany({
      where: {
        escrowStatus: "PENDING_PAYMENT",
        listing: { eventId },
      },
      select: { id: true, listingId: true },
    });
    for (const t of pendingTrades) {
      await prisma.resaleTrade.update({
        where: { id: t.id },
        data: { escrowStatus: "CANCELLED" },
      });
      await prisma.resaleListing.updateMany({
        where: { id: t.listingId, status: "RESERVED" },
        data: { status: "CANCELLED" },
      });
    }

    // Unlock tickets still listed
    const listedTickets = await prisma.ticket.findMany({
      where: { eventId, status: "listed" },
      select: { id: true },
    });
    for (const t of listedTickets) {
      await prisma.ticket.update({
        where: { id: t.id },
        data: { status: "cancelled" },
      });
    }

    const heldTrades = await prisma.resaleTrade.findMany({
      where: {
        escrowStatus: "HELD",
        ticket: { eventId },
      },
    });

    const results: Array<{ ticketId: number; action: string }> = [];

    for (const trade of heldTrades) {
      await this.refundEscrow(trade.ticketId, "event_cancelled");
      results.push({ ticketId: trade.ticketId, action: "P2P_REFUND" });
    }

    const tickets = await prisma.ticket.findMany({
      where: { eventId },
      select: { id: true },
    });

    for (const t of tickets) {
      await prisma.ticket.updateMany({
        where: {
          id: t.id,
          status: { notIn: ["checked_in", "revoked"] },
        },
        data: { status: "cancelled" },
      });

      try {
        const elig = await RefundService.eligiblePrimaryRefund(t.id);
        if (elig.eligible) {
          results.push({
            ticketId: t.id,
            action: `PRIMARY_ELIGIBLE:${elig.beneficiaryUserId}`,
          });
        } else {
          results.push({ ticketId: t.id, action: `PRIMARY_BLOCKED:${elig.reason}` });
        }
      } catch {
        /* ignore */
      }
    }

    await prisma.event.update({
      where: { id: eventId },
      data: { status: "cancelled" },
    });

    return { eventId, results };
  }

  /** Sau sự kiện ended: giải ngân trade HELD còn lại (buyer no-show). */
  static async releaseHeldAfterEventEnded(eventId: number) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status === "cancelled") {
      throw Object.assign(
        new Error("Chỉ giải ngân no-show khi sự kiện ended (không cancelled)"),
        { status: 409 },
      );
    }

    if (event.status !== "ended") {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: "ended" },
      });
    }

    const held = await prisma.resaleTrade.findMany({
      where: {
        escrowStatus: "HELD",
        ticket: { eventId },
      },
    });

    const released: number[] = [];
    for (const trade of held) {
      const r = await this.releaseEscrow(trade.ticketId, "event_ended");
      if (r) released.push(r.tradeId);
    }
    return { released };
  }

  static async myListings(sellerId: number) {
    const listings = await prisma.resaleListing.findMany({
      where: { sellerId },
      include: listingInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return listings.map((l) => serializeListing(l as any));
  }

  static async myTrades(userId: number) {
    const trades = await prisma.resaleTrade.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      include: {
        ticket: { include: { event: true } },
        seller: true,
        buyer: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return trades.map((t) => ({
      id: t.id,
      role: t.buyerId === userId ? "buyer" : "seller",
      ticketId: t.ticketId,
      amount: Number(t.amount),
      escrowStatus: t.escrowStatus,
      eventTitle: t.ticket.event.title,
      counterparty:
        t.buyerId === userId ? t.seller.fullName : t.buyer.fullName,
      paidAt: t.paidAt,
      releasedAt: t.releasedAt,
      createdAt: t.createdAt,
    }));
  }
}
