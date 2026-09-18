import { prisma } from "../lib/prisma.js";

/** Tạo bảng P2P nếu chưa có — không dùng db push toàn schema (DB remote có bảng thừa). */
export async function ensureMarketplaceSchema() {
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ResaleListingStatus" AS ENUM ('ACTIVE', 'RESERVED', 'SOLD', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "ResaleEscrowStatus" AS ENUM ('PENDING_PAYMENT', 'HELD', 'RELEASED', 'REFUNDED', 'CANCELLED');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "RefundLedgerKind" AS ENUM ('P2P_RELEASE', 'P2P_REFUND', 'PRIMARY_REFUND');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT false;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "tickets"
      ADD COLUMN IF NOT EXISTS "original_order_id" INTEGER;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "resale_state" VARCHAR(30),
      ADD COLUMN IF NOT EXISTS "primary_refund_status" VARCHAR(40),
      ADD COLUMN IF NOT EXISTS "primary_refund_beneficiary_user_id" INTEGER;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "resale_listings" (
      "id" SERIAL PRIMARY KEY,
      "ticket_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE RESTRICT,
      "seller_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
      "event_id" INTEGER NOT NULL REFERENCES "events"("id") ON DELETE RESTRICT,
      "price" DECIMAL(15, 2) NOT NULL,
      "face_price" DECIMAL(15, 2) NOT NULL,
      "bank_code" VARCHAR(20) NOT NULL,
      "bank_name" VARCHAR(100) NOT NULL,
      "bank_account_no" VARCHAR(50) NOT NULL,
      "bank_account_name" VARCHAR(150) NOT NULL,
      "note" TEXT,
      "status" "ResaleListingStatus" NOT NULL DEFAULT 'ACTIVE',
      "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "resale_trades" (
      "id" SERIAL PRIMARY KEY,
      "listing_id" INTEGER NOT NULL REFERENCES "resale_listings"("id") ON DELETE RESTRICT,
      "ticket_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE RESTRICT,
      "seller_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
      "buyer_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
      "amount" DECIMAL(15, 2) NOT NULL,
      "payos_order_code" BIGINT NOT NULL UNIQUE,
      "payment_link_id" VARCHAR(100),
      "escrow_status" "ResaleEscrowStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
      "release_reason" VARCHAR(40),
      "paid_at" TIMESTAMP(6),
      "released_at" TIMESTAMP(6),
      "refunded_at" TIMESTAMP(6),
      "expires_at" TIMESTAMP(6) NOT NULL,
      "sol_tx_signature" VARCHAR(128),
      "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "refund_ledger" (
      "id" SERIAL PRIMARY KEY,
      "ticket_id" INTEGER NOT NULL REFERENCES "tickets"("id") ON DELETE CASCADE,
      "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "kind" "RefundLedgerKind" NOT NULL,
      "amount" DECIMAL(15, 2) NOT NULL,
      "ref_type" VARCHAR(40) NOT NULL,
      "ref_id" INTEGER NOT NULL,
      "note" TEXT,
      "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE ("ticket_id", "kind", "user_id")
    );
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS resale_listings_status_event_id_idx ON "resale_listings" ("status", "event_id")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS resale_listings_ticket_id_idx ON "resale_listings" ("ticket_id")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS resale_trades_ticket_id_idx ON "resale_trades" ("ticket_id")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS resale_trades_buyer_id_idx ON "resale_trades" ("buyer_id")`,
  );

  console.log("✅ [Marketplace] Schema P2P sẵn sàng");
}
