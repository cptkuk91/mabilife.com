"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getGuideById, toggleGuideLike, toggleGuideBookmark, deleteGuide } from "@/actions/guide";
import {
  getGuideComments,
  createGuideComment,
  updateGuideComment,
  deleteGuideComment,
  toggleGuideCommentLike,
} from "@/actions/guideComment";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const pageClass = "mx-auto max-w-[800px] px-4 pb-24 pt-20 md:px-5";
const stateClass = "flex min-h-[50vh] items-center justify-center rounded-[28px] bg-white px-6 py-16 text-center text-base text-app-body shadow-elev-card";
const categoryBadgeClass = "inline-flex rounded-full bg-[#EAF4FF] px-3 py-1.5 text-[13px] font-semibold text-app-accent";
const kebabButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-[12px] text-[15px] text-app-body transition hover:bg-black/[0.04] hover:text-app-title";
const dropdownClass =
  "absolute right-0 top-full z-20 mt-2 min-w-[132px] overflow-hidden rounded-[16px] border border-black/8 bg-white py-1 shadow-elev-hover";
const dropdownItemClass =
  "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-app-title transition hover:bg-app-bg";
const dropdownDangerClass = "text-[#FF3B30] hover:bg-[#FFF0F0]";
const actionButtonClass =
  "inline-flex items-center gap-2 rounded-[12px] bg-black/[0.04] px-4 py-2.5 text-sm font-semibold text-app-body transition hover:bg-black/[0.08] hover:text-app-title";
const commentCardClass =
  "rounded-[18px] border border-black/8 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]";
const commentActionButtonClass =
  "inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-[12px] font-medium text-app-body transition hover:bg-black/[0.04] hover:text-app-title";
const modalOverlayClass = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm";
const modalClass = "w-full max-w-[400px] rounded-[24px] bg-white p-7 shadow-elev-hover";
const modalActionsClass = "mt-6 flex justify-end gap-3";
const modalSecondaryButtonClass =
  "rounded-[12px] bg-app-bg px-5 py-2.5 text-sm font-semibold text-app-title transition hover:bg-black/[0.08]";
const modalDangerButtonClass =
  "rounded-[12px] bg-[#FF3B30] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E02B21] disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClass =
  "rounded-[12px] bg-app-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-60";

export default function TipDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showGuideDropdown, setShowGuideDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [activeCommentDropdown, setActiveCommentDropdown] = useState<string | null>(null);
  const [showCommentDeleteModal, setShowCommentDeleteModal] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  useEffect(() => {
    loadGuide();
  }, [id]);

  useEffect(() => {
    if (guide?._id) {
      loadComments();
    }
  }, [guide]);

  useEffect(() => {
    if (guide && session?.user) {
      const userId = (session.user as any).id;
      setIsLiked(guide.likedBy?.includes(userId) || false);
      setIsBookmarked(guide.bookmarkedBy?.includes(userId) || false);
    }

    if (guide?.slug && id !== guide.slug) {
      window.history.replaceState(null, "", `/guide/${guide.slug}`);
    }
  }, [session, guide, id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-guide-kebab]") && !target.closest("[data-comment-kebab]")) {
        setShowGuideDropdown(false);
        setActiveCommentDropdown(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const loadGuide = async () => {
    setLoading(true);
    const result = await getGuideById(id);

    if (result.success && result.data) {
      const guideData = result.data as any;
      setGuide(guideData);
      setLikeCount(guideData.likes || 0);
    }

    setLoading(false);
  };

  const loadComments = async () => {
    if (!guide?._id) return;
    const result = await getGuideComments(guide._id);
    if (result.success && result.data) {
      setComments(result.data);
    }
  };

  const toggleLike = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!guide?._id) return;

    const result = await toggleGuideLike(guide._id);
    if (result.success) {
      setLikeCount((prev) => prev + (isLiked ? -1 : 1));
      setIsLiked(!isLiked);
    }
  };

  const toggleBookmark = async () => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!guide?._id) return;

    const result = await toggleGuideBookmark(guide._id);
    if (result.success) {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleEditGuide = () => {
    if (!guide?._id) return;
    router.push(`/guide/write?edit=${guide._id}`);
  };

  const handleDeleteGuide = async () => {
    if (!guide?._id) return;

    setIsDeleting(true);
    const result = await deleteGuide(guide._id);
    if (result.success) {
      router.push("/guide");
    } else {
      alert(result.error || "삭제에 실패했습니다.");
    }
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const handleSubmitComment = async () => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!newComment.trim() || !guide?._id) return;

    setIsSubmitting(true);
    const result = await createGuideComment(guide._id, newComment.trim());
    if (result.success) {
      setNewComment("");
      loadComments();
    }
    setIsSubmitting(false);
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!replyContent.trim() || !guide?._id) return;

    setIsSubmitting(true);
    const result = await createGuideComment(guide._id, replyContent.trim(), parentId);
    if (result.success) {
      setReplyContent("");
      setReplyingTo(null);
      loadComments();
    }
    setIsSubmitting(false);
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
    if (!editCommentContent.trim() || !guide?._id) return;

    const result = await updateGuideComment(commentId, guide._id, editCommentContent.trim());
    if (result.success) {
      setEditingCommentId(null);
      setEditCommentContent("");
      loadComments();
    } else {
      alert(result.error || "수정에 실패했습니다.");
    }
  };

  const handleDeleteCommentClick = (commentId: string) => {
    setDeletingCommentId(commentId);
    setShowCommentDeleteModal(true);
    setActiveCommentDropdown(null);
  };

  const handleConfirmDeleteComment = async () => {
    if (!deletingCommentId || !guide?._id) return;

    setIsDeletingComment(true);
    const result = await deleteGuideComment(deletingCommentId, guide._id);
    if (result.success) {
      loadComments();
    } else {
      alert(result.error || "삭제에 실패했습니다.");
    }
    setIsDeletingComment(false);
    setShowCommentDeleteModal(false);
    setDeletingCommentId(null);
  };

  const handleToggleCommentLike = async (commentId: string) => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!guide?._id) return;

    const result = await toggleGuideCommentLike(commentId, guide._id);
    if (result.success) {
      loadComments();
    }
  };

  const parentComments = comments.filter((comment) => !comment.parentId);
  const getReplies = (parentId: string) => comments.filter((comment) => comment.parentId === parentId);
  const isAuthor = session?.user && guide?.author?.id === (session.user as any).id;

  if (loading) {
    return (
      <div className={pageClass}>
        <div className={stateClass}>로딩 중...</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className={pageClass}>
        <div className={stateClass}>공략을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <header className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className={categoryBadgeClass}>{guide.category}</div>
          {isAuthor && (
            <div className="relative" data-guide-kebab>
              <button
                type="button"
                className={kebabButtonClass}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGuideDropdown(!showGuideDropdown);
                }}
                aria-label="공략 메뉴"
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>
              {showGuideDropdown && (
                <div className={dropdownClass}>
                  <button type="button" className={dropdownItemClass} onClick={handleEditGuide}>
                    <i className="fa-solid fa-pen text-[12px]"></i>
                    수정
                  </button>
                  <button
                    type="button"
                    className={cn(dropdownItemClass, dropdownDangerClass)}
                    onClick={() => {
                      setShowGuideDropdown(false);
                      setShowDeleteModal(true);
                    }}
                  >
                    <i className="fa-solid fa-trash text-[12px]"></i>
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <h1 className="mt-4 text-[30px] font-extrabold leading-[1.25] tracking-[-0.04em] text-app-title md:text-[36px]">
          {guide.title}
        </h1>

        <div className="mt-5 flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id}`}
              alt="Author"
              className="h-10 w-10 rounded-full bg-black/5 object-cover"
            />
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-app-title">{guide.author?.name || "익명"}</span>
              <span className="text-[13px] text-app-body">
                {new Date(guide.createdAt).toLocaleString()}
                {guide.updatedAt !== guide.createdAt && <span className="text-[12px] text-app-body/80"> · 수정됨</span>}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={cn(
                actionButtonClass,
                isLiked && "bg-[#FFF0F5] text-[#FF2D55] hover:bg-[#FFF0F5] hover:text-[#FF2D55]",
              )}
              onClick={toggleLike}
            >
              <i className={`fa-${isLiked ? "solid" : "regular"} fa-heart`}></i>
              {likeCount}
            </button>
            <button
              type="button"
              className={cn(
                actionButtonClass,
                isBookmarked && "bg-[#FFF8E1] text-[#FF9500] hover:bg-[#FFF8E1] hover:text-[#FF9500]",
              )}
              onClick={toggleBookmark}
            >
              <i className={`fa-${isBookmarked ? "solid" : "regular"} fa-bookmark`}></i>
              북마크
            </button>
            <span className="inline-flex items-center gap-2 text-sm text-app-body">
              <i className="fa-regular fa-eye"></i>
              {guide.views || 0}
            </span>
          </div>
        </div>
      </header>

      {guide.thumbnail && (
        <div className="mb-8 overflow-hidden rounded-[20px]">
          <img src={guide.thumbnail} alt="썸네일" className="h-auto max-h-[400px] w-full object-cover" />
        </div>
      )}

      <div
        className="min-h-[300px] text-[16px] leading-8 text-app-title md:text-[17px] [&_h1]:mb-5 [&_h1]:mt-8 [&_h1]:text-[28px] [&_h1]:font-bold [&_h2]:mb-4 [&_h2]:mt-7 [&_h2]:text-[24px] [&_h2]:font-bold [&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-[20px] [&_h3]:font-bold [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-[16px] [&_li]:mb-2 [&_li]:pl-1 [&_ol]:my-4 [&_ol]:ml-6 [&_ol]:list-decimal [&_p]:mb-5 [&_ul]:my-4 [&_ul]:ml-6 [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: guide.content }}
      ></div>

      <section className="mt-14 rounded-[24px] bg-[#F5F5F7] p-5 md:p-7">
        <h3 className="mb-5 text-[20px] font-bold text-app-title">댓글 {comments.length}개</h3>

        <div className="mb-6 flex flex-col gap-3 rounded-[18px] border border-black/8 bg-white p-3 sm:flex-row">
          <input
            type="text"
            className="min-w-0 flex-1 rounded-[12px] border-none bg-transparent px-3 py-2.5 text-[15px] text-app-title outline-none placeholder:text-app-body"
            placeholder={session?.user ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            disabled={!session?.user || isSubmitting}
          />
          <button
            type="button"
            className={primaryButtonClass}
            onClick={handleSubmitComment}
            disabled={!session?.user || isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "..." : "등록"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {parentComments.length === 0 ? (
            <div className="rounded-[18px] border border-dashed border-black/8 bg-white/70 px-4 py-10 text-center text-sm text-app-body">
              아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
            </div>
          ) : (
            parentComments.map((comment) => {
              const replies = getReplies(comment._id);
              const isCommentAuthor = session?.user && comment.author.id === (session.user as any).id;
              const hasLiked = session?.user && comment.likedBy?.includes((session.user as any).id);

              return (
                <div key={comment._id} className="pb-1">
                  <div className="flex gap-3">
                    <img
                      src={comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full bg-black/5 object-cover"
                    />
                    <div className={cn(commentCardClass, "flex-1")}>
                      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[13px] font-semibold text-app-title">{comment.author.name}</span>
                        <span className="text-[12px] text-app-body">
                          {new Date(comment.createdAt).toLocaleString()}
                          {comment.updatedAt !== comment.createdAt && " · 수정됨"}
                        </span>
                        {isCommentAuthor && (
                          <div className="relative ml-auto" data-comment-kebab>
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] text-app-body transition hover:bg-black/[0.04] hover:text-app-title"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentDropdown(activeCommentDropdown === comment._id ? null : comment._id);
                              }}
                              aria-label="댓글 메뉴"
                            >
                              <i className="fa-solid fa-ellipsis"></i>
                            </button>
                            {activeCommentDropdown === comment._id && (
                              <div className="absolute right-0 top-full z-20 mt-2 min-w-[108px] overflow-hidden rounded-[12px] border border-black/8 bg-white py-1 shadow-elev-hover">
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-app-title transition hover:bg-app-bg"
                                  onClick={() => handleStartEditComment(comment)}
                                >
                                  <i className="fa-solid fa-pen text-[11px]"></i>
                                  수정
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#FF3B30] transition hover:bg-[#FFF0F0]"
                                  onClick={() => handleDeleteCommentClick(comment._id)}
                                >
                                  <i className="fa-solid fa-trash text-[11px]"></i>
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {editingCommentId === comment._id ? (
                        <div className="mt-2">
                          <textarea
                            className="min-h-[80px] w-full rounded-[12px] border border-black/10 px-3 py-2.5 text-sm text-app-title outline-none transition focus:border-app-accent"
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              type="button"
                              className="rounded-[10px] bg-app-bg px-4 py-2 text-[13px] font-semibold text-app-title transition hover:bg-black/[0.08]"
                              onClick={handleCancelEditComment}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="rounded-[10px] bg-app-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0062CC]"
                              onClick={() => handleSaveEditComment(comment._id)}
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[15px] leading-6 text-app-title">{comment.content}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={cn(
                            commentActionButtonClass,
                            hasLiked && "text-[#FF2D55] hover:bg-[#FFF0F5] hover:text-[#FF2D55]",
                          )}
                          onClick={() => handleToggleCommentLike(comment._id)}
                        >
                          <i className={`fa-${hasLiked ? "solid" : "regular"} fa-heart`}></i>
                          {comment.likes || 0}
                        </button>
                        <button
                          type="button"
                          className={commentActionButtonClass}
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        >
                          <i className="fa-solid fa-reply"></i>
                          답글
                        </button>
                      </div>
                    </div>
                  </div>

                  {replyingTo === comment._id && (
                    <div className="ml-12 mt-3 flex flex-wrap gap-2 max-sm:ml-6">
                      <input
                        type="text"
                        className="min-w-0 flex-1 rounded-[12px] border border-black/10 bg-white px-4 py-2.5 text-sm text-app-title outline-none transition focus:border-app-accent"
                        placeholder="답글을 입력하세요..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitReply(comment._id)}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="rounded-[10px] bg-app-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handleSubmitReply(comment._id)}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        등록
                      </button>
                      <button
                        type="button"
                        className="rounded-[10px] bg-app-bg px-4 py-2 text-[13px] font-semibold text-app-title transition hover:bg-black/[0.08]"
                        onClick={() => setReplyingTo(null)}
                      >
                        취소
                      </button>
                    </div>
                  )}

                  {replies.length > 0 && (
                    <div className="ml-12 mt-3 flex flex-col gap-3 max-sm:ml-6">
                      {replies.map((reply) => {
                        const isReplyAuthor = session?.user && reply.author.id === (session.user as any).id;
                        const hasLikedReply = session?.user && reply.likedBy?.includes((session.user as any).id);

                        return (
                          <div key={reply._id} className="flex gap-3">
                            <img
                              src={reply.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.id}`}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-full bg-black/5 object-cover"
                            />
                            <div className={cn(commentCardClass, "flex-1")}>
                              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-[13px] font-semibold text-app-title">{reply.author.name}</span>
                                <span className="text-[12px] text-app-body">
                                  {new Date(reply.createdAt).toLocaleString()}
                                  {reply.updatedAt !== reply.createdAt && " · 수정됨"}
                                </span>
                                {isReplyAuthor && (
                                  <div className="relative ml-auto" data-comment-kebab>
                                    <button
                                      type="button"
                                      className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] text-app-body transition hover:bg-black/[0.04] hover:text-app-title"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCommentDropdown(activeCommentDropdown === reply._id ? null : reply._id);
                                      }}
                                      aria-label="답글 메뉴"
                                    >
                                      <i className="fa-solid fa-ellipsis"></i>
                                    </button>
                                    {activeCommentDropdown === reply._id && (
                                      <div className="absolute right-0 top-full z-20 mt-2 min-w-[108px] overflow-hidden rounded-[12px] border border-black/8 bg-white py-1 shadow-elev-hover">
                                        <button
                                          type="button"
                                          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-app-title transition hover:bg-app-bg"
                                          onClick={() => handleStartEditComment(reply)}
                                        >
                                          <i className="fa-solid fa-pen text-[11px]"></i>
                                          수정
                                        </button>
                                        <button
                                          type="button"
                                          className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium text-[#FF3B30] transition hover:bg-[#FFF0F0]"
                                          onClick={() => handleDeleteCommentClick(reply._id)}
                                        >
                                          <i className="fa-solid fa-trash text-[11px]"></i>
                                          삭제
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {editingCommentId === reply._id ? (
                                <div className="mt-2">
                                  <textarea
                                    className="min-h-[80px] w-full rounded-[12px] border border-black/10 px-3 py-2.5 text-sm text-app-title outline-none transition focus:border-app-accent"
                                    value={editCommentContent}
                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                  />
                                  <div className="mt-2 flex justify-end gap-2">
                                    <button
                                      type="button"
                                      className="rounded-[10px] bg-app-bg px-4 py-2 text-[13px] font-semibold text-app-title transition hover:bg-black/[0.08]"
                                      onClick={handleCancelEditComment}
                                    >
                                      취소
                                    </button>
                                    <button
                                      type="button"
                                      className="rounded-[10px] bg-app-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0062CC]"
                                      onClick={() => handleSaveEditComment(reply._id)}
                                    >
                                      저장
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[15px] leading-6 text-app-title">{reply.content}</p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  className={cn(
                                    commentActionButtonClass,
                                    hasLikedReply && "text-[#FF2D55] hover:bg-[#FFF0F5] hover:text-[#FF2D55]",
                                  )}
                                  onClick={() => handleToggleCommentLike(reply._id)}
                                >
                                  <i className={`fa-${hasLikedReply ? "solid" : "regular"} fa-heart`}></i>
                                  {reply.likes || 0}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <div className="mt-10 border-t border-black/8 pt-8">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[14px] bg-black/[0.04] px-5 py-3 text-sm font-semibold text-app-title transition hover:bg-black/[0.08]"
          onClick={() => router.push("/guide")}
        >
          <i className="fa-solid fa-arrow-left"></i>
          목록으로
        </button>
      </div>

      {showDeleteModal && (
        <div className={modalOverlayClass} onClick={() => setShowDeleteModal(false)}>
          <div className={modalClass} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[20px] font-bold text-app-title">공략 삭제</h3>
            <p className="text-[15px] text-app-body">정말로 이 공략을 삭제하시겠습니까?</p>
            <p className="mt-2 text-[13px] text-[#FF3B30]">삭제된 공략은 복구할 수 없습니다.</p>
            <div className={modalActionsClass}>
              <button type="button" className={modalSecondaryButtonClass} onClick={() => setShowDeleteModal(false)}>
                취소
              </button>
              <button
                type="button"
                className={modalDangerButtonClass}
                onClick={handleDeleteGuide}
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCommentDeleteModal && (
        <div className={modalOverlayClass} onClick={() => setShowCommentDeleteModal(false)}>
          <div className={modalClass} onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-3 text-[20px] font-bold text-app-title">댓글 삭제</h3>
            <p className="text-[15px] text-app-body">정말로 이 댓글을 삭제하시겠습니까?</p>
            <div className={modalActionsClass}>
              <button
                type="button"
                className={modalSecondaryButtonClass}
                onClick={() => setShowCommentDeleteModal(false)}
              >
                취소
              </button>
              <button
                type="button"
                className={modalDangerButtonClass}
                onClick={handleConfirmDeleteComment}
                disabled={isDeletingComment}
              >
                {isDeletingComment ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
