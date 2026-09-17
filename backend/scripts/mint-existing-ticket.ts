/**
 * Mint on-chain cho vé đã có mã TIX-/demo- (cần SERVER_PRIVATE_KEY có SOL devnet).
 *
 * Usage:
 *   npx tsx scripts/mint-existing-ticket.ts TIX-8457612141-1
 */
import "dotenv/config";
import { SolanaService } from "../src/service/solana.service.js";

const code = process.argv[2];
if (!code) {
  console.error("Usage: npx tsx scripts/mint-existing-ticket.ts <TIX-...|ticketId>");
  process.exit(1);
}

const kp = SolanaService.getServerKeypair();
console.log("Hot wallet:", kp.publicKey.toBase58());
console.log(
  "Faucet:",
  `https://faucet.solana.com/?address=${kp.publicKey.toBase58()}`,
);

try {
  const result = await SolanaService.mintByCodeOrId(code);
  console.log(JSON.stringify(result, null, 2));
  console.log("Explorer:", result.explorerUrl);
} catch (e: any) {
  console.error("FAILED:", e?.message || e);
  process.exit(1);
}
