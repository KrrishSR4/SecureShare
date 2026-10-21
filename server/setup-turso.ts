/**
 * setup-turso.ts
 * Creates all required tables in Turso (LibSQL) database
 * based on the Prisma schema.
 * Run once: npx tsx setup-turso.ts
 */
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const tables: string[] = [
  `CREATE TABLE IF NOT EXISTS "User" (
    "id"                       TEXT     NOT NULL PRIMARY KEY,
    "email"                    TEXT     NOT NULL UNIQUE,
    "name"                     TEXT,
    "password"                 TEXT,
    "role"                     TEXT     NOT NULL DEFAULT 'USER',
    "oauthProvider"            TEXT,
    "oauthId"                  TEXT,
    "profilePictureUrl"        TEXT,
    "emailVerified"            INTEGER  NOT NULL DEFAULT 0,
    "verificationTokenHash"    TEXT,
    "verificationTokenExpires" DATETIME,
    "resetTokenHash"           TEXT,
    "resetTokenExpires"        DATETIME,
    "refreshTokenHash"         TEXT,
    "lastLogin"                DATETIME,
    "isActive"                 INTEGER  NOT NULL DEFAULT 1,
    "createdAt"                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS "File" (
    "id"                TEXT     NOT NULL PRIMARY KEY,
    "name"              TEXT     NOT NULL,
    "size"              INTEGER  NOT NULL,
    "encryptedSize"     INTEGER,
    "mimeType"          TEXT     NOT NULL,
    "r2Key"             TEXT     NOT NULL UNIQUE,
    "encryptedKey"      TEXT,
    "iv"                TEXT,
    "authTag"           TEXT,
    "encryptionVersion" INTEGER  NOT NULL DEFAULT 1,
    "keyVersion"        INTEGER  NOT NULL DEFAULT 1,
    "ownerId"           TEXT     NOT NULL,
    "inTrash"           INTEGER  NOT NULL DEFAULT 0,
    "createdAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "action"    TEXT     NOT NULL,
    "details"   TEXT     NOT NULL,
    "userId"    TEXT,
    "fileId"    TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id"            TEXT     NOT NULL PRIMARY KEY,
    "share_id"      TEXT,
    "file_name"     TEXT,
    "shared_by"     TEXT,
    "recipient"     TEXT,
    "action"        TEXT     NOT NULL,
    "encryption"    TEXT,
    "download_type" TEXT,
    "timestamp"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status"        TEXT     NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS "Share" (
    "id"                        TEXT     NOT NULL PRIMARY KEY,
    "token"                     TEXT     NOT NULL UNIQUE,
    "fileId"                    TEXT     NOT NULL,
    "password"                  TEXT,
    "expiresAt"                 DATETIME,
    "revoked"                   INTEGER  NOT NULL DEFAULT 0,
    "downloadsCount"            INTEGER  NOT NULL DEFAULT 0,
    "downloadsLimit"            INTEGER  NOT NULL DEFAULT 5,
    "recipientEmail"            TEXT,
    "emailVerificationRequired" INTEGER  NOT NULL DEFAULT 0,
    "verificationOtp"           TEXT,
    "verificationOtpExpires"    DATETIME,
    "createdAt"                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"                 DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
];

async function main() {
  console.log("🚀 Setting up Turso database tables...\n");
  for (const sql of tables) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS "(.+?)"/)?.[1];
    try {
      await client.execute(sql);
      console.log(`✅ Table "${tableName}" ready`);
    } catch (err: any) {
      console.error(`❌ Failed to create "${tableName}":`, err.message);
    }
  }
  console.log("\n✅ Turso database setup complete!");
  client.close();
}

main().catch(console.error);
