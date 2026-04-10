"use client";

import Image from "next/image";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  deletePost,
  getPost,
  getTrendingPosts,
  incrementViewCount,
  toggleLike,
  type SerializedPost,
  type TrendingPeriod,
  type TrendingPost,
  updatePost,
} from "@/actions/post";
import {
  acceptComment,
  createComment,
  deleteComment,
  getComments,
  toggleCommentLike,
  type SerializedComment,
  updateComment,
} from "@/actions/comment";

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const fr = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";

const badgeStyle = (type: string, solved?: boolean) =>
  type === "질문"
    ? solved
      ? "bg-[#E6F8EC] text-[#27AE60]"
      : "bg-[#FEF4E6] text-[#F2994A]"
    : type === "정보"
      ? "bg-[#E8F0FE] text-[#2F80ED]"
      : "bg-[#F7F6F3] text-[#787774]";

const badgeText = (type: string, solved?: boolean) =>
  type === "질문" ? (solved ? "해결됨" : "답변 대기중") : type;

function updateCommentTree(
  comments: SerializedComment[],
  commentId: string,
  updater: (comment: SerializedComment) => SerializedComment,
): SerializedComment[] {
  return comments.map((comment) => {
    if (comment._id === commentId) {
      return updater(comment);
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: updateCommentTree(comment.replies, commentId, updater),
    };
  });
}

export default function PostDetailClient({
  id,
  initialPost,
}: {
  id: string;
  initialPost: SerializedPost | null;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const viewedPostIdRef = useRef<string | null>(null);

  const [post, setPost] = useState<SerializedPost | null>(initialPost);
  const [loading, setLoading] = useState(!initialPost);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(initialPost?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>("week");
  const [comments, setComments] = useState<SerializedComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [deleteCommentTargetId, setDeleteCommentTargetId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [showPostDeleteModal, setShowPostDeleteModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptTargetId, setAcceptTargetId] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [activeCommentDropdown, setActiveCommentDropdown] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);

  const loadPost = useEffectEvent(async (postId: string) => {
    setLoading(true);
    const result = await getPost(postId);

    if (result.success && result.post) {
      setPost(result.post);
      setEditContent(result.post.content);
    } else {
      alert(result.error || "게시글을 불러오는데 실패했습니다.");
      router.push("/community");
    }

    setLoading(false);
  });
  const incrementPostViewEffect = useEffectEvent(async (postId: string) => {
    const result = await incrementViewCount(postId);

    if (result.success && typeof result.viewCount === "number") {
      const nextViewCount: number = result.viewCount;
      setPost((previousPost) =>
        previousPost && previousPost._id === postId
          ? { ...previousPost, viewCount: nextViewCount }
          : previousPost,
      );
    }
  });

  const refreshComments = async () => {
    const result = await getComments(id);
    if (result.success) {
      setComments(result.comments);
    }
  };

  const loadComments = useEffectEvent(async () => {
    await refreshComments();
  });

  const loadTrendingPosts = useEffectEvent(async () => {
    const result = await getTrendingPosts(trendingPeriod, 5);
    if (result.success) {
      setTrendingPosts(result.posts);
    }
  });

  useEffect(() => {
    const handleDocumentClick = () => {
      setShowDropdown(false);
      setActiveCommentDropdown(null);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [id]);

  useEffect(() => {
    if (!initialPost) {
      void loadPost(id);
    }
  }, [id, initialPost]);

  useEffect(() => {
    if (!post?._id || viewedPostIdRef.current === post._id) {
      return;
    }

    viewedPostIdRef.current = post._id;
    void incrementPostViewEffect(post._id);
  }, [post?._id]);

  useEffect(() => {
    void loadComments();
  }, [id]);

  useEffect(() => {
    void loadTrendingPosts();
  }, [trendingPeriod]);

  const handleSubmitComment = async () => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const trimmedComment = newComment.trim();
    if (!trimmedComment) {
      return;
    }

    setIsSubmittingComment(true);
    const result = await createComment(id, trimmedComment);

    if (result.success) {
      setNewComment("");
      await refreshComments();
      setPost((previousPost) =>
        previousPost
          ? { ...previousPost, commentCount: (previousPost.commentCount || 0) + 1 }
          : previousPost,
      );
    } else {
      alert(result.error || "댓글 작성에 실패했습니다.");
    }

    setIsSubmittingComment(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const trimmedReply = replyContent.trim();
    if (!trimmedReply) {
      return;
    }

    const result = await createComment(id, trimmedReply, parentId);

    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
      await refreshComments();
      setPost((previousPost) =>
        previousPost
          ? { ...previousPost, commentCount: (previousPost.commentCount || 0) + 1 }
          : previousPost,
      );
    } else {
      alert(result.error || "답글 작성에 실패했습니다.");
    }
  };

  const handleDeleteCommentClick = (commentId: string) => {
    setDeleteCommentTargetId(commentId);
    setShowCommentDeleteModal(true);
  };

  const handleDeleteCommentConfirm = async () => {
    if (!deleteCommentTargetId) {
      return;
    }

    setIsDeletingComment(true);
    const result = await deleteComment(deleteCommentTargetId, id);

    if (result.success) {
      await refreshComments();
      const deletedCount = result.deletedCount || 1;
      setPost((previousPost) =>
        previousPost
          ? { ...previousPost, commentCount: Math.max(previousPost.commentCount - deletedCount, 0) }
          : previousPost,
      );
    } else {
      alert(result.error || "삭제에 실패했습니다.");
    }

    setIsDeletingComment(false);
    setShowCommentDeleteModal(false);
    setDeleteCommentTargetId(null);
  };

  const handleDeleteCommentCancel = () => {
    setShowCommentDeleteModal(false);
    setDeleteCommentTargetId(null);
  };

  const handleAcceptClick = (commentId: string) => {
    setAcceptTargetId(commentId);
    setShowAcceptModal(true);
  };

  const handleAcceptConfirm = async () => {
    if (!acceptTargetId) {
      return;
    }

    setIsAccepting(true);
    const result = await acceptComment(acceptTargetId, id);

    if (result.success) {
      setPost((previousPost) =>
        previousPost
          ? { ...previousPost, isSolved: true, acceptedCommentId: acceptTargetId }
          : previousPost,
      );
      setComments((previousComments) =>
        updateCommentTree(previousComments, acceptTargetId, (comment) => ({
          ...comment,
          isAccepted: true,
        })),
      );
    } else {
      alert(result.error || "채택에 실패했습니다.");
    }

    setIsAccepting(false);
    setShowAcceptModal(false);
    setAcceptTargetId(null);
  };

  const handleAcceptCancel = () => {
    setShowAcceptModal(false);
    setAcceptTargetId(null);
  };

  const handleStartEditComment = (comment: SerializedComment) => {
    setEditingCommentId(comment._id);
    setEditCommentContent(comment.content);
    setActiveCommentDropdown(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleSaveEditComment = async (commentId: string) => {
    const trimmedComment = editCommentContent.trim();
    if (!trimmedComment) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSavingComment(true);
    const result = await updateComment(commentId, id, trimmedComment);

    if (result.success) {
      setComments((previousComments) =>
        updateCommentTree(previousComments, commentId, (comment) => ({
          ...comment,
          content: trimmedComment,
        })),
      );
      setEditingCommentId(null);
      setEditCommentContent("");
    } else {
      alert(result.error || "수정에 실패했습니다.");
    }

    setIsSavingComment(false);
  };

  const handleCommentLike = async (commentId: string) => {
    if (!session?.user || !currentUserId) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await toggleCommentLike(commentId);
    if (!result.success) {
      return;
    }

    setComments((previousComments) =>
      updateCommentTree(previousComments, commentId, (comment) => {
        const isLiked = comment.likedBy.includes(currentUserId);
        return {
          ...comment,
          likes: isLiked ? comment.likes - 1 : comment.likes + 1,
          likedBy: isLiked
            ? comment.likedBy.filter((userId) => userId !== currentUserId)
            : [...comment.likedBy, currentUserId],
        };
      }),
    );
  };

  const handleDeleteClick = () => {
    setShowPostDeleteModal(true);
    setShowDropdown(false);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    const result = await deletePost(id);

    if (result.success) {
      router.push("/community");
      return;
    }

    alert(result.error || "삭제에 실패했습니다.");
    setIsDeleting(false);
    setShowPostDeleteModal(false);
  };

  const handleDeleteCancel = () => {
    setShowPostDeleteModal(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowDropdown(false);
  };

  const handleSaveEdit = async () => {
    const trimmedContent = editContent.trim();
    if (!trimmedContent) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    const result = await updatePost(id, trimmedContent);

    if (result.success) {
      setPost((previousPost) =>
        previousPost
          ? { ...previousPost, content: trimmedContent }
          : previousPost,
      );
      setIsEditing(false);
    } else {
      alert(result.error || "수정에 실패했습니다.");
    }

    setIsSaving(false);
  };

  const handleLike = async () => {
    if (!session?.user || !currentUserId || !post) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await toggleLike(id);
    if (!result.success) {
      alert(result.error || "좋아요 처리에 실패했습니다.");
      return;
    }

    setPost((previousPost) => {
      if (!previousPost) {
        return previousPost;
      }

      const isLiked = previousPost.likedBy.includes(currentUserId);
      return {
        ...previousPost,
        likes: isLiked ? previousPost.likes - 1 : previousPost.likes + 1,
        likedBy: isLiked
          ? previousPost.likedBy.filter((userId) => userId !== currentUserId)
          : [...previousPost.likedBy, currentUserId],
      };
    });
  };

  const renderHashtags = (text: string) =>
    text.split("\n").map((line, lineIndex) => (
      <div key={lineIndex} className="min-h-[1.5em]">
        {line.split(/((?:^|\s)#[^\s#]+)/g).map((part, partIndex) =>
          part.trim().startsWith("#") ? (
            <span key={partIndex} className="rounded-md bg-[#E8F0FE] px-1 py-0.5 font-semibold text-[#2F80ED]">
              {part}
            </span>
          ) : (
            <span key={partIndex}>{part}</span>
          ),
        )}
        {line === "" && <br />}
      </div>
    ));

  if (loading) {
    return (
      <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-20 sm:px-6 lg:px-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-[20px] text-[#B4B4B0]" aria-hidden="true" />
            <p className="mt-3 text-[14px] text-[#9B9A97]">로딩중…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 bg-white px-5 pb-24 pt-16 sm:px-6 md:pb-16 md:pt-20 lg:px-8 xl:grid-cols-[minmax(0,1fr)_300px]">
      <main className="min-w-0">
        <article className="rounded-xl border border-[#E3E2DE] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex flex-1 items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`}
                  className="size-9 rounded-full border border-[#E3E2DE] object-cover"
                  alt="Avatar"
                  width={36}
                  height={36}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-bold text-[#37352F]">{post.author.name}</span>
                  <span className="text-[11px] text-[#B4B4B0]">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold", badgeStyle(post.type, post.isSolved))}>
                {badgeText(post.type, post.isSolved)}
              </span>
            </div>

            {currentUserId === post.author.id && (
              <div className="relative ml-1" onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); }}>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md text-[#B4B4B0] transition hover:bg-[#F7F6F3] hover:text-[#787774]"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.nativeEvent.stopImmediatePropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <i className="fa-solid fa-ellipsis-vertical text-[12px]" aria-hidden="true" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[100px] overflow-hidden rounded-lg border border-[#E3E2DE] bg-white py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[12px] font-medium text-[#37352F] transition hover:bg-[#F7F6F3]"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.nativeEvent.stopImmediatePropagation();
                        handleEdit();
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[12px] font-medium text-[#EB5757] transition hover:bg-[#FEF0F0]"
                      onClick={(event) => {
                        event.stopPropagation();
                        event.nativeEvent.stopImmediatePropagation();
                        handleDeleteClick();
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-h-[160px] whitespace-pre-wrap break-words text-[14px] leading-7 text-[#37352F]">
            {isEditing ? (
              <div className="rounded-lg p-1">
                <textarea
                  className={cn("mb-2 min-h-[160px] w-full rounded-lg border border-[#E3E2DE] bg-white px-3 py-3 text-[14px] leading-6 text-[#37352F] outline-none transition focus:border-[#2F80ED]", fr)}
                  value={editContent}
                  onChange={(event) => setEditContent(event.target.value)}
                  placeholder="내용을 입력하세요"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className={cn("rounded-lg bg-[#F7F6F3] px-3 py-1.5 text-[12px] font-medium text-[#787774] transition hover:bg-[#F1F1EF]", fr)}
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(post.content);
                    }}
                    disabled={isSaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className={cn("rounded-lg bg-[#2F80ED] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-60", fr)}
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              renderHashtags(post.content)
            )}
          </div>

          {post.images.map((url, index) => (
            <Image
              key={index}
              src={url}
              alt={`Post Image ${index + 1}`}
              className="mb-3 h-auto w-full rounded-xl border border-[#E3E2DE] object-cover"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: "100%", height: "auto" }}
            />
          ))}

          <div className="mt-3 flex flex-wrap gap-3 text-[12px] text-[#9B9A97]">
            <span className="inline-flex items-center gap-1">
              <i className="fa-regular fa-comment" aria-hidden="true" /> {post.commentCount || 0}
            </span>
            <button
              type="button"
              className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-[#FEF0F0] hover:text-[#EB5757]", post.likedBy.includes(currentUserId || "") && "text-[#EB5757]")}
              onClick={handleLike}
            >
              <i className={post.likedBy.includes(currentUserId || "") ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true" /> {post.likes || 0}
            </button>
            <span className="inline-flex items-center gap-1">
              <i className="fa-regular fa-eye" aria-hidden="true" /> {post.viewCount || 0}
            </span>
          </div>
        </article>

        <section className="mt-4 rounded-xl border border-[#E3E2DE] bg-white p-5">
          <h3 className="mb-4 flex items-center gap-2 text-[15px] font-bold text-[#37352F]">
            댓글 <span className="text-[14px] text-[#2F80ED]">{post.commentCount || 0}</span>
          </h3>

          <div className="mb-5 flex gap-2.5 border-b border-[#F1F1EF] pb-5 max-sm:flex-col">
            <Image
              src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous"}
              className="size-8 rounded-full border border-[#E3E2DE] object-cover"
              alt="Your Avatar"
              width={32}
              height={32}
            />
            <div className="flex flex-1 flex-col gap-2">
              <textarea
                className={cn("w-full rounded-lg border border-[#E3E2DE] px-3 py-2.5 text-[13px] text-[#37352F] outline-none transition focus:border-[#2F80ED] disabled:cursor-not-allowed disabled:bg-[#F7F6F3] disabled:text-[#B4B4B0] placeholder:text-[#C4C4C0]", fr)}
                placeholder={session?.user ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                disabled={!session?.user}
                rows={3}
              />
              <button
                type="button"
                className={cn("self-end rounded-lg bg-[#2F80ED] px-4 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-50", fr)}
                onClick={handleSubmitComment}
                disabled={!session?.user || isSubmittingComment || !newComment.trim()}
              >
                {isSubmittingComment ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <div key={comment._id} className={cn("flex flex-col gap-2.5", comment.isAccepted && "rounded-xl border border-[#27AE60]/20 bg-[#27AE60]/5 p-3.5")}>
                {comment.isAccepted && (
                  <div className="inline-flex w-fit items-center gap-1 rounded-md bg-[#27AE60] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <i className="fa-solid fa-check-circle" aria-hidden="true" /> 채택된 답변
                  </div>
                )}

                <div className="flex gap-2.5">
                  <Image
                    src={comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                    className="size-8 rounded-full border border-[#E3E2DE] object-cover"
                    alt="Commenter"
                    width={32}
                    height={32}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-semibold text-[#37352F]">{comment.author.name}</span>
                      <span className="text-[11px] text-[#B4B4B0]">{new Date(comment.createdAt).toLocaleString()}</span>
                      {currentUserId === comment.author.id && (
                        <div className="relative ml-auto" onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); }}>
                          <button
                            type="button"
                            className="flex size-6 items-center justify-center rounded-md text-[11px] text-[#B4B4B0] transition hover:bg-[#F7F6F3] hover:text-[#787774]"
                            onClick={(event) => {
                              event.stopPropagation();
                              event.nativeEvent.stopImmediatePropagation();
                              setActiveCommentDropdown(activeCommentDropdown === comment._id ? null : comment._id);
                            }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                          </button>
                          {activeCommentDropdown === comment._id && (
                            <div className="absolute right-0 top-full z-20 mt-1 min-w-[90px] overflow-hidden rounded-lg border border-[#E3E2DE] bg-white py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                              <button
                                type="button"
                                className="block w-full px-3 py-1.5 text-left text-[11px] font-medium text-[#37352F] transition hover:bg-[#F7F6F3]"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleStartEditComment(comment);
                                }}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className="block w-full px-3 py-1.5 text-left text-[11px] font-medium text-[#EB5757] transition hover:bg-[#FEF0F0]"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActiveCommentDropdown(null);
                                  handleDeleteCommentClick(comment._id);
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment._id ? (
                      <div className="my-1.5">
                        <textarea
                          className={cn("w-full rounded-lg border border-[#E3E2DE] bg-[#FBFBFA] px-3 py-2 text-[13px] text-[#37352F] outline-none transition focus:border-[#2F80ED]", fr)}
                          value={editCommentContent}
                          onChange={(event) => setEditCommentContent(event.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="mt-1.5 flex justify-end gap-2">
                          <button type="button" className={cn("rounded-lg bg-[#F7F6F3] px-3 py-1.5 text-[11px] font-medium text-[#787774] transition hover:bg-[#F1F1EF]", fr)} onClick={handleCancelEditComment}>
                            취소
                          </button>
                          <button
                            type="button"
                            className={cn("rounded-lg bg-[#2F80ED] px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-60", fr)}
                            onClick={() => handleSaveEditComment(comment._id)}
                            disabled={isSavingComment}
                          >
                            {isSavingComment ? "저장 중..." : "저장"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-1.5 break-words text-[13px] leading-6 text-[#37352F]">{comment.content}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#9B9A97] transition hover:bg-[#F7F6F3]", comment.likedBy.includes(currentUserId || "") && "text-[#EB5757] hover:bg-[#FEF0F0]")}
                        onClick={() => handleCommentLike(comment._id)}
                      >
                        <i className={comment.likedBy.includes(currentUserId || "") ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true" /> {comment.likes || 0}
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[#9B9A97] transition hover:bg-[#F7F6F3] hover:text-[#2F80ED]"
                        onClick={() => {
                          setReplyingTo(replyingTo === comment._id ? null : comment._id);
                          setReplyContent("");
                        }}
                      >
                        <i className="fa-regular fa-comment" aria-hidden="true" /> 답글
                      </button>
                      {post.type === "질문" && !post.isSolved && currentUserId === post.author.id && currentUserId !== comment.author.id && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[#27AE60] transition hover:bg-[#27AE60]/10"
                          onClick={() => handleAcceptClick(comment._id)}
                        >
                          <i className="fa-solid fa-check" aria-hidden="true" /> 채택
                        </button>
                      )}
                    </div>

                    {replyingTo === comment._id && (
                      <div className="mt-2.5 rounded-lg bg-[#FBFBFA] p-2.5">
                        <textarea
                          className={cn("mb-1.5 w-full rounded-lg border border-[#E3E2DE] bg-white px-3 py-2 text-[12px] text-[#37352F] outline-none transition focus:border-[#2F80ED] placeholder:text-[#C4C4C0]", fr)}
                          placeholder="답글을 작성하세요..."
                          value={replyContent}
                          onChange={(event) => setReplyContent(event.target.value)}
                          rows={2}
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            className="rounded-lg bg-[#F7F6F3] px-2.5 py-1.5 text-[11px] font-medium text-[#787774] transition hover:bg-[#F1F1EF]"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className={cn("rounded-lg bg-[#2F80ED] px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-50", fr)}
                            onClick={() => handleSubmitReply(comment._id)}
                            disabled={!replyContent.trim()}
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {comment.replies.length > 0 && (
                  <div className="ml-[44px] flex flex-col gap-2.5 border-l-2 border-[#F1F1EF] pl-3.5 max-sm:ml-5">
                    {comment.replies.map((reply) => (
                      <div key={reply._id} className="flex gap-2">
                        <Image
                          src={reply.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.id}`}
                          className="size-7 rounded-full border border-[#E3E2DE] object-cover"
                          alt="Replier"
                          width={28}
                          height={28}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="text-[12px] font-semibold text-[#37352F]">{reply.author.name}</span>
                            <span className="text-[10px] text-[#B4B4B0]">{new Date(reply.createdAt).toLocaleString()}</span>
                            {currentUserId === reply.author.id && (
                              <div className="relative ml-auto" onClick={(event) => { event.stopPropagation(); event.nativeEvent.stopImmediatePropagation(); }}>
                                <button
                                  type="button"
                                  className="flex size-5 items-center justify-center rounded text-[10px] text-[#B4B4B0] transition hover:bg-[#F7F6F3] hover:text-[#787774]"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    event.nativeEvent.stopImmediatePropagation();
                                    setActiveCommentDropdown(activeCommentDropdown === reply._id ? null : reply._id);
                                  }}
                                >
                                  <i className="fa-solid fa-ellipsis-vertical" aria-hidden="true" />
                                </button>
                                {activeCommentDropdown === reply._id && (
                                  <div className="absolute right-0 top-full z-20 mt-1 min-w-[90px] overflow-hidden rounded-lg border border-[#E3E2DE] bg-white py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                                    <button
                                      type="button"
                                      className="block w-full px-3 py-1.5 text-left text-[11px] font-medium text-[#37352F] transition hover:bg-[#F7F6F3]"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleStartEditComment(reply);
                                      }}
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      className="block w-full px-3 py-1.5 text-left text-[11px] font-medium text-[#EB5757] transition hover:bg-[#FEF0F0]"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        setActiveCommentDropdown(null);
                                        handleDeleteCommentClick(reply._id);
                                      }}
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {editingCommentId === reply._id ? (
                            <div className="my-1">
                              <textarea
                                className={cn("w-full rounded-lg border border-[#E3E2DE] bg-[#FBFBFA] px-2.5 py-2 text-[12px] text-[#37352F] outline-none transition focus:border-[#2F80ED]", fr)}
                                value={editCommentContent}
                                onChange={(event) => setEditCommentContent(event.target.value)}
                                rows={3}
                                autoFocus
                              />
                              <div className="mt-1 flex justify-end gap-1.5">
                                <button type="button" className="rounded-lg bg-[#F7F6F3] px-2.5 py-1 text-[10px] font-medium text-[#787774] transition hover:bg-[#F1F1EF]" onClick={handleCancelEditComment}>
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className={cn("rounded-lg bg-[#2F80ED] px-2.5 py-1 text-[10px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-60", fr)}
                                  onClick={() => handleSaveEditComment(reply._id)}
                                  disabled={isSavingComment}
                                >
                                  {isSavingComment ? "저장 중..." : "저장"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mb-1 break-words text-[12px] leading-5 text-[#37352F]">{reply.content}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className={cn("inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] text-[#9B9A97] transition hover:bg-[#F7F6F3]", reply.likedBy.includes(currentUserId || "") && "text-[#EB5757] hover:bg-[#FEF0F0]")}
                              onClick={() => handleCommentLike(reply._id)}
                            >
                              <i className={reply.likedBy.includes(currentUserId || "") ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true" /> {reply.likes || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <button type="button" className={cn("mt-4 rounded-lg bg-[#37352F] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#2F2E2B]", fr)} onClick={() => router.back()}>
          목록으로
        </button>
      </main>

      <aside className="sticky top-14 hidden flex-col gap-4 self-start xl:flex">
        <div className="rounded-xl border border-[#E3E2DE] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#37352F]">실시간 인기글</h3>
            <div className="flex gap-0.5 rounded-md bg-[#F7F6F3] p-0.5">
              {(["week", "month"] as TrendingPeriod[]).map((period) => (
                <button
                  key={period}
                  type="button"
                  className={cn("rounded-md px-2.5 py-1 text-[11px] font-medium transition", trendingPeriod === period ? "bg-white text-[#37352F] shadow-sm" : "text-[#9B9A97] hover:text-[#787774]")}
                  onClick={() => setTrendingPeriod(period)}
                >
                  {period === "week" ? "주간" : "월간"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            {trendingPosts.map((trendingPost, index) => (
              <div
                key={trendingPost._id}
                className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg py-2 transition hover:bg-[#F7F6F3]", trendingPost._id === post._id && "bg-[#E8F0FE]")}
                onClick={() => router.push(`/community/${trendingPost._id}`)}
              >
                <span className={cn("flex size-5 shrink-0 items-center justify-center text-[11px] font-bold", index < 3 ? "text-[#EB5757]" : "text-[#B4B4B0]")}>
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#37352F]">{trendingPost.content}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {showPostDeleteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={handleDeleteCancel}>
          <div className="w-full max-w-[380px] rounded-2xl border border-[#E3E2DE] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)]" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-2 text-[18px] font-bold text-[#37352F]">게시글 삭제</h3>
            <p className="text-[14px] text-[#787774]">정말로 이 게시글을 삭제하시겠습니까?</p>
            <p className="mt-1 text-[12px] text-[#EB5757]">삭제된 게시글은 복구할 수 없습니다.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={cn("rounded-lg bg-[#F7F6F3] px-4 py-2 text-[13px] font-medium text-[#37352F] transition hover:bg-[#F1F1EF]", fr)} onClick={handleDeleteCancel}>
                취소
              </button>
              <button
                type="button"
                className={cn("rounded-lg bg-[#EB5757] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#E04040] disabled:cursor-not-allowed disabled:opacity-60", fr)}
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentDeleteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={handleDeleteCommentCancel}>
          <div className="w-full max-w-[380px] rounded-2xl border border-[#E3E2DE] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)]" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-2 text-[18px] font-bold text-[#37352F]">댓글 삭제</h3>
            <p className="text-[14px] text-[#787774]">정말로 이 댓글을 삭제하시겠습니까?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={cn("rounded-lg bg-[#F7F6F3] px-4 py-2 text-[13px] font-medium text-[#37352F] transition hover:bg-[#F1F1EF]", fr)} onClick={handleDeleteCommentCancel}>
                취소
              </button>
              <button
                type="button"
                className={cn("rounded-lg bg-[#EB5757] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#E04040] disabled:cursor-not-allowed disabled:opacity-60", fr)}
                onClick={handleDeleteCommentConfirm}
                disabled={isDeletingComment}
              >
                {isDeletingComment ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAcceptModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={handleAcceptCancel}>
          <div className="w-full max-w-[380px] rounded-2xl border border-[#E3E2DE] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)]" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-2 text-[18px] font-bold text-[#37352F]">답변 채택</h3>
            <p className="text-[14px] text-[#787774]">이 답변을 채택하시겠습니까?</p>
            <p className="mt-1 text-[12px] text-[#EB5757]">채택 후에는 취소할 수 없습니다.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={cn("rounded-lg bg-[#F7F6F3] px-4 py-2 text-[13px] font-medium text-[#37352F] transition hover:bg-[#F1F1EF]", fr)} onClick={handleAcceptCancel}>
                취소
              </button>
              <button
                type="button"
                className={cn("rounded-lg bg-[#27AE60] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#219653] disabled:cursor-not-allowed disabled:opacity-60", fr)}
                onClick={handleAcceptConfirm}
                disabled={isAccepting}
              >
                {isAccepting ? "처리 중..." : "채택하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
