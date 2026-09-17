import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getAccount,
} from "@solana/spl-token";
import bs58 from "bs58";
import dotenv from "dotenv";
import { prisma } from "../lib/prisma.js";

dotenv.config();

export function isOnChainMintAddress(
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  if (
    value.startsWith("TIX-") ||
    value.startsWith("demo-") ||
    value.startsWith("airdrop-")
  ) {
    return false;
  }
  try {
    // eslint-disable-next-line no-new
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

export class SolanaService {
  private static connection = new Connection(
    process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
    "confirmed",
  );

  /** Hot wallet payer / mint authority */
  static getServerKeypair(): Keypair {
    const rawKey = process.env.SERVER_PRIVATE_KEY;
    if (!rawKey) {
      console.warn(
        "⚠️ [Solana] SERVER_PRIVATE_KEY chưa cấu hình — sinh key tạm (mất khi restart).",
      );
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

  static explorerMintUrl(mint: string) {
    const cluster = (process.env.SOLANA_RPC_URL || "").includes("mainnet")
      ? "mainnet-beta"
      : "devnet";
    return `https://explorer.solana.com/address/${mint}?cluster=${cluster}`;
  }

  static explorerTxUrl(signature: string) {
    const cluster = (process.env.SOLANA_RPC_URL || "").includes("mainnet")
      ? "mainnet-beta"
      : "devnet";
    return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
  }

  /**
   * Mint SPL token decimals=0, supply=1 vào ví custodial chủ vé.
   * Ghi Ticket.mintAddress = mint pubkey (tra Explorer được).
   */
  static async mintTicketOnChain(params: {
    ticketId: number;
    recipientWallet: string;
  }): Promise<{
    mint: string;
    tokenAccount: string;
    explorerUrl: string;
  }> {
    const { ticketId, recipientWallet } = params;
    const serverWallet = this.getServerKeypair();
    const recipient = new PublicKey(recipientWallet);

    const balance = await this.connection.getBalance(serverWallet.publicKey);
    if (balance < 0.05 * LAMPORTS_PER_SOL) {
      throw Object.assign(
        new Error(
          `Hot wallet thiếu SOL (${balance / LAMPORTS_PER_SOL} SOL). Airdrop: ${serverWallet.publicKey.toBase58()}`,
        ),
        { status: 503, code: "INSUFFICIENT_SOL" },
      );
    }

    console.log(
      `[Solana] Mint ticket #${ticketId} → ${recipientWallet} (payer ${serverWallet.publicKey.toBase58()})`,
    );

    const mint = await createMint(
      this.connection,
      serverWallet,
      serverWallet.publicKey,
      null,
      0,
    );

    const ata = await getOrCreateAssociatedTokenAccount(
      this.connection,
      serverWallet,
      mint,
      recipient,
    );

    await mintTo(
      this.connection,
      serverWallet,
      mint,
      ata.address,
      serverWallet,
      1,
    );

    const mintStr = mint.toBase58();
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { mintAddress: mintStr },
    });

    const explorerUrl = this.explorerMintUrl(mintStr);
    console.log(`✅ [Solana] Ticket #${ticketId} mint: ${explorerUrl}`);

    return {
      mint: mintStr,
      tokenAccount: ata.address.toBase58(),
      explorerUrl,
    };
  }

  static async ensureTicketMinted(ticketId: number) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw Object.assign(new Error("Không tìm thấy vé"), { status: 404 });
    }
    if (isOnChainMintAddress(ticket.mintAddress)) {
      return {
        alreadyMinted: true as const,
        mint: ticket.mintAddress!,
        explorerUrl: this.explorerMintUrl(ticket.mintAddress!),
      };
    }
    if (!ticket.ownerWallet) {
      throw Object.assign(new Error("Vé chưa có ownerWallet"), { status: 400 });
    }

    const result = await this.mintTicketOnChain({
      ticketId,
      recipientWallet: ticket.ownerWallet,
    });
    return { alreadyMinted: false as const, ...result };
  }

  /** Tìm theo mintAddress cũ (TIX-...) hoặc ticket id */
  static async mintByCodeOrId(codeOrId: string) {
    let ticket = await prisma.ticket.findFirst({
      where: { mintAddress: codeOrId },
    });
    if (!ticket && /^\d+$/.test(codeOrId)) {
      ticket = await prisma.ticket.findUnique({
        where: { id: Number(codeOrId) },
      });
    }
    if (!ticket) {
      throw Object.assign(new Error(`Không tìm thấy vé: ${codeOrId}`), {
        status: 404,
      });
    }
    return {
      ticketId: ticket.id,
      legacyCode: ticket.mintAddress,
      ...(await this.ensureTicketMinted(ticket.id)),
    };
  }

  /** Chuyển 1 token mint từ ví seller (custodial keypair) → buyer */
  static async transferTicketTokenWithSigner(params: {
    ticketId: number;
    mintAddress: string;
    fromKeypair: Keypair;
    toWallet: string;
  }): Promise<string | null> {
    if (!isOnChainMintAddress(params.mintAddress)) return null;

    const serverWallet = this.getServerKeypair();
    const mint = new PublicKey(params.mintAddress);
    const to = new PublicKey(params.toWallet);

    const fromAta = await getOrCreateAssociatedTokenAccount(
      this.connection,
      serverWallet,
      mint,
      params.fromKeypair.publicKey,
    );

    const toAta = await getOrCreateAssociatedTokenAccount(
      this.connection,
      serverWallet,
      mint,
      to,
    );

    const info = await getAccount(this.connection, fromAta.address);
    if (info.amount < 1n) {
      console.warn(
        `[Solana] Ticket #${params.ticketId} ATA không còn token để transfer`,
      );
      return null;
    }

    const sig = await transfer(
      this.connection,
      serverWallet,
      fromAta.address,
      toAta.address,
      params.fromKeypair,
      1,
    );

    console.log(
      `✅ [Solana] Transfer ticket #${params.ticketId}: ${this.explorerTxUrl(sig)}`,
    );
    return sig;
  }

  static async recordTicketPurchaseOnChain(params: {
    orderId: number;
    recipientWallet?: string;
    solAmount?: number;
  }): Promise<string> {
    const { orderId, recipientWallet, solAmount = 0.001 } = params;

    try {
      const serverWallet = this.getServerKeypair();
      console.log(`[Solana] Log SOL Order #${orderId}`);
      console.log(`[Solana] Hot Wallet: ${serverWallet.publicKey.toBase58()}`);

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
        }),
      );

      const txSignature = await sendAndConfirmTransaction(this.connection, tx, [
        serverWallet,
      ]);

      console.log(`✅ [Solana] Tx: ${this.explorerTxUrl(txSignature)}`);

      await prisma.order.update({
        where: { id: orderId },
        data: { solTxSignature: txSignature },
      });

      return txSignature;
    } catch (error: any) {
      console.error(
        `❌ [Solana] Lỗi Order #${orderId}:`,
        error?.message,
      );
      throw error;
    }
  }

  static async recordResaleTransferOnChain(params: {
    tradeId: number;
    fromWallet?: string;
    toWallet?: string;
    solAmount?: number;
  }): Promise<string> {
    const { tradeId, toWallet, solAmount = 0.0001 } = params;

    try {
      const serverWallet = this.getServerKeypair();
      let destinationPubkey = serverWallet.publicKey;
      if (toWallet) {
        try {
          destinationPubkey = new PublicKey(toWallet);
        } catch {
          destinationPubkey = serverWallet.publicKey;
        }
      }

      const lamports = Math.max(1, Math.round(solAmount * LAMPORTS_PER_SOL));
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: serverWallet.publicKey,
          toPubkey: destinationPubkey,
          lamports,
        }),
      );

      const txSignature = await sendAndConfirmTransaction(this.connection, tx, [
        serverWallet,
      ]);

      console.log(
        `✅ [Solana P2P] Trade #${tradeId}: ${this.explorerTxUrl(txSignature)}`,
      );

      await prisma.resaleTrade.update({
        where: { id: tradeId },
        data: { solTxSignature: txSignature },
      });

      return txSignature;
    } catch (error: any) {
      console.error(`❌ [Solana P2P] Trade #${tradeId}:`, error?.message);
      throw error;
    }
  }
}
