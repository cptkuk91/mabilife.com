import { randomUUID } from "node:crypto";
import { redis } from "@/lib/redis";

export type UploadScope = "community" | "guide-content" | "guide-thumbnail";

const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;
const UPLOAD_RATE_LIMIT_MAX_REQUESTS = 25;
const UPLOAD_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;
const UPLOAD_RATE_LIMIT_KEY = "upload:rate";

type LocalRateLimitStore = Map<string, number>;

declare global {
  var uploadRateLimitStore: LocalRateLimitStore | undefined;
}

const localRateLimitStore =
  globalThis.uploadRateLimitStore ?? (globalThis.uploadRateLimitStore = new Map<string, number>());

function buildRedisKey(key: string) {
  const prefix = process.env.REDIS_PREFIX || "";
  if (!prefix) return key;
  return prefix.endsWith(":") ? prefix + key : `${prefix}:${key}`;
}

function sanitizePathSegment(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  return cleaned || "user";
}

function getDateSegments(now = new Date()) {
  return {
    day: String(now.getUTCDate()).padStart(2, "0"),
    month: String(now.getUTCMonth() + 1).padStart(2, "0"),
    year: String(now.getUTCFullYear()),
  };
}

export function getAllowedUploadMimeTypes() {
  return Array.from(ALLOWED_IMAGE_TYPES.keys());
}

export function getMaxUploadSizeBytes() {
  return MAX_UPLOAD_SIZE_BYTES;
}

export function buildUploadKey({
  contentType,
  scope,
  userId,
}: {
  contentType: string;
  scope: UploadScope;
  userId: string;
}) {
  const extension = ALLOWED_IMAGE_TYPES.get(contentType);

  if (!extension) {
    throw new Error("Unsupported upload content type");
  }

  const safeUserId = sanitizePathSegment(userId);
  const safeScope = sanitizePathSegment(scope);
  const { day, month, year } = getDateSegments();

  return `mabilife/uploads/${safeScope}/${safeUserId}/${year}/${month}/${day}/${randomUUID()}.${extension}`;
}

export function validateImageUploadInput({
  contentType,
  fileName,
  fileSize,
}: {
  contentType: string;
  fileName: string;
  fileSize: number;
}) {
  if (!fileName?.trim()) {
    return { error: "파일 이름이 올바르지 않습니다.", success: false as const };
  }

  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return { error: "파일 크기 정보가 올바르지 않습니다.", success: false as const };
  }

  if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
    return {
      error: `이미지는 최대 ${Math.floor(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))}MB까지 업로드할 수 있습니다.`,
      success: false as const,
    };
  }

  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    return {
      error: "지원하지 않는 이미지 형식입니다. JPG, PNG, WEBP, GIF, AVIF만 업로드할 수 있습니다.",
      success: false as const,
    };
  }

  return { success: true as const };
}

async function enforceRedisRateLimit(userId: string) {
  if (!redis) return null;

  const windowBucket = Math.floor(Date.now() / (UPLOAD_RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = buildRedisKey(`${UPLOAD_RATE_LIMIT_KEY}:${userId}:${windowBucket}`);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, UPLOAD_RATE_LIMIT_WINDOW_SECONDS);
  }

  return count;
}

function enforceLocalRateLimit(userId: string) {
  const windowBucket = Math.floor(Date.now() / (UPLOAD_RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `${userId}:${windowBucket}`;
  const nextCount = (localRateLimitStore.get(key) ?? 0) + 1;
  localRateLimitStore.set(key, nextCount);

  // Clean up stale windows opportunistically.
  for (const existingKey of localRateLimitStore.keys()) {
    if (!existingKey.endsWith(String(windowBucket)) && Math.random() < 0.1) {
      localRateLimitStore.delete(existingKey);
    }
  }

  return nextCount;
}

export async function enforceUploadRateLimit(userId: string) {
  const nextCount = (await enforceRedisRateLimit(userId)) ?? enforceLocalRateLimit(userId);

  if (nextCount > UPLOAD_RATE_LIMIT_MAX_REQUESTS) {
    return {
      error: "업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      success: false as const,
    };
  }

  return { success: true as const };
}
