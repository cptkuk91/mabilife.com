"use server";

import { auth } from "@/lib/auth";
import getGuideCommentModel, { IGuideComment } from "@/models/GuideComment";
import { revalidatePath } from "next/cache";
import { getCache, setCache, delCache } from "@/lib/redis";

export interface GuideCommentResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Create a new comment
export async function createGuideComment(
  guideId: string,
  content: string,
  parentId?: string
): Promise<GuideCommentResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const GuideComment = await getGuideCommentModel();

    const comment = await GuideComment.create({
      guideId,
      content,
      parentId: parentId || null,
      author: {
        id: (session.user as any).id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
    } as any) as any;

    // Invalidate comments cache
    await delCache(`guide:comments:${guideId}`);

    revalidatePath(`/guide/tips/${guideId}`);

    return {
      success: true,
      data: {
        ...comment.toObject(),
        _id: comment._id.toString(),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Create guide comment error:", error);
    return { success: false, error: "댓글 작성에 실패했습니다." };
  }
}

// Get comments for a guide
export async function getGuideComments(guideId: string): Promise<GuideCommentResponse> {
  try {
    const cacheKey = `guide:comments:${guideId}`;
    const cached = await getCache<any>(cacheKey);

    if (cached) {
      return { success: true, data: cached };
    }

    const GuideComment = await getGuideCommentModel();

    const comments = await GuideComment.find({ guideId })
      .sort({ createdAt: 1 })
      .lean();

    const serializedComments = comments.map((comment) => ({
      ...comment,
      _id: comment._id.toString(),
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    }));

    // Cache comments (TTL 5 mins)
    await setCache(cacheKey, serializedComments, 300);

    return { success: true, data: serializedComments };
  } catch (error) {
    console.error("Get guide comments error:", error);
    return { success: false, error: "댓글을 불러오는데 실패했습니다." };
  }
}

// Update a comment
export async function updateGuideComment(
  commentId: string,
  guideId: string,
  content: string
): Promise<GuideCommentResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const GuideComment = await getGuideCommentModel();
    const comment = await GuideComment.findById(commentId);

    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    if (comment.author.id !== (session.user as any).id) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    await GuideComment.findByIdAndUpdate(commentId, { content });

    // Invalidate caches
    await delCache(`guide:comments:${guideId}`);

    revalidatePath(`/guide/tips/${guideId}`);

    return { success: true };
  } catch (error) {
    console.error("Update guide comment error:", error);
    return { success: false, error: "댓글 수정에 실패했습니다." };
  }
}

// Delete a comment
export async function deleteGuideComment(
  commentId: string,
  guideId: string
): Promise<GuideCommentResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const GuideComment = await getGuideCommentModel();
    const comment = await GuideComment.findById(commentId);

    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    if (comment.author.id !== (session.user as any).id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    // Delete the comment and all its replies
    await GuideComment.deleteMany({
      $or: [{ _id: commentId }, { parentId: commentId }],
    });

    // Invalidate caches
    await delCache(`guide:comments:${guideId}`);

    revalidatePath(`/guide/tips/${guideId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete guide comment error:", error);
    return { success: false, error: "댓글 삭제에 실패했습니다." };
  }
}

// Toggle like on a comment
export async function toggleGuideCommentLike(
  commentId: string,
  guideId: string
): Promise<GuideCommentResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const GuideComment = await getGuideCommentModel();
    const comment = await GuideComment.findById(commentId);

    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    const userId = (session.user as any).id;
    const hasLiked = comment.likedBy.includes(userId);

    if (hasLiked) {
      await GuideComment.findByIdAndUpdate(commentId, {
        $pull: { likedBy: userId },
        $inc: { likes: -1 },
      });
    } else {
      await GuideComment.findByIdAndUpdate(commentId, {
        $push: { likedBy: userId },
        $inc: { likes: 1 },
      });
    }

    revalidatePath(`/guide/tips/${guideId}`);

    return { success: true, data: { liked: !hasLiked } };
  } catch (error) {
    console.error("Toggle guide comment like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}
