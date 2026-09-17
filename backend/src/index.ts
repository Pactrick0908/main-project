import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import router from "./routes/index.js";
import { prisma } from "./lib/prisma.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000;

app.use(cors());
app.use(express.json());

app.use("/api/v1/", router);

const server = app.listen(PORT, async () => {
  try {
    await prisma.$connect();
    console.log("Đã kết nối PostgreSQL qua Prisma");
  } catch (error) {
    console.error("Không kết nối được database:", error);
  }
  console.log(`Backend server đang chạy tại http://localhost:${PORT}`);
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
