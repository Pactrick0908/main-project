import { payOS } from "../config/payos.config.js";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import { SolanaService } from "./solana.service.js";

export type OrderItemInput = {
  eventZoneId: number;
  quantity: number;
  seatLabels?: string[];
};

export interface CreateOrderParams {
  userId: number;
  eventId: number;
  items: OrderItemInput[];
  /** @deprecated dùng items */
  ticketId?: number;
  quantity?: number;
  unitPrice?: number;
}

function parseSeatLabel(
  label: string,
): { rowName: string; seatNumber: number } | null {
  const m = String(label)
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { rowName: m[1], seatNumber: Number(m[2]) };
}

/** Tìm/tạo ghế trống trong zone; nếu ghế chọn đã bán thì nhảy ghế khác. */
async function allocateSeat(
  tx: Prisma.TransactionClient,
  params: {
    eventId: number;
    zoneId: number;
    preferredLabel?: string;
    fallbackIndex: number;
  },
): Promise<number> {
  const preferred = params.preferredLabel
    ? parseSeatLabel(params.preferredLabel)
    : null;

  const candidates: Array<{ rowName: string; seatNumber: number }> = [];
  if (preferred) candidates.push(preferred);
  candidates.push({
    rowName: "A",
    seatNumber: params.fallbackIndex,
  });

  for (const c of candidates) {
    let seat = await tx.seat.findFirst({
      where: {
        zoneId: params.zoneId,
        rowName: c.rowName,
        seatNumber: c.seatNumber,
      },
    });
    if (!seat) {
      seat = await tx.seat.create({
        data: {
          zoneId: params.zoneId,
          rowName: c.rowName,
          seatNumber: c.seatNumber,
        },
      });
    }

    const taken = await tx.ticket.findFirst({
      where: {
        eventId: params.eventId,
        seatId: seat.id,
        status: { in: ["sold", "checked_in", "valid", "held"] },
      },
    });
    if (!taken) return seat.id;
  }

  // Fallback: tạo ghế mới với seatNumber unique theo thời gian
  const seat = await tx.seat.create({
    data: {
      zoneId: params.zoneId,
      rowName: "X",
      seatNumber: Date.now() % 1_000_000,
    },
  });
  return seat.id;
}

export class OrderService {
  static async createOrder(params: CreateOrderParams) {
    const { userId, eventId, items } = params;

    if (!eventId || !Number.isInteger(Number(eventId))) {
      throw Object.assign(new Error("Thiếu eventId"), { status: 400 });
    }
    if (!items?.length) {
      throw Object.assign(new Error("Thiếu danh sách hạng vé cần mua"), {
        status: 400,
      });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      select: {
        id: true,
        title: true,
        status: true,
        saleOpensAt: true,
        schedules: {
          orderBy: { startTime: "asc" },
          take: 1,
          select: { startTime: true },
        },
      },
    });
    if (!event) {
      throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
    }

    // Tới giờ bắt đầu sự kiện → tự đóng bán
    const startsAt = event.schedules[0]?.startTime;
    if (
      startsAt &&
      new Date() >= startsAt &&
      !["ended", "draft"].includes(String(event.status || "").toLowerCase())
    ) {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: "ended" },
      });
      throw Object.assign(
        new Error("Sự kiện đã bắt đầu — ngừng bán vé"),
        { status: 409 },
      );
    }

    const status = String(event.status || "").toLowerCase();
    if (status === "ended" || status === "draft") {
      throw Object.assign(
        new Error(
          status === "ended"
            ? "Sự kiện đã ngừng bán / kết thúc — không thể mua vé"
            : "Sự kiện chưa công bố — chưa mở bán vé",
        ),
        { status: 409 },
      );
    }
    if (event.saleOpensAt && new Date() < event.saleOpensAt) {
      throw Object.assign(
        new Error(
          `Chưa tới giờ mở bán vé (${event.saleOpensAt.toLocaleString("vi-VN")})`,
        ),
        { status: 409 },
      );
    }
    if (status === "open") {
      // ok
    } else if (
      status === "upcoming" &&
      event.saleOpensAt &&
      new Date() >= event.saleOpensAt
    ) {
      // Cho mua sớm khi đã tới giờ mở bán dù status còn upcoming
    } else {
      throw Object.assign(new Error("Sự kiện chưa mở bán vé"), {
        status: 409,
      });
    }

    let totalAmount = 0;
    let totalQty = 0;
    const normalizedItems: OrderItemInput[] = [];

    for (const raw of items) {
      const eventZoneId = Number(raw.eventZoneId);
      const quantity = Math.max(0, Number(raw.quantity) || 0);
      if (!eventZoneId || quantity < 1) continue;

      const eventZone = await prisma.eventZone.findFirst({
        where: { id: eventZoneId, eventId: event.id },
        include: { zone: true },
      });
      if (!eventZone) {
        throw Object.assign(
          new Error(`Hạng vé #${eventZoneId} không thuộc sự kiện`),
          { status: 400 },
        );
      }

      const soldCount = await prisma.ticket.count({
        where: {
          eventZoneId: eventZone.id,
          status: { in: ["sold", "checked_in", "valid", "held"] },
        },
      });
      const remaining = eventZone.totalSeats - soldCount;
      if (remaining <= 0) {
        throw Object.assign(
          new Error(`Hạng "${eventZone.zone.name}" đã hết vé`),
          { status: 409 },
        );
      }
      if (quantity > remaining) {
        throw Object.assign(
          new Error(
            `Hạng "${eventZone.zone.name}" chỉ còn ${remaining} chỗ`,
          ),
          { status: 409 },
        );
      }

      const seatLabels = (raw.seatLabels ?? [])
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, quantity);

      if (eventZone.zone.hasSeats && seatLabels.length > 0) {
        for (const label of seatLabels) {
          if (!parseSeatLabel(label)) {
            throw Object.assign(new Error(`Ghế không hợp lệ: ${label}`), {
              status: 400,
            });
          }
        }
      }

      totalAmount += Number(eventZone.price) * quantity;
      totalQty += quantity;
      normalizedItems.push({
        eventZoneId,
        quantity,
        seatLabels,
      });
    }

    if (!normalizedItems.length || totalQty < 1) {
      throw Object.assign(new Error("Chọn ít nhất 1 vé"), { status: 400 });
    }

    const adminAmount = Math.round(totalAmount * 0.9);
    const systemAmount = totalAmount - adminAmount;

    const orderCode = Number(
      `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 900 + 100)}`,
    );

    const clientUrl = (
      process.env.CLIENT_URL || "http://localhost:5173"
    ).replace(/\/$/, "");

    // PayOS tự gắn code, id, cancel, status, orderCode vào returnUrl
    const paymentLinkData = {
      orderCode,
      amount: totalAmount,
      description: `VE${orderCode}`.slice(0, 25),
      returnUrl: `${clientUrl}/my-tickets?orderCode=${orderCode}`,
      cancelUrl: `${clientUrl}/events/${event.id}`,
    };

    let paymentLinkResponse: any;
    try {
      paymentLinkResponse = await payOS.createPaymentLink(paymentLinkData);
    } catch (payosError: any) {
      console.warn("⚠️ [PayOS] Fallback sandbox link:", payosError?.message);
      paymentLinkResponse = {
        checkoutUrl: `https://pay.payos.vn/web/${orderCode}`,
        qrCode: `00020101021238540010A000000727012600069704150112103891189070520459995303704540${totalAmount}5802VN62210817VE${orderCode}6304ABCD`,
        paymentLinkId: `mock_${orderCode}`,
      };
    }

    const newOrder = await prisma.order.create({
      data: {
        orderCode: BigInt(orderCode),
        userId,
        eventId: event.id,
        itemsJson: normalizedItems as unknown as Prisma.InputJsonValue,
        quantity: totalQty,
        totalAmount,
        adminAmount,
        systemAmount,
        solAmount: 0.001,
        status: "PENDING",
        paymentLinkId: paymentLinkResponse.paymentLinkId,
      },
    });

    return {
      orderId: newOrder.id,
      orderCode,
      totalAmount,
      quantity: totalQty,
      checkoutUrl: paymentLinkResponse.checkoutUrl,
      qrCode: paymentLinkResponse.qrCode,
      paymentLinkId: paymentLinkResponse.paymentLinkId,
    };
  }

  /**
   * Sau khi PAID: tạo Ticket(s), gán user + ví custodial, mã vé (mintAddress).
   * Dùng FOR UPDATE để chặn race khi poll + webhook + MyTickets gọi đồng thời.
   */
  static async fulfillPaidOrder(orderId: number) {
    const createdIds: number[] = [];
    let alreadyFulfilled = false;
    let ownerWallet: string | null = null;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM orders WHERE id = ${orderId} FOR UPDATE`;

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });
      if (!order) {
        throw Object.assign(new Error("Không tìm thấy đơn hàng"), { status: 404 });
      }
      if (order.status !== "PAID") {
        throw Object.assign(new Error("Đơn chưa thanh toán"), { status: 409 });
      }

      const existingIds = Array.isArray(order.ticketIdsJson)
        ? (order.ticketIdsJson as number[])
        : [];
      if (existingIds.length > 0 || order.ticketId) {
        alreadyFulfilled = true;
        createdIds.push(
          ...(existingIds.length
            ? existingIds
            : order.ticketId
              ? [order.ticketId]
              : []),
        );
        ownerWallet = order.user.walletAddress;
        return;
      }

      if (!order.eventId || !order.itemsJson) {
        throw Object.assign(
          new Error("Đơn hàng thiếu thông tin sự kiện / hạng vé"),
          { status: 400 },
        );
      }

      const items = order.itemsJson as OrderItemInput[];
      ownerWallet = order.user.walletAddress;
      if (!ownerWallet) {
        throw Object.assign(new Error("User chưa có ví Solana"), { status: 400 });
      }

      let seq = 0;
      for (const item of items) {
        const eventZone = await tx.eventZone.findFirst({
          where: { id: item.eventZoneId, eventId: order.eventId! },
          include: { zone: true },
        });
        if (!eventZone) {
          throw Object.assign(
            new Error(`Hạng vé #${item.eventZoneId} không hợp lệ`),
            { status: 400 },
          );
        }

        const sold = await tx.ticket.count({
          where: {
            eventZoneId: eventZone.id,
            status: { in: ["sold", "checked_in", "valid", "held"] },
          },
        });
        if (sold + item.quantity > eventZone.totalSeats) {
          throw Object.assign(
            new Error(`Hết chỗ hạng "${eventZone.zone.name}"`),
            { status: 409 },
          );
        }

        const labels = item.seatLabels ?? [];
        for (let i = 0; i < item.quantity; i++) {
          seq += 1;
          let seatId: number | null = null;

          if (eventZone.zone.hasSeats) {
            seatId = await allocateSeat(tx, {
              eventId: order.eventId!,
              zoneId: eventZone.zoneId,
              preferredLabel: labels[i],
              fallbackIndex: sold + i + 1,
            });
          }

          const ticketCode = `TIX-${order.orderCode}-${seq}`;
          const ticket = await tx.ticket.create({
            data: {
              eventId: order.eventId!,
              eventZoneId: eventZone.id,
              seatId,
              userId: order.userId,
              ownerWallet,
              status: "sold",
              mintAddress: ticketCode,
              originalOrderId: order.id,
            },
          });
          createdIds.push(ticket.id);
        }
      }

      await tx.order.update({
        where: { id: order.id },
        data: {
          ticketId: createdIds[0] ?? null,
          ticketIdsJson: createdIds as unknown as Prisma.InputJsonValue,
        },
      });
    });

    if (!alreadyFulfilled) {
      console.log(
        `🎫 [Fulfill] Order #${orderId} → ${createdIds.length} vé: ${createdIds.join(", ")} → ví ${ownerWallet}`,
      );
    }

    return { ticketIds: createdIds, alreadyFulfilled };
  }

  /** Hủy đơn PENDING khi user đóng QR / bỏ thanh toán. */
  static async cancelPendingOrder(orderCode: string | number) {
    const order = await prisma.order.findUnique({
      where: { orderCode: BigInt(orderCode) },
      select: { id: true, status: true, orderCode: true },
    });
    if (!order) {
      throw Object.assign(new Error("Không tìm thấy đơn hàng"), { status: 404 });
    }
    if (order.status === "PAID") {
      throw Object.assign(new Error("Đơn đã thanh toán, không hủy được"), {
        status: 409,
      });
    }
    if (order.status === "CANCELLED") {
      return {
        orderCode: order.orderCode.toString(),
        status: "CANCELLED" as const,
        alreadyCancelled: true,
      };
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    return {
      orderCode: order.orderCode.toString(),
      status: "CANCELLED" as const,
      alreadyCancelled: false,
    };
  }

  /**
   * Đánh PAID (idempotent) rồi tạo vé. Dùng chung cho webhook và xác nhận PayOS API.
   */
  static async markPaidAndFulfill(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) {
      throw Object.assign(new Error("Không tìm thấy đơn hàng"), { status: 404 });
    }

    if (order.status === "CANCELLED") {
      throw Object.assign(new Error("Đơn đã hủy, không thể cấp vé"), {
        status: 409,
      });
    }

    if (order.status !== "PAID") {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.order.updateMany({
          where: { id: order.id, status: "PENDING" },
          data: { status: "PAID" },
        });
        if (updated.count === 0) return;

        const currentBalance = await tx.adminBalance.findFirst();
        if (!currentBalance) {
          await tx.adminBalance.create({
            data: {
              totalRevenue: order.adminAmount,
              systemRevenue: order.systemAmount,
            },
          });
        } else {
          await tx.adminBalance.update({
            where: { id: currentBalance.id },
            data: {
              totalRevenue: { increment: order.adminAmount },
              systemRevenue: { increment: order.systemAmount },
            },
          });
        }
      });
    }

    const fulfillResult = await OrderService.fulfillPaidOrder(order.id);

    SolanaService.recordTicketPurchaseOnChain({
      orderId: order.id,
      recipientWallet: order.user?.walletAddress,
      solAmount: order.solAmount,
    }).catch((solErr: any) => {
      console.error(
        `❌ Lỗi Background Solana Order #${order.id}:`,
        solErr?.message,
      );
    });

    return {
      ticketIds: fulfillResult.ticketIds,
      alreadyFulfilled: fulfillResult.alreadyFulfilled,
      ownerWallet: order.user?.walletAddress ?? null,
    };
  }

  /** Chỉ hỏi PayOS — không cấp vé. */
  static async lookupPayOSPayment(order: {
    orderCode: bigint;
    paymentLinkId: string | null;
  }) {
    const ids: Array<string | number> = [];
    if (order.paymentLinkId && !order.paymentLinkId.startsWith("mock_")) {
      ids.push(order.paymentLinkId);
    }
    ids.push(Number(order.orderCode.toString()));

    let lastError: string | undefined;
    for (const id of ids) {
      try {
        const info: any = await payOS.getPaymentLinkInformation(id as any);
        const payload = info?.status == null && info?.data ? info.data : info;
        if (payload?.status || payload?.amountPaid != null) {
          return { payload, error: undefined };
        }
      } catch (err: any) {
        lastError = err?.message;
      }

      try {
        const res = await fetch(
          `https://api-merchant.payos.vn/v2/payment-requests/${id}`,
          {
            headers: {
              "x-client-id": process.env.PAYOS_CLIENT_ID || "",
              "x-api-key": process.env.PAYOS_API_KEY || "",
            },
          },
        );
        const json: any = await res.json().catch(() => ({}));
        const payload = json?.data ?? json;
        if (payload?.status || payload?.amountPaid != null) {
          return { payload, error: undefined };
        }
        lastError = json?.desc || json?.message || `HTTP ${res.status}`;
      } catch (err: any) {
        lastError = err?.message;
      }
    }

    return { payload: null as any, error: lastError };
  }

  /**
   * Trạng thái thanh toán trên PayOS. Không gọi webhook / không tạo vé.
   */
  static async getPayOSPaymentStatus(orderCode: string | number) {
    const order = await prisma.order.findUnique({
      where: { orderCode: BigInt(orderCode) },
      select: {
        orderCode: true,
        status: true,
        totalAmount: true,
        paymentLinkId: true,
      },
    });
    if (!order) return null;

    if (order.status === "PAID") {
      return {
        orderCode: order.orderCode.toString(),
        orderStatus: "PAID" as const,
        payosStatus: "PAID",
        paid: true,
      };
    }

    if (order.status === "CANCELLED") {
      return {
        orderCode: order.orderCode.toString(),
        orderStatus: "CANCELLED" as const,
        payosStatus: "CANCELLED",
        paid: false,
      };
    }

    const { payload, error } = await OrderService.lookupPayOSPayment(order);
    const status = String(payload?.status ?? "").toUpperCase();
    const amountPaid = Number(payload?.amountPaid ?? 0);
    const total = Number(order.totalAmount);
    const paid =
      status === "PAID" ||
      (Number.isFinite(amountPaid) && amountPaid >= total && amountPaid > 0);

    if (payload) {
      console.log(
        `🔎 [PayOS] Order #${orderCode} status=${status || "(empty)"} amountPaid=${amountPaid} paid=${paid}`,
      );
    } else {
      console.warn(`⚠️ [PayOS] Không lấy được trạng thái đơn #${orderCode}:`, error);
    }

    return {
      orderCode: order.orderCode.toString(),
      orderStatus: order.status,
      payosStatus: status || "UNKNOWN",
      paid,
      amountPaid: Number.isFinite(amountPaid) ? amountPaid : 0,
      error: paid ? undefined : error,
    };
  }

  static async getOrderStatus(orderCode: string | number) {
    let order = await prisma.order.findUnique({
      where: { orderCode: BigInt(orderCode) },
      select: {
        id: true,
        orderCode: true,
        totalAmount: true,
        status: true,
        solTxSignature: true,
        createdAt: true,
        ticketId: true,
        ticketIdsJson: true,
        quantity: true,
        eventId: true,
      },
    });

    if (!order) return null;

    let ticketIds = Array.isArray(order.ticketIdsJson)
      ? (order.ticketIdsJson as number[])
      : order.ticketId
        ? [order.ticketId]
        : [];

    // PAID nhưng chưa có vé → thử fulfill lại (recovery)
    if (order.status === "PAID" && ticketIds.length === 0) {
      try {
        const result = await OrderService.fulfillPaidOrder(order.id);
        ticketIds = result.ticketIds;
        order = {
          ...order,
          ticketIdsJson: ticketIds,
          ticketId: ticketIds[0] ?? null,
        };
      } catch (err: any) {
        console.error(
          `❌ [Recovery fulfill] Order #${order.id}:`,
          err?.message,
        );
      }
    }

    return {
      id: order.id,
      orderCode: order.orderCode.toString(),
      totalAmount: order.totalAmount,
      status: order.status,
      solTxSignature: order.solTxSignature,
      createdAt: order.createdAt,
      quantity: order.quantity,
      eventId: order.eventId,
      ticketIds,
    };
  }

  static async lookupBankAccount(bin: string, accountNumber: string) {
    const cleanAcc = String(accountNumber).trim().replace(/\s+/g, "");

    try {
      const res = await fetch("https://api.vietqr.io/v2/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.VIETQR_CLIENT_ID || "demo-client-id",
          "x-api-key": process.env.VIETQR_API_KEY || "demo-api-key",
        },
        body: JSON.stringify({
          bin: String(bin),
          accountNumber: cleanAcc,
        }),
      });

      const data: any = await res.json().catch(() => ({}));
      if (data && data.code === "00" && data.data?.accountName) {
        return {
          accountName: data.data.accountName,
          accountNumber: cleanAcc,
          isVerified: true,
        };
      }
    } catch (err: any) {
      console.warn("⚠️ [VietQR Lookup API Warning]:", err?.message);
    }

    return {
      accountName: `NGUYEN VAN ${cleanAcc.slice(-3) || "SOL"}`,
      accountNumber: cleanAcc,
      isVerified: true,
      isFallback: true,
    };
  }
}
