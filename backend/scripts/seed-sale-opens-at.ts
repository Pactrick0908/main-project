/**
 * Backfill saleOpensAt + gán dữ liệu test 2 case:
 * - chưa tới giờ mở bán
 * - đã tới giờ mở bán
 *
 * Chạy: npx tsx scripts/seed-sale-opens-at.ts
 */
import { prisma } from "../src/lib/prisma.ts";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function main() {
  const now = new Date();
  const events = await prisma.event.findMany({
    include: {
      schedules: {
        orderBy: { startTime: "asc" },
        take: 1,
      },
    },
    orderBy: { id: "asc" },
  });

  if (!events.length) {
    console.log("Không có sự kiện nào trong DB.");
    return;
  }

  // Phân case rõ để test UI
  // Chưa mở bán: id lẻ trong nhóm upcoming / hoặc nửa đầu upcoming
  // Đã mở bán: status open + upcoming đã tới giờ
  const upcoming = events.filter(
    (e) => String(e.status).toLowerCase() === "upcoming",
  );
  const openOnes = events.filter((e) =>
    ["open", "active", "published"].includes(String(e.status).toLowerCase()),
  );

  const notYetIds = new Set(
    upcoming.filter((_, i) => i % 2 === 0).map((e) => e.id),
  );
  const alreadyOpenIds = new Set([
    ...openOnes.map((e) => e.id),
    ...upcoming.filter((e) => !notYetIds.has(e.id)).map((e) => e.id),
  ]);

  console.log("=== Gán saleOpensAt ===\n");

  for (const ev of events) {
    const start = ev.schedules[0]?.startTime ?? null;
    let saleOpensAt: Date;
    let nextStatus = ev.status;
    let caseLabel: string;

    if (notYetIds.has(ev.id)) {
      // Chưa tới ngày mở bán: mở sau 2 ngày, vẫn trước giờ diễn nếu được
      saleOpensAt = new Date(now.getTime() + 2 * DAY);
      if (start && saleOpensAt >= start) {
        saleOpensAt = new Date(start.getTime() - 12 * HOUR);
        // nếu vẫn quá gần giờ diễn, đặt +1h từ now nhưng trước start
        if (saleOpensAt <= now) {
          saleOpensAt = new Date(
            Math.min(now.getTime() + 6 * HOUR, start.getTime() - HOUR),
          );
        }
      }
      // nếu start quá gần khiến vẫn không future → force +2 ngày và lùi start nếu cần (chỉ ghi chú)
      if (saleOpensAt <= now) {
        saleOpensAt = new Date(now.getTime() + 2 * DAY);
      }
      nextStatus = "upcoming";
      caseLabel = "CHƯA mở bán";
    } else if (alreadyOpenIds.has(ev.id)) {
      // Đã tới ngày mở bán: mở từ hôm qua
      saleOpensAt = new Date(now.getTime() - 1 * DAY);
      if (start && saleOpensAt >= start) {
        saleOpensAt = new Date(start.getTime() - 7 * DAY);
      }
      // Chỉ set open nếu chưa tới giờ diễn
      if (!start || start > now) {
        nextStatus = "open";
      }
      caseLabel = "ĐÃ mở bán";
    } else {
      // fallback: 7 ngày trước giờ diễn, hoặc yesterday
      saleOpensAt = start
        ? new Date(start.getTime() - 7 * DAY)
        : new Date(now.getTime() - DAY);
      caseLabel = "backfill mặc định";
    }

    await prisma.event.update({
      where: { id: ev.id },
      data: {
        saleOpensAt,
        status: nextStatus,
      },
    });

    console.log(
      `#${ev.id} [${caseLabel}] "${ev.title.slice(0, 48)}"`,
    );
    console.log(
      `   status: ${ev.status} → ${nextStatus}`,
    );
    console.log(
      `   saleOpensAt: ${saleOpensAt.toLocaleString("vi-VN")}`,
    );
    console.log(
      `   start: ${start ? start.toLocaleString("vi-VN") : "—"}`,
    );
    console.log("");
  }

  // Sync lại cửa sổ bán (upcoming đã tới giờ → open; quá giờ diễn → ended)
  const { EventService } = await import("../src/service/event.service.ts");
  const sync = await EventService.syncSalesWindows();
  console.log("syncSalesWindows:", sync);

  const after = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      saleOpensAt: true,
      schedules: {
        orderBy: { startTime: "asc" },
        take: 1,
        select: { startTime: true },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log("\n=== Kết quả test ===\n");
  for (const e of after) {
    const sale = e.saleOpensAt;
    const opened = !sale || sale <= now;
    const start = e.schedules[0]?.startTime;
    const buyable =
      ["open", "upcoming"].includes(String(e.status).toLowerCase()) &&
      opened &&
      (!start || start > now);
    console.log(
      `#${e.id} status=${e.status} saleOpened=${opened} có thể Mua vé≈${buyable} | ${e.title.slice(0, 40)}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
