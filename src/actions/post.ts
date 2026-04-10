"use server";

import { randomUUID } from "node:crypto";
import type { Model } from "mongoose";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { redis } from "@/lib/redis";
import getCommentModel, { IComment } from "@/models/Comment";
import getPostModel, { IPost } from "@/models/Post";
import getPostDailyStatModel from "@/models/PostDailyStat";

export type PostType = "잡담" | "질문" | "정보";

export type CreatePostInput = {
  content: string;
  type: PostType;
  images?: string[];
};

export type PostResponse = {
  success: boolean;
  id?: string;
  error?: string;
};

export type PostViewResponse = {
  success: boolean;
  alreadyCounted?: boolean;
  error?: string;
  viewCount?: number;
};

type PostAuthor = {
  id: string;
  name: string;
  image?: string | null;
};

type AcceptedCommentPreview = {
  _id: string;
  content: string;
  author: PostAuthor;
};

export type SerializedPost = {
  _id: string;
  content: string;
  type: PostType;
  images: string[];
  author: PostAuthor;
  isSolved?: boolean;
  acceptedCommentId?: string | null;
  likes: number;
  likedBy: string[];
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  acceptedComment: AcceptedCommentPreview | null;
};

export type TrendingPost = {
  _id: string;
  content: string;
  type: PostType;
  author: PostAuthor;
  viewCount: number;
  recentViewCount: number;
  commentCount: number;
  likes: number;
  createdAt: string;
  finalScore: number;
};

type GetPostsResponse = {
  success: boolean;
  posts: SerializedPost[];
  error?: string;
};

type PostRaw = {
  _id: { toString(): string };
  content: string;
  type: PostType;
  images?: string[];
  author: PostAuthor;
  isSolved?: boolean;
  acceptedCommentId?: string | null;
  likes: number;
  likedBy?: string[];
  commentCount: number;
  viewCount: number;
  viewHistory?: Array<{ viewedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
};

type PostSearchRow = PostRaw & {
  score?: number;
};

type CommentRaw = {
  _id: { toString(): string };
  content: string;
  author: PostAuthor;
};

type TrendingPostRow = {
  _id: { toString(): string };
  content: string;
  type: PostType;
  author: PostAuthor;
  viewCount: number;
  recentViewCount: number;
  commentCount: number;
  likes: number;
  createdAt: Date;
  finalScore: number;
};

type PostQuery = Record<string, unknown>;

const POST_TYPES: PostType[] = ["잡담", "질문", "정보"];
const POST_VIEW_DEDUPE_TTL = 24 * 60 * 60;
const POST_VIEWER_COOKIE_NAME = "mabilife_post_viewer";
const POST_VIEWER_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|discordbot|whatsapp|kakaotalk|telegrambot|preview/i;

type LocalPostViewStore = Map<string, number>;

declare global {
  var postViewDedupeStore: LocalPostViewStore | undefined;
}

const localPostViewStore =
  globalThis.postViewDedupeStore ?? (globalThis.postViewDedupeStore = new Map<string, number>());

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

function getExactPostType(search: string): PostType | null {
  return POST_TYPES.find((type) => type === search) ?? null;
}

function buildPostBaseQuery(type?: string): PostQuery {
  const query: PostQuery = {};

  if (type && type !== "전체" && POST_TYPES.includes(type as PostType)) {
    query.type = type as PostType;
  }

  return query;
}

function buildPostRegexQuery(search: string): PostQuery {
  const regex = new RegExp(escapeRegex(search), "i");

  return {
    $or: [{ content: regex }, { type: regex }],
  };
}

function buildRedisKey(key: string) {
  const prefix = process.env.REDIS_PREFIX || "";

  if (!prefix) return key;

  return prefix.endsWith(":") ? prefix + key : `${prefix}:${key}`;
}

function getDayBucket(date = new Date()) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export type TrendingPeriod = "week" | "month";

function getTrendingPeriodStart(period: TrendingPeriod, now = new Date()) {
  const periodStart = new Date(now);

  if (period === "week") {
    periodStart.setDate(periodStart.getDate() - 7);
  } else {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  periodStart.setHours(0, 0, 0, 0);

  return periodStart;
}

async function getPostViewerKey() {
  const session = await auth();

  if (session?.user?.id) {
    return `user:${session.user.id}`;
  }

  const cookieStore = await cookies();
  let viewerId = cookieStore.get(POST_VIEWER_COOKIE_NAME)?.value;

  if (!viewerId) {
    viewerId = randomUUID();
    cookieStore.set(POST_VIEWER_COOKIE_NAME, viewerId, {
      httpOnly: true,
      maxAge: POST_VIEWER_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return `anon:${viewerId}`;
}

function markLocalPostViewDeduped(postId: string, viewerKey: string) {
  const key = `${postId}:${viewerKey}`;
  const now = Date.now();
  const expiry = localPostViewStore.get(key);

  if (expiry && expiry > now) {
    return true;
  }

  localPostViewStore.set(key, now + POST_VIEW_DEDUPE_TTL * 1000);

  if (Math.random() < 0.1) {
    for (const [existingKey, existingExpiry] of localPostViewStore.entries()) {
      if (existingExpiry <= now) {
        localPostViewStore.delete(existingKey);
      }
    }
  }

  return false;
}

async function hasRecentPostView(postId: string, viewerKey: string) {
  if (!redis) {
    return markLocalPostViewDeduped(postId, viewerKey);
  }

  const dedupeKey = buildRedisKey(`post:view:${postId}:${viewerKey}`);
  const result = await redis.set(dedupeKey, "1", "EX", POST_VIEW_DEDUPE_TTL, "NX");

  return result !== "OK";
}

async function shouldSkipPostViewCount() {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "";

  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

async function findPostsByTextSearch(
  Post: Model<IPost>,
  baseQuery: PostQuery,
  search: string,
  page: number,
  limit: number,
): Promise<PostSearchRow[]> {
  return Post.aggregate<PostSearchRow>([
    { $match: baseQuery },
    { $match: { $text: { $search: search } } },
    { $addFields: { score: { $meta: "textScore" } } },
    { $sort: { score: -1, createdAt: -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);
}

async function findPostsByRegexSearch(
  Post: Model<IPost>,
  baseQuery: PostQuery,
  search: string,
  page: number,
  limit: number,
): Promise<PostRaw[]> {
  return Post.find({ ...baseQuery, ...buildPostRegexQuery(search) })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean<PostRaw[]>();
}

async function findPosts(
  Post: Model<IPost>,
  type: string | undefined,
  search: string | undefined,
  page: number,
  limit: number,
): Promise<PostRaw[]> {
  const normalizedSearch = normalizeSearchTerm(search);
  const baseQuery = buildPostBaseQuery(type);

  if (!normalizedSearch) {
    return Post.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PostRaw[]>();
  }

  const exactType = getExactPostType(normalizedSearch);
  if (exactType) {
    if (baseQuery.type && baseQuery.type !== exactType) {
      return [];
    }

    return Post.find({ ...baseQuery, type: exactType })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<PostRaw[]>();
  }

  if (!shouldUseTextSearch(normalizedSearch)) {
    return findPostsByRegexSearch(Post, baseQuery, normalizedSearch, page, limit);
  }

  const textResults = await findPostsByTextSearch(Post, baseQuery, normalizedSearch, page, limit);

  if (textResults.length > 0) {
    return textResults;
  }

  return findPostsByRegexSearch(Post, baseQuery, normalizedSearch, page, limit);
}

async function loadAcceptedCommentMap(
  Comment: Model<IComment>,
  posts: Array<Pick<PostRaw, "acceptedCommentId">>,
): Promise<Map<string, CommentRaw>> {
  const acceptedCommentIds = posts.flatMap((post) =>
    typeof post.acceptedCommentId === "string" && post.acceptedCommentId
      ? [post.acceptedCommentId]
      : [],
  );

  if (acceptedCommentIds.length === 0) {
    return new Map();
  }

  const acceptedComments = await Comment.find({ _id: { $in: acceptedCommentIds } }).lean<CommentRaw[]>();

  return new Map(acceptedComments.map((comment) => [comment._id.toString(), comment]));
}

function serializePost(post: PostRaw, commentMap: Map<string, CommentRaw>): SerializedPost {
  const acceptedComment = post.acceptedCommentId ? commentMap.get(post.acceptedCommentId) : null;

  return {
    _id: post._id.toString(),
    content: post.content,
    type: post.type,
    images: post.images ?? [],
    author: {
      id: post.author.id,
      name: post.author.name,
      image: post.author.image ?? null,
    },
    isSolved: post.isSolved,
    acceptedCommentId: post.acceptedCommentId ?? null,
    likes: post.likes,
    likedBy: post.likedBy ?? [],
    commentCount: post.commentCount,
    viewCount: post.viewCount,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    acceptedComment: acceptedComment
      ? {
          _id: acceptedComment._id.toString(),
          content: acceptedComment.content,
          author: acceptedComment.author,
        }
      : null,
  };
}

export async function createPost(input: CreatePostInput): Promise<PostResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Post = await getPostModel();
    const post = await Post.create({
      content: input.content,
      type: input.type,
      images: input.images ?? [],
      author: {
        id: session.user.id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
      isSolved: input.type === "질문" ? false : undefined,
    });

    revalidatePath("/");
    revalidatePath("/community");

    return {
      success: true,
      id: post._id.toString(),
    };
  } catch (error) {
    logger.error("Create post error:", error);
    return { success: false, error: "게시글 작성에 실패했습니다." };
  }
}

export async function getPosts(
  page = 1,
  limit = 20,
  type?: string,
  search?: string,
): Promise<GetPostsResponse> {
  try {
    const Post = await getPostModel();
    const Comment = await getCommentModel();
    const posts = await findPosts(Post, type, search, page, limit);
    const commentMap = await loadAcceptedCommentMap(Comment, posts);

    return {
      success: true,
      posts: posts.map((post) => serializePost(post, commentMap)),
    };
  } catch (error) {
    logger.error("Get posts error:", error);
    return { success: false, error: "게시글을 불러오는데 실패했습니다.", posts: [] };
  }
}

export async function getPost(id: string) {
  try {
    const Post = await getPostModel();
    const post = await Post.findById(id).lean<PostRaw | null>();

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    return {
      success: true,
      post: {
        ...serializePost(post, new Map()),
        acceptedComment: null,
      },
    };
  } catch (error) {
    logger.error("Get post error:", error);
    return { success: false, error: "게시글을 불러오는데 실패했습니다." };
  }
}

export async function incrementViewCount(id: string): Promise<PostViewResponse> {
  try {
    const Post = await getPostModel();
    const PostDailyStat = await getPostDailyStatModel();
    const post = await Post.findById(id).select("viewCount");

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    if (await shouldSkipPostViewCount()) {
      return {
        success: true,
        alreadyCounted: true,
        viewCount: post.viewCount ?? 0,
      };
    }

    const viewerKey = await getPostViewerKey();
    const alreadyCounted = await hasRecentPostView(id, viewerKey);

    if (alreadyCounted) {
      return {
        success: true,
        alreadyCounted: true,
        viewCount: post.viewCount ?? 0,
      };
    }

    const dayBucket = getDayBucket();
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { returnDocument: "after", timestamps: false },
    ).select("viewCount");

    if (!updatedPost) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    await PostDailyStat.updateOne(
      { postId: post._id, day: dayBucket },
      {
        $inc: {
          uniqueViewCount: 1,
          viewCount: 1,
        },
        $setOnInsert: {
          day: dayBucket,
          postId: post._id,
        },
      },
      { upsert: true },
    );

    logger.debug("Post view count updated:", id, "New count:", updatedPost.viewCount);

    return {
      success: true,
      alreadyCounted: false,
      viewCount: updatedPost.viewCount ?? 0,
    };
  } catch (error) {
    logger.error("Increment view error:", error);
    return { success: false, error: "조회수 반영에 실패했습니다." };
  }
}

export async function deletePost(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Post = await getPostModel();
    const PostDailyStat = await getPostDailyStatModel();
    const Comment = await getCommentModel();
    const post = await Post.findById(id);

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    if (post.author.id !== session.user.id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    await Comment.deleteMany({ postId: id });
    await PostDailyStat.deleteMany({ postId: id });
    await Post.findByIdAndDelete(id);

    revalidatePath("/");
    revalidatePath("/community");

    return { success: true };
  } catch (error) {
    logger.error("Delete post error:", error);
    return { success: false, error: "게시글 삭제에 실패했습니다." };
  }
}

export async function toggleLike(postId: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = session.user.id;
    const Post = await getPostModel();
    const post = await Post.findById(postId);

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    const isLiked = post.likedBy.includes(userId);

    if (isLiked) {
      await Post.findByIdAndUpdate(postId, {
        $inc: { likes: -1 },
        $pull: { likedBy: userId },
      });
    } else {
      await Post.findByIdAndUpdate(postId, {
        $inc: { likes: 1 },
        $push: { likedBy: userId },
      });
    }

    return { success: true, liked: !isLiked };
  } catch (error) {
    logger.error("Toggle like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}

export async function getTrendingPosts(period: TrendingPeriod = "week", limit = 5) {
  try {
    const Post = await getPostModel();
    const PostDailyStat = await getPostDailyStatModel();

    const now = new Date();
    const periodStart = getTrendingPeriodStart(period, now);
    const windowMs = Math.max(now.getTime() - periodStart.getTime(), 1);

    const posts = await PostDailyStat.aggregate<TrendingPostRow>([
      {
        $match: {
          day: { $gte: periodStart },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $multiply: [
              "$uniqueViewCount",
              {
                $add: [
                  0.1,
                  {
                    $multiply: [
                      0.9,
                      {
                        $divide: [
                          { $subtract: ["$day", periodStart] },
                          windowMs,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$postId",
          recentViewCount: { $sum: "$uniqueViewCount" },
          trendingScore: { $sum: "$trendingScore" },
        },
      },
      {
        $lookup: {
          from: Post.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "post",
        },
      },
      {
        $unwind: "$post",
      },
      {
        $addFields: {
          finalScore: {
            $add: [
              "$trendingScore",
              { $multiply: [{ $ifNull: ["$post.commentCount", 0] }, 2] },
              { $ifNull: ["$post.likes", 0] },
            ],
          },
        },
      },
      {
        $sort: { finalScore: -1 },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: "$post._id",
          content: "$post.content",
          type: "$post.type",
          author: "$post.author",
          viewCount: "$post.viewCount",
          recentViewCount: 1,
          commentCount: "$post.commentCount",
          likes: "$post.likes",
          createdAt: "$post.createdAt",
          finalScore: 1,
        },
      },
    ]);

    return {
      success: true,
      posts: posts.map((post) => ({
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
      })) satisfies TrendingPost[],
    };
  } catch (error) {
    logger.error("Get trending posts error:", error);
    return { success: false, error: "인기글을 불러오는데 실패했습니다.", posts: [] };
  }
}

export async function updatePost(id: string, content: string, images?: string[]) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Post = await getPostModel();
    const post = await Post.findById(id);

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    if (post.author.id !== session.user.id) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    const updateData: { content: string; images?: string[] } = { content };
    if (images !== undefined) {
      updateData.images = images;
    }

    await Post.findByIdAndUpdate(id, updateData);

    revalidatePath("/");
    revalidatePath("/community");

    return { success: true };
  } catch (error) {
    logger.error("Update post error:", error);
    return { success: false, error: "게시글 수정에 실패했습니다." };
  }
}
