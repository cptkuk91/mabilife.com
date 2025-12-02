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

    console.log("Raw comments from DB:", comments.map(c => ({ _id: c._id, isAccepted: c.isAccepted })));

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

export async function getWeeklyTopAnswerers(limit: number = 5) {
  try {
    const Comment = await getCommentModel();

    // 이번 주 시작일 (일요일 또는 월요일 기준)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // 일요일 기준
    weekStart.setHours(0, 0, 0, 0);

    // 이번 주에 채택된 댓글을 작성자별로 집계
    const topAnswerers = await Comment.aggregate([
      {
        $match: {
          isAccepted: true,
          acceptedAt: { $gte: weekStart }
        }
      },
      {
        $group: {
          _id: '$author.id',
          name: { $first: '$author.name' },
          image: { $first: '$author.image' },
          acceptCount: { $sum: 1 }
        }
      },
      {
        $sort: { acceptCount: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: 1,
          image: 1,
          acceptCount: 1
        }
      }
    ]);

    return { success: true, answerers: topAnswerers };
  } catch (error) {
    console.error("Get weekly top answerers error:", error);
    return { success: false, error: "지식인 랭킹을 불러오는데 실패했습니다.", answerers: [] };
  }
}

export async function acceptComment(commentId: string, postId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "로그인이 필요합니다." };
    }

    const userId = (session.user as any).id;
    const Comment = await getCommentModel();
    const Post = await getPostModel();

    // 게시글 확인
    const post = await Post.findById(postId);
    if (!post) {
      return { success: false, error: "게시글을 찾을 수 없습니다." };
    }

    // 질문 타입인지 확인
    if (post.type !== '질문') {
      return { success: false, error: "질문 게시글에서만 채택이 가능합니다." };
    }

    // 게시글 작성자인지 확인
    if (post.author.id !== userId) {
      return { success: false, error: "게시글 작성자만 채택할 수 있습니다." };
    }

    // 이미 채택된 답변이 있는지 확인
    if (post.isSolved) {
      console.log("Already solved - rejecting accept request");
      return { success: false, error: "이미 채택된 답변이 있습니다." };
    }

    console.log("Proceeding with accept for comment:", commentId);

    // 댓글 확인
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return { success: false, error: "댓글을 찾을 수 없습니다." };
    }

    // 자기 댓글은 채택 불가
    if (comment.author.id === userId) {
      return { success: false, error: "자신의 댓글은 채택할 수 없습니다." };
    }

    // 대댓글은 채택 불가
    if (comment.parentId) {
      return { success: false, error: "답글은 채택할 수 없습니다." };
    }

    // 기존 댓글에 isAccepted 필드가 없을 수 있으므로 먼저 초기화
    await Comment.updateOne(
      { _id: commentId, isAccepted: { $exists: false } },
      { $set: { isAccepted: false } }
    );

    // 댓글 채택 처리 (채택 시간 기록)
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { isAccepted: true, acceptedAt: new Date() } },
      { new: true }
    );

    console.log("Comment accepted:", updatedComment?._id, "isAccepted:", updatedComment?.isAccepted);

    // 게시글 해결됨 표시
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: { isSolved: true, acceptedCommentId: commentId } },
      { new: true }
    );

    console.log("Post updated:", updatedPost?._id, "isSolved:", updatedPost?.isSolved, "acceptedCommentId:", updatedPost?.acceptedCommentId);

    revalidatePath(`/community/${postId}`);
    revalidatePath("/community");

    return { success: true };
  } catch (error) {
    console.error("Accept comment error:", error);
    return { success: false, error: "채택 처리에 실패했습니다." };
  }
}
