import fs from "fs";
import { Keypair } from "@solana/web3.js";

// Đọc mảng 64 bytes từ file admin.json
const rawKey = JSON.parse(fs.readFileSync("./admin.json", "utf-8"));
const admin = Keypair.fromSecretKey(new Uint8Array(rawKey));

console.log("=== ĐỊA CHỈ VÍ ADMIN ===");
console.log(admin.publicKey.toBase58());
