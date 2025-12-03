"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPost, incrementViewCount, deletePost, updatePost, toggleLike, getTrendingPosts, TrendingPeriod } from "@/actions/post";
import { getComments, createComment, deleteComment, updateComment, toggleCommentLike, acceptComment } from "@/actions/comment";
import styles from "../community.module.css";

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
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>('week');
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
      // Increment view count first, then load post to get updated count
      await incrementViewCount(id);
      await loadPost();
      await loadComments();
    };
    init();
    loadTrendingPosts();

    // Close dropdown when clicking outside
    const handleClickOutside = () => {
      setShowDropdown(false);
      setActiveCommentDropdown(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
      // Update post comment count locally
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
      // 로컬 상태 업데이트
      setPost({ ...post, isSolved: true, acceptedCommentId: acceptTargetId });
      setComments(comments.map(comment =>
        comment._id === acceptTargetId
          ? { ...comment, isAccepted: true }
          : comment
      ));
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
      // Update local state
      const updateCommentContent = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment._id === commentId) {
            return { ...comment, content: editCommentContent };
          }
          if (comment.replies?.length > 0) {
            return { ...comment, replies: updateCommentContent(comment.replies) };
          }
          return comment;
        });
      };
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
      // Update local state
      const updateCommentLike = (comments: any[]): any[] => {
        return comments.map(comment => {
          if (comment._id === commentId) {
            const userId = (session.user as any).id;
            const isLiked = comment.likedBy?.includes(userId);
            return {
              ...comment,
              likes: isLiked ? comment.likes - 1 : comment.likes + 1,
              likedBy: isLiked
                ? comment.likedBy.filter((uid: string) => uid !== userId)
                : [...(comment.likedBy || []), userId]
            };
          }
          if (comment.replies?.length > 0) {
            return { ...comment, replies: updateCommentLike(comment.replies) };
          }
          return comment;
        });
      };
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
          : [...(post.likedBy || []), userId]
      });
    } else {
      alert(result.error || "좋아요 처리에 실패했습니다.");
    }
  };

  const renderContentWithHashtags = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      const parts = line.split(/((?:^|\s)#[^\s#]+)/g);
      return (
        <div key={lineIndex}>
          {parts.map((part, index) => {
            if (part.trim().startsWith('#')) {
              return <span key={index} className={styles.highlight}>{part}</span>;
            }
            return <span key={index}>{part}</span>;
          })}
          {line === '' && <br />}
        </div>
      );
    });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!post) return null;

  return (
    <div className={styles.layoutWrapper}>
      <main className={styles.feedSection}>
        <article className={styles.feedCard} style={{ cursor: 'default' }}>
          <div className={styles.postDetailHeader}>
            <div className={styles.cardHeader} style={{ marginBottom: 0, flex: 1 }}>
              <div className={styles.userMeta}>
                <img src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`} className={styles.uAvatar} alt="User Avatar" />
                <div className={styles.uInfo}>
                  <span className={styles.uName}>{post.author.name}</span>
                  <span className={styles.uTime}>{new Date(post.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className={`${styles.badge} ${
                post.type === '잡담' ? styles.free : 
                post.type === '질문' ? styles.question : 
                styles.tip
              }`}>
                {post.type === '질문' ? (post.isSolved ? '해결됨' : '답변 대기중') : post.type}
              </div>
            </div>

            {/* Dropdown Menu for Author */}
            {(session?.user as any)?.id === post.author.id && (
              <div 
                className={styles.postActions} 
                onClick={(e) => {
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
              >
                <button 
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
                
                {showDropdown && (
                  <div className={styles.dropdown}>
                    <button 
                      className={styles.dropdownItem}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        handleEdit();
                      }}
                    >
                      수정
                    </button>
                    <button
                      className={`${styles.dropdownItem} ${styles.delete}`}
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
          
          <div className={styles.postContent} style={{ minHeight: '200px' }}>
            {isEditing ? (
              <div className={styles.editWrapper}>
                <textarea
                  className={styles.editInput}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                />
                <div className={styles.editActions}>
                  <button 
                    className={styles.cancelBtn} 
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(post.content);
                    }}
                    disabled={isSaving}
                  >
                    취소
                  </button>
                  <button 
                    className={styles.saveBtn} 
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    {isSaving ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              renderContentWithHashtags(post.content)
            )}
          </div>
          
          {post.images && post.images.map((url: string, index: number) => (
            <img key={index} src={url} alt={`Post Image ${index + 1}`} className={styles.postImg} />
          ))}

          <div className={styles.cardFooter}>
            <span className={styles.statItem}>
              <i className="fa-regular fa-comment"></i> {post.commentCount || 0}
            </span>
            <button
              className={`${styles.likeBtn} ${post.likedBy?.includes((session?.user as any)?.id) ? styles.liked : ''}`}
              onClick={handleLike}
            >
              <i className={post.likedBy?.includes((session?.user as any)?.id) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
              <span>{post.likes || 0}</span>
            </button>
            <span className={styles.statItem}>
              <i className="fa-regular fa-eye"></i> {post.viewCount || 0}
            </span>
          </div>
        </article>
        
        {/* Comment Section */}
        <div className={styles.commentSection}>
          <h3 className={styles.commentTitle}>
            댓글 <span className={styles.commentCount}>{post.commentCount || 0}</span>
          </h3>

          {/* Comment Input */}
          <div className={styles.commentInputWrapper}>
            <img
              src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous`}
              className={styles.commentAvatar}
              alt="Your Avatar"
            />
            <div className={styles.commentInputBox}>
              <textarea
                className={styles.commentInput}
                placeholder={session?.user ? "댓글을 작성하세요..." : "로그인 후 댓글을 작성할 수 있습니다."}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={!session?.user}
                rows={3}
              />
              <button
                className={styles.commentSubmitBtn}
                onClick={handleSubmitComment}
                disabled={!session?.user || isSubmittingComment || !newComment.trim()}
              >
                {isSubmittingComment ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>

          {/* Comments List */}
          <div className={styles.commentList}>
            {comments.map((comment) => (
                <div key={comment._id} className={`${styles.commentItem} ${comment.isAccepted ? styles.acceptedComment : ''}`}>
                  {/* Accepted Badge */}
                  {comment.isAccepted && (
                    <div className={styles.acceptedBadge}>
                      <i className="fa-solid fa-check-circle"></i> 채택된 답변
                    </div>
                  )}
                  {/* Main Comment */}
                  <div className={styles.commentContent}>
                    <img
                      src={comment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                      className={styles.commentAvatar}
                      alt="Commenter"
                    />
                    <div className={styles.commentBody}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor}>{comment.author.name}</span>
                        <span className={styles.commentTime}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {/* 케밥 메뉴 */}
                        {(session?.user as any)?.id === comment.author.id && (
                          <div
                            className={styles.commentMenuWrapper}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                            }}
                          >
                            <button
                              className={styles.commentMenuBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.nativeEvent.stopImmediatePropagation();
                                setActiveCommentDropdown(activeCommentDropdown === comment._id ? null : comment._id);
                              }}
                            >
                              <i className="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            {activeCommentDropdown === comment._id && (
                              <div className={styles.commentDropdown}>
                                <button
                                  className={styles.dropdownItem}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditComment(comment);
                                  }}
                                >
                                  수정
                                </button>
                                <button
                                  className={`${styles.dropdownItem} ${styles.delete}`}
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
                        <div className={styles.editCommentWrapper}>
                          <textarea
                            className={styles.editCommentInput}
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            rows={3}
                            autoFocus
                          />
                          <div className={styles.editCommentBtns}>
                            <button className={styles.cancelBtn} onClick={handleCancelEditComment}>
                              취소
                            </button>
                            <button
                              className={styles.saveBtn}
                              onClick={() => handleSaveEditComment(comment._id)}
                              disabled={isSavingComment}
                            >
                              {isSavingComment ? "저장 중..." : "저장"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={styles.commentText}>{comment.content}</p>
                      )}
                      <div className={styles.commentActions}>
                        <button
                          className={`${styles.commentLikeBtn} ${comment.likedBy?.includes((session?.user as any)?.id) ? styles.liked : ''}`}
                          onClick={() => handleCommentLike(comment._id)}
                        >
                          <i className={comment.likedBy?.includes((session?.user as any)?.id) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                          <span>{comment.likes || 0}</span>
                        </button>
                        <button
                          className={styles.replyBtn}
                          onClick={() => {
                            setReplyingTo(replyingTo === comment._id ? null : comment._id);
                            setReplyContent("");
                          }}
                        >
                          <i className="fa-regular fa-comment"></i> 답글
                        </button>
                        {/* 채택 버튼: 질문 게시글이고, 작성자이고, 아직 채택 안됐고, 자기 댓글이 아닌 경우 */}
                        {post.type === '질문' &&
                          !post.isSolved &&
                          (session?.user as any)?.id === post.author.id &&
                          (session?.user as any)?.id !== comment.author.id && (
                          <button
                            className={styles.acceptBtn}
                            onClick={() => handleAcceptClick(comment._id)}
                          >
                            <i className="fa-solid fa-check"></i> 채택
                          </button>
                        )}
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment._id && (
                        <div className={styles.replyInputWrapper}>
                          <textarea
                            className={styles.replyInput}
                            placeholder="답글을 작성하세요..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                          />
                          <div className={styles.replyBtns}>
                            <button
                              className={styles.cancelReplyBtn}
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                            >
                              취소
                            </button>
                            <button
                              className={styles.submitReplyBtn}
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

                  {/* Replies */}
                  {comment.replies?.length > 0 && (
                    <div className={styles.repliesList}>
                      {comment.replies.map((reply: any) => (
                        <div key={reply._id} className={styles.replyItem}>
                          <img
                            src={reply.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${reply.author.id}`}
                            className={styles.replyAvatar}
                            alt="Replier"
                          />
                          <div className={styles.commentBody}>
                            <div className={styles.commentHeader}>
                              <span className={styles.commentAuthor}>{reply.author.name}</span>
                              <span className={styles.commentTime}>
                                {new Date(reply.createdAt).toLocaleString()}
                              </span>
                              {/* 대댓글 케밥 메뉴 */}
                              {(session?.user as any)?.id === reply.author.id && (
                                <div
                                  className={styles.commentMenuWrapper}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.nativeEvent.stopImmediatePropagation();
                                  }}
                                >
                                  <button
                                    className={styles.commentMenuBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.nativeEvent.stopImmediatePropagation();
                                      setActiveCommentDropdown(activeCommentDropdown === reply._id ? null : reply._id);
                                    }}
                                  >
                                    <i className="fa-solid fa-ellipsis-vertical"></i>
                                  </button>
                                  {activeCommentDropdown === reply._id && (
                                    <div className={styles.commentDropdown}>
                                      <button
                                        className={styles.dropdownItem}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEditComment(reply);
                                        }}
                                      >
                                        수정
                                      </button>
                                      <button
                                        className={`${styles.dropdownItem} ${styles.delete}`}
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
                              <div className={styles.editCommentWrapper}>
                                <textarea
                                  className={styles.editCommentInput}
                                  value={editCommentContent}
                                  onChange={(e) => setEditCommentContent(e.target.value)}
                                  rows={3}
                                  autoFocus
                                />
                                <div className={styles.editCommentBtns}>
                                  <button className={styles.cancelBtn} onClick={handleCancelEditComment}>
                                    취소
                                  </button>
                                  <button
                                    className={styles.saveBtn}
                                    onClick={() => handleSaveEditComment(reply._id)}
                                    disabled={isSavingComment}
                                  >
                                    {isSavingComment ? "저장 중..." : "저장"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className={styles.commentText}>{reply.content}</p>
                            )}
                            <div className={styles.commentActions}>
                              <button
                                className={`${styles.commentLikeBtn} ${reply.likedBy?.includes((session?.user as any)?.id) ? styles.liked : ''}`}
                                onClick={() => handleCommentLike(reply._id)}
                              >
                                <i className={reply.likedBy?.includes((session?.user as any)?.id) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
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
        </div>

        <button className={styles.postBtn} onClick={() => router.back()} style={{ width: 'fit-content', marginTop: '20px' }}>
          목록으로
        </button>
      </main>

      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.widget}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetH}>실시간 인기글</div>
            <div className={styles.periodSelector}>
              <button
                className={`${styles.periodBtn} ${trendingPeriod === 'week' ? styles.active : ''}`}
                onClick={() => setTrendingPeriod('week')}
              >
                주간
              </button>
              <button
                className={`${styles.periodBtn} ${trendingPeriod === 'month' ? styles.active : ''}`}
                onClick={() => setTrendingPeriod('month')}
              >
                월간
              </button>
            </div>
          </div>
          <div className={styles.trendingList}>
            {trendingPosts.map((post, index) => (
              <div
                key={post._id}
                className={styles.trendingItem}
                onClick={() => router.push(`/community/${post._id}`)}
              >
                <span className={`${styles.rank} ${index < 3 ? styles.topRank : ''}`}>{index + 1}</span>
                <div className={styles.trendingContent}>
                  <div className={styles.trendingTitle}>{post.content}</div>
                  <div className={styles.trendingMeta}>
                    <span><i className="fa-solid fa-heart"></i> {post.likes}</span>
                    <span><i className="fa-regular fa-comment"></i> {post.commentCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Post Delete Modal */}
      {showPostDeleteModal && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>게시글 삭제</h3>
            <p>정말로 이 게시글을 삭제하시겠습니까?</p>
            <p className={styles.modalWarning}>삭제된 게시글은 복구할 수 없습니다.</p>
            <div className={styles.modalActions}>
              <button onClick={handleDeleteCancel}>취소</button>
              <button
                className={styles.modalDeleteBtn}
                onClick={handleDeleteConfirm}
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
        <div className={styles.modalOverlay} onClick={handleDeleteCommentCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>댓글 삭제</h3>
            <p>정말로 이 댓글을 삭제하시겠습니까?</p>
            <div className={styles.modalActions}>
              <button onClick={handleDeleteCommentCancel}>취소</button>
              <button
                className={styles.modalDeleteBtn}
                onClick={handleDeleteCommentConfirm}
                disabled={isDeletingComment}
              >
                {isDeletingComment ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className={styles.modalOverlay} onClick={handleAcceptCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>답변 채택</h3>
            <p>이 답변을 채택하시겠습니까?</p>
            <p className={styles.modalWarning}>채택 후에는 취소할 수 없습니다.</p>
            <div className={styles.modalActions}>
              <button onClick={handleAcceptCancel}>취소</button>
              <button
                className={styles.modalAcceptBtn}
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
