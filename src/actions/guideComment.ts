"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";
import getGuideCommentModel, { type IGuideComment } from "@/models/GuideComment";

export type SerializedGuideComment = {
  _id: string;
  guideId: string;
  content: string;
  author: IGuideComment["author"];
  parentId?: string | null;
  likes: number;
  likedBy: string[];
  createdAt: string;
  updatedAt: string;
};

export interface GuideCommentResponse {
  success: boolean;
  data?: SerializedGuideComment | SerializedGuideComment[] | { liked: boolean };
  error?: string;
}

type GuideCommentRaw = {
  _id: { toString(): string };
  guideId: string;
  content: string;
  author: IGuideComment["author"];
  parentId?: string | null;
  likes: number;
  likedBy?: string[];
  createdAt: Date;
  updatedAt: Date;
};

function serializeGuideComment(comment: GuideCommentRaw): SerializedGuideComment {
  return {
    _id: comment._id.toString(),
    guideId: comment.guideId,
    content: comment.content,
    author: comment.author,
    parentId: comment.parentId ?? null,
    likes: comment.likes,
    likedBy: comment.likedBy ?? [],
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

function revalidateGuideCommentPaths(guideId: string) {
  revalidatePath("/guide");
  revalidatePath(`/guide/${guideId}`);
}

export async function createGuideComment(
  guideId: string,
  content: string,
  parentId?: string,
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
      parentId: parentId || undefined,
      author: {
        id: session.user.id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
    }) as IGuideComment;

    revalidateGuideCommentPaths(guideId);

    return {
      success: true,
      data: serializeGuideComment(comment.toObject() as unknown as GuideCommentRaw),
    };
  } catch (error) {
    logger.error("Create guide comment error:", error);
    return { success: false, error: "댓글 작성에 실패했습니다." };
  }
}

export async function getGuideComments(guideId: string): Promise<GuideCommentResponse> {
  try {
    const GuideComment = await getGuideCommentModel();
    const comments = await GuideComment.find({ guideId })
      .sort({ createdAt: 1 })
      .lean<GuideCommentRaw[]>();

    return { success: true, data: comments.map(serializeGuideComment) };
  } catch (error) {
    logger.error("Get guide comments error:", error);
    return { success: false, error: "댓글을 불러오는데 실패했습니다." };
  }
}

export async function updateGuideComment(
  commentId: string,
  guideId: string,
  content: string,
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

    if (comment.author.id !== session.user.id) {
      return { success: false, error: "수정 권한이 없습니다." };
    }

    await GuideComment.findByIdAndUpdate(commentId, { content });
    revalidateGuideCommentPaths(guideId);

    return { success: true };
  } catch (error) {
    logger.error("Update guide comment error:", error);
    return { success: false, error: "댓글 수정에 실패했습니다." };
  }
}

export async function deleteGuideComment(
  commentId: string,
  guideId: string,
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

    if (comment.author.id !== session.user.id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    await GuideComment.deleteMany({
      $or: [{ _id: commentId }, { parentId: commentId }],
    });

    revalidateGuideCommentPaths(guideId);

    return { success: true };
  } catch (error) {
    logger.error("Delete guide comment error:", error);
    return { success: false, error: "댓글 삭제에 실패했습니다." };
  }
}

export async function toggleGuideCommentLike(
  commentId: string,
  guideId: string,
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

    const userId = session.user.id;
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

    revalidateGuideCommentPaths(guideId);

    return { success: true, data: { liked: !hasLiked } };
  } catch (error) {
    logger.error("Toggle guide comment like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}
