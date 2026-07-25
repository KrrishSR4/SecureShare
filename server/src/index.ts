import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
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

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all files
app.get("/api/files", (req: Request, res: Response) => {
  res.json(Array.from(workspaceFiles.values()));
});

// Create new file
app.post("/api/files", (req: Request, res: Response): any => {
  const { name, extension, size, sizeBytes, type, content } = req.body as {
    name?: string;
    extension?: string;
    size?: string;
    sizeBytes?: number;
    type?: string;
    content?: string;
  };

  if (!name || !content) {
    return res.status(400).json({ error: "Name and content are required." });
  }

  const fileId = `f-${Math.random().toString(36).substring(2, 9)}`;
  const newFile: WorkspaceFile = {
    id: fileId,
    name,
    extension: extension || "bin",
    size: size || "Unknown size",
    sizeBytes: sizeBytes || 0,
    uploadTime: "Just now",
    owner: "Alex Rivera",
    status: "completed",
    type: type || "application/octet-stream",
    shares: [],
    content,
  };

  workspaceFiles.set(fileId, newFile);
  logServerActivity("Uploaded File", `Uploaded ${name}.${newFile.extension} to workspace`, `${name}.${newFile.extension}`, "Upload");

  res.json(newFile);
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
app.delete("/api/trash/:fileId/permanent", (req: Request, res: Response): any => {
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

  trashFiles.delete(fileId);
  logServerActivity("Shredded File", `Permanently shredded metadata and cyphertext wrapper for ${file.name}.${file.extension}`, `${file.name}.${file.extension}`, "Trash2");
  res.json({ success: true });
});

// Generate share link for a file
app.post("/api/files/:fileId/shares", (req: Request, res: Response): any => {
  const { fileId } = req.params as { fileId: string };
  const { recipientEmail, password, oneTime } = req.body as {
    recipientEmail?: string;
    password?: string;
    oneTime?: boolean;
  };

  const file = workspaceFiles.get(fileId);
  if (!file) {
    return res.status(404).json({ error: "File not found." });
  }

  const shareId = Math.random().toString(36).substring(2, 7) + Math.random().toString(36).substring(2, 7); // 10 chars ID
  const shareUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/share/${shareId}`;

  // Register in shares list of file
  const newShare: SharedSession = {
    id: `s-${Math.random().toString(36).substring(2, 9)}`,
    recipientEmail: recipientEmail || "Public Access Link",
    url: shareUrl,
    created: "Just now",
    status: "active",
    downloadsCount: 0,
    downloadLimit: 5,
  };
  file.shares.unshift(newShare);
  workspaceFiles.set(fileId, file);

  // Register in share payload map
  const sharePayload: SharePayload = {
    id: shareId,
    name: `${file.name}.${file.extension}`,
    size: file.size,
    type: file.type,
    content: file.content,
    requirePassword: !!password,
    password: password || undefined,
    oneTimeDownload: !!oneTime,
  };
  sharedFilesMap.set(shareId, sharePayload);

  logServerActivity("Generated Share Link", `Generated access link for ${file.name}.${file.extension} shared with ${recipientEmail || "public link"}`, `${file.name}.${file.extension}`, "Share2");

  res.json({ url: shareUrl, shareId });
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
app.get("/api/shares/:shareId", (req: Request, res: Response): any => {
  const { shareId } = req.params as { shareId: string };
  const payload = sharedFilesMap.get(shareId);

  if (!payload) {
    return res.status(404).json({ error: "Share expired or not found." });
  }

  // If no password, we return content right away, and if oneTime, delete it
  if (!payload.requirePassword) {
    const responsePayload = {
      ...payload,
      requirePassword: false,
    };

    if (payload.oneTimeDownload) {
      sharedFilesMap.delete(shareId);
      console.log(`Shredded one-time file ${shareId} on retrieval.`);
    }

    return res.json(responsePayload);
  }

  // If password required, do NOT return content yet
  res.json({
    id: payload.id,
    name: payload.name,
    size: payload.size,
    type: payload.type,
    requirePassword: true,
    oneTime: payload.oneTimeDownload,
  });
});

// Decrypt / Retrieve share content with password verification
app.post("/api/shares/:shareId/decrypt", (req: Request, res: Response): any => {
  const { shareId } = req.params as { shareId: string };
  const { password } = req.body as { password?: string };

  const payload = sharedFilesMap.get(shareId);
  if (!payload) {
    return res.status(404).json({ error: "Share expired or not found." });
  }

  if (payload.password !== password) {
    return res.status(401).json({ error: "Invalid decryption password." });
  }

  const responsePayload = {
    id: payload.id,
    name: payload.name,
    size: payload.size,
    type: payload.type,
    content: payload.content,
    oneTime: payload.oneTimeDownload,
  };

  if (payload.oneTimeDownload) {
    sharedFilesMap.delete(shareId);
    console.log(`Shredded one-time file ${shareId} on decryption.`);
  }

  res.json(responsePayload);
});

app.listen(PORT, () => {
  console.log(`[server]: SecureShare backend running at http://localhost:${PORT}`);
});
