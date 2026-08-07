import { CacheService } from "./cache.service.js";
import prisma from "../config/postgres.js";

// Session Cache TTL: 15 minutes
const SESSION_TTL = 15 * 60;

export const SessionService = {
  async getCachedUser(userId: string) {
    const key = `user-session:${userId}`;
    return await CacheService.getOrSet(key, SESSION_TTL, async () => {
      return await prisma.user.findUnique({
        where: { id: userId },
      });
    });
  },

  async invalidateUserSession(userId: string) {
    const key = `user-session:${userId}`;
    await CacheService.invalidate(key);
  },
};
