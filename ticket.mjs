import crypto from "crypto";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

function createWalletFromGoogle(googleID, serverSalt = "my-ticket-app-salt") {
  const seed = crypto.hkdfSync(
    "sha256",
    Buffer.from(googleID),
    Buffer.from(serverSalt),
    Buffer.from("solana-ticket-seed"),
    32,
  );
  return Keypair.fromSeed(new Uint8Array(seed));
}

async function runDemo() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  const userA = createWalletFromGoogle("google_id_alice_123");
  const userB = createWalletFromGoogle("google_id_bob_456");
  let admin;
  const ADMIN_KEY_FILE = "./admin.json";
  if (fs.existsSync(ADMIN_KEY_FILE)) {
    const rawKey = JSON.parse(fs.readFileSync(ADMIN_KEY_FILE, "utf-8"));
    admin = Keypair.fromSecretKey(new Uint8Array(rawKey));
  } else {
    admin = Keypair.generate();
    fs.writeFileSync(
      ADMIN_KEY_FILE,
      JSON.stringify(Array.from(admin.secretKey)),
    );
    console.log("=== ĐÃ TẠO VÍ ADMIN MỚI ===");
    console.log("Địa chỉ ví Admin:", admin.publicKey.toBase58());
    console.log(
      "👉 Hãy vào https://faucet.solana.com/ dán ví này để nhận SOL test, sau đó chạy lại script!",
    );
    process.exit(0);
  }

  console.log(`Ví Khách A (Alice): ${userA.publicKey.toBase58()}`);
  console.log(`Ví Khách B (Bob):   ${userB.publicKey.toBase58()}`);
  console.log(`Ví ADMIN:   ${admin.publicKey.toBase58()}`);
  console.log("====================================");
  const balanceLamportsA = await connection.getBalance(userA.publicKey);
  const balanceLamportsB = await connection.getBalance(userA.publicKey);
  const balanceLamportsAdmin = await connection.getBalance(admin.publicKey);
  console.log(`Số dư của A: ${balanceLamportsA / 1e9} SOL`);
  console.log(`Số dư của A: ${balanceLamportsB / 1e9} SOL`);
  console.log(`Số dư của Admin: ${balanceLamportsAdmin / 1e9} SOL`);

  console.log("\n--- BƯỚC 1: ADMIN TẠO LOẠI VÉ ---");
  const ticketMint = await createMint(
    connection,
    admin, // Admin trả phí tạo token trên blockchain
    admin.publicKey, // Admin giữ quyền in thêm vé
    null, // Không dùng quyền đóng băng
    0, // Decimals = 0 (đặc trưng của vé sự kiện)
  );
  console.log("✅ Đã tạo thành công Token Mint (Mã định danh vé):");
  console.log(ticketMint.toBase58());

  // Lưu mã vé vào file để sau này dùng cho bước chuyển A -> B
  fs.writeFileSync("./ticket-mint.txt", ticketMint.toBase58());

  // 5. Admin tạo ngăn chứa vé (ATA) cho Khách A và đúc 1 vé bỏ vào
  console.log("\n--- BƯỚC 2: BẮN VÉ VÀO VÍ KHÁCH A ---");
  const aliceTicketAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    admin, // Admin trả phí mở ngăn chứa cho khách
    ticketMint, // Loại vé
    userA.publicKey, // Chủ sở hữu ngăn chứa là Khách A
  );
  console.log(
    `Ngăn chứa vé (ATA) của Khách A: ${aliceTicketAccount.address.toBase58()}`,
  );

  // In 1 vé đưa vào ngăn chứa của A
  await mintTo(
    connection,
    admin, // Admin trả phí gas
    ticketMint, // Loại vé cần in
    aliceTicketAccount.address, // Bắn vào ngăn của A
    admin, // Admin ký lệnh in vé
    10, // Số lượng in: 1 vé
  );

  console.log("✅ Đã bắn thành công 1 vé vào ví của Khách A!");
  console.log(`\nKiểm tra số dư vé của Khách A trên Explorer:`);
  console.log(
    `https://explorer.solana.com/address/${aliceTicketAccount.address.toBase58()}?cluster=devnet`,
  );
}

runDemo();
