import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import router from "./routes/index.js";
import { prisma } from "./lib/prisma.js";
import { seedRbac } from "./rbac/rbac.seed.js";
import { ensureMarketplaceSchema } from "./service/ensureMarketplaceSchema.js";
import { registerPayOSWebhook } from "./config/payos.config.js";
import { EventService } from "./service/event.service.js";
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 6000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "ticket-api" });
});

app.use("/api/v1/", router);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log(`Serving frontend from ${frontendDist}`);
}

const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("Đã kết nối PostgreSQL qua Prisma");
    try {
      await seedRbac();
    } catch (seedErr: any) {
      console.warn(
        "⚠️ [RBAC] Chưa seed được (chạy npx prisma db push):",
        seedErr?.message,
      );
    }
    try {
      await ensureMarketplaceSchema();
    } catch (mktErr: any) {
      console.warn("⚠️ [Marketplace] Chưa tạo bảng P2P:", mktErr?.message);
    }
  } catch (error) {
    console.error("Không kết nối được database:", error);
  }
  console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
  void registerPayOSWebhook();

  // Tự đóng/mở bán vé theo lịch (mỗi phút)
  const runSalesSync = () => {
    void EventService.syncSalesWindows()
      .then((r) => {
        if (r.closed.closed > 0) {
          console.log(
            `[Sales] Đã tự đóng bán ${r.closed.closed} sự kiện:`,
            r.closed.ids.join(", "),
          );
        }
        if (r.opened.opened > 0) {
          console.log(
            `[Sales] Đã mở bán ${r.opened.opened} sự kiện (tới giờ mở bán):`,
            r.opened.ids.join(", "),
          );
        }
      })
      .catch((err) => console.warn("[Sales] syncSalesWindows:", err));
  };
  runSalesSync();
  setInterval(runSalesSync, 60_000);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} đang bị chiếm. Tắt process cũ rồi chạy lại:\n` +
        `  netstat -ano | findstr :${PORT}\n` +
        `  taskkill /PID <pid> /F`,
    );
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});
