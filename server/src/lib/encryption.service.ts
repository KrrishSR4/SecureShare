import crypto from "crypto";
import { pipeline } from "stream/promises";
import { Readable, Writable } from "stream";

const ALGORITHM = "aes-256-gcm";

// Get the master key from env or use a fallback for development (32 bytes)
const MASTER_KEY = process.env.MASTER_KEY || "0123456789abcdef0123456789abcdef";

function getKey(): Buffer {
  if (MASTER_KEY.length !== 32) {
    throw new Error("MASTER_KEY must be exactly 32 bytes (characters) long for aes-256-gcm");
  }
  return Buffer.from(MASTER_KEY, "utf-8");
}

export interface EncryptionResult {
  iv: string;
  authTag: string;
  encryptedSize: number;
}

export const EncryptionService = {
  async encryptStream(inputStream: Readable, outputStream: Writable): Promise<EncryptionResult> {
    const iv = crypto.randomBytes(16);
    const key = getKey();
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encryptedSize = 0;
    cipher.on("data", (chunk) => {
      encryptedSize += chunk.length;
    });

    await pipeline(inputStream, cipher, outputStream);

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      encryptedSize,
    };
  },

  async decryptStream(inputStream: Readable, outputStream: Writable, ivHex: string, authTagHex: string): Promise<void> {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    await pipeline(inputStream, decipher, outputStream);
  }
};
