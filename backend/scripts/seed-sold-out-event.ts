/**
 * Làm 1 sự kiện BÁN HẾT VÉ để test UI "Hết vé".
 * Mặc định: event #8 KOSMIK LIVE (đổi EVENT_ID nếu cần).
 *
 * npx tsx scripts/seed-sold-out-event.ts
 */
import { prisma } from "../src/lib/prisma.ts";

const EVENT_ID = Number(process.env.SOLD_OUT_EVENT_ID || 8);
/** Mỗi hạng chỉ giữ N chỗ rồi bán hết — dễ seed */
const CAP_PER_ZONE = Number(process.env.SOLD_OUT_CAP || 3);

async function main() {
  const event = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    include: {
      eventZones: { include: { zone: true } },
    },
  });
  if (!event) {
    throw new Error(`Không tìm thấy event #${EVENT_ID}`);
  }

  let buyer = await prisma.user.findFirst({
    where: { email: "buyer-soldout@ticket.local" },
  });
  if (!buyer) {
    const customerRole = await prisma.role.findUnique({
      where: { name: "customer" },
    });
    buyer = await prisma.user.create({
      data: {
        fullName: "Buyer SoldOut Test",
        email: "buyer-soldout@ticket.local",
        googleId: `soldout-buyer:${Date.now()}`,
        walletAddress: `soldout-wallet-${EVENT_ID}`,
        avatarUrl: "",
        roleId: customerRole?.id ?? null,
      },
    });
  }

  console.log(`Sold-out target: #${event.id} "${event.title}"`);

  // Xóa vé cũ của event (test seed) rồi tạo lại cho đủ chỗ
  await prisma.ticketNonce.deleteMany({
    where: { ticket: { eventId: EVENT_ID } },
  });
  await prisma.ticket.deleteMany({ where: { eventId: EVENT_ID } });

  for (const ez of event.eventZones) {
    const cap = Math.max(1, CAP_PER_ZONE);
    await prisma.eventZone.update({
      where: { id: ez.id },
      data: { totalSeats: cap },
    });

    const rows = Array.from({ length: cap }, (_, i) => ({
      eventId: EVENT_ID,
      eventZoneId: ez.id,
      status: "sold",
      userId: buyer!.id,
      ownerWallet: buyer!.walletAddress,
    }));

    await prisma.ticket.createMany({ data: rows });
    console.log(
      `  ${ez.zone.name}: totalSeats=${cap}, created ${cap} sold tickets`,
    );
  }

  const check = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    include: {
      eventZones: {
        include: {
          zone: true,
          _count: { select: { tickets: true } },
        },
      },
    },
  });

  const soldOut = (check?.eventZones ?? []).every(
    (z) => z._count.tickets >= z.totalSeats,
  );
  console.log("\nKết quả:");
  for (const z of check?.eventZones ?? []) {
    console.log(
      `  ${z.zone.name}: ${z._count.tickets}/${z.totalSeats}`,
    );
  }
  console.log(
    soldOut
      ? `\n✅ Event #${EVENT_ID} đã BÁN HẾT — reload trang chủ /events/${EVENT_ID}`
      : `\n⚠️ Chưa sold-out hoàn toàn`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
