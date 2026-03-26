"use server";

import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import getPostModel from "@/models/Post";
import getCommentModel from "@/models/Comment";
import { revalidatePath } from "next/cache";

export type CreatePostInput = {
  content: string;
  type: '잡담' | '질문' | '정보';
  images?: string[];
};

export type PostResponse = {
  success: boolean;
  id?: string;
  error?: string;
};

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
      images: input.images || [],
      author: {
        id: session.user.id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
      isSolved: input.type === '질문' ? false : undefined,
    });

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

export async function getPosts(page = 1, limit = 20, type?: string, search?: string) {
  try {
    const Post = await getPostModel();
    const Comment = await getCommentModel();
    const query: Record<string, unknown> = {};

    if (type && type !== '전체') {
      query.type = type;
    }

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // 채택된 댓글 ID들 수집
    const acceptedCommentIds = posts
      .filter(post => post.acceptedCommentId)
      .map(post => post.acceptedCommentId as string);

    // 채택된 댓글들 한번에 조회
    const acceptedComments = acceptedCommentIds.length > 0
      ? await Comment.find({ _id: { $in: acceptedCommentIds } }).lean()
      : [];

    // 댓글 맵 생성
    const commentMap = new Map(
      acceptedComments.map(comment => [comment._id.toString(), comment])
    );

    // Convert _id to string and exclude viewHistory (not needed on client)
    const serializedPosts = posts.map((post) => {
      const acceptedComment = post.acceptedCommentId
        ? commentMap.get(post.acceptedCommentId)
        : null;

      return {
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        viewHistory: undefined,
        acceptedComment: acceptedComment ? {
          _id: acceptedComment._id.toString(),
          content: acceptedComment.content,
          author: acceptedComment.author,
        } : null,
      };
    });

    return { success: true, posts: serializedPosts };
  } catch (error) {
    logger.error("Get posts error:", error);
    return { success: false, error: "게시글을 불러오는데 실패했습니다.", posts: [] };
  }
}

export async function getPost(id: string) {
  try {
    const Post = await getPostModel();
    const post = await Post.findById(id).lean();

    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    return {
      success: true,
      post: {
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
        viewHistory: undefined,
      }
    };
  } catch (error) {
    logger.error("Get post error:", error);
    return { success: false, error: "게시글을 불러오는데 실패했습니다." };
  }
}

export async function incrementViewCount(id: string) {
  try {
    const Post = await getPostModel();

    // viewCount 필드가 없는 기존 문서를 위해 먼저 초기화
    await Post.updateOne(
      { _id: id, viewCount: { $exists: false } },
      { $set: { viewCount: 0, viewHistory: [] } }
    );

    // 조회수 증가
    const result = await Post.findByIdAndUpdate(
      id,
      {
        $inc: { viewCount: 1 },
        $push: { viewHistory: { viewedAt: new Date() } }
      },
      { new: true }
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

    // 게시글에 달린 모든 댓글 삭제
    await Comment.deleteMany({ postId: id });

    // 게시글 삭제
    await Post.findByIdAndDelete(id);
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
      // Unlike
      await Post.findByIdAndUpdate(postId, {
        $inc: { likes: -1 },
        $pull: { likedBy: userId }
      });
    } else {
      // Like
      await Post.findByIdAndUpdate(postId, {
        $inc: { likes: 1 },
        $push: { likedBy: userId }
      });
    }

    return { success: true, liked: !isLiked };
  } catch (error) {
    logger.error("Toggle like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}

export type TrendingPeriod = 'week' | 'month';

export async function getTrendingPosts(period: TrendingPeriod = 'week', limit: number = 5) {
  try {
    const Post = await getPostModel();

    const now = new Date();
    const periodStart = new Date();

    if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart.setMonth(now.getMonth() - 1);
    }

    // Get posts with views in the time period
    const posts = await Post.aggregate([
      {
        $addFields: {
          // Filter viewHistory to only include views within the period
          recentViews: {
            $filter: {
              input: { $ifNull: ['$viewHistory', []] },
              as: 'view',
              cond: { $gte: ['$$view.viewedAt', periodStart] }
            }
          },
          // Calculate time-weighted score for recent views
          // More recent views get higher weight
          trendingScore: {
            $reduce: {
              input: { $ifNull: ['$viewHistory', []] },
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $cond: [
                      { $gte: ['$$this.viewedAt', periodStart] },
                      {
                        // Weight: 1.0 for now, decreasing to 0.1 at period start
                        $add: [
                          0.1,
                          {
                            $multiply: [
                              0.9,
                              {
                                $divide: [
                                  { $subtract: ['$$this.viewedAt', periodStart] },
                                  { $subtract: [now, periodStart] }
                                ]
                              }
                            ]
                          }
                        ]
                      },
                      0
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          recentViewCount: { $size: '$recentViews' },
          // Combine views + comments + likes for final score
          finalScore: {
            $add: [
              '$trendingScore',
              { $multiply: [{ $ifNull: ['$commentCount', 0] }, 2] },
              { $ifNull: ['$likes', 0] }
            ]
          }
        }
      },
      {
        $match: {
          recentViewCount: { $gt: 0 }
        }
      },
      {
        $sort: { finalScore: -1 }
      },
      {
        $limit: limit
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
          finalScore: 1
        }
      }
    ]);

    const serializedPosts = posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
    }));

    return { success: true, posts: serializedPosts };
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
    revalidatePath("/community");

    return { success: true };
  } catch (error) {
    logger.error("Update post error:", error);
    return { success: false, error: "게시글 수정에 실패했습니다." };
  }
}
