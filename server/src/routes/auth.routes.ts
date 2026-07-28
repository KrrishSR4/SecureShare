import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { hashPassword, comparePasswords } from "../utils/passwords.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/tokens.js";

const router = Router();

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

    const hashedPassword = await hashPassword(password);
    
    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // emailVerified is false by default in schema
      },
    });

    // In a real app, generate verification token and send email here

    res.status(201).json({ message: "Account created successfully. Please verify your email." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/signin", async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ error: "Verify your email before continuing." });
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token hash in DB
    const refreshTokenHash = await hashPassword(refreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash, lastLogin: new Date() },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
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
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.refreshTokenHash) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const isMatch = await comparePasswords(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }

    const tokenPayload = { userId: user.id, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    const newRefreshTokenHash = await hashPassword(newRefreshToken);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshTokenHash },
    });

    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken: newAccessToken });
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

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
