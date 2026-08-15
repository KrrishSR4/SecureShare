import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";
import { verifyAccessToken } from "../utils/tokens.js";

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
    // 1. Try validating via Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (user) {
      req.user = {
        userId: user.id,
        role: (user.app_metadata?.role as string) || "USER"
      };
      return next();
    }
  } catch (err) {
    // Fallback to custom token verification
  }

  try {
    // 2. Fallback to custom JWT tokens (e.g. OAuth flows or local testing session)
    const payload = verifyAccessToken(token);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
