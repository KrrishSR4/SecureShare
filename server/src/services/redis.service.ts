import redisClient from "../config/redis.js";

export const RedisService = {
  async get(key: string): Promise<string | null> {
    try {
      if (!redisClient.isOpen) return null;
      return await redisClient.get(key);
    } catch (err) {
      console.error(`[Redis] Error getting key ${key}:`, err);
      return null;
    }
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (!redisClient.isOpen) return;
      if (ttlSeconds) {
        await redisClient.set(key, value, { EX: ttlSeconds });
      } else {
        await redisClient.set(key, value);
      }
      console.log(`[Cache Set] Key: ${key}`);
    } catch (err) {
      console.error(`[Redis] Error setting key ${key}:`, err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;
      await redisClient.del(key);
      console.log(`[Cache Delete] Key: ${key}`);
    } catch (err) {
      console.error(`[Redis] Error deleting key ${key}:`, err);
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient.isOpen) return false;
      const res = await redisClient.exists(key);
      return res === 1;
    } catch (err) {
      console.error(`[Redis] Error checking exists for key ${key}:`, err);
      return false;
    }
  },

  isAlive(): boolean {
    return redisClient.isOpen;
  },
};
