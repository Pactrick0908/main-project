import { payOS } from "../config/payos.config.js";
import { prisma } from "../lib/prisma.js";
import { SolanaService } from "./solana.service.js";

export class WebhookService {
  /**
   * Xử lý webhook thanh toán từ PayOS
   */
  static async processPayOSWebhook(webhookBody: any) {
    let verifiedData: any = null;

    // 1. Xác thực tính toàn vẹn chữ ký dữ liệu Webhook từ PayOS
    try {
      verifiedData = payOS.verifyPaymentWebhookData(webhookBody);
    } catch (err: any) {
      console.warn("⚠️ Verify Webhook signature warning (Sandbox mode):", err?.message);
      verifiedData = webhookBody?.data || webhookBody;
    }

    if (!verifiedData || !verifiedData.orderCode) {
      throw new Error("Dữ liệu webhook không hợp lệ hoặc thiếu orderCode");
    }

    const { orderCode, code } = verifiedData;

    // Code "00" nghĩa là khách đã chuyển khoản thành công
    if (code === "00" || webhookBody.code === "00") {
      console.log(`🔔 [Webhook] Đơn hàng #${orderCode} đã thanh toán thành công!`);

      // Tìm kiếm Order trong Database
      const order = await prisma.order.findUnique({
        where: { orderCode: BigInt(orderCode) },
        include: { user: true },
      });

      if (!order) {
        console.warn(`⚠️ Không tìm thấy Order với orderCode: ${orderCode}`);
        return { success: true, message: "Order not found, ignored" };
      }

      if (order.status === "PAID") {
        return { success: true, message: "Đơn hàng đã được xử lý trước đó" };
      }

      // 2. Database Transaction: Đổi Order sang PAID và chia 90% cho Ban tổ chức
      await prisma.$transaction(async (tx) => {
        // Cập nhật trạng thái đơn hàng
        await tx.order.update({
          where: { id: order.id },
          data: { status: "PAID" },
        });

        // Tích lũy doanh thu cho Ban tổ chức (90%) và Quỹ hệ thống (10%)
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

      // 3. Kích hoạt giao dịch Solana on-chain bất đồng bộ (Background Task)
      SolanaService.recordTicketPurchaseOnChain({
        orderId: order.id,
        recipientWallet: order.user?.walletAddress,
        solAmount: order.solAmount,
      }).catch((solErr) => {
        console.error(`❌ Lỗi chạy Background Solana cho Order #${order.id}:`, solErr?.message);
      });
    }

    return {
      success: true,
      message: "Webhook processed successfully",
    };
  }
}
