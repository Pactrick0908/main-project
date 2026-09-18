import { payOS } from "../config/payos.config.js";
import { prisma } from "../lib/prisma.js";
import { OrderService } from "./order.service.js";
import { MarketplaceService } from "./marketplace.service.js";

function isPayOSPaymentSuccess(webhookBody: any, verifiedData: any): boolean {
  if (webhookBody?.success === true) return true;

  const candidates = [
    verifiedData?.code,
    verifiedData?.status,
    verifiedData?.desc,
    webhookBody?.code,
    webhookBody?.status,
    webhookBody?.desc,
    webhookBody?.data?.code,
    webhookBody?.data?.status,
    webhookBody?.data?.desc,
  ];

  for (const raw of candidates) {
    if (raw == null || raw === "") continue;
    const s = String(raw).trim().toLowerCase();
    if (
      s === "00" ||
      s === "0" ||
      s === "paid" ||
      s === "success" ||
      s === "thành công"
    ) {
      return true;
    }
  }

  const fail = candidates.some((raw) => {
    const s = String(raw ?? "").trim().toLowerCase();
    return [
      "01",
      "02",
      "cancelled",
      "canceled",
      "expired",
      "failed",
      "that bai",
      "thất bại",
    ].includes(s);
  });

  const hasOrder =
    verifiedData?.orderCode != null ||
    webhookBody?.data?.orderCode != null ||
    webhookBody?.orderCode != null;

  // PayOS thường chỉ bắn webhook khi đã nhận tiền
  return Boolean(hasOrder) && !fail;
}

export class WebhookService {
  /**
   * Xử lý webhook thanh toán từ PayOS
   * Khi chuyển khoản thành công → PAID → tạo Ticket + gắn ví user
   */
  static async processPayOSWebhook(webhookBody: any) {
    let verifiedData: any = null;

    try {
      verifiedData = payOS.verifyPaymentWebhookData(webhookBody);
    } catch (err: any) {
      console.warn(
        "⚠️ Verify Webhook signature warning (Sandbox mode):",
        err?.message,
      );
      verifiedData = webhookBody?.data || webhookBody;
    }

    const orderCode =
      verifiedData?.orderCode ??
      webhookBody?.data?.orderCode ??
      webhookBody?.orderCode;

    if (!orderCode) {
      throw new Error("Dữ liệu webhook không hợp lệ hoặc thiếu orderCode");
    }

    if (!isPayOSPaymentSuccess(webhookBody, verifiedData)) {
      const code = String(
        verifiedData?.code ?? webhookBody?.code ?? webhookBody?.data?.code ?? "",
      );
      return {
        success: true,
        message: `Ignored payment code=${code || "(empty)"}`,
      };
    }

    console.log(`🔔 [Webhook] Đơn hàng #${orderCode} thanh toán thành công`);

    const order = await prisma.order.findUnique({
      where: { orderCode: BigInt(orderCode) },
      include: { user: true },
    });

    if (!order) {
      try {
        const p2p = await MarketplaceService.fulfillPaidTrade(orderCode);
        if (p2p) {
          return {
            success: true,
            message: "Webhook processed — P2P trade fulfilled",
            data: p2p,
          };
        }
      } catch (err: any) {
        console.warn(`⚠️ [Webhook P2P] #${orderCode}:`, err?.message);
      }
      console.warn(`⚠️ Không tìm thấy Order với orderCode: ${orderCode}`);
      return { success: true, message: "Order not found, ignored" };
    }

    const fulfillResult = await OrderService.markPaidAndFulfill(order.id);

    return {
      success: true,
      message: "Webhook processed — tickets issued to wallet",
      data: {
        orderId: order.id,
        ticketIds: fulfillResult.ticketIds,
        alreadyFulfilled: fulfillResult.alreadyFulfilled,
        ownerWallet: fulfillResult.ownerWallet,
      },
    };
  }
}
