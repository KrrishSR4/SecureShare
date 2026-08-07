import { CacheService } from "./cache.service.js";
import prisma from "../config/postgres.js";

// Share Link Cache TTL: 5 minutes
const SHARE_LINK_TTL = 5 * 60;

export const TokenService = {
  async getCachedShare(token: string) {
    const key = `share:${token}`;
    return await CacheService.getOrSet(key, SHARE_LINK_TTL, async () => {
      return await prisma.share.findUnique({
        where: { token },
        include: {
          file: {
            include: {
              owner: true,
            },
          },
        },
      });
    });
  },

  async invalidateShare(token: string) {
    const key = `share:${token}`;
    await CacheService.invalidate(key);
  },
};
