import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = process.env.REDIS_PORT || "6379";
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisUrl = `redis://${redisHost}:${redisPort}`;

const redisClient = createClient({
  url: redisUrl,
  password: redisPassword,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.warn("[Redis] Caching disabled: Max connection attempts reached.");
        return new Error("Max reconnect attempts reached");
      }
      console.warn(`[Redis] Connection lost. Reconnect attempt #${retries}`);
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on("connect", () => {
  console.log("[Redis] Connected to caching layer successfully.");
});

redisClient.on("error", (err) => {
  console.error("[Redis] Client error:", err);
});

redisClient.on("end", () => {
  console.log("[Redis] Connection closed.");
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("[Redis] Initialization failed, continuing in fallback mode:", err);
  }
}

export default redisClient;
