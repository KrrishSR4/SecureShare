import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { requireAuth, AuthRequest } from "./middleware/auth.js";
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

// Helper to log activities on the server
const logServerActivity = async (action: string, details: string, target: string, iconName: string, userId?: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        details,
        userId: userId || null
      }
    });
  } catch (err) {
    console.error("Failed to write server activity log to DB:", err);
  }
};

interface AuditLogPayload {
  shareId?: string;
  fileName?: string;
  sharedBy?: string;
  recipient?: string;
  action: string;
  encryption?: string;
  downloadType?: string;
  status: string;
}

const createAuditLog = async (payload: AuditLogPayload) => {
  try {
    await prisma.supabaseAuditLog.create({
      data: {
        shareId: payload.shareId || null,
        fileName: payload.fileName || null,
        sharedBy: payload.sharedBy || null,
        recipient: payload.recipient || null,
        action: payload.action,
        encryption: payload.encryption || null,
        downloadType: payload.downloadType || null,
        status: payload.status
      }
    });
  } catch (err) {
    console.error("Failed to write Supabase audit log:", err);
  }
};

const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
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
app.get("/api/files", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const dbFiles = await prisma.file.findMany({
      where: {
        ownerId: userId,
        inTrash: false
      },
      include: {
        shares: true,
        owner: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedFiles: WorkspaceFile[] = dbFiles.map((f) => ({
      id: f.id,
      name: f.name,
      extension: f.name.split('.').pop() || "bin",
      size: formatBytes(f.size),
      sizeBytes: f.size,
      uploadTime: f.createdAt.toISOString(),
      owner: f.owner.name || f.owner.email,
      status: "completed",
      type: f.mimeType,
      shares: f.shares.map((s) => ({
        id: s.id,
        recipientEmail: s.recipientEmail || "Public Access Link",
        url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${s.token}`,
        created: s.createdAt.toISOString(),
        status: s.revoked ? "revoked" as const : "active" as const,
        downloadsCount: s.downloadsCount,
        downloadLimit: s.downloadsLimit
      })),
      content: ""
    }));

    res.json(mappedFiles);
  } catch (err) {
    console.error("Failed to get files:", err);
    res.status(500).json({ error: "Failed to fetch files." });
  }
});

// Create new file
app.post("/api/files", requireAuth, (req: AuthRequest, res: Response): void => {
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
            connect: { id: req.user?.userId }
          }
        },
        include: {
          owner: true
        }
      });

      const newFile: WorkspaceFile = {
        id: fileId,
        name: dbFile.name,
        extension: dbFile.name.split('.').pop() || "bin",
        size: formatBytes(dbFile.size),
        sizeBytes: dbFile.size,
        uploadTime: "Just now",
        owner: dbFile.owner.name || dbFile.owner.email,
        status: "completed",
        type: dbFile.mimeType,
        shares: [],
        content: ""
      };

      logServerActivity("Uploaded File", `Encrypted and saved ${newFile.name}.${newFile.extension}`, `${newFile.name}.${newFile.extension}`, "Upload", req.user?.userId);
      res.json(newFile);
    } catch (err) {
      console.error("Encryption error:", err);
      // Record ENCRYPTION_FAILED in Supabase audit logs
      await createAuditLog({
        fileName: fileData.name || info.filename,
        sharedBy: req.user?.userId || "Unknown",
        recipient: "None",
        action: "ENCRYPTION_FAILED",
        encryption: "AES-256",
        status: "FAILED"
      });
      res.status(500).json({ error: "Failed to encrypt and store file." });
    }
  });

  req.pipe(bb);
});

// Download decrypted file
app.get("/api/files/:fileId/download", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { fileId } = req.params;
  
  try {
    const dbFile = await prisma.file.findFirst({
      where: { id: fileId as string, ownerId: req.user?.userId }
    });
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
    
    logServerActivity("Downloaded File", `Decrypted and streamed ${dbFile.name}`, dbFile.name, "Download", req.user?.userId);
  } catch (err) {
    console.error("Decryption error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to decrypt file. Integrity check might have failed." });
    }
  }
});

// Rename file
app.post("/api/files/:fileId/rename", requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };
  const { name } = req.body as { name?: string };

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "New name is required." });
  }

  try {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: req.user?.userId },
      include: { owner: true }
    });

    if (!file) {
      return res.status(404).json({ error: "File not found." });
    }

    const oldName = file.name;
    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: { name },
      include: { owner: true }
    });

    const ext = updatedFile.name.split('.').pop() || "bin";
    logServerActivity("Renamed File", `Renamed ${oldName}.${ext} to ${name}.${ext}`, `${name}.${ext}`, "Edit2", req.user?.userId);
    
    res.json({
      id: updatedFile.id,
      name: updatedFile.name,
      extension: ext,
      size: formatBytes(updatedFile.size),
      sizeBytes: updatedFile.size,
      uploadTime: updatedFile.createdAt.toISOString(),
      owner: updatedFile.owner.name || updatedFile.owner.email,
      status: "completed",
      type: updatedFile.mimeType,
      shares: [],
      content: ""
    });
  } catch (err) {
    console.error("Rename failed:", err);
    res.status(500).json({ error: "Failed to rename file." });
  }
});

// Delete file (move to trash)
app.delete("/api/files/:fileId", requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };

  try {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: req.user?.userId }
    });

    if (!file) {
      return res.status(404).json({ error: "File not found." });
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { inTrash: true }
    });

    logServerActivity("Deleted File", `Moved ${file.name} to trash bin`, file.name, "Trash2", req.user?.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Failed to delete file." });
  }
});

// Get trash files
app.get("/api/trash", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const dbFiles = await prisma.file.findMany({
      where: {
        ownerId: req.user?.userId,
        inTrash: true
      },
      include: {
        owner: true
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    const mappedFiles = dbFiles.map(f => ({
      id: f.id,
      name: f.name,
      extension: f.name.split('.').pop() || "bin",
      size: formatBytes(f.size),
      sizeBytes: f.size,
      uploadTime: f.createdAt.toISOString(),
      owner: f.owner.name || f.owner.email,
      status: "completed",
      type: f.mimeType,
      shares: [],
      content: ""
    }));

    res.json(mappedFiles);
  } catch (err) {
    console.error("Failed to get trash files:", err);
    res.status(500).json({ error: "Failed to fetch trash bin." });
  }
});

// Restore file from trash
app.post("/api/trash/:fileId/restore", requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };

  try {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: req.user?.userId, inTrash: true },
      include: { owner: true }
    });

    if (!file) {
      return res.status(404).json({ error: "File not found in trash." });
    }

    const restoredFile = await prisma.file.update({
      where: { id: fileId },
      data: { inTrash: false },
      include: { owner: true }
    });

    logServerActivity("Restored File", `Restored ${restoredFile.name} from trash to workspace`, restoredFile.name, "RotateCcw", req.user?.userId);
    
    res.json({
      id: restoredFile.id,
      name: restoredFile.name,
      extension: restoredFile.name.split('.').pop() || "bin",
      size: formatBytes(restoredFile.size),
      sizeBytes: restoredFile.size,
      uploadTime: restoredFile.createdAt.toISOString(),
      owner: restoredFile.owner.name || restoredFile.owner.email,
      status: "completed",
      type: restoredFile.mimeType,
      shares: [],
      content: ""
    });
  } catch (err) {
    console.error("Restore failed:", err);
    res.status(500).json({ error: "Failed to restore file." });
  }
});

// Permanent delete from trash
app.delete("/api/trash/:fileId/permanent", requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };

  try {
    const file = await prisma.file.findFirst({
      where: { id: fileId, ownerId: req.user?.userId, inTrash: true }
    });

    if (!file) {
      return res.status(404).json({ error: "File not found in trash." });
    }

    // Find all shares for this file to invalidate their cache
    const fileShares = await prisma.share.findMany({
      where: { fileId }
    });
    for (const share of fileShares) {
      await TokenService.invalidateShare(share.token);
    }

    // Delete file from disk if it exists
    const filePath = path.join(process.cwd(), "uploads", file.r2Key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete file from Prisma database (this cascade deletes database shares)
    await prisma.file.delete({
      where: { id: fileId }
    });

    logServerActivity("Shredded File", `Permanently shredded metadata and cyphertext wrapper for ${file.name}`, file.name, "Trash2", req.user?.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Permanent delete failed:", err);
    res.status(500).json({ error: "Failed to shred file." });
  }
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
app.post("/api/files/:fileId/shares", requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  const { fileId } = req.params as { fileId: string };
  const { recipientEmail, password, oneTime } = req.body as {
    recipientEmail?: string;
    password?: string;
    oneTime?: boolean;
  };

  try {
    const dbFile = await prisma.file.findFirst({
      where: { id: fileId, ownerId: req.user?.userId },
      include: { owner: true }
    });

    if (!dbFile) {
      // Record SHARE_FAILED audit log
      await createAuditLog({
        fileName: "Unknown",
        sharedBy: req.user?.userId || "Unknown",
        recipient: recipientEmail || "Unknown",
        action: "SHARE_FAILED",
        status: "FAILED"
      });
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

    // Record FILE_SHARED audit log in Supabase
    await createAuditLog({
      shareId: token,
      fileName: dbFile.name,
      sharedBy: dbFile.owner.email,
      recipient: recipientEmail || "Public Access Link",
      action: "FILE_SHARED",
      encryption: dbFile.iv ? "AES-256" : "None",
      downloadType: oneTime ? "ONE_TIME" : "NORMAL",
      status: "SUCCESS"
    });

    logServerActivity(
      "Generated Share Link",
      `Generated access link for ${dbFile.name} shared with ${recipientEmail || "public link"}`,
      dbFile.name,
      "Share2",
      req.user?.userId
    );

    res.json({ url: shareUrl, shareId: token });
  } catch (err) {
    console.error("Share generation error:", err);
    // Record SHARE_FAILED audit log
    await createAuditLog({
      fileName: "Unknown",
      sharedBy: req.user?.userId || "Unknown",
      recipient: recipientEmail || "Unknown",
      action: "SHARE_FAILED",
      status: "FAILED"
    });
    res.status(500).json({ error: "Failed to generate share link" });
  }
});

// Revoke a share link
app.post("/api/shares/:shareId/revoke", requireAuth, async (req: AuthRequest, res: Response): Promise<any> => {
  const { shareId } = req.params as { shareId: string };

  try {
    const share = await prisma.share.findFirst({
      where: {
        token: shareId,
        file: { ownerId: req.user?.userId }
      },
      include: {
        file: { include: { owner: true } }
      }
    });

    if (!share) {
      return res.status(404).json({ error: "Share not found or unauthorized." });
    }

    // Set revoked: true
    await prisma.share.update({
      where: { id: share.id },
      data: { revoked: true }
    });

    // Invalidate Cache-Aside
    await TokenService.invalidateShare(shareId);

    // Delete temp file from disk
    const filePath = path.join(process.cwd(), "uploads", share.file.r2Key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from DB (cascades share deletion)
    await prisma.file.delete({
      where: { id: share.fileId }
    });

    // Record LINK_REVOKED audit log in Supabase
    await createAuditLog({
      shareId,
      fileName: share.file.name,
      sharedBy: share.file.owner.email,
      recipient: share.recipientEmail || "Public Access Link",
      action: "LINK_REVOKED",
      encryption: share.file.iv ? "AES-256" : "None",
      status: "SUCCESS"
    });

    // Record FILE_DELETED audit log in Supabase
    await createAuditLog({
      shareId,
      fileName: share.file.name,
      sharedBy: share.file.owner.email,
      recipient: share.recipientEmail || "Public Access Link",
      action: "FILE_DELETED",
      encryption: share.file.iv ? "AES-256" : "None",
      status: "SUCCESS"
    });

    logServerActivity("Revoked Share Link", `Revoked access link for ${share.file.name}`, share.file.name, "Trash2", req.user?.userId);
    res.json({ success: true });
  } catch (err) {
    console.error("Revocation error:", err);
    res.status(500).json({ error: "Failed to revoke share link" });
  }
});

// Get activities
app.get("/api/activities", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user?.userId } });
    const email = req.user?.role === "ADMIN" ? undefined : user?.email;

    const dbLogs = await prisma.supabaseAuditLog.findMany({
      where: email ? { sharedBy: email } : {},
      orderBy: { timestamp: "desc" },
      take: 20
    });

    const mappedActivities = dbLogs.map(log => ({
      id: log.id,
      time: log.timestamp.toISOString(),
      action: log.action,
      details: `${log.action}: ${log.fileName || "File"} shared with ${log.recipient || "Public"}`,
      fileName: log.fileName || "",
      iconName: "FileText"
    }));

    res.json(mappedActivities);
  } catch (err) {
    console.error("Failed to get activities:", err);
    res.status(500).json({ error: "Failed to fetch activities." });
  }
});

// Log activity
app.post("/api/activities", requireAuth, async (req: AuthRequest, res: Response) => {
  const { action, details, target, iconName } = req.body as {
    action: string;
    details: string;
    target: string;
    iconName: string;
  };
  await logServerActivity(action, details, target, iconName, req.user?.userId);
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
  const passwordHeader = req.header("x-share-password");
  const password = typeof passwordHeader === "string" ? passwordHeader : undefined;

  let dbShare;
  try {
    // Validate share and increment download counter atomically inside a row-locked transaction
    dbShare = await prisma.$transaction(async (tx) => {
      const share = await tx.share.findUnique({
        where: { token: shareId },
        include: {
          file: {
            include: { owner: true }
          }
        }
      });

      if (!share) {
        throw new Error("invalid_link");
      }

      if (share.revoked) {
        throw new Error("link_revoked");
      }

      if (share.downloadsCount >= share.downloadsLimit) {
        throw new Error("limit_reached");
      }

      if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
        throw new Error("link_expired");
      }

      if (!share.file.owner.isActive) {
        throw new Error("owner_inactive");
      }

      // Increment count
      return tx.share.update({
        where: { id: share.id },
        data: {
          downloadsCount: { increment: 1 }
        },
        include: {
          file: {
            include: { owner: true }
          }
        }
      });
    });
  } catch (err: any) {
    const errorMsg = err.message || "invalid_link";
    const status = errorMsg === "owner_inactive" ? 403 : errorMsg === "invalid_link" || errorMsg === "file_removed" ? 404 : 410;

    // Record DOWNLOAD_FAILED or LINK_EXPIRED audit event in Supabase
    await createAuditLog({
      shareId,
      fileName: "Unknown",
      sharedBy: "Unknown",
      recipient: "Unknown",
      action: errorMsg === "link_expired" ? "LINK_EXPIRED" : "DOWNLOAD_FAILED",
      encryption: "AES-256",
      status: "FAILED"
    });

    return res.status(status).json({ error: errorMsg });
  }

  // Validate password
  if (dbShare.password && dbShare.password !== password) {
    // Record DOWNLOAD_FAILED audit event in Supabase
    await createAuditLog({
      shareId: dbShare.token,
      fileName: dbShare.file.name,
      sharedBy: dbShare.file.owner.email,
      recipient: dbShare.recipientEmail || "Public Access Link",
      action: "DOWNLOAD_FAILED",
      encryption: "AES-256",
      status: "FAILED"
    });
    return res.status(401).json({ error: "Incorrect password" });
  }

  const dbFile = dbShare.file;
  if (!dbFile.iv || !dbFile.authTag) {
    return res.status(404).json({ error: "File encryption metadata missing" });
  }

  const filePath = path.join(process.cwd(), "uploads", dbFile.r2Key);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File missing on disk" });
  }

  try {
    // Invalidate the cache to ensure next request fetches updated metadata
    await TokenService.invalidateShare(shareId);

    // Stream and decrypt the file
    const readStream = fs.createReadStream(filePath);
    
    res.setHeader("Content-Disposition", `attachment; filename="${dbFile.name}"`);
    res.setHeader("Content-Type", dbFile.mimeType);

    await EncryptionService.decryptStream(readStream, res, dbFile.iv, dbFile.authTag);

    // Record FILE_DOWNLOADED audit event in Supabase
    await createAuditLog({
      shareId: dbShare.token,
      fileName: dbFile.name,
      sharedBy: dbFile.owner.email,
      recipient: dbShare.recipientEmail || "Public Access Link",
      action: "FILE_DOWNLOADED",
      encryption: "AES-256",
      downloadType: dbShare.downloadsLimit === 1 ? "ONE_TIME" : "NORMAL",
      status: "SUCCESS"
    });

    logServerActivity(
      "Secure Share Downloaded",
      `Decrypted and streamed ${dbFile.name} from secure share link`,
      dbFile.name,
      "Download"
    );

    // Enforce Zero-Persistence policy: delete temporary file if downloads limit reached or one-time download
    const isLimitReached = dbShare.downloadsCount >= dbShare.downloadsLimit;
    if (isLimitReached || dbShare.downloadsLimit === 1) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Cascade delete Share and File records from DB
      await prisma.share.delete({ where: { id: dbShare.id } });
      await prisma.file.delete({ where: { id: dbFile.id } });

      // Record FILE_DELETED audit log in Supabase
      await createAuditLog({
        shareId: dbShare.token,
        fileName: dbFile.name,
        sharedBy: dbFile.owner.email,
        recipient: dbShare.recipientEmail || "Public Access Link",
        action: "FILE_DELETED",
        encryption: "AES-256",
        status: "SUCCESS"
      });
    }
  } catch (err) {
    console.error("Secure download error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to decrypt file. Integrity check might have failed." });
    }
  }
});

const startCleanupInterval = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      // Find all expired shares
      const expiredShares = await prisma.share.findMany({
        where: {
          expiresAt: { lt: now }
        },
        include: {
          file: {
            include: { owner: true }
          }
        }
      });

      for (const share of expiredShares) {
        // Record LINK_EXPIRED in Supabase audit logs
        await createAuditLog({
          shareId: share.token,
          fileName: share.file.name,
          sharedBy: share.file.owner.email,
          recipient: share.recipientEmail || "Public Access Link",
          action: "LINK_EXPIRED",
          encryption: share.file.iv ? "AES-256" : "None",
          status: "SUCCESS"
        });

        // Delete file on disk
        const filePath = path.join(process.cwd(), "uploads", share.file.r2Key);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        // Delete Share and File
        await prisma.share.delete({ where: { id: share.id } });
        await prisma.file.delete({ where: { id: share.fileId } });

        // Record FILE_DELETED audit log in Supabase
        await createAuditLog({
          shareId: share.token,
          fileName: share.file.name,
          sharedBy: share.file.owner.email,
          recipient: share.recipientEmail || "Public Access Link",
          action: "FILE_DELETED",
          encryption: share.file.iv ? "AES-256" : "None",
          status: "SUCCESS"
        });
      }

      // Clean up orphaned files in uploads that don't match any active DB File record
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (fs.existsSync(uploadsDir)) {
        const filesOnDisk = fs.readdirSync(uploadsDir);
        const activeFiles = await prisma.file.findMany({
          select: { r2Key: true }
        });
        const activeKeys = new Set(activeFiles.map(f => f.r2Key));

        for (const file of filesOnDisk) {
          if (!activeKeys.has(file)) {
            // Delete orphaned file
            fs.unlinkSync(path.join(uploadsDir, file));
          }
        }
      }
    } catch (err) {
      console.error("Error during scheduled temporary files cleanup:", err);
    }
  }, 5 * 60 * 1000); // 5 minutes
};

app.listen(PORT, async () => {
  console.log(`[server]: SecureShare backend running at http://localhost:${PORT}`);
  try {
    await connectPostgres();
    await connectRedis();
    startCleanupInterval();
  } catch (err) {
    console.error("Server startup connection error:", err);
  }
});
