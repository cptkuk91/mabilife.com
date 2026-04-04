"use server";

import type { Model } from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import getCommentModel, { IComment } from "@/models/Comment";
import getPostModel, { IPost } from "@/models/Post";

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

export async function incrementViewCount(id: string) {
  try {
    const Post = await getPostModel();

    await Post.updateOne(
      { _id: id, viewCount: { $exists: false } },
      { $set: { viewCount: 0, viewHistory: [] } },
    );

    const result = await Post.findByIdAndUpdate(
      id,
      {
        $inc: { viewCount: 1 },
        $push: { viewHistory: { viewedAt: new Date() } },
      },
      { returnDocument: "after" },
    );

    logger.debug("View count updated:", id, "New count:", result?.viewCount);

    revalidatePath("/community");
    revalidatePath(`/community/${id}`);

    return { success: true };
  } catch (error) {
    logger.error("Increment view error:", error);
    return { success: false };
  }
}

export async function deletePost(id: string) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Post = await getPostModel();
    const Comment = await getCommentModel();
    const post = await Post.findById(id);

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    if (post.author.id !== session.user.id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    await Comment.deleteMany({ postId: id });
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

export type TrendingPeriod = "week" | "month";

export async function getTrendingPosts(period: TrendingPeriod = "week", limit = 5) {
  try {
    const Post = await getPostModel();

    const now = new Date();
    const periodStart = new Date();

    if (period === "week") {
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart.setMonth(now.getMonth() - 1);
    }

    const posts = await Post.aggregate<TrendingPostRow>([
      {
        $addFields: {
          recentViews: {
            $filter: {
              input: { $ifNull: ["$viewHistory", []] },
              as: "view",
              cond: { $gte: ["$$view.viewedAt", periodStart] },
            },
          },
          trendingScore: {
            $reduce: {
              input: { $ifNull: ["$viewHistory", []] },
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $cond: [
                      { $gte: ["$$this.viewedAt", periodStart] },
                      {
                        $add: [
                          0.1,
                          {
                            $multiply: [
                              0.9,
                              {
                                $divide: [
                                  { $subtract: ["$$this.viewedAt", periodStart] },
                                  { $subtract: [now, periodStart] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          recentViewCount: { $size: "$recentViews" },
          finalScore: {
            $add: [
              "$trendingScore",
              { $multiply: [{ $ifNull: ["$commentCount", 0] }, 2] },
              { $ifNull: ["$likes", 0] },
            ],
          },
        },
      },
      {
        $match: {
          recentViewCount: { $gt: 0 },
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
          _id: 1,
          content: 1,
          type: 1,
          author: 1,
          viewCount: 1,
          recentViewCount: 1,
          commentCount: 1,
          likes: 1,
          createdAt: 1,
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
