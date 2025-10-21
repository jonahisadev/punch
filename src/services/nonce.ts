import Redis from "ioredis";

let redisClient: Redis | null = null;

// Create Redis client with configuration from environment variables
const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
    });
  }
  return redisClient;
};

const NONCE_TTL_SECONDS = 30;
const NONCE_KEY_PREFIX = "nonce:";

/**
 * Store a nonce in Redis with a 30-second TTL
 * @param nonce The nonce to store
 */
export const storeNonce = async (nonce: string): Promise<void> => {
  const redis = getRedisClient();
  const key = `${NONCE_KEY_PREFIX}${nonce}`;
  await redis.set(key, "1", "EX", NONCE_TTL_SECONDS);
};

/**
 * Verify and consume a nonce (atomic operation)
 * @param nonce The nonce to verify and consume
 * @returns true if the nonce was valid and consumed, false otherwise
 */
export const verifyAndConsumeNonce = async (nonce: string): Promise<boolean> => {
  const redis = getRedisClient();
  const key = `${NONCE_KEY_PREFIX}${nonce}`;

  // Use DEL to atomically check existence and remove
  // DEL returns the number of keys deleted (1 if existed, 0 if not)
  const deleted = await redis.del(key);
  return deleted === 1;
};
