
import Redis from 'ioredis';

const USE_REDIS = process.env.USE_REDIS === 'true';

const globalForRedis = global as unknown as { redis: Redis | null };

export const redis =
  globalForRedis.redis ??
  (USE_REDIS && process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : null);

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis;
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

export async function setCache(key: string, data: any, ttl?: number): Promise<void> {
  if (!redis) return;
  if (ttl) {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } else {
    await redis.set(key, JSON.stringify(data));
  }
}

export async function delCache(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}
