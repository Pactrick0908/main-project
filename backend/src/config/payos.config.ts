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
