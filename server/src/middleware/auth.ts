import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/tokens.js";
import { SessionService } from "../services/session.service.js";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccessToken(token);
    
    // Ensure user still exists (utilizes Cache-Aside via SessionService)
    const user = await SessionService.getCachedUser(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "User no longer exists" });
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
