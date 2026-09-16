import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";

dotenv.config();

export class SolanaService {
  private static connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
  );

  /**
   * Khởi tạo Keypair từ private key trong file .env
   * Hỗ trợ định dạng Base58 string hoặc JSON array [1,2,3...]
   */
  private static getServerKeypair(): Keypair {
    const rawKey = process.env.SERVER_PRIVATE_KEY;
    if (!rawKey) {
      console.warn("⚠️ [Solana] SERVER_PRIVATE_KEY chưa được cấu hình. Tạm thời sinh key ngẫu nhiên cho dev.");
      return Keypair.generate();
    }

    try {
      const trimmed = rawKey.trim();
      if (trimmed.startsWith("[")) {
        return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed)));
      }
      return Keypair.fromSecretKey(bs58.decode(trimmed));
    } catch (error) {
      console.error("❌ [Solana] Lỗi phân tích SERVER_PRIVATE_KEY:", error);
      return Keypair.generate();
    }
  }

  /**
   * Kích hoạt phí lưu trữ và ghi nhận giao dịch mua vé on-chain
   * Gửi một lượng SOL cố định (mặc định 0.001 SOL) từ ví nóng của server
   */
  static async recordTicketPurchaseOnChain(params: {
    orderId: number;
    recipientWallet?: string;
    solAmount?: number;
  }): Promise<string> {
    const { orderId, recipientWallet, solAmount = 0.001 } = params;

    try {
      const serverWallet = this.getServerKeypair();
      console.log(`[Solana] Kích hoạt on-chain cho Order #${orderId}`);
      console.log(`[Solana] Hot Wallet: ${serverWallet.publicKey.toBase58()}`);

      // Nếu khách có ví Solana thì gửi SOL vào ví khách, nếu không thì tự gửi lại ví server để ghi nhận log tx
      let destinationPubkey = serverWallet.publicKey;
      if (recipientWallet) {
        try {
          destinationPubkey = new PublicKey(recipientWallet);
        } catch {
          destinationPubkey = serverWallet.publicKey;
        }
      }

      const lamports = Math.round(solAmount * LAMPORTS_PER_SOL);

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: serverWallet.publicKey,
          toPubkey: destinationPubkey,
          lamports,
        })
      );

      // Ký và phát hành giao dịch lên Devnet
      const txSignature = await sendAndConfirmTransaction(this.connection, tx, [
        serverWallet,
      ]);

      console.log(
        `✅ [Solana] Tx thành công: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
      );

      // Cập nhật chữ ký giao dịch vào Order trong DB
      await prisma.order.update({
        where: { id: orderId },
        data: { solTxSignature: txSignature },
      });

      return txSignature;
    } catch (error: any) {
      console.error(`❌ [Solana] Lỗi on-chain cho Order #${orderId}:`, error?.message);
      throw error;
    }
  }
}
