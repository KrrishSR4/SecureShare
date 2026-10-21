import path from "path";
import { defineConfig } from "prisma/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

// Load .env for CLI commands (db push, migrate, generate, etc.)
dotenv.config({ path: path.join(process.cwd(), ".env") });

const tursoUrl = process.env.TURSO_DATABASE_URL as string;
const tursoToken = process.env.TURSO_AUTH_TOKEN as string;

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: "file:./prisma/dev.db",
  },
  migrate: {
    async adapter() {
      const client = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      });
      return new PrismaLibSql(client);
    },
  },
});
