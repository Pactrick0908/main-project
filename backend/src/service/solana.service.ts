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

  /** Cache để mọi lần mint/ghi on-chain dùng đúng 1 hot wallet trong process. */
  private static cachedKeypair: Keypair | null = null;

  /**
   * SOL tiêu thụ mỗi lần ghi vé on-chain (transfer mặc định 0.001 SOL).
   */
  static readonly SOL_PER_TICKET = 0.001;
  static readonly WALLET_SAFE_SOL = 0.1;
  static readonly WALLET_CRITICAL_SOL = 0.03;

  static getCluster(): "mainnet-beta" | "testnet" | "devnet" {
    const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    if (rpc.includes("mainnet")) return "mainnet-beta";
    if (rpc.includes("testnet")) return "testnet";
    return "devnet";
  }

  /**
   * Số dư ví mint admin + ước tính còn tạo được bao nhiêu vé + mức gas.
   */
  static async getHotWalletStatus() {
    const costPerTicket = this.SOL_PER_TICKET;
    try {
      const kp = this.getServerKeypair();
      const address = kp.publicKey.toBase58();
      const cluster = this.getCluster();
      let solBalance = 0;
      let reachable = true;
      try {
        const lamports = await Promise.race([
          this.connection.getBalance(kp.publicKey),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("RPC timeout")), 5_000),
          ),
        ]);
        solBalance = lamports / LAMPORTS_PER_SOL;
      } catch {
        reachable = false;
      }

      const status: "safe" | "low" | "critical" | "unknown" = !reachable
        ? "unknown"
        : solBalance > this.WALLET_SAFE_SOL
          ? "safe"
          : solBalance >= this.WALLET_CRITICAL_SOL
            ? "low"
            : "critical";

      return {
        configured: true,
        reachable,
        address,
        solBalance: Number(solBalance.toFixed(6)),
        estimatedTickets: reachable
          ? Math.max(0, Math.floor(solBalance / costPerTicket))
          : 0,
        costPerTicket,
        status,
        cluster,
        explorerUrl: `https://explorer.solana.com/address/${address}?cluster=${cluster}`,
      };
    } catch (error: any) {
      return {
        configured: false,
        reachable: false,
        address: null as string | null,
        solBalance: 0,
        estimatedTickets: 0,
        costPerTicket,
        status: "critical" as const,
        cluster: this.getCluster(),
        explorerUrl: null as string | null,
        error:
          error?.message ??
          "Chưa cấu hình SERVER_PRIVATE_KEY — không đọc được ví admin.",
      };
    }
  }

  /**
   * Khởi tạo Keypair từ SERVER_PRIVATE_KEY trong file .env
   * Hỗ trợ định dạng Base58 string hoặc JSON array [1,2,3...]
   */
  private static getServerKeypair(): Keypair {
    if (this.cachedKeypair) return this.cachedKeypair;

    const rawKey = process.env.SERVER_PRIVATE_KEY;
    if (!rawKey) {
      throw new Error(
        "Thiếu SERVER_PRIVATE_KEY trong .env — không thể dùng hot wallet cố định.",
      );
    }

    try {
      const trimmed = rawKey.trim();
      const keypair = trimmed.startsWith("[")
        ? Keypair.fromSecretKey(Uint8Array.from(JSON.parse(trimmed)))
        : Keypair.fromSecretKey(bs58.decode(trimmed));
      this.cachedKeypair = keypair;
      return keypair;
    } catch (error) {
      console.error("❌ [Solana] Lỗi phân tích SERVER_PRIVATE_KEY:", error);
      throw new Error("SERVER_PRIVATE_KEY không hợp lệ (cần Base58 hoặc JSON array).");
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

  static async recordResaleTransferOnChain(params: {
    tradeId: number;
    fromWallet: string;
    toWallet: string;
  }): Promise<void> {
    console.log(
      `[Solana P2P] Trade #${params.tradeId} ${params.fromWallet} → ${params.toWallet}`,
    );
  }
}
