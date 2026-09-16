import type { Request, Response } from "express";
import { WebhookService } from "../service/webhook.service.js";

/**
 * Xử lý webhook từ PayOS khi khách thanh toán VietQR thành công
 * POST /api/v1/webhook/payos
 */
export const handlePayOSWebhook = async (req: Request, res: Response) => {
  try {
    const result = await WebhookService.processPayOSWebhook(req.body);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("❌ [Webhook Controller Error]:", error);
    return res.status(200).json({ success: false, message: error?.message });
  }
};
