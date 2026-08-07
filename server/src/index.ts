import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import busboy from "busboy";
import fs from "fs";
import path from "path";
import prisma, { connectPostgres } from "./config/postgres.js";
import { connectRedis } from "./config/redis.js";
import { DatabaseService } from "./services/database.service.js";
import { RedisService } from "./services/redis.service.js";
import { CacheService } from "./services/cache.service.js";
import { TokenService } from "./services/token.service.js";
import { EncryptionService } from "./lib/encryption.service.js";
import crypto from "crypto";


const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// SERVER IN-MEMORY DATA STORES
interface SharedSession {
  id: string;
  recipientEmail: string;
  url: string;
  created: string;
  status: "active" | "expired" | "revoked";
  downloadsCount: number;
  downloadLimit: number;
}

interface WorkspaceFile {
  id: string;
  name: string;
  extension: string;
  size: string;
  sizeBytes: number;
  uploadTime: string;
  owner: string;
  status: "completed" | "failed" | "uploading";
  type: string;
  shares: SharedSession[];
  content: string; // Base64 ciphertext / file contents
}

interface ActivityEvent {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  target: string;
  iconName: string;
}

interface SharePayload {
  id: string;
  name: string;
  size: string;
  type: string;
  content: string;
  requirePassword?: boolean;
  password?: string;
  oneTimeDownload?: boolean;
}

const workspaceFiles = new Map<string, WorkspaceFile>();
const trashFiles = new Map<string, WorkspaceFile>();
const sharedFilesMap = new Map<string, SharePayload>();
const activitiesList: ActivityEvent[] = [];

// Helper to log activities on the server
const logServerActivity = (action: string, details: string, target: string, iconName: string) => {
  const newActivity: ActivityEvent = {
    id: `act-${Math.random().toString(36).substring(2, 9)}`,
    action,
    details,
    timestamp: "Just now",
    target,
    iconName,
  };
  activitiesList.unshift(newActivity);
  if (activitiesList.length > 20) {
    activitiesList.pop(); // keep last 20 activities
  }
};

// Seed initial log
logServerActivity("System Started", "SecureShare cloud node initialized successfully", "System Node", "Server");

app.get("/api/health", async (req: Request, res: Response) => {
  const dbAlive = await DatabaseService.isAlive();
  const redisAlive = RedisService.isAlive();
  res.json({
    status: dbAlive ? "ok" : "error",
    databaseConnected: dbAlive,
    redisConnected: redisAlive,
    cacheActive: redisAlive,
    timestamp: new Date().toISOString(),
  });
});

// AUTHENTICATION ROUTES
app.use("/api/auth", authRoutes);

// Get all files
app.get("/api/files", (req: Request, res: Response) => {
  res.json(Array.from(workspaceFiles.values()));
});

// Create new file
app.post("/api/files", (req: Request, res: Response): void => {
  const bb = busboy({ headers: req.headers as any });
  let fileData: any = {};

  bb.on("field", (name, val) => {
    fileData[name] = val;
  });

  bb.on("file", async (name, fileStream, info) => {
    const fileId = `f-${Math.random().toString(36).substring(2, 9)}`;
    const r2Key = crypto.randomUUID(); 
    const uploadPath = path.join(process.cwd(), "uploads", r2Key);
    const writeStream = fs.createWriteStream(uploadPath);

    try {
      const { iv, authTag, encryptedSize } = await EncryptionService.encryptStream(fileStream, writeStream);

      const dbFile = await prisma.file.create({
        data: {
          id: fileId,
          name: fileData.name || info.filename,
          size: parseInt(fileData.sizeBytes || "0", 10),
          encryptedSize,
          mimeType: fileData.type || info.mimeType,
          r2Key,
          iv,
          authTag,
          owner: {
            connectOrCreate: {
              where: { email: "alex@example.com" },
              create: {
                id: "mock-user-id",
                email: "alex@example.com",
                name: "Alex Rivera"
              }
            }
          }
        }
      });

      const newFile: WorkspaceFile = {
        id: fileId,
        name: fileData.name || info.filename,
        extension: fileData.extension || info.filename.split('.').pop() || "bin",
        size: fileData.size || "Unknown size",
        sizeBytes: dbFile.size,
        uploadTime: "Just now",
        owner: "Alex Rivera",
        status: "completed",
        type: fileData.type || info.mimeType,
        shares: [],
        content: "" // No plaintext stored
      };
      workspaceFiles.set(fileId, newFile);

      logServerActivity("Uploaded File", `Encrypted and saved ${newFile.name}.${newFile.extension}`, `${newFile.name}.${newFile.extension}`, "Upload");
      res.json(newFile);
    } catch (err) {
      console.error("Encryption error:", err);
      res.status(500).json({ error: "Failed to encrypt and store file." });
    }
  });

  req.pipe(bb);
});

// Download decrypted file
app.get("/api/files/:fileId/download", async (req: Request, res: Response): Promise<void> => {
  const { fileId } = req.params;
  
  try {
    const dbFile = await prisma.file.findUnique({ where: { id: fileId as string } });
    if (!dbFile || !dbFile.iv || !dbFile.authTag) {
      res.status(404).json({ error: "File or encryption metadata not found." });
      return;
    }

    const filePath = path.join(process.cwd(), "uploads", dbFile.r2Key);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Encrypted file missing on disk." });
      return;
    }

    const readStream = fs.createReadStream(filePath);
    
    res.setHeader("Content-Disposition", `attachment; filename="${dbFile.name}"`);
    res.setHeader("Content-Type", dbFile.mimeType);

    await EncryptionService.decryptStream(readStream, res, dbFile.iv, dbFile.authTag);
    
    logServerActivity("Downloaded File", `Decrypted and streamed ${dbFile.name}`, dbFile.name, "Download");
  } catch (err) {
    console.error("Decryption error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to decrypt file. Integrity check might have failed." });
    }
  }
});

// Rename file
app.post("/api/files/:fileId/rename", (req: Request, res: Response): any => {
  const { fileId } = req.params as { fileId: string };
  const { name } = req.body as { name?: string };

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "New name is required." });
  }

  const file = workspaceFiles.get(fileId);
  if (!file) {
    return res.status(404).json({ error: "File not found." });
  }

  const oldName = file.name;
  file.name = name;
  workspaceFiles.set(fileId, file);

  logServerActivity("Renamed File", `Renamed ${oldName}.${file.extension} to ${name}.${file.extension}`, `${name}.${file.extension}`, "Edit2");
  res.json(file);
});

// Delete file (move to trash)
app.delete("/api/files/:fileId", (req: Request, res: Response): any => {
  const { fileId } = req.params as { fileId: string };
  const file = workspaceFiles.get(fileId);

  if (!file) {
    return res.status(404).json({ error: "File not found." });
  }

  workspaceFiles.delete(fileId);
  trashFiles.set(fileId, file);

  logServerActivity("Deleted File", `Moved ${file.name}.${file.extension} to trash bin`, `${file.name}.${file.extension}`, "Trash2");
  res.json({ success: true });
});

// Get trash files
app.get("/api/trash", (req: Request, res: Response) => {
  res.json(Array.from(trashFiles.values()));
});

// Restore file from trash
app.post("/api/trash/:fileId/restore", (req: Request, res: Response): any => {
  const { fileId } = req.params as { fileId: string };
  const file = trashFiles.get(fileId);

  if (!file) {
    return res.status(404).json({ error: "File not found in trash." });
  }

  trashFiles.delete(fileId);
  workspaceFiles.set(fileId, file);

  logServerActivity("Restored File", `Restored ${file.name}.${file.extension} from trash to workspace`, `${file.name}.${file.extension}`, "RotateCcw");
  res.json(file);
});

// Permanent delete from trash
app.delete("/api/trash/:fileId/permanent", async (req: Request, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };
  const file = trashFiles.get(fileId);

  if (!file) {
    return res.status(404).json({ error: "File not found in trash." });
  }

  // Remove any shares registered under this file
  file.shares.forEach((share) => {
    const shareId = share.url.split("/").pop();
    if (shareId) sharedFilesMap.delete(shareId);
  });

  try {
    // Find all shares for this file to invalidate their cache
    const fileShares = await prisma.share.findMany({
      where: { fileId }
    });
    for (const share of fileShares) {
      await TokenService.invalidateShare(share.token);
    }

    // Delete file from Prisma database (this cascade deletes database shares)
    await prisma.file.delete({
      where: { id: fileId }
    });
  } catch (err) {
    console.warn(`File ${fileId} not found in database during shredding:`, err);
  }

  trashFiles.delete(fileId);
  logServerActivity("Shredded File", `Permanently shredded metadata and cyphertext wrapper for ${file.name}.${file.extension}`, `${file.name}.${file.extension}`, "Trash2");
  res.json({ success: true });
});

// Helper to validate share tokens and enforce all security rules
async function validateShare(token: string) {
  if (!token || typeof token !== "string" || token.length < 20) {
    return { valid: false, error: "invalid_link" };
  }

  // Utilizing Cache-Aside Pattern via TokenService
  const share = await TokenService.getCachedShare(token);

  if (!share) {
    return { valid: false, error: "invalid_link" };
  }

  if (!share.file) {
    return { valid: false, error: "file_removed" };
  }

  if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
    return { valid: false, error: "link_expired" };
  }

  if (share.revoked) {
    return { valid: false, error: "link_revoked" };
  }

  if (share.downloadsCount >= share.downloadsLimit) {
    return { valid: false, error: "limit_reached" };
  }

  if (!share.file.owner || !share.file.owner.isActive) {
    return { valid: false, error: "owner_inactive" };
  }

  return { valid: true, share };
}

// Generate share link for a file
app.post("/api/files/:fileId/shares", async (req: Request, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };
  const { recipientEmail, password, oneTime } = req.body as {
    recipientEmail?: string;
    password?: string;
    oneTime?: boolean;
  };

  try {
    const file = workspaceFiles.get(fileId);
    const dbFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: { owner: true }
    });

    if (!dbFile) {
      return res.status(404).json({ error: "File not found." });
    }

    const token = crypto.randomBytes(18).toString("base64url");
    const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${token}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours default expiry

    const dbShare = await prisma.share.create({
      data: {
        token,
        fileId: dbFile.id,
        password: password || null,
        expiresAt,
        downloadsLimit: oneTime ? 1 : 5,
        recipientEmail: recipientEmail || "Public Access Link",
      }
    });

    // Register in shares list of in-memory file for sync
    if (file) {
      const newShare: SharedSession = {
        id: dbShare.id,
        recipientEmail: dbShare.recipientEmail || "Public Access Link",
        url: shareUrl,
        created: "Just now",
        status: "active",
        downloadsCount: 0,
        downloadLimit: dbShare.downloadsLimit,
      };
      file.shares.unshift(newShare);
      workspaceFiles.set(fileId, file);
    }

    // Register in in-memory share payload map for backward compatibility
    const sharePayload: SharePayload = {
      id: token,
      name: `${dbFile.name}`,
      size: file ? file.size : `${(dbFile.size / 1024).toFixed(0)} KB`,
      type: dbFile.mimeType,
      content: "",
      requirePassword: !!password,
      password: password || undefined,
      oneTimeDownload: !!oneTime,
    };
    sharedFilesMap.set(token, sharePayload);

    logServerActivity(
      "Generated Share Link",
      `Generated access link for ${dbFile.name} shared with ${recipientEmail || "public link"}`,
      dbFile.name,
      "Share2"
    );

    res.json({ url: shareUrl, shareId: token });
  } catch (err) {
    console.error("Share generation error:", err);
    res.status(500).json({ error: "Failed to generate share link" });
  }
});

// Get activities
app.get("/api/activities", (req: Request, res: Response) => {
  res.json(activitiesList);
});

// Log activity
app.post("/api/activities", (req: Request, res: Response) => {
  const { action, details, target, iconName } = req.body as {
    action: string;
    details: string;
    target: string;
    iconName: string;
  };
  logServerActivity(action, details, target, iconName);
  res.json({ success: true });
});

// Get share metadata (downloader endpoint)
app.get("/api/shares/:shareId", async (req: Request, res: Response): Promise<any> => {
  const { shareId } = req.params as { shareId: string };
  
  try {
    const { valid, share, error } = await validateShare(shareId);
    if (!valid || !share) {
      const status = error === "owner_inactive" ? 403 : error === "invalid_link" || error === "file_removed" ? 404 : 410;
      return res.status(status).json({ error });
    }

    res.json({
      id: share.token,
      name: share.file.name,
      size: `${(share.file.size / 1024).toFixed(0)} KB`,
      type: share.file.mimeType,
      requirePassword: !!share.password,
      oneTime: share.downloadsLimit === 1,
      expiresAt: share.expiresAt,
      downloadsCount: share.downloadsCount,
      downloadsLimit: share.downloadsLimit,
      remainingDownloads: share.downloadsLimit - share.downloadsCount,
      createdBy: share.file.owner.name || share.file.owner.email,
      createdAt: share.createdAt,
    });
  } catch (err) {
    console.error("Metadata retrieval error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

// Retrieve share content (legacy/fallback POST download endpoint)
app.post("/api/shares/:shareId/download", async (req: Request, res: Response): Promise<any> => {
  const { shareId } = req.params as { shareId: string };
  
  try {
    const { valid, share, error } = await validateShare(shareId);
    if (!valid || !share) {
      const status = error === "owner_inactive" ? 403 : error === "invalid_link" || error === "file_removed" ? 404 : 410;
      return res.status(status).json({ error });
    }

    // Since POST download usually returns content directly, we can support it if needed.
    // For our new robust file streaming download, the frontend will call GET /api/shares/:shareId/download.
    res.json({ content: "" });
  } catch (err) {
    console.error("Legacy download error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

// Decrypt / Retrieve share content with password verification
app.post("/api/shares/:shareId/decrypt", async (req: Request, res: Response): Promise<any> => {
  const { shareId } = req.params as { shareId: string };
  const { password } = req.body as { password?: string };

  try {
    const { valid, share, error } = await validateShare(shareId);
    if (!valid || !share) {
      const status = error === "owner_inactive" ? 403 : error === "invalid_link" || error === "file_removed" ? 404 : 410;
      return res.status(status).json({ error });
    }

    if (share.password && share.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    res.json({
      id: share.token,
      name: share.file.name,
      size: `${(share.file.size / 1024).toFixed(0)} KB`,
      type: share.file.mimeType,
      content: "",
      oneTime: share.downloadsLimit === 1,
      success: true
    });
  } catch (err) {
    console.error("Password verification error:", err);
    res.status(500).json({ error: "internal_server_error" });
  }
});

// Streams file, Updates download counter, Revokes link if necessary
app.get("/api/shares/:shareId/download", async (req: Request, res: Response): Promise<any> => {
  const { shareId } = req.params as { shareId: string };
  const { password } = req.query as { password?: string };

  try {
    const { valid, share, error } = await validateShare(shareId);
    if (!valid || !share) {
      const status = error === "owner_inactive" ? 403 : error === "invalid_link" || error === "file_removed" ? 404 : 410;
      return res.status(status).json({ error });
    }

    // Validate password if required
    if (share.password && share.password !== password) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const dbFile = share.file;
    if (!dbFile.iv || !dbFile.authTag) {
      return res.status(404).json({ error: "File encryption metadata missing" });
    }

    const filePath = path.join(process.cwd(), "uploads", dbFile.r2Key);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File missing on disk" });
    }

    // Increment download count and check if limit is reached
    const newCount = share.downloadsCount + 1;
    const isLimitReached = newCount >= share.downloadsLimit;

    await prisma.share.update({
      where: { id: share.id },
      data: {
        downloadsCount: newCount,
        revoked: isLimitReached ? true : share.revoked
      }
    });
    
    // Invalidate the cache to ensure next request fetches updated metadata
    await TokenService.invalidateShare(shareId);

    // Sync with in-memory workspaceFiles map if it exists
    const memoryFile = workspaceFiles.get(dbFile.id);
    if (memoryFile) {
      memoryFile.shares = memoryFile.shares.map(s => {
        if (s.url.endsWith(shareId)) {
          return {
            ...s,
            downloadsCount: newCount,
            status: isLimitReached ? "revoked" as const : s.status
          };
        }
        return s;
      });
      workspaceFiles.set(dbFile.id, memoryFile);
    }

    // Stream and decrypt the file
    const readStream = fs.createReadStream(filePath);
    
    res.setHeader("Content-Disposition", `attachment; filename="${dbFile.name}"`);
    res.setHeader("Content-Type", dbFile.mimeType);

    await EncryptionService.decryptStream(readStream, res, dbFile.iv, dbFile.authTag);

    logServerActivity(
      "Secure Share Downloaded",
      `Decrypted and streamed ${dbFile.name} from secure share link`,
      dbFile.name,
      "Download"
    );
  } catch (err) {
    console.error("Secure download error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to decrypt file. Integrity check might have failed." });
    }
  }
});

app.listen(PORT, async () => {
  console.log(`[server]: SecureShare backend running at http://localhost:${PORT}`);
  try {
    await connectPostgres();
    await connectRedis();
  } catch (err) {
    console.error("Server startup connection error:", err);
  }
});
