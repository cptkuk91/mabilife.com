"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPost, incrementViewCount, deletePost, updatePost, toggleLike, getTrendingPosts, TrendingPeriod } from "@/actions/post";
import { getComments, createComment, deleteComment, updateComment, toggleCommentLike, acceptComment } from "@/actions/comment";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const pageClass =
  "mx-auto grid max-w-[var(--max-width)] grid-cols-1 gap-6 px-4 pb-24 pt-20 md:px-5 xl:grid-cols-[minmax(0,1fr)_340px]";
const cardClass = "rounded-[24px] bg-white p-5 shadow-elev-card";
const menuButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-[10px] text-app-body transition hover:bg-app-bg hover:text-app-title";
const dropdownClass =
  "absolute right-0 top-full z-20 mt-2 min-w-[108px] overflow-hidden rounded-[14px] border border-black/8 bg-white py-1 shadow-elev-hover";
const dropdownItemClass =
  "block w-full px-4 py-2.5 text-left text-sm font-medium text-app-title transition hover:bg-app-bg";
const dangerDropdownItemClass = "text-[#FF3B30] hover:bg-[#FFF0F0]";
const actionButtonClass =
  "inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[13px] text-app-body transition hover:bg-[#FFF0F0] hover:text-[#FF3B30]";
const likedActionButtonClass = "text-[#FF3B30]";
const commentButtonClass =
  "inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[12px] text-app-body transition hover:bg-black/[0.04]";
const modalOverlayClass = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm";
const modalCardClass = "w-full max-w-[400px] rounded-[24px] bg-white p-7 shadow-elev-hover";
const modalActionsClass = "mt-6 flex justify-end gap-3";
const modalSecondaryButtonClass =
  "rounded-[12px] bg-app-bg px-5 py-2.5 text-sm font-semibold text-app-title transition hover:bg-black/[0.08]";
const modalDangerButtonClass =
  "rounded-[12px] bg-[#FF3B30] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E02B21] disabled:cursor-not-allowed disabled:opacity-60";
const modalAcceptButtonClass =
  "rounded-[12px] bg-[#34C759] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2DB94D] disabled:cursor-not-allowed disabled:opacity-60";
const highlightClass = "rounded-[6px] bg-[#EAF4FF] px-1.5 py-0.5 font-semibold text-app-accent";

const getPostBadgeClass = (type: string, isSolved?: boolean) =>
  cn(
    "ml-auto inline-flex shrink-0 items-center gap-1 rounded-[8px] px-2.5 py-1 text-[11px] font-bold",
    type === "질문"
      ? isSolved
        ? "bg-[#E8FAEB] text-[#34C759]"
        : "bg-[#FFF4E5] text-[#FF9500]"
      : type === "정보"
        ? "bg-[#E8F5FD] text-app-accent"
        : "bg-[#F0F3F4] text-app-body",
  );

const getPostBadgeText = (type: string, isSolved?: boolean) =>
  type === "질문" ? (isSolved ? "해결됨" : "답변 대기중") : type;

export default function PostDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>("week");
  const [comments, setComments] = useState<any[]>([]);
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

  useEffect(() => {
    const init = async () => {
      await incrementViewCount(id);
      await loadPost();
      await loadComments();
    };

    init();
    loadTrendingPosts();

    const handleClickOutside = () => {
      setShowDropdown(false);
      setActiveCommentDropdown(null);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [id]);

  useEffect(() => {
    loadTrendingPosts();
  }, [trendingPeriod]);

  const loadTrendingPosts = async () => {
    const result = await getTrendingPosts(trendingPeriod, 5);
    if (result.success) {
      setTrendingPosts(result.posts);
    }
  };

  const loadComments = async () => {
    const result = await getComments(id);
    if (result.success) {
      setComments(result.comments);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setIsSubmittingComment(true);
    const result = await createComment(id, newComment);

    if (result.success) {
      setNewComment("");
      await loadComments();
      setPost({ ...post, commentCount: (post.commentCount || 0) + 1 });
    } else {
      alert(result.error || "댓글 작성에 실패했습니다.");
    }
    setIsSubmittingComment(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await createComment(id, replyContent, parentId);

    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
      await loadComments();
      setPost({ ...post, commentCount: (post.commentCount || 0) + 1 });
    } else {
      alert(result.error || "답글 작성에 실패했습니다.");
    }
  };

  const handleDeleteCommentClick = (commentId: string) => {
    setDeleteCommentTargetId(commentId);
    setShowCommentDeleteModal(true);
  };

  const handleDeleteCommentConfirm = async () => {
    if (!deleteCommentTargetId) return;

    setIsDeletingComment(true);
    const result = await deleteComment(deleteCommentTargetId, id);

    if (result.success) {
      await loadComments();
      const deletedCount = result.deletedCount || 1;
      setPost({ ...post, commentCount: Math.max((post.commentCount || deletedCount) - deletedCount, 0) });
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
    if (!acceptTargetId) return;

    setIsAccepting(true);
    const result = await acceptComment(acceptTargetId, id);

    if (result.success) {
      setPost({ ...post, isSolved: true, acceptedCommentId: acceptTargetId });
      setComments(
        comments.map((comment) =>
          comment._id === acceptTargetId
            ? { ...comment, isAccepted: true }
            : comment,
        ),
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

  const handleStartEditComment = (comment: any) => {
    setEditingCommentId(comment._id);
    setEditCommentContent(comment.content);
    setActiveCommentDropdown(null);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent("");
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editCommentContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSavingComment(true);

    const result = await updateComment(commentId, id, editCommentContent);

    if (result.success) {
      const updateCommentContent = (items: any[]): any[] =>
        items.map((comment) => {
          if (comment._id === commentId) {
            return { ...comment, content: editCommentContent };
          }
          if (comment.replies?.length > 0) {
            return { ...comment, replies: updateCommentContent(comment.replies) };
          }
          return comment;
        });

      setComments(updateCommentContent(comments));
      setEditingCommentId(null);
      setEditCommentContent("");
    } else {
      alert(result.error || "수정에 실패했습니다.");
    }

    setIsSavingComment(false);
  };

  const handleCommentLike = async (commentId: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await toggleCommentLike(commentId);

    if (result.success) {
      const updateCommentLike = (items: any[]): any[] =>
        items.map((comment) => {
          if (comment._id === commentId) {
            const userId = (session.user as any).id;
            const isLiked = comment.likedBy?.includes(userId);
            return {
              ...comment,
              likes: isLiked ? comment.likes - 1 : comment.likes + 1,
              likedBy: isLiked
                ? comment.likedBy.filter((uid: string) => uid !== userId)
                : [...(comment.likedBy || []), userId],
            };
          }
          if (comment.replies?.length > 0) {
            return { ...comment, replies: updateCommentLike(comment.replies) };
          }
          return comment;
        });

      setComments(updateCommentLike(comments));
    }
  };

  const loadPost = async () => {
    const result = await getPost(id);
    if (result.success && result.post) {
      setPost(result.post);
      setEditContent(result.post.content);
    } else {
      alert(result.error);
      router.push("/community");
    }
    setLoading(false);
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
    } else {
      alert(result.error || "삭제에 실패했습니다.");
      setIsDeleting(false);
    }
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
    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    const result = await updatePost(id, editContent);

    if (result.success) {
      setPost({ ...post, content: editContent });
      setIsEditing(false);
    } else {
      alert(result.error || "수정에 실패했습니다.");
    }
    setIsSaving(false);
  };

  const handleLike = async () => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await toggleLike(id);

    if (result.success) {
      const userId = (session.user as any).id;
      const isCurrentlyLiked = post.likedBy?.includes(userId);
      setPost({
        ...post,
        likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1,
        likedBy: isCurrentlyLiked
          ? post.likedBy.filter((uid: string) => uid !== userId)
          : [...(post.likedBy || []), userId],
      });
    } else {
      alert(result.error || "좋아요 처리에 실패했습니다.");
    }
  };

  const renderContentWithHashtags = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIndex) => {
      const parts = line.split(/((?:^|\s)#[^\s#]+)/g);
      return (
        <div key={lineIndex} className="min-h-[1.5em]">
          {parts.map((part, index) => {
            if (part.trim().startsWith("#")) {
              return (
                <span key={index} className={highlightClass}>
                  {part}
                </span>
              );
            }
            return <span key={index}>{part}</span>;
          })}
          {line === "" && <br />}
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[var(--max-width)] px-4 pb-24 pt-24 md:px-5">
        <div className="flex min-h-[40vh] items-center justify-center rounded-[24px] bg-white text-app-body shadow-elev-card">
          Loading...
        </div>
      </div>
    );
  }

  if (!post) return null;

  const currentUserId = (session?.user as any)?.id;

  return (
    <div className={pageClass}>
      <main className="min-w-0">
        <article className={cardClass}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="mb-0 flex flex-1 items-start justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <Image
                  src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`}
                  className="h-10 w-10 rounded-full bg-black/10 object-cover"
                  alt="User Avatar"
                  width={40}
                  height={40}
                />
                <div className="min-w-0 flex flex-col">
                  <span className="truncate text-[14px] font-bold text-app-title">{post.author.name}</span>
                  <span className="text-[12px] text-app-body">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className={getPostBadgeClass(post.type, post.isSolved)}>{getPostBadgeText(post.type, post.isSolved)}</div>
            </div>

            {currentUserId === post.author.id && (
              <div
                className="relative ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                <button
                  type="button"
                  className={menuButtonClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>

                {showDropdown && (
                  <div className={dropdownClass}>
                    <button
                      type="button"
                      className={dropdownItemClass}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleEdit();
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className={cn(dropdownItemClass, dangerDropdownItemClass)}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
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

          <div className="min-h-[200px] whitespace-pre-wrap break-words text-[16px] leading-6 text-app-title">
            {isEditing ? (
              <div className="rounded-[16px] p-2">
                <textarea
                  className="mb-3 min-h-[200px] w-full rounded-[12px] border border-black/10 bg-white px-4 py-4 text-[16px] leading-6 text-app-title outline-none transition focus:border-app-accent"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-[10px] border border-black/10 bg-app-bg px-4 py-2 text-sm font-medium text-app-body transition hover:bg-black/[0.08]"
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
                    className="rounded-[10px] bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-60"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              renderContentWithHashtags(post.content)
            )}
          </div>

          {post.images &&
            post.images.map((url: string, index: number) => (
              <Image
                key={index}
                src={url}
                alt={`Post Image ${index + 1}`}
                className="mb-3 h-auto w-full rounded-[16px] border border-black/8 object-cover"
                width={0}
                height={0}
                sizes="100vw"
                style={{ width: "100%", height: "auto" }}
              />
            ))}

          <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-app-body">
            <span className="inline-flex items-center gap-1.5">
              <i className="fa-regular fa-comment"></i>
              {post.commentCount || 0}
            </span>
            <button
              type="button"
              className={cn(actionButtonClass, post.likedBy?.includes(currentUserId) && likedActionButtonClass)}
              onClick={handleLike}
            >
              <i className={post.likedBy?.includes(currentUserId) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
              <span>{post.likes || 0}</span>
            </button>
            <span className="inline-flex items-center gap-1.5">
              <i className="fa-regular fa-eye"></i>
              {post.viewCount || 0}
            </span>
          </div>
        </article>

        <section className="mt-4 rounded-[24px] bg-white p-6 shadow-elev-card">
          <h3 className="mb-5 flex items-center gap-2 text-[18px] font-bold text-app-title">
            댓글 <span className="text-[16px] text-app-accent">{post.commentCount || 0}</span>
          </h3>

          <div className="mb-6 flex gap-3 border-b border-black/8 pb-6 max-sm:flex-col">
            <Image
              src={session?.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous"}
              className="h-10 w-10 rounded-full bg-black/10 object-cover"
              alt="Your Avatar"
              width={40}
              height={40}
            />
            <div className="flex flex-1 flex-col gap-3">
              <textarea
                className="w-full rounded-[12px] border border-black/10 px-3 py-3 text-[14px] text-app-title outline-none transition focus:border-app-accent disabled:cursor-not-allowed disabled:bg-app-bg disabled:text-app-body"
                placeholder={session?.user ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!session?.user}
                rows={3}
              />
              <button
                type="button"
                className="self-end rounded-[10px] bg-app-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleSubmitComment}
                disabled={!session?.user || isSubmittingComment || !newComment.trim()}
              >
                {isSubmittingComment ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className={cn(
                  "flex flex-col gap-3",
                  comment.isAccepted && "rounded-[18px] border border-[#34C759]/20 bg-[#34C759]/5 p-4",
                )}
              >
                {comment.isAccepted && (
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-[#34C759] px-3 py-1 text-[12px] font-semibold text-white">
                    <i className="fa-solid fa-check-circle"></i>
                    채택된 답변
                  </div>
                )}

                <div className="flex gap-3">
                  <Image
                    src={comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                    className="h-10 w-10 rounded-full bg-black/10 object-cover"
                    alt="Commenter"
                    width={40}
                    height={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[14px] font-semibold text-app-title">{comment.author.name}</span>
                      <span className="text-[12px] text-app-body">{new Date(comment.createdAt).toLocaleString()}</span>

                      {currentUserId === comment.author.id && (
                        <div
                          className="relative ml-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                          }}
                        >
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] text-app-body transition hover:bg-black/[0.04] hover:text-app-title"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              setActiveCommentDropdown(activeCommentDropdown === comment._id ? null : comment._id);
                            }}
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>

                          {activeCommentDropdown === comment._id && (
                            <div className={dropdownClass}>
                              <button
                                type="button"
                                className={dropdownItemClass}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditComment(comment);
                                }}
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                className={cn(dropdownItemClass, dangerDropdownItemClass)}
                                onClick={(e) => {
                                  e.stopPropagation();
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
                      <div className="my-2">
                        <textarea
                          className="w-full rounded-[12px] border border-black/10 bg-app-bg px-3 py-2.5 text-sm text-app-title outline-none transition focus:border-app-accent"
                          value={editCommentContent}
                          onChange={(e) => setEditCommentContent(e.target.value)}
                          rows={3}
                          autoFocus
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-[10px] border border-black/10 bg-app-bg px-4 py-2 text-sm font-medium text-app-body transition hover:bg-black/[0.08]"
                            onClick={handleCancelEditComment}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className="rounded-[10px] bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => handleSaveEditComment(comment._id)}
                            disabled={isSavingComment}
                          >
                            {isSavingComment ? "저장 중..." : "저장"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mb-2 break-words text-[14px] leading-6 text-app-title">{comment.content}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className={cn(
                          commentButtonClass,
                          comment.likedBy?.includes(currentUserId) && "text-[#FF3B30] hover:bg-[#FFF0F0] hover:text-[#FF3B30]",
                        )}
                        onClick={() => handleCommentLike(comment._id)}
                      >
                        <i className={comment.likedBy?.includes(currentUserId) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                        <span>{comment.likes || 0}</span>
                      </button>
                      <button
                        type="button"
                        className={cn(commentButtonClass, "hover:text-app-accent")}
                        onClick={() => {
                          setReplyingTo(replyingTo === comment._id ? null : comment._id);
                          setReplyContent("");
                        }}
                      >
                        <i className="fa-regular fa-comment"></i>
                        답글
                      </button>
                      {post.type === "질문" &&
                        !post.isSolved &&
                        currentUserId === post.author.id &&
                        currentUserId !== comment.author.id && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[12px] font-semibold text-[#34C759] transition hover:bg-[#34C759]/10"
                            onClick={() => handleAcceptClick(comment._id)}
                          >
                            <i className="fa-solid fa-check"></i>
                            채택
                          </button>
                        )}
                    </div>

                    {replyingTo === comment._id && (
                      <div className="mt-3 rounded-[14px] bg-app-bg p-3">
                        <textarea
                          className="mb-2 w-full rounded-[10px] border border-black/10 bg-white px-3 py-2.5 text-[13px] text-app-title outline-none transition focus:border-app-accent"
                          placeholder="답글을 작성하세요..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[13px] font-medium text-app-body transition hover:bg-app-bg"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent("");
                            }}
                          >
                            취소
                          </button>
                          <button
                            type="button"
                            className="rounded-[10px] bg-app-accent px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-50"
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

                {comment.replies?.length > 0 && (
                  <div className="ml-[52px] flex flex-col gap-3 border-l-2 border-black/8 pl-4 max-sm:ml-6">
                    {comment.replies.map((reply: any) => (
                      <div key={reply._id} className="flex gap-2.5">
                        <Image
                          src={reply.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.id}`}
                          className="h-8 w-8 rounded-full bg-black/10 object-cover"
                          alt="Replier"
                          width={32}
                          height={32}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[14px] font-semibold text-app-title">{reply.author.name}</span>
                            <span className="text-[12px] text-app-body">{new Date(reply.createdAt).toLocaleString()}</span>

                            {currentUserId === reply.author.id && (
                              <div
                                className="relative ml-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.nativeEvent.stopImmediatePropagation();
                                }}
                              >
                                <button
                                  type="button"
                                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] text-app-body transition hover:bg-black/[0.04] hover:text-app-title"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                    setActiveCommentDropdown(activeCommentDropdown === reply._id ? null : reply._id);
                                  }}
                                >
                                  <i className="fa-solid fa-ellipsis-vertical"></i>
                                </button>

                                {activeCommentDropdown === reply._id && (
                                  <div className={dropdownClass}>
                                    <button
                                      type="button"
                                      className={dropdownItemClass}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditComment(reply);
                                      }}
                                    >
                                      수정
                                    </button>
                                    <button
                                      type="button"
                                      className={cn(dropdownItemClass, dangerDropdownItemClass)}
                                      onClick={(e) => {
                                        e.stopPropagation();
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
                            <div className="my-2">
                              <textarea
                                className="w-full rounded-[12px] border border-black/10 bg-app-bg px-3 py-2.5 text-sm text-app-title outline-none transition focus:border-app-accent"
                                value={editCommentContent}
                                onChange={(e) => setEditCommentContent(e.target.value)}
                                rows={3}
                                autoFocus
                              />
                              <div className="mt-2 flex justify-end gap-2">
                                <button
                                  type="button"
                                  className="rounded-[10px] border border-black/10 bg-app-bg px-4 py-2 text-sm font-medium text-app-body transition hover:bg-black/[0.08]"
                                  onClick={handleCancelEditComment}
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  className="rounded-[10px] bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-60"
                                  onClick={() => handleSaveEditComment(reply._id)}
                                  disabled={isSavingComment}
                                >
                                  {isSavingComment ? "저장 중..." : "저장"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="mb-2 break-words text-[14px] leading-6 text-app-title">{reply.content}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className={cn(
                                commentButtonClass,
                                reply.likedBy?.includes(currentUserId) && "text-[#FF3B30] hover:bg-[#FFF0F0] hover:text-[#FF3B30]",
                              )}
                              onClick={() => handleCommentLike(reply._id)}
                            >
                              <i className={reply.likedBy?.includes(currentUserId) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                              <span>{reply.likes || 0}</span>
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

        <button
          type="button"
          className="mt-5 rounded-full bg-app-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0062CC]"
          onClick={() => router.back()}
        >
          목록으로
        </button>
      </main>

      <aside className="sticky top-20 hidden flex-col gap-5 xl:flex">
        <div className={cardClass}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-[16px] font-extrabold text-app-title">실시간 인기글</div>
            <div className="flex items-center gap-1 rounded-[10px] bg-app-bg p-1">
              <button
                type="button"
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-[12px] font-semibold text-app-body transition",
                  trendingPeriod === "week" && "bg-white text-app-title shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
                )}
                onClick={() => setTrendingPeriod("week")}
              >
                주간
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-[8px] px-3 py-1.5 text-[12px] font-semibold text-app-body transition",
                  trendingPeriod === "month" && "bg-white text-app-title shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
                )}
                onClick={() => setTrendingPeriod("month")}
              >
                월간
              </button>
            </div>
          </div>

          <div className="flex flex-col">
            {trendingPosts.map((trendingPost, index) => (
              <div
                key={trendingPost._id}
                className={cn(
                  "mx-[-8px] flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 transition hover:bg-app-bg",
                  trendingPost._id === post._id && "bg-[#0071E3]/8",
                )}
                onClick={() => router.push(`/community/${trendingPost._id}`)}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center text-[12px] font-bold text-app-accent",
                    index < 3 && "text-[#FF3B30]",
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="overflow-hidden text-[14px] font-semibold text-app-title [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">
                    {trendingPost.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {showPostDeleteModal && (
        <div className={modalOverlayClass} onClick={handleDeleteCancel}>
          <div className={modalCardClass} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[20px] font-bold text-app-title">게시글 삭제</h3>
            <p className="text-[15px] text-app-body">정말로 이 게시글을 삭제하시겠습니까?</p>
            <p className="mt-2 text-[13px] text-[#FF3B30]">삭제된 게시글은 복구할 수 없습니다.</p>
            <div className={modalActionsClass}>
              <button type="button" className={modalSecondaryButtonClass} onClick={handleDeleteCancel}>
                취소
              </button>
              <button
                type="button"
                className={modalDangerButtonClass}
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
        <div className={modalOverlayClass} onClick={handleDeleteCommentCancel}>
          <div className={modalCardClass} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[20px] font-bold text-app-title">댓글 삭제</h3>
            <p className="text-[15px] text-app-body">정말로 이 댓글을 삭제하시겠습니까?</p>
            <div className={modalActionsClass}>
              <button type="button" className={modalSecondaryButtonClass} onClick={handleDeleteCommentCancel}>
                취소
              </button>
              <button
                type="button"
                className={modalDangerButtonClass}
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
        <div className={modalOverlayClass} onClick={handleAcceptCancel}>
          <div className={modalCardClass} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[20px] font-bold text-app-title">답변 채택</h3>
            <p className="text-[15px] text-app-body">이 답변을 채택하시겠습니까?</p>
            <p className="mt-2 text-[13px] text-[#FF3B30]">채택 후에는 취소할 수 없습니다.</p>
            <div className={modalActionsClass}>
              <button type="button" className={modalSecondaryButtonClass} onClick={handleAcceptCancel}>
                취소
              </button>
              <button
                type="button"
                className={modalAcceptButtonClass}
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
