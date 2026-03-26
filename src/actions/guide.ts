"use server";

import type { Model } from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { delCache, getCache, invalidateCachePattern, setCache } from "@/lib/redis";
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
  slug?: string;
};

type GuideSearchRow = GuideRaw & {
  score?: number;
};

type GuideQuery = Record<string, unknown>;

const GUIDE_DEFAULT_LIMIT = 20;
const GUIDE_LIST_CACHE_TTL = 60;
const GUIDE_DETAIL_CACHE_TTL = 300;
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const GUIDE_CATEGORY_ALIASES = new Map<string, string>([
  ["초보가이드", "초보 가이드"],
  ["전투던전", "전투/던전"],
  ["메인스트림", "메인스트림"],
  ["생활알바", "생활/알바"],
  ["패션뷰티", "패션/뷰티"],
  ["돈벌기", "돈벌기"],
]);

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
  return {
    _id: guide._id.toString(),
    title: guide.title,
    content: guide.content,
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

export async function createGuide(input: CreateGuideInput): Promise<GuideResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Guide = await getGuideModel();

    let slug = generateSlug(input.title);
    let counter = 1;
    const originalSlug = slug;

    while (await Guide.findOne({ slug })) {
      slug = `${originalSlug}-${counter}`;
      counter += 1;
    }

    const guide = await Guide.create({
      title: input.title,
      content: input.content,
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
    const cacheKey = `guide:detail:${idOrSlug}`;
    const cached = await getCache<SerializedGuide>(cacheKey);

    if (cached) {
      try {
        if (objectIdPattern.test(idOrSlug)) {
          void Guide.findByIdAndUpdate(idOrSlug, { $inc: { views: 1 } }, { timestamps: false }).exec();
        } else {
          const decodedSlug = decodeURIComponent(idOrSlug);
          void Guide.findOneAndUpdate({ slug: decodedSlug }, { $inc: { views: 1 } }, { timestamps: false }).exec();
        }
      } catch (error) {
        logger.error("Guide view increment error:", error);
      }

      return { success: true, data: cached };
    }

    const isValidObjectId = objectIdPattern.test(idOrSlug);
    let guide: IGuide | null = null;

    if (isValidObjectId) {
      guide = await Guide.findByIdAndUpdate(
        idOrSlug,
        { $inc: { views: 1 } },
        { new: true, timestamps: false },
      );

      if (guide && !guide.slug) {
        let slug = generateSlug(guide.title);
        let counter = 1;
        const originalSlug = slug;

        while (await Guide.findOne({ slug, _id: { $ne: guide._id } })) {
          slug = `${originalSlug}-${counter}`;
          counter += 1;
        }

        guide.slug = slug;
        await guide.save();
      }
    }

    if (!guide) {
      const decodedSlug = decodeURIComponent(idOrSlug);
      guide = await Guide.findOneAndUpdate(
        { slug: decodedSlug },
        { $inc: { views: 1 } },
        { new: true, timestamps: false },
      );
    }

    if (!guide) {
      return { success: false, error: "가이드를 찾을 수 없습니다." };
    }

    const serializedGuide = serializeGuide(toGuideRaw(guide));
    await setCache(cacheKey, serializedGuide, GUIDE_DETAIL_CACHE_TTL);

    return { success: true, data: serializedGuide };
  } catch (error) {
    logger.error("Get guide error:", error);
    return { success: false, error: "가이드를 불러오는데 실패했습니다." };
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

    const updated = await Guide.findByIdAndUpdate(id, { $set: input }, { new: true }).lean<GuideRaw | null>();

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
        { timestamps: false, new: true },
      );
    } else {
      await Guide.findByIdAndUpdate(
        id,
        { $push: { likedBy: userId }, $inc: { likes: 1 } },
        { timestamps: false, new: true },
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
