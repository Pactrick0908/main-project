import crypto from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

/** TTL mã QR động: 60 giây (1 phút) */
export const QR_TTL_MS = 60_000;

export function randomNonce(bytes = 24): string {
  return bs58.encode(crypto.randomBytes(bytes));
}

export function buildCheckInMessage(
  ticketId: number,
  nonce: string,
  expiresAt: number,
): string {
  return `TICKET_CHECKIN_V1|${ticketId}|${nonce}|${expiresAt}`;
}

export function signMessage(keypair: Keypair, message: string): string {
  const msgBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(msgBytes, keypair.secretKey);
  return bs58.encode(signature);
}

export function verifySignature(
  message: string,
  signatureBase58: string,
  ownerPubkeyBase58: string,
): boolean {
  try {
    const msgBytes = new TextEncoder().encode(message);
    const signature = bs58.decode(signatureBase58);
    const publicKey = bs58.decode(ownerPubkeyBase58);
    if (publicKey.length !== 32 || signature.length !== 64) return false;
    return nacl.sign.detached.verify(msgBytes, signature, publicKey);
  } catch {
    return false;
  }
}
