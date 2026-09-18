import PayOS from "@payos/node";
import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.PAYOS_CLIENT_ID || "";
const apiKey = process.env.PAYOS_API_KEY || "";
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || "";

if (!clientId || !apiKey || !checksumKey) {
  console.warn(
    "⚠️ [PayOS] Cảnh báo: Thiếu PAYOS_CLIENT_ID, PAYOS_API_KEY hoặc PAYOS_CHECKSUM_KEY trong file .env."
  );
}

// Khởi tạo Singleton PayOS instance
export const payOS = new PayOS(clientId, apiKey, checksumKey);

/** Đăng ký URL webhook với PayOS (dashboard + confirmWebhook). */
export async function registerPayOSWebhook() {
  const webhookUrl = (
    process.env.PAYOS_WEBHOOK_URL ||
    (process.env.RENDER_EXTERNAL_URL
      ? `${process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "")}/api/v1/webhook/payos`
      : "")
  ).trim();

  if (!webhookUrl) {
    // Localhost: PayOS không gọi được webhook. App poll PayOS API để cấp vé.
    return;
  }

  try {
    await payOS.confirmWebhook(webhookUrl);
    console.log(`✅ [PayOS] Đã đăng ký webhook: ${webhookUrl}`);
  } catch (err: any) {
    console.warn(
      `⚠️ [PayOS] Không đăng ký được webhook (${webhookUrl}):`,
      err?.message,
    );
  }
}
