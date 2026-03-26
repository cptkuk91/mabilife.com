import Redis from 'ioredis';

const USE_REDIS = process.env.USE_REDIS === 'true';
const REDIS_PREFIX = process.env.REDIS_PREFIX || '';

const globalForRedis = global as unknown as { redis: Redis | null };

export const redis =
  globalForRedis.redis ??
  (USE_REDIS && process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : null);

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis;
}


const getKey = (key: string) => {
  if (!REDIS_PREFIX) return key;
  return REDIS_PREFIX.endsWith(':') ? REDIS_PREFIX + key : `${REDIS_PREFIX}:${key}`;
};

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  const data = await redis.get(getKey(key));
  return data ? JSON.parse(data) : null;
}

export async function setCache<T>(key: string, data: T, ttl?: number): Promise<void> {
  if (!redis) return;
  const prefixedKey = getKey(key);
  if (ttl) {
    await redis.set(prefixedKey, JSON.stringify(data), 'EX', ttl);
  } else {
    await redis.set(prefixedKey, JSON.stringify(data));
  }
}

export async function delCache(key: string): Promise<void> {
  if (!redis) return;
  await redis.del(getKey(key));
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  if (!redis) return;
  const searchPattern = getKey(pattern);
  const keys = await redis.keys(searchPattern);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}
