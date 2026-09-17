import { Keypair } from "@solana/web3.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export class WalletService {
  static createWalletFromGoogle(googleID: string): Keypair {
    const salt = process.env.SERVER_SALT;
    if (!salt) {
      throw new Error("Thiếu biến môi trường SERVER_SALT trong file .env!");
    }
    const seed = crypto.hkdfSync(
      "sha256",
      Buffer.from(googleID, "utf-8"),
      Buffer.from(salt, "utf-8"),
      Buffer.from("solana-ticket-seed", "utf-8"),
      32,
    );

    return Keypair.fromSeed(new Uint8Array(seed));
  }
}
