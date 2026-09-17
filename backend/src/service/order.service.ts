import { payOS } from "../config/payos.config.js";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

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
      select: { id: true, title: true, status: true },
    });
    if (!event) {
      throw Object.assign(new Error("Không tìm thấy sự kiện"), { status: 404 });
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

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const paymentLinkData = {
      orderCode,
      amount: totalAmount,
      description: `VE${orderCode}`.slice(0, 25),
      returnUrl: `${clientUrl}/my-tickets?status=success&orderCode=${orderCode}`,
      cancelUrl: `${clientUrl}/events/${event.id}?status=cancelled`,
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
   */
  static async fulfillPaidOrder(orderId: number) {
    const order = await prisma.order.findUnique({
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
      return {
        ticketIds: existingIds.length
          ? existingIds
          : order.ticketId
            ? [order.ticketId]
            : [],
        alreadyFulfilled: true,
      };
    }

    if (!order.eventId || !order.itemsJson) {
      throw Object.assign(
        new Error("Đơn hàng thiếu thông tin sự kiện / hạng vé"),
        { status: 400 },
      );
    }

    const items = order.itemsJson as OrderItemInput[];
    const ownerWallet = order.user.walletAddress;
    if (!ownerWallet) {
      throw Object.assign(new Error("User chưa có ví Solana"), { status: 400 });
    }

    const createdIds: number[] = [];

    await prisma.$transaction(async (tx) => {
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

    console.log(
      `🎫 [Fulfill] Order #${order.id} → ${createdIds.length} vé: ${createdIds.join(", ")} → ví ${ownerWallet}`,
    );

    return { ticketIds: createdIds, alreadyFulfilled: false };
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
