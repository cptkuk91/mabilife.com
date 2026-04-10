"use server";

import { randomUUID } from "node:crypto";
import type { Model } from "mongoose";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import {
  GUIDE_CONTENT_SANITIZER_VERSION,
  hasRenderableGuideContent,
  sanitizeGuideHtml,
  sanitizeGuideTitle,
} from "@/lib/guide-html";
import { logger } from "@/lib/logger";
import { delCache, getCache, invalidateCachePattern, redis, setCache } from "@/lib/redis";
import getGuideModel, { IGuide } from "@/models/Guide";
import getGuideCommentModel from "@/models/GuideComment";

export interface CreateGuideInput {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  thumbnail?: string;
}

export type GuideSortOption = "latest" | "popular" | "views";

export interface GetGuidesOptions {
  category?: string;
  search?: string;
  limit?: number;
  skip?: number;
  sort?: GuideSortOption;
}

type GuideAuthor = {
  id: string;
  name: string;
  image?: string | null;
};

export type SerializedGuide = {
  _id: string;
  title: string;
  content: string;
  category: string;
  author: GuideAuthor;
  views: number;
  likes: number;
  likedBy: string[];
  bookmarks: number;
  bookmarkedBy: string[];
  tags: string[];
  thumbnail?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  slug?: string;
};

export interface GuideResponse {
  success: boolean;
  data?: SerializedGuide | SerializedGuide[] | null;
  error?: string;
  id?: string;
}

export interface GuideViewResponse {
  success: boolean;
  alreadyCounted?: boolean;
  error?: string;
  views?: number;
}

type GuideRaw = {
  _id: { toString(): string };
  title: string;
  content: string;
  category: string;
  author: GuideAuthor;
  views: number;
  likes: number;
  likedBy?: string[];
  bookmarks: number;
  bookmarkedBy?: string[];
  tags?: string[];
  thumbnail?: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  contentSanitizedVersion?: number;
  contentSanitizedAt?: Date | null;
  slug?: string;
};

type GuideSearchRow = GuideRaw & {
  score?: number;
};

type GuideQuery = Record<string, unknown>;

const GUIDE_DEFAULT_LIMIT = 20;
const GUIDE_LIST_CACHE_TTL = 60;
const GUIDE_DETAIL_CACHE_TTL = 300;
const GUIDE_VIEW_DEDUPE_TTL = 24 * 60 * 60;
const GUIDE_VIEWER_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const GUIDE_VIEWER_COOKIE_NAME = "mabilife_guide_viewer";
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const GUIDE_CATEGORY_ALIASES = new Map<string, string>([
  ["초보가이드", "초보 가이드"],
  ["전투던전", "전투/던전"],
  ["메인스트림", "메인스트림"],
  ["생활알바", "생활/알바"],
  ["패션뷰티", "패션/뷰티"],
  ["돈벌기", "돈벌기"],
]);

type LocalGuideViewStore = Map<string, number>;

declare global {
  var guideViewDedupeStore: LocalGuideViewStore | undefined;
}

const localGuideViewStore =
  globalThis.guideViewDedupeStore ?? (globalThis.guideViewDedupeStore = new Map<string, number>());

function generateSlug(title: string): string {
  return title
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9가-힣-]/g, "");
}

function normalizeSearchTerm(search?: string): string | null {
  const trimmed = search?.trim();
  return trimmed ? trimmed : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shouldUseTextSearch(search: string): boolean {
  return search
    .split(/\s+/)
    .filter(Boolean)
    .some((token) => token.length >= 2);
}

function normalizeGuideKeyword(value: string): string {
  return value.replace(/[\s/]+/g, "");
}

function getExactGuideCategory(search: string): string | null {
  return GUIDE_CATEGORY_ALIASES.get(normalizeGuideKeyword(search)) ?? null;
}

function getGuideSortOption(sort?: GuideSortOption): Record<string, 1 | -1> {
  if (sort === "popular") {
    return { likes: -1, createdAt: -1 };
  }

  if (sort === "views") {
    return { views: -1, createdAt: -1 };
  }

  return { createdAt: -1 };
}

function buildGuideBaseQuery(category?: string | null): GuideQuery {
  const query: GuideQuery = { isPublished: true };

  if (category) {
    query.category = category;
  }

  return query;
}

function buildGuideRegexQuery(search: string): GuideQuery {
  const regex = new RegExp(escapeRegex(search), "i");

  return {
    $or: [{ title: regex }, { content: regex }, { tags: regex }],
  };
}

function serializeGuide(guide: GuideRaw): SerializedGuide {
  const sanitizedTitle = sanitizeGuideTitle(guide.title);
  const sanitizedContent = sanitizeGuideHtml(guide.content);

  return {
    _id: guide._id.toString(),
    title: sanitizedTitle,
    content: sanitizedContent,
    category: guide.category,
    author: {
      id: guide.author.id,
      name: guide.author.name,
      image: guide.author.image ?? null,
    },
    views: guide.views,
    likes: guide.likes,
    likedBy: guide.likedBy ?? [],
    bookmarks: guide.bookmarks,
    bookmarkedBy: guide.bookmarkedBy ?? [],
    tags: guide.tags ?? [],
    thumbnail: guide.thumbnail ?? null,
    isPublished: guide.isPublished,
    createdAt: guide.createdAt.toISOString(),
    updatedAt: guide.updatedAt.toISOString(),
    slug: guide.slug,
  };
}

function serializeGuides(guides: GuideRaw[]): SerializedGuide[] {
  return guides.map(serializeGuide);
}

function buildRedisKey(key: string) {
  const prefix = process.env.REDIS_PREFIX || "";

  if (!prefix) return key;

  return prefix.endsWith(":") ? prefix + key : `${prefix}:${key}`;
}

function buildGuideSanitizationPatch(guide: Pick<GuideRaw, "title" | "content">) {
  return {
    content: sanitizeGuideHtml(guide.content),
    contentSanitizedAt: new Date(),
    contentSanitizedVersion: GUIDE_CONTENT_SANITIZER_VERSION,
    title: sanitizeGuideTitle(guide.title),
  };
}

function needsGuideSanitizationSync(
  guide: Pick<GuideRaw, "title" | "content" | "contentSanitizedVersion">,
  patch: ReturnType<typeof buildGuideSanitizationPatch>,
) {
  return (
    guide.title !== patch.title ||
    guide.content !== patch.content ||
    (guide.contentSanitizedVersion ?? 0) < GUIDE_CONTENT_SANITIZER_VERSION
  );
}

async function syncGuideSanitizationIfNeeded(Guide: Model<IGuide>, guide: IGuide): Promise<GuideRaw> {
  const rawGuide = toGuideRaw(guide);
  const patch = buildGuideSanitizationPatch(rawGuide);

  if (!needsGuideSanitizationSync(rawGuide, patch)) {
    return rawGuide;
  }

  await Guide.findByIdAndUpdate(
    guide._id,
    { $set: patch },
    { timestamps: false },
  );

  return {
    ...rawGuide,
    ...patch,
  };
}

async function sanitizeCachedGuideIfNeeded(
  Guide: Model<IGuide>,
  cachedGuide: SerializedGuide,
  requestedIdOrSlug: string,
): Promise<SerializedGuide> {
  const nextTitle = sanitizeGuideTitle(cachedGuide.title);
  const nextContent = sanitizeGuideHtml(cachedGuide.content);

  if (nextTitle === cachedGuide.title && nextContent === cachedGuide.content) {
    return cachedGuide;
  }

  const nextGuide = {
    ...cachedGuide,
    content: nextContent,
    title: nextTitle,
  };

  await setGuideDetailCacheEntries(nextGuide, requestedIdOrSlug);

  void Guide.findByIdAndUpdate(
    cachedGuide._id,
    {
      $set: {
        content: nextContent,
        contentSanitizedAt: new Date(),
        contentSanitizedVersion: GUIDE_CONTENT_SANITIZER_VERSION,
        title: nextTitle,
      },
    },
    { timestamps: false },
  ).catch((error) => {
    logger.error("Guide cached sanitization sync error:", error);
  });

  return nextGuide;
}

function getGuideDetailPath(idOrSlug: string): string {
  return `/guide/${encodeURIComponent(idOrSlug)}`;
}

async function invalidateGuideListCache() {
  await invalidateCachePattern("guides:list:*");
}

async function invalidateGuideDetailCache(id: string, slug?: string) {
  await delCache(`guide:detail:${id}`);

  if (slug) {
    await delCache(`guide:detail:${slug}`);
  }
}

async function setGuideDetailCacheEntries(guide: SerializedGuide, requestedIdOrSlug?: string) {
  const cacheKeys = new Set<string>();

  if (requestedIdOrSlug) {
    cacheKeys.add(`guide:detail:${requestedIdOrSlug}`);
  }

  cacheKeys.add(`guide:detail:${guide._id}`);

  if (guide.slug) {
    cacheKeys.add(`guide:detail:${guide.slug}`);
  }

  await Promise.all(
    Array.from(cacheKeys).map((cacheKey) => setCache(cacheKey, guide, GUIDE_DETAIL_CACHE_TTL)),
  );
}

async function findGuidesByTextSearch(
  Guide: Model<IGuide>,
  baseQuery: GuideQuery,
  search: string,
  options: GetGuidesOptions,
): Promise<GuideSearchRow[]> {
  return Guide.aggregate<GuideSearchRow>([
    { $match: baseQuery },
    { $match: { $text: { $search: search } } },
    { $addFields: { score: { $meta: "textScore" } } },
    { $sort: { score: -1, ...getGuideSortOption(options.sort) } },
    { $skip: options.skip ?? 0 },
    { $limit: options.limit ?? GUIDE_DEFAULT_LIMIT },
  ]);
}

async function findGuidesByRegexSearch(
  Guide: Model<IGuide>,
  baseQuery: GuideQuery,
  search: string,
  options: GetGuidesOptions,
): Promise<GuideRaw[]> {
  return Guide.find({ ...baseQuery, ...buildGuideRegexQuery(search) })
    .sort(getGuideSortOption(options.sort))
    .skip(options.skip ?? 0)
    .limit(options.limit ?? GUIDE_DEFAULT_LIMIT)
    .lean<GuideRaw[]>();
}

async function findGuides(
  Guide: Model<IGuide>,
  baseQuery: GuideQuery,
  options: GetGuidesOptions,
): Promise<GuideRaw[]> {
  const search = normalizeSearchTerm(options.search);

  if (!search) {
    return Guide.find(baseQuery)
      .sort(getGuideSortOption(options.sort))
      .skip(options.skip ?? 0)
      .limit(options.limit ?? GUIDE_DEFAULT_LIMIT)
      .lean<GuideRaw[]>();
  }

  const exactCategory = getExactGuideCategory(search);
  if (exactCategory) {
    if (baseQuery.category && baseQuery.category !== exactCategory) {
      return [];
    }

    return Guide.find({ ...baseQuery, category: exactCategory })
      .sort(getGuideSortOption(options.sort))
      .skip(options.skip ?? 0)
      .limit(options.limit ?? GUIDE_DEFAULT_LIMIT)
      .lean<GuideRaw[]>();
  }

  if (!shouldUseTextSearch(search)) {
    return findGuidesByRegexSearch(Guide, baseQuery, search, options);
  }

  const textResults = await findGuidesByTextSearch(Guide, baseQuery, search, options);

  if (textResults.length > 0) {
    return textResults;
  }

  return findGuidesByRegexSearch(Guide, baseQuery, search, options);
}

function toGuideRaw(guide: IGuide): GuideRaw {
  return guide.toObject() as GuideRaw;
}

async function ensureGuideSlug(Guide: Model<IGuide>, guide: IGuide): Promise<IGuide> {
  if (guide.slug) {
    return guide;
  }

  let slug = generateSlug(sanitizeGuideTitle(guide.title)) || "guide";
  let counter = 1;
  const originalSlug = slug;

  while (await Guide.findOne({ slug, _id: { $ne: guide._id } })) {
    slug = `${originalSlug}-${counter}`;
    counter += 1;
  }

  guide.slug = slug;
  await guide.save();

  return guide;
}

async function findGuideByIdOrSlug(Guide: Model<IGuide>, idOrSlug: string): Promise<IGuide | null> {
  const decodedSlug = decodeURIComponent(idOrSlug);
  let guide: IGuide | null = null;

  if (objectIdPattern.test(idOrSlug)) {
    guide = await Guide.findById(idOrSlug);
  }

  if (!guide) {
    guide = await Guide.findOne({ slug: decodedSlug });
  }

  if (!guide) {
    return null;
  }

  return ensureGuideSlug(Guide, guide);
}

async function getGuideViewerKey() {
  const session = await auth();

  if (session?.user?.id) {
    return `user:${session.user.id}`;
  }

  const cookieStore = await cookies();
  let viewerId = cookieStore.get(GUIDE_VIEWER_COOKIE_NAME)?.value;

  if (!viewerId) {
    viewerId = randomUUID();
    cookieStore.set(GUIDE_VIEWER_COOKIE_NAME, viewerId, {
      httpOnly: true,
      maxAge: GUIDE_VIEWER_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return `anon:${viewerId}`;
}

function markLocalGuideViewDeduped(guideId: string, viewerKey: string) {
  const key = `${guideId}:${viewerKey}`;
  const now = Date.now();
  const currentExpiry = localGuideViewStore.get(key);

  if (currentExpiry && currentExpiry > now) {
    return true;
  }

  localGuideViewStore.set(key, now + GUIDE_VIEW_DEDUPE_TTL * 1000);

  if (Math.random() < 0.1) {
    for (const [existingKey, expiry] of localGuideViewStore.entries()) {
      if (expiry <= now) {
        localGuideViewStore.delete(existingKey);
      }
    }
  }

  return false;
}

async function hasRecentGuideView(guideId: string, viewerKey: string) {
  if (!redis) {
    return markLocalGuideViewDeduped(guideId, viewerKey);
  }

  const dedupeKey = buildRedisKey(`guide:view:${guideId}:${viewerKey}`);
  const result = await redis.set(dedupeKey, "1", "EX", GUIDE_VIEW_DEDUPE_TTL, "NX");

  return result !== "OK";
}

export async function createGuide(input: CreateGuideInput): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const sanitizedTitle = sanitizeGuideTitle(input.title);
    const sanitizedContent = sanitizeGuideHtml(input.content);

    if (!sanitizedTitle) {
      return { success: false, error: "제목을 입력해주세요." };
    }

    if (!hasRenderableGuideContent(sanitizedContent)) {
      return { success: false, error: "내용을 입력해주세요." };
    }

    let slug = generateSlug(sanitizedTitle) || "guide";
    let counter = 1;
    const originalSlug = slug;

    while (await Guide.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter += 1;
    }

    const guide = await Guide.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      contentSanitizedVersion: GUIDE_CONTENT_SANITIZER_VERSION,
      contentSanitizedAt: new Date(),
      category: input.category,
      tags: input.tags ?? [],
      thumbnail: input.thumbnail,
      author: {
        id: session.user.id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
      slug,
    });

    await invalidateGuideListCache();

    revalidatePath("/");
    revalidatePath("/guide");

    return {
      success: true,
      id: guide.slug,
    };
  } catch (error) {
    logger.error("Create guide error:", error);
    return { success: false, error: "가이드 작성에 실패했습니다." };
  }
}

export async function getGuides(options: GetGuidesOptions = {}): Promise<GuideResponse> {
  try {
    const normalizedOptions = {
      category: options.category && options.category !== "전체" ? options.category : null,
      search: normalizeSearchTerm(options.search),
      limit: options.limit ?? GUIDE_DEFAULT_LIMIT,
      skip: options.skip ?? 0,
      sort: options.sort ?? "latest",
    } satisfies {
      category: string | null;
      search: string | null;
      limit: number;
      skip: number;
      sort: GuideSortOption;
    };

    const cacheKey = `guides:list:${JSON.stringify(normalizedOptions)}`;
    const cached = await getCache<SerializedGuide[]>(cacheKey);

    if (cached) {
      return { success: true, data: cached };
    }

    const Guide = await getGuideModel();
    const baseQuery = buildGuideBaseQuery(normalizedOptions.category);
    const guides = await findGuides(Guide, baseQuery, {
      category: normalizedOptions.category ?? undefined,
      search: normalizedOptions.search ?? undefined,
      limit: normalizedOptions.limit,
      skip: normalizedOptions.skip,
      sort: normalizedOptions.sort,
    });
    const serializedGuides = serializeGuides(guides);

    await setCache(cacheKey, serializedGuides, GUIDE_LIST_CACHE_TTL);

    return { success: true, data: serializedGuides };
  } catch (error) {
    logger.error("Get guides error:", error);
    return { success: false, error: "가이드 목록을 불러오는데 실패했습니다." };
  }
}

export async function getGuideById(idOrSlug: string): Promise<GuideResponse> {
  try {
    const Guide = await getGuideModel();
    const cached = await getCache<SerializedGuide>(`guide:detail:${idOrSlug}`);

    if (cached) {
      const sanitizedCachedGuide = await sanitizeCachedGuideIfNeeded(Guide, cached, idOrSlug);

      return { success: true, data: sanitizedCachedGuide };
    }

    const guide = await findGuideByIdOrSlug(Guide, idOrSlug);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const sanitizedGuide = await syncGuideSanitizationIfNeeded(Guide, guide);
    const serializedGuide = serializeGuide(sanitizedGuide);
    await setGuideDetailCacheEntries(serializedGuide, idOrSlug);

    return { success: true, data: serializedGuide };
  } catch (error) {
    logger.error("Get guide error:", error);
    return { success: false, error: "가이드를 불러오는데 실패했습니다." };
  }
}

export async function incrementGuideView(idOrSlug: string): Promise<GuideViewResponse> {
  try {
    const Guide = await getGuideModel();
    const guide = await findGuideByIdOrSlug(Guide, idOrSlug);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const guideId = guide._id.toString();
    const viewerKey = await getGuideViewerKey();
    const alreadyCounted = await hasRecentGuideView(guideId, viewerKey);

    if (alreadyCounted) {
      const sanitizedGuide = await syncGuideSanitizationIfNeeded(Guide, guide);
      const serializedGuide = serializeGuide(sanitizedGuide);
      await setGuideDetailCacheEntries(serializedGuide, idOrSlug);

      return {
        success: true,
        alreadyCounted: true,
        views: serializedGuide.views,
      };
    }

    const updatedGuide = await Guide.findByIdAndUpdate(
      guideId,
      { $inc: { views: 1 } },
      { returnDocument: "after", timestamps: false },
    );

    if (!updatedGuide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const sanitizedGuide = await syncGuideSanitizationIfNeeded(Guide, updatedGuide);
    const serializedGuide = serializeGuide(sanitizedGuide);
    await setGuideDetailCacheEntries(serializedGuide, idOrSlug);

    return {
      success: true,
      alreadyCounted: false,
      views: serializedGuide.views,
    };
  } catch (error) {
    logger.error("Increment guide view error:", error);
    return { success: false, error: "조회수 반영에 실패했습니다." };
  }
}

export async function updateGuide(
  id: string,
  input: Partial<CreateGuideInput>,
): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    if (guide.author.id !== session.user.id) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    const updateData: Partial<CreateGuideInput> & {
      contentSanitizedAt?: Date;
      contentSanitizedVersion?: number;
      title?: string;
      content?: string;
    } = {};

    if (input.title !== undefined) {
      const sanitizedTitle = sanitizeGuideTitle(input.title);

      if (!sanitizedTitle) {
        return { success: false, error: "제목을 입력해주세요." };
      }

      updateData.title = sanitizedTitle;
    }

    if (input.content !== undefined) {
      const sanitizedContent = sanitizeGuideHtml(input.content);

      if (!hasRenderableGuideContent(sanitizedContent)) {
        return { success: false, error: "내용을 입력해주세요." };
      }

      updateData.content = sanitizedContent;
      updateData.contentSanitizedVersion = GUIDE_CONTENT_SANITIZER_VERSION;
      updateData.contentSanitizedAt = new Date();
    }

    if (input.category !== undefined) {
      updateData.category = input.category;
    }

    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }

    if (input.thumbnail !== undefined) {
      updateData.thumbnail = input.thumbnail;
    }

    const updated = await Guide.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after" },
    ).lean<GuideRaw | null>();

    if (!updated) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    await invalidateGuideListCache();
    await invalidateGuideDetailCache(id, guide.slug);

    revalidatePath("/");
    revalidatePath("/guide");
    revalidatePath(getGuideDetailPath(guide.slug || id));

    return { success: true, data: serializeGuide(updated) };
  } catch (error) {
    logger.error("Update guide error:", error);
    return { success: false, error: "가이드 수정에 실패했습니다." };
  }
}

export async function deleteGuide(id: string): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    if (guide.author.id !== session.user.id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    const GuideComment = await getGuideCommentModel();
    await GuideComment.deleteMany({ guideId: id });

    await invalidateGuideListCache();
    await invalidateGuideDetailCache(id, guide.slug);
    await delCache(`guide:comments:${id}`);

    await Guide.findByIdAndDelete(id);

    revalidatePath("/");
    revalidatePath("/guide");

    return { success: true };
  } catch (error) {
    logger.error("Delete guide error:", error);
    return { success: false, error: "가이드 삭제에 실패했습니다." };
  }
}

export async function toggleGuideLike(id: string): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const userId = session.user.id;
    const hasLiked = guide.likedBy.includes(userId);

    if (hasLiked) {
      await Guide.findByIdAndUpdate(
        id,
        { $pull: { likedBy: userId }, $inc: { likes: -1 } },
        { timestamps: false, returnDocument: "after" },
      );
    } else {
      await Guide.findByIdAndUpdate(
        id,
        { $push: { likedBy: userId }, $inc: { likes: 1 } },
        { timestamps: false, returnDocument: "after" },
      );
    }

    await invalidateGuideListCache();
    await invalidateGuideDetailCache(id, guide.slug);

    revalidatePath("/guide");
    revalidatePath(getGuideDetailPath(guide.slug || id));

    return { success: true };
  } catch (error) {
    logger.error("Toggle guide like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}

export async function toggleGuideBookmark(id: string): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();
    const guide = await Guide.findById(id);

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const userId = session.user.id;
    const hasBookmarked = guide.bookmarkedBy.includes(userId);

    if (hasBookmarked) {
      await Guide.findByIdAndUpdate(
        id,
        { $pull: { bookmarkedBy: userId }, $inc: { bookmarks: -1 } },
        { timestamps: false },
      );
    } else {
      await Guide.findByIdAndUpdate(
        id,
        { $push: { bookmarkedBy: userId }, $inc: { bookmarks: 1 } },
        { timestamps: false },
      );
    }

    await invalidateGuideDetailCache(id, guide.slug);

    revalidatePath(getGuideDetailPath(guide.slug || id));

    return { success: true };
  } catch (error) {
    logger.error("Toggle guide bookmark error:", error);
    return { success: false, error: "북마크 처리에 실패했습니다." };
  }
}
