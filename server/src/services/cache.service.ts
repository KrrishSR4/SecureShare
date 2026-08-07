import { RedisService } from "./redis.service.js";

export const CacheService = {
  async getOrSet<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
    // 1. Try to fetch from Redis Cache
    const cachedValue = await RedisService.get(key);
    if (cachedValue !== null) {
      console.log(`[Cache Hit] Key: ${key}`);
      try {
        return JSON.parse(cachedValue) as T;
      } catch (e) {
        console.error(`[Cache] Failed to parse cached payload for key ${key}:`, e);
      }
    }

    // 2. Cache Miss: Execute DB/source query
    console.log(`[Cache Miss] Key: ${key}`);
    const result = await fetchFn();

    // 3. Cache Set: Save to Redis Cache (only if result is not null/undefined)
    if (result !== undefined && result !== null) {
      await RedisService.set(key, JSON.stringify(result), ttlSeconds);
    }

    return result;
  },

  async invalidate(key: string): Promise<void> {
    await RedisService.del(key);
  },
};
