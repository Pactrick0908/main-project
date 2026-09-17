import { payOS } from "../config/payos.config.js";
import { prisma } from "../lib/prisma.js";
import { SolanaService } from "./solana.service.js";
import { OrderService } from "./order.service.js";

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

    const code = String(
      verifiedData?.code ?? webhookBody?.code ?? webhookBody?.data?.code ?? "",
    );

    if (code !== "00") {
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
      console.warn(`⚠️ Không tìm thấy Order với orderCode: ${orderCode}`);
      return { success: true, message: "Order not found, ignored" };
    }

    if (order.status !== "PAID") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });

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
    }).catch((solErr) => {
      console.error(
        `❌ Lỗi Background Solana Order #${order.id}:`,
        solErr?.message,
      );
    });

    return {
      success: true,
      message: "Webhook processed — tickets issued to wallet",
      data: {
        orderId: order.id,
        ticketIds: fulfillResult.ticketIds,
        alreadyFulfilled: fulfillResult.alreadyFulfilled,
        ownerWallet: order.user?.walletAddress ?? null,
      },
    };
  }
}
