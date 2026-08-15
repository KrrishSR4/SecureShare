import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { hashPassword, comparePasswords } from "../utils/passwords.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokens.js";
import { supabase } from "../lib/supabase.js";

import { OAuth2Client } from "google-auth-library";

const router = Router();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:4000"}/api/auth/google/callback`
);

async function handleOAuthLogin(res: Response, email: string, name: string, provider: string, providerId: string, avatarUrl: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        oauthProvider: provider,
        oauthId: providerId,
        profilePictureUrl: avatarUrl,
        emailVerified: true,
      }
    });
  } else if (!user.oauthProvider) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { oauthProvider: provider, oauthId: providerId, profilePictureUrl: avatarUrl || user.profilePictureUrl }
    });
  }

  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  const refreshTokenHash = await hashPassword(refreshToken);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash, lastLogin: new Date() },
  });

  setRefreshCookie(res, refreshToken);

  const userString = encodeURIComponent(JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    profilePictureUrl: user.profilePictureUrl,
    role: user.role,
  }));
  
  res.redirect(`${FRONTEND_URL}/auth/oauth-callback?accessToken=${accessToken}&user=${userString}`);
}

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/signup", async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Register user in Supabase Auth via Admin API (pre-confirms email)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (error || !data.user) {
      return res.status(400).json({ error: error?.message || "Failed to create user in Supabase Auth." });
    }
    
    // Mirror the created user into our local Prisma User schema
    await prisma.user.create({
      data: {
        id: data.user.id,
        name,
        email,
        emailVerified: true,
      },
    });

    res.status(201).json({ message: "Account created successfully." });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // Verify credentials via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({ error: error?.message || "Invalid credentials" });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Mirror user locally if missing (e.g. registered externally or seeded directly in Supabase dashboard)
      user = await prisma.user.create({
        data: {
          id: data.user.id,
          email,
          name: data.user.user_metadata?.name || email.split("@")[0],
          emailVerified: true
        }
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    if (data.session.refresh_token) {
      setRefreshCookie(res, data.session.refresh_token);
    }

    res.json({
      accessToken: data.session.access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/refresh-token", async (req: Request, res: Response): Promise<any> => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      return res.status(401).json({ error: error?.message || "Invalid refresh token" });
    }

    if (data.session.refresh_token) {
      setRefreshCookie(res, data.session.refresh_token);
    }
    
    res.json({ accessToken: data.session.access_token });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

router.post("/logout", async (req: Request, res: Response): Promise<any> => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    try {
      const payload = verifyRefreshToken(refreshToken);
      await prisma.user.update({
        where: { id: payload.userId },
        data: { refreshTokenHash: null },
      });
    } catch (e) {
      // Ignore invalid token on logout
    }
  }

  res.clearCookie("refreshToken");
  res.json({ success: true });
});

router.post("/verify-email", async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing token" });
    
    // In a real app, you would verify the token against verificationTokenHash in DB
    // For this implementation, we will just find any unverified user for the demo
    // and verify them. In production, decode token -> match user -> verify hash.
    const unverifiedUser = await prisma.user.findFirst({
      where: { emailVerified: false },
    });
    
    if (unverifiedUser) {
      await prisma.user.update({
        where: { id: unverifiedUser.id },
        data: { emailVerified: true },
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/forgot-password", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      // In a real app, generate reset token, hash it, save to DB, email the raw token.
      console.log(`[Email Service Mock] Password reset link for ${email}: http://localhost:5173/auth/reset-password?token=mock-reset-token-123`);
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: "If the email exists, a reset link was sent." });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req: Request, res: Response): Promise<any> => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Missing fields" });

    // In a real app, find user by token hash, verify expiration.
    // For this prototype, we'll just update the first user for demonstration.
    const user = await prisma.user.findFirst();
    if (!user) return res.status(400).json({ error: "Invalid token" });

    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// OAuth Routes
router.get("/google", (req: Request, res: Response) => {
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
  });
  res.redirect(url);
});

router.get("/google/callback", async (req: Request, res: Response): Promise<any> => {
  const { code } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthCodeMissing`);
  
  try {
    const { tokens } = await googleClient.getToken(code as string);
    googleClient.setCredentials(tokens);
    const { data } = await googleClient.request<any>({ url: "https://www.googleapis.com/oauth2/v2/userinfo" });
    
    await handleOAuthLogin(res, data.email, data.name, "google", data.id, data.picture);
  } catch (error) {
    console.error("Google OAuth Error:", error);
    res.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthFailed`);
  }
});

router.get("/github", (req: Request, res: Response) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(url);
});

router.get("/github/callback", async (req: Request, res: Response): Promise<any> => {
  const { code } = req.query;
  if (!code) return res.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthCodeMissing`);
  
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Accept: "application/json",
        "User-Agent": "SecureShare-Server"
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) throw new Error("No access token from GitHub");

    const userRes = await fetch("https://api.github.com/user", {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "SecureShare-Server"
      }
    });
    const userData = await userRes.json();

    const emailRes = await fetch("https://api.github.com/user/emails", {
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "SecureShare-Server"
      }
    });
    const emailData = await emailRes.json();
    const primaryEmailObj = emailData.find((e: any) => e.primary) || emailData[0];
    const primaryEmail = primaryEmailObj?.email;

    if (!primaryEmail) throw new Error("No email found from GitHub");

    await handleOAuthLogin(res, primaryEmail, userData.name || userData.login, "github", String(userData.id), userData.avatar_url);
  } catch (error) {
    console.error("GitHub OAuth Error:", error);
    res.redirect(`${FRONTEND_URL}/auth/signin?error=OAuthFailed`);
  }
});

export default router;
