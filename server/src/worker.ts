import { Hono } from "hono";
import { cors } from "hono/cors";
import { createClient } from "@supabase/supabase-js";
import { WorkerEncryptionService } from "./lib/encryption.worker.js";

type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  FRONTEND_URL: string;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Authorization", "Content-Type"],
}));

function getSupabase(c: any) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function authMiddleware(c: any, next: any) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer secureshare_jwt_")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.split(" ")[1];
  try {
    const emailB64 = token.replace("secureshare_jwt_", "");
    const email = atob(emailB64);
    c.set("userEmail", email);
    await next();
  } catch (err) {
    return c.json({ error: "Invalid token" }, 401);
  }
}

// 1. Google OAuth Initiation
app.get("/api/auth/google", (c) => {
  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", c.env.GOOGLE_CLIENT_ID || "");
  const WORKER_URL = new URL(c.req.url).origin;
  googleAuthUrl.searchParams.set("redirect_uri", `${WORKER_URL}/api/auth/google/callback`);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
  googleAuthUrl.searchParams.set("access_type", "offline");
  googleAuthUrl.searchParams.set("prompt", "consent");
  return c.redirect(googleAuthUrl.toString(), 302);
});

// 2. Google OAuth Callback
app.get("/api/auth/google/callback", async (c) => {
  const code = c.req.query("code");
  const FRONTEND_URL = c.env.FRONTEND_URL || "https://secureshare-frontend-dev.pages.dev";
  if (!code) return c.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthCodeMissing`, 302);

  const WORKER_URL = new URL(c.req.url).origin;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID || "",
        client_secret: c.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: `${WORKER_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) throw new Error("Failed to obtain Google access token");

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = (await userRes.json()) as any;
    
    // Ensure user exists in Supabase
    const supabase = getSupabase(c);
    const { data: existingUser } = await supabase.from('User').select('id').eq('email', googleUser.email).single();
    if (!existingUser) {
      await supabase.from('User').insert({
        id: `u-${crypto.randomUUID()}`,
        email: googleUser.email,
        name: googleUser.name,
        profilePictureUrl: googleUser.picture,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const userString = encodeURIComponent(
      JSON.stringify({
        id: googleUser.id || "google_user",
        name: googleUser.name || "Google User",
        email: googleUser.email,
        profilePictureUrl: googleUser.picture,
        role: "USER",
      })
    );

    const accessToken = "secureshare_jwt_" + btoa(googleUser.email || "user");
    return c.redirect(`${FRONTEND_URL}/auth/oauth-callback?accessToken=${accessToken}&user=${userString}`, 302);
  } catch (err) {
    console.error("Google Callback Error:", err);
    return c.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthFailed`, 302);
  }
});

// 3. GitHub OAuth Initiation
app.get("/api/auth/github", (c) => {
  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID || "");
  const WORKER_URL = new URL(c.req.url).origin;
  githubAuthUrl.searchParams.set("redirect_uri", `${WORKER_URL}/api/auth/github/callback`);
  githubAuthUrl.searchParams.set("scope", "user:email");
  return c.redirect(githubAuthUrl.toString(), 302);
});

// 4. GitHub OAuth Callback
app.get("/api/auth/github/callback", async (c) => {
  const code = c.req.query("code");
  const FRONTEND_URL = c.env.FRONTEND_URL || "https://secureshare-frontend-dev.pages.dev";
  if (!code) return c.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthCodeMissing`, 302);

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "SecureShare-Cloudflare-Worker",
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData.access_token) throw new Error("Failed to obtain GitHub access token");

    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "SecureShare-Cloudflare-Worker",
      },
    });
    const githubUser = (await userRes.json()) as any;

    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "SecureShare-Cloudflare-Worker",
      },
    });
    const emails = (await emailRes.json()) as any[];
    const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email || `${githubUser.login}@github.com`;
    
    // Ensure user exists in Supabase
    const supabase = getSupabase(c);
    const { data: existingUser } = await supabase.from('User').select('id').eq('email', primaryEmail).single();
    if (!existingUser) {
      await supabase.from('User').insert({
        id: `u-${crypto.randomUUID()}`,
        email: primaryEmail,
        name: githubUser.name || githubUser.login,
        profilePictureUrl: githubUser.avatar_url,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    const userString = encodeURIComponent(
      JSON.stringify({
        id: String(githubUser.id),
        name: githubUser.name || githubUser.login,
        email: primaryEmail,
        profilePictureUrl: githubUser.avatar_url,
        role: "USER",
      })
    );

    const accessToken = "secureshare_jwt_" + btoa(primaryEmail);
    return c.redirect(`${FRONTEND_URL}/auth/oauth-callback?accessToken=${accessToken}&user=${userString}`, 302);
  } catch (err) {
    console.error("GitHub Callback Error:", err);
    return c.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthFailed`, 302);
  }
});

app.get("/api/health", (c) => c.json({ status: "ok", runtime: "cloudflare-workers-hono", timestamp: new Date().toISOString() }));

// --- API ROUTES WITH SUPABASE ---

async function logActivity(supabase: any, action: string, details: string, userId: string) {
  await supabase.from('AuditLog').insert({
    id: crypto.randomUUID(),
    action,
    details,
    userId,
    createdAt: new Date().toISOString()
  });
}

async function getAuthUser(c: any) {
  const email = c.get("userEmail");
  const { data: user } = await getSupabase(c).from('User').select('id').eq('email', email).single();
  return user;
}

app.get("/api/files", authMiddleware, async (c) => {
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  if (!user) return c.json([]);

  const { data: files } = await supabase
    .from('File')
    .select(`*, Share(*), User(*)`)
    .eq('ownerId', user.id)
    .eq('inTrash', false)
    .order('createdAt', { ascending: false });

  if (!files) return c.json([]);

  const FRONTEND_URL = c.env.FRONTEND_URL || "https://secureshare-frontend-dev.pages.dev";

  const mappedFiles = files.map((f: any) => ({
    id: f.id,
    name: f.name,
    extension: f.name.split('.').pop() || "bin",
    size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(1)} KB`,
    sizeBytes: f.size,
    uploadTime: f.createdAt,
    owner: f.User?.name || f.User?.email || "Unknown",
    status: "completed",
    type: f.mimeType,
    shares: (f.Share || []).map((s: any) => ({
      id: s.id,
      recipientEmail: s.recipientEmail || "Public Access Link",
      url: `${FRONTEND_URL}/share/${s.token}`,
      created: s.createdAt,
      status: s.revoked ? "revoked" : "active",
      downloadsCount: s.downloadsCount,
      downloadLimit: s.downloadsLimit
    }))
  }));

  return c.json(mappedFiles);
});

app.post("/api/files", authMiddleware, async (c) => {
  try {
    const supabase = getSupabase(c);
    const user = await getAuthUser(c);
    if (!user) return c.json({ error: "User not found" }, 401);

    const body = await c.req.parseBody();
    const file = body["file"] as File;
    const name = body["name"] as string;
    const type = body["type"] as string;
    const sizeBytes = parseInt(body["sizeBytes"] as string, 10) || file.size;

    if (!file) return c.json({ error: "No file provided" }, 400);

    const arrayBuffer = await file.arrayBuffer();
    const { iv, authTag, encryptedBuffer } = await WorkerEncryptionService.encryptBuffer(arrayBuffer);

    const fileId = `f-${Math.random().toString(36).substring(2, 9)}`;
    const r2Key = crypto.randomUUID();

    const { error: storageError } = await supabase.storage
      .from('secureshare-storage')
      .upload(r2Key, encryptedBuffer, {
        contentType: 'application/octet-stream'
      });

    if (storageError) {
      console.error("Storage error:", storageError);
      return c.json({ error: "Storage upload failed" }, 500);
    }

    const { data: dbFile, error: dbError } = await supabase.from('File').insert({
      id: fileId,
      name: name || file.name,
      size: sizeBytes,
      encryptedSize: encryptedBuffer.byteLength,
      mimeType: type || file.type,
      r2Key,
      iv,
      authTag,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inTrash: false
    }).select().single();

    if (dbError) {
      console.error("DB Error:", dbError);
      return c.json({ error: "DB Error" }, 500);
    }

    await logActivity(supabase, "Uploaded File", `Uploaded ${name}`, user.id);

    return c.json({
      id: fileId,
      name: dbFile.name,
      sizeBytes: dbFile.size,
      status: "completed"
    });
  } catch (err) {
    console.error("Upload Error:", err);
    return c.json({ error: "Upload failed" }, 500);
  }
});

app.get("/api/files/:fileId/download", authMiddleware, async (c) => {
  const fileId = c.req.param("fileId");
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  
  const { data: dbFile } = await supabase.from('File').select('*').eq('id', fileId).eq('ownerId', user?.id).single();
  if (!dbFile) return c.json({ error: "Not found" }, 404);

  const { data: fileData, error: downloadError } = await supabase.storage.from('secureshare-storage').download(dbFile.r2Key);
  if (downloadError || !fileData) return c.json({ error: "Storage error" }, 500);

  const arrayBuffer = await fileData.arrayBuffer();
  const decryptedBuffer = await WorkerEncryptionService.decryptBuffer(arrayBuffer, dbFile.iv, dbFile.authTag);

  await logActivity(supabase, "Downloaded File", `Downloaded ${dbFile.name}`, user?.id);

  return new Response(decryptedBuffer, {
    headers: {
      "Content-Type": dbFile.mimeType,
      "Content-Disposition": `attachment; filename="${dbFile.name}"`
    }
  });
});

app.post("/api/files/:fileId/rename", authMiddleware, async (c) => {
  const fileId = c.req.param("fileId");
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  
  const { data: dbFile } = await supabase.from('File').select('*').eq('id', fileId).eq('ownerId', user?.id).single();
  if (!dbFile) return c.json({ error: "Not found" }, 404);

  await supabase.from('File').update({ name: body.name }).eq('id', fileId);
  await logActivity(supabase, "Renamed File", `Renamed ${dbFile.name} to ${body.name}`, user?.id);

  return c.json({ success: true, name: body.name });
});

app.delete("/api/files/:fileId", authMiddleware, async (c) => {
  const fileId = c.req.param("fileId");
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  
  const { data: dbFile } = await supabase.from('File').select('*').eq('id', fileId).eq('ownerId', user?.id).single();
  if (!dbFile) return c.json({ error: "Not found" }, 404);

  await supabase.from('File').update({ inTrash: true }).eq('id', fileId);
  await logActivity(supabase, "Deleted File", `Moved ${dbFile.name} to trash`, user?.id);

  return c.json({ success: true });
});

app.get("/api/trash", authMiddleware, async (c) => {
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  if (!user) return c.json([]);

  const { data: files } = await supabase
    .from('File')
    .select(`*, User(*)`)
    .eq('ownerId', user.id)
    .eq('inTrash', true)
    .order('updatedAt', { ascending: false });

  if (!files) return c.json([]);

  const mappedFiles = files.map((f: any) => ({
    id: f.id,
    name: f.name,
    extension: f.name.split('.').pop() || "bin",
    size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${(f.size / 1024).toFixed(1)} KB`,
    sizeBytes: f.size,
    uploadTime: f.createdAt,
    owner: f.User?.name || f.User?.email || "Unknown",
    status: "completed",
    type: f.mimeType,
    shares: []
  }));

  return c.json(mappedFiles);
});

app.post("/api/trash/:fileId/restore", authMiddleware, async (c) => {
  const fileId = c.req.param("fileId");
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  
  const { data: dbFile } = await supabase.from('File').select('*').eq('id', fileId).eq('ownerId', user?.id).single();
  if (!dbFile) return c.json({ error: "Not found" }, 404);

  await supabase.from('File').update({ inTrash: false }).eq('id', fileId);
  await logActivity(supabase, "Restored File", `Restored ${dbFile.name}`, user?.id);

  return c.json({ success: true });
});

app.delete("/api/trash/:fileId/permanent", authMiddleware, async (c) => {
  const fileId = c.req.param("fileId");
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  
  const { data: dbFile } = await supabase.from('File').select('*').eq('id', fileId).eq('ownerId', user?.id).single();
  if (!dbFile) return c.json({ error: "Not found" }, 404);

  await supabase.storage.from('secureshare-storage').remove([dbFile.r2Key]);
  await supabase.from('File').delete().eq('id', fileId);
  await logActivity(supabase, "Shredded File", `Permanently shredded ${dbFile.name}`, user?.id);

  return c.json({ success: true });
});

app.get("/api/activities", authMiddleware, async (c) => {
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  if (!user) return c.json([]);

  const { data: logs } = await supabase
    .from('AuditLog')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })
    .limit(50);

  if (!logs) return c.json([]);

  const mappedLogs = logs.map((l: any) => ({
    id: l.id,
    action: l.action,
    details: l.details,
    timestamp: l.createdAt,
    target: "System",
    iconName: "Activity"
  }));

  return c.json(mappedLogs);
});

app.post("/api/activities", authMiddleware, async (c) => {
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "User not found" }, 401);

  await logActivity(supabase, body.action, body.details, user.id);
  return c.json({ success: true });
});

app.post("/api/files/:fileId/shares", authMiddleware, async (c) => {
  const fileId = c.req.param("fileId");
  const body = await c.req.json();
  const supabase = getSupabase(c);
  const user = await getAuthUser(c);

  const { data: dbFile } = await supabase.from('File').select('*').eq('id', fileId).eq('ownerId', user?.id).single();
  if (!dbFile) return c.json({ error: "File not found" }, 404);

  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const { data: share, error } = await supabase.from('Share').insert({
    id: crypto.randomUUID(),
    fileId,
    token,
    recipientEmail: body.recipientEmail || null,
    downloadsLimit: body.oneTimeDownload ? 1 : 5,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    revoked: false,
    downloadsCount: 0
  }).select().single();

  if (error) return c.json({ error: "Share creation failed" }, 500);
  await logActivity(supabase, "Generated Share Link", `Shared ${dbFile.name}`, user?.id);

  return c.json(share);
});

app.post("/api/shares/:token/revoke", authMiddleware, async (c) => {
  const token = c.req.param("token");
  const supabase = getSupabase(c);
  await supabase.from('Share').update({ revoked: true }).eq('token', token);
  return c.json({ success: true });
});

app.get("/api/shares/:token", async (c) => {
  const token = c.req.param("token");
  const supabase = getSupabase(c);
  
  const { data: share } = await supabase.from('Share').select('*, File(*)').eq('token', token).single();
  if (!share || share.revoked || (share.expiresAt && new Date(share.expiresAt) < new Date())) {
    return c.json({ error: "invalid_link" }, 404);
  }
  if (share.downloadsCount >= share.downloadsLimit) {
    return c.json({ error: "invalid_link" }, 404);
  }

  return c.json({
    id: share.id,
    fileName: share.File.name,
    fileSize: share.File.size,
    expiresAt: share.expiresAt,
    oneTimeDownload: share.downloadsLimit === 1
  });
});

app.get("/api/shares/:token/download", async (c) => {
  const token = c.req.param("token");
  const supabase = getSupabase(c);
  
  const { data: share } = await supabase.from('Share').select('*, File(*)').eq('token', token).single();
  if (!share || share.revoked || (share.expiresAt && new Date(share.expiresAt) < new Date())) {
    return c.json({ error: "invalid_link" }, 404);
  }
  if (share.downloadsCount >= share.downloadsLimit) {
    return c.json({ error: "invalid_link" }, 404);
  }

  const { data: fileData, error: downloadError } = await supabase.storage.from('secureshare-storage').download(share.File.r2Key);
  if (downloadError || !fileData) return c.json({ error: "Storage error" }, 500);

  const arrayBuffer = await fileData.arrayBuffer();
  const decryptedBuffer = await WorkerEncryptionService.decryptBuffer(arrayBuffer, share.File.iv, share.File.authTag);

  await supabase.from('Share').update({ downloadsCount: share.downloadsCount + 1 }).eq('id', share.id);

  if (share.downloadsLimit === 1) {
    await supabase.storage.from('secureshare-storage').remove([share.File.r2Key]);
    await supabase.from('File').delete().eq('id', share.fileId);
  }

  return new Response(decryptedBuffer, {
    headers: {
      "Content-Type": share.File.mimeType,
      "Content-Disposition": `attachment; filename="${share.File.name}"`
    }
  });
});

export default app;
