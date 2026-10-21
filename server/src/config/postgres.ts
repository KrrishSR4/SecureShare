import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import dotenv from "dotenv";

dotenv.config();

// PrismaLibSql accepts config directly (not a pre-created Client instance)
const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Reuses connections and initializes once
const prisma = new PrismaClient({ adapter } as any);

export async function connectPostgres(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("[Turso] Connected to LibSQL database successfully.");
  } catch (err) {
    console.error("[Turso] Database connection failed:", err);
    throw err;
  }
}

export default prisma;
