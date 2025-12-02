"use server";

import { auth } from "@/lib/auth";
import getCommentModel from "@/models/Comment";
import getPostModel from "@/models/Post";
import { revalidatePath } from "next/cache";

export async function createComment(postId: string, content: string, parentId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Comment = await getCommentModel();
    const Post = await getPostModel();

    const comment = await Comment.create({
      postId,
      content,
      parentId: parentId || null,
      author: {
        id: (session.user as any).id,
        name: session.user.name || "익명",
        image: session.user.image || undefined,
      },
    });

    // Increment comment count on post
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 }
    });

    revalidatePath(`/community/${postId}`);

    return {
      success: true,
      comment: {
        ...comment.toObject(),
        _id: comment._id.toString(),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      }
    };
  } catch (error) {
    console.error("Create comment error:", error);
    return { success: false, error: "댓글 작성에 실패했습니다." };
  }
}

export async function getComments(postId: string) {
  try {
    const Comment = await getCommentModel();

    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();

    // Organize comments into tree structure
    const commentMap = new Map();
    const rootComments: any[] = [];

    // First pass: create map of all comments
    comments.forEach((comment) => {
      const serialized = {
        ...comment,
        _id: comment._id.toString(),
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: [],
      };
      commentMap.set(serialized._id, serialized);
    });

    // Second pass: organize into tree
    comments.forEach((comment) => {
      const serialized = commentMap.get(comment._id.toString());
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(serialized);
        }
      } else {
        rootComments.push(serialized);
      }
    });

    return { success: true, comments: rootComments };
  } catch (error) {
    console.error("Get comments error:", error);
    return { success: false, error: "댓글을 불러오는데 실패했습니다.", comments: [] };
  }
}

export async function deleteComment(commentId: string, postId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const Comment = await getCommentModel();
    const Post = await getPostModel();

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    if (comment.author.id !== (session.user as any).id) {
      return { success: false, error: "삭제 권한이 없습니다." };
    }

    // Count replies to delete
    const replyCount = await Comment.countDocuments({ parentId: commentId });

    // Delete all replies first
    await Comment.deleteMany({ parentId: commentId });

    // Delete the comment itself
    await Comment.findByIdAndDelete(commentId);

    // Update post comment count (parent + replies)
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: -(1 + replyCount) }
    });

    revalidatePath(`/community/${postId}`);

    return { success: true, deletedCount: 1 + replyCount };
  } catch (error) {
    console.error("Delete comment error:", error);
    return { success: false, error: "댓글 삭제에 실패했습니다." };
  }
}

export async function toggleCommentLike(commentId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = (session.user as any).id;
    const Comment = await getCommentModel();
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    const isLiked = comment.likedBy.includes(userId);

    if (isLiked) {
      await Comment.findByIdAndUpdate(commentId, {
        $inc: { likes: -1 },
        $pull: { likedBy: userId }
      });
    } else {
      await Comment.findByIdAndUpdate(commentId, {
        $inc: { likes: 1 },
        $push: { likedBy: userId }
      });
    }

    return { success: true, liked: !isLiked };
  } catch (error) {
    console.error("Toggle comment like error:", error);
    return { success: false, error: "좋아요 처리에 실패했습니다." };
  }
}
