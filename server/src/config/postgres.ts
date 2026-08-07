import { PrismaClient } from "@prisma/client";

// Reuses connections and initializes once
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:postgrespassword@localhost:5432/secureshare?schema=public",
    },
  },
});

export async function connectPostgres(): Promise<void> {
  try {
    // Basic connectivity check
    await prisma.$executeRawUnsafe("SELECT 1;");
    console.log("[PostgreSQL] Connected to primary database successfully.");
  } catch (err) {
    console.error("[PostgreSQL] Database connection failed:", err);
    throw err;
  }
}

export default prisma;
