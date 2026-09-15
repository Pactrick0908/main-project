import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("Thiếu biến môi trường DATABASE_URL trong file .env!");
}

const adapter = new PrismaPg({
    connectionString,
    ssl: { rejectUnauthorized: false },
});

export const prisma = new PrismaClient({ adapter });
