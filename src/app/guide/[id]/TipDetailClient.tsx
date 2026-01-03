"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getGuideById, toggleGuideLike, toggleGuideBookmark, deleteGuide } from "@/actions/guide";
import {
  getGuideComments,
  createGuideComment,
  updateGuideComment,
  deleteGuideComment,
  toggleGuideCommentLike,
} from "@/actions/guideComment";
import styles from "./tipDetail.module.css";

export default function TipDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();

  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Guide dropdown state
  const [showGuideDropdown, setShowGuideDropdown] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Comment edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [activeCommentDropdown, setActiveCommentDropdown] = useState<string | null>(null);

  // Comment delete modal state
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

  // session이 로드된 후 좋아요/북마크 상태 업데이트
  useEffect(() => {
    if (guide && session?.user) {
      const userId = (session.user as any).id;
      setIsLiked(guide.likedBy?.includes(userId) || false);
      setIsBookmarked(guide.bookmarkedBy?.includes(userId) || false);
    }

    // URL update to slug if visited by ID
    if (guide?.slug && id !== guide.slug) {
       window.history.replaceState(null, "", `/guide/${guide.slug}`);
    }
  }, [session, guide, id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 케밥 버튼이나 드롭다운 내부 클릭이 아닌 경우에만 닫기
      if (!target.closest(`.${styles.kebabWrapper}`) && !target.closest(`.${styles.commentKebabWrapper}`)) {
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
      if (isLiked) {
        setLikeCount((prev) => prev - 1);
      } else {
        setLikeCount((prev) => prev + 1);
      }
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

  // Guide actions
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

  // Comment actions
  const handleSubmitComment = async () => {
    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    if (!newComment.trim()) return;
    if (!guide?._id) return;

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

    if (!replyContent.trim()) return;
    if (!guide?._id) return;

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
    if (!editCommentContent.trim()) return;
    if (!guide?._id) return;

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
    if (!deletingCommentId) return;
    if (!guide?._id) return;

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

  // Organize comments into parent and replies
  const parentComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  const isAuthor = session?.user && guide?.author?.id === (session.user as any).id;

  if (loading) {
    return (
      <div className={styles.tipDetailContainer}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className={styles.tipDetailContainer}>
        <div className={styles.notFound}>공략을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className={styles.tipDetailContainer}>
      {/* Header */}
      <div className={styles.tipHeader}>
        <div className={styles.headerTop}>
          <div className={styles.tipCategoryBadge}>{guide.category}</div>
          {isAuthor && (
            <div className={styles.kebabWrapper}>
              <button
                className={styles.kebabBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGuideDropdown(!showGuideDropdown);
                }}
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>
              {showGuideDropdown && (
                <div className={styles.dropdown}>
                  <button onClick={handleEditGuide}>
                    <i className="fa-solid fa-pen"></i> 수정
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => {
                      setShowGuideDropdown(false);
                      setShowDeleteModal(true);
                    }}
                  >
                    <i className="fa-solid fa-trash"></i> 삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        <h1 className={styles.tipTitle}>{guide.title}</h1>

        <div className={styles.tipMeta}>
          <div className={styles.authorInfo}>
            <img
              src={guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id}`}
              alt="Author"
              className={styles.authorImg}
            />
            <div className={styles.authorText}>
              <span className={styles.authorName}>{guide.author?.name || "익명"}</span>
              <span className={styles.postDate}>
                {new Date(guide.createdAt).toLocaleString()}
                {guide.updatedAt !== guide.createdAt && <span className={styles.edited}> · 수정됨</span>}
              </span>
            </div>
          </div>

          <div className={styles.tipActions}>
            <button
              className={`${styles.actionBtn} ${styles.like} ${isLiked ? styles.active : ""}`}
              onClick={toggleLike}
            >
              <i className={`fa-${isLiked ? "solid" : "regular"} fa-heart`}></i>
              {likeCount}
            </button>
            <button
              className={`${styles.actionBtn} ${isBookmarked ? styles.active : ""}`}
              onClick={toggleBookmark}
            >
              <i className={`fa-${isBookmarked ? "solid" : "regular"} fa-bookmark`}></i>
              북마크
            </button>
            <span className={styles.viewCount}>
              <i className="fa-regular fa-eye"></i>
              {guide.views || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Thumbnail */}
      {guide.thumbnail && (
        <div className={styles.thumbnailWrapper}>
          <img src={guide.thumbnail} alt="썸네일" className={styles.thumbnail} />
        </div>
      )}

      {/* Content */}
      <div className={styles.tipContent} dangerouslySetInnerHTML={{ __html: guide.content }}></div>

      {/* Comments Section */}
      <div className={styles.commentsSection}>
        <h3 className={styles.commentsHeader}>
          댓글 {comments.length}개
        </h3>

        {/* Comment Input */}
        <div className={styles.commentInputArea}>
          <input
            type="text"
            className={styles.commentInput}
            placeholder={session?.user ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
            disabled={!session?.user || isSubmitting}
          />
          <button
            className={styles.commentSubmit}
            onClick={handleSubmitComment}
            disabled={!session?.user || isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? "..." : "등록"}
          </button>
        </div>

        {/* Comment List */}
        <div className={styles.commentList}>
          {parentComments.length === 0 ? (
            <div className={styles.noComments}>아직 댓글이 없습니다. 첫 댓글을 작성해보세요!</div>
          ) : (
            parentComments.map((comment) => {
              const replies = getReplies(comment._id);
              const isCommentAuthor = session?.user && comment.author.id === (session.user as any).id;
              const hasLiked = session?.user && comment.likedBy?.includes((session.user as any).id);

              return (
                <div key={comment._id} className={styles.commentThread}>
                  {/* Parent Comment */}
                  <div className={styles.commentItem}>
                    <img
                      src={comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                      alt=""
                      className={styles.commentAvatar}
                    />
                    <div className={styles.commentBubble}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor}>{comment.author.name}</span>
                        <span className={styles.commentDate}>
                          {new Date(comment.createdAt).toLocaleString()}
                          {comment.updatedAt !== comment.createdAt && " · 수정됨"}
                        </span>
                        {isCommentAuthor && (
                          <div className={styles.commentKebabWrapper}>
                            <button
                              className={styles.commentKebabBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCommentDropdown(
                                  activeCommentDropdown === comment._id ? null : comment._id
                                );
                              }}
                            >
                              <i className="fa-solid fa-ellipsis"></i>
                            </button>
                            {activeCommentDropdown === comment._id && (
                              <div className={styles.commentDropdown}>
                                <button onClick={() => handleStartEditComment(comment)}>
                                  <i className="fa-solid fa-pen"></i> 수정
                                </button>
                                <button
                                  className={styles.deleteBtn}
                                  onClick={() => handleDeleteCommentClick(comment._id)}
                                >
                                  <i className="fa-solid fa-trash"></i> 삭제
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment._id ? (
                        <div className={styles.editArea}>
                          <textarea
                            className={styles.editTextarea}
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                          />
                          <div className={styles.editActions}>
                            <button onClick={handleCancelEditComment}>취소</button>
                            <button
                              className={styles.saveBtn}
                              onClick={() => handleSaveEditComment(comment._id)}
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.commentText}>{comment.content}</p>
                      )}
                      <div className={styles.commentActions}>
                        <button
                          className={`${styles.commentLikeBtn} ${hasLiked ? styles.liked : ""}`}
                          onClick={() => handleToggleCommentLike(comment._id)}
                        >
                          <i className={`fa-${hasLiked ? "solid" : "regular"} fa-heart`}></i>
                          {comment.likes || 0}
                        </button>
                        <button
                          className={styles.replyBtn}
                          onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                        >
                          <i className="fa-solid fa-reply"></i> 답글
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment._id && (
                    <div className={styles.replyInputArea}>
                      <input
                        type="text"
                        className={styles.replyInput}
                        placeholder="답글을 입력하세요..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitReply(comment._id)}
                        autoFocus
                      />
                      <button
                        className={styles.replySubmit}
                        onClick={() => handleSubmitReply(comment._id)}
                        disabled={isSubmitting || !replyContent.trim()}
                      >
                        등록
                      </button>
                      <button className={styles.replyCancel} onClick={() => setReplyingTo(null)}>
                        취소
                      </button>
                    </div>
                  )}

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className={styles.repliesWrapper}>
                      {replies.map((reply) => {
                        const isReplyAuthor = session?.user && reply.author.id === (session.user as any).id;
                        const hasLikedReply = session?.user && reply.likedBy?.includes((session.user as any).id);

                        return (
                          <div key={reply._id} className={styles.replyItem}>
                            <img
                              src={reply.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.id}`}
                              alt=""
                              className={styles.commentAvatar}
                            />
                            <div className={styles.commentBubble}>
                              <div className={styles.commentHeader}>
                                <span className={styles.commentAuthor}>{reply.author.name}</span>
                                <span className={styles.commentDate}>
                                  {new Date(reply.createdAt).toLocaleString()}
                                  {reply.updatedAt !== reply.createdAt && " · 수정됨"}
                                </span>
                                {isReplyAuthor && (
                                  <div className={styles.commentKebabWrapper}>
                                    <button
                                      className={styles.commentKebabBtn}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveCommentDropdown(
                                          activeCommentDropdown === reply._id ? null : reply._id
                                        );
                                      }}
                                    >
                                      <i className="fa-solid fa-ellipsis"></i>
                                    </button>
                                    {activeCommentDropdown === reply._id && (
                                      <div className={styles.commentDropdown}>
                                        <button onClick={() => handleStartEditComment(reply)}>
                                          <i className="fa-solid fa-pen"></i> 수정
                                        </button>
                                        <button
                                          className={styles.deleteBtn}
                                          onClick={() => handleDeleteCommentClick(reply._id)}
                                        >
                                          <i className="fa-solid fa-trash"></i> 삭제
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {editingCommentId === reply._id ? (
                                <div className={styles.editArea}>
                                  <textarea
                                    className={styles.editTextarea}
                                    value={editCommentContent}
                                    onChange={(e) => setEditCommentContent(e.target.value)}
                                  />
                                  <div className={styles.editActions}>
                                    <button onClick={handleCancelEditComment}>취소</button>
                                    <button
                                      className={styles.saveBtn}
                                      onClick={() => handleSaveEditComment(reply._id)}
                                    >
                                      저장
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className={styles.commentText}>{reply.content}</p>
                              )}
                              <div className={styles.commentActions}>
                                <button
                                  className={`${styles.commentLikeBtn} ${hasLikedReply ? styles.liked : ""}`}
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
      </div>

      {/* Back Button */}
      <div className={styles.backBtnWrapper}>
        <button className={styles.backBtn} onClick={() => router.push("/guide")}>
          <i className="fa-solid fa-arrow-left"></i>
          목록으로
        </button>
      </div>

      {/* Guide Delete Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>공략 삭제</h3>
            <p>정말로 이 공략을 삭제하시겠습니까?</p>
            <p className={styles.modalWarning}>삭제된 공략은 복구할 수 없습니다.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowDeleteModal(false)}>취소</button>
              <button
                className={styles.modalDeleteBtn}
                onClick={handleDeleteGuide}
                disabled={isDeleting}
              >
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Delete Modal */}
      {showCommentDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCommentDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>댓글 삭제</h3>
            <p>정말로 이 댓글을 삭제하시겠습니까?</p>
            <div className={styles.modalActions}>
              <button onClick={() => setShowCommentDeleteModal(false)}>취소</button>
              <button
                className={styles.modalDeleteBtn}
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
