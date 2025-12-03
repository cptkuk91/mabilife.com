"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPresignedUrlAction } from "@/actions/upload";
import { createPost, getPosts, deletePost, updatePost, getTrendingPosts, TrendingPeriod, toggleLike } from "@/actions/post";
import { getWeeklyTopAnswerers } from "@/actions/comment";
import styles from "./community.module.css";

export default function CommunityPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("잡담");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [isEditDragging, setIsEditDragging] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>('week');
  const [topAnswerers, setTopAnswerers] = useState<any[]>([]);
  const MAX_IMAGES = 5;

  useEffect(() => {
    loadPosts();
    loadTopAnswerers();

    // Close dropdown when clicking outside
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeTab]); // Reload when tab changes

  useEffect(() => {
    loadTrendingPosts();
  }, [trendingPeriod]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPosts = async () => {
    const result = await getPosts(1, 20, activeTab, searchQuery);
    if (result.success) {
      setPosts(result.posts);
    }
  };

  const loadTrendingPosts = async () => {
    const result = await getTrendingPosts(trendingPeriod, 5);
    if (result.success) {
      setTrendingPosts(result.posts);
    }
  };

  const loadTopAnswerers = async () => {
    const result = await getWeeklyTopAnswerers(5);
    if (result.success) {
      setTopAnswerers(result.answerers);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    if (uploadedImages.length + imageFiles.length > MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const { success, signedUrl, publicUrl, error } = await getPresignedUrlAction(file.name, file.type);
        
        if (!success || !signedUrl || !publicUrl) {
          console.error("Failed to get presigned URL:", error);
          return null;
        }

        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          console.error("Failed to upload to S3");
          return null;
        }

        return publicUrl;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      setUploadedImages(prev => [...prev, ...successfulUploads]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    if (uploadedImages.length + imageFiles.length > MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const { success, signedUrl, publicUrl, error } = await getPresignedUrlAction(file.name, file.type);
        
        if (!success || !signedUrl || !publicUrl) {
          console.error("Failed to get presigned URL:", error);
          return null;
        }

        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          console.error("Failed to upload to S3");
          return null;
        }

        return publicUrl;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);
      
      setUploadedImages(prev => [...prev, ...successfulUploads]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handlePostSubmit = async () => {
    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await createPost({
        content,
        type: postType as '잡담' | '질문' | '정보',
        images: uploadedImages,
      });

      if (result.success) {
        // Reset form
        setContent("");
        setUploadedImages([]);
        setPostType("잡담");
        loadPosts(); // Reload posts
      } else {
        alert(result.error || "게시글 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Post submit error:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setDeleteTargetId(postId);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setIsDeleting(true);

    const result = await deletePost(deleteTargetId);

    if (result.success) {
      loadPosts();
    } else {
      alert(result.error || "삭제에 실패했습니다.");
    }

    setIsDeleting(false);
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    if (!session?.user) {
      alert("로그인이 필요합니다.");
      return;
    }

    const result = await toggleLike(postId);

    if (result.success) {
      // Update local state
      setPosts(posts.map(post => {
        if (post._id === postId) {
          const userId = (session.user as any).id;
          const isCurrentlyLiked = post.likedBy?.includes(userId);
          return {
            ...post,
            likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1,
            likedBy: isCurrentlyLiked
              ? post.likedBy.filter((id: string) => id !== userId)
              : [...(post.likedBy || []), userId]
          };
        }
        return post;
      }));
    } else {
      alert(result.error || "좋아요 처리에 실패했습니다.");
    }
  };

  const handleStartEdit = (e: React.MouseEvent, post: any) => {
    e.stopPropagation();
    setEditingPostId(post._id);
    setEditContent(post.content);
    setEditImages(post.images || []);
    setActiveDropdown(null);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPostId(null);
    setEditContent("");
    setEditImages([]);
  };

  const uploadEditImages = async (imageFiles: File[]) => {
    if (imageFiles.length === 0) return;

    if (editImages.length + imageFiles.length > MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    setIsEditUploading(true);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const { success, signedUrl, publicUrl, error } = await getPresignedUrlAction(file.name, file.type);

        if (!success || !signedUrl || !publicUrl) {
          console.error("Failed to get presigned URL:", error);
          return null;
        }

        const uploadResponse = await fetch(signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          console.error("Failed to upload to S3");
          return null;
        }

        return publicUrl;
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((url): url is string => url !== null);

      setEditImages(prev => [...prev, ...successfulUploads]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsEditUploading(false);
    }
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    await uploadEditImages(imageFiles);
    e.target.value = '';
  };

  const handleEditDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(true);
  };

  const handleEditDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(false);
  };

  const handleEditDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    await uploadEditImages(imageFiles);
  };

  const handleSaveEdit = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();

    if (!editContent.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    setIsSavingEdit(true);

    try {
      const result = await updatePost(postId, editContent, editImages);

      if (result.success) {
        setEditingPostId(null);
        setEditContent("");
        setEditImages([]);
        loadPosts();
      } else {
        alert(result.error || "수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Edit error:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderContentWithHashtags = (text: string) => {
    // Split by newlines first to preserve them
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
          {/* Add a zero-width space or break to ensure empty lines have height if needed, 
              but usually div block is enough. However, for exact matching with textarea, 
              we might need <br/> if line is empty string? 
              Actually, textarea preserves newlines. 
              If line is empty string, it renders as a blank line. 
              A div with empty content has 0 height. 
              So we should render <br/> if line is empty.
          */}
          {line === '' && <br />}
        </div>
      );
    });
  };

  return (
    <>


      <div className={styles.layoutWrapper}>
        
        {/* Feed Column */}
        <main className={styles.feedSection}>
          
          {/* 1. Universal Write Box */}
          <div className={styles.writeCard}>
            <div 
              className={`${styles.writeTop} ${isDragging ? styles.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <img src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(session?.user as any)?.id || 'Me'}`} className={styles.myAvatar} alt="My Avatar" />
              
              <div className={styles.inputContainer}>
                {/* Highlights Overlay */}
                <div className={styles.highlights}>
                  {renderContentWithHashtags(content)}
                </div>
                
                {/* Actual Textarea */}
                <textarea 
                  className={`${styles.writeInput} ${content ? styles.hasHighlights : ''}`}
                  rows={6} 
                  placeholder="무슨 생각을 하고 계신가요? (이미지를 드래그해서 첨부할 수 있습니다)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  spellCheck={false}
                ></textarea>
              </div>

              {isUploading && (
                <div className={styles.uploadOverlay}>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
              )}
            </div>
            
            {/* Uploaded Images Preview */}
            {uploadedImages.length > 0 && (
              <div className={styles.imagePreviewArea}>
                {uploadedImages.map((url, index) => (
                  <div key={index} className={styles.previewImageWrapper}>
                    <img src={url} alt={`Uploaded ${index}`} className={styles.previewImage} />
                    <button 
                      className={styles.removeImageBtn}
                      onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.writeTools}>
              <div className={styles.typeSelector}>
                <button 
                  className={`${styles.typeBtn} ${postType === '잡담' ? styles.active : ''}`}
                  onClick={() => setPostType('잡담')}
                >
                  잡담
                </button>
                <button 
                  className={`${styles.typeBtn} ${styles.qMode} ${postType === '질문' ? styles.active : ''}`}
                  onClick={() => setPostType('질문')}
                >
                  질문
                </button>
                <button 
                  className={`${styles.typeBtn} ${postType === '정보' ? styles.active : ''}`}
                  onClick={() => setPostType('정보')}
                >
                  정보
                </button>
              </div>
              <div className={styles.postActions}>
                <div className={styles.imageUploadWrapper}>
                  <input 
                    type="file" 
                    id="image-upload" 
                    multiple 
                    accept="image/*" 
                    className={styles.hiddenInput}
                    onChange={handleFileSelect}
                    disabled={uploadedImages.length >= MAX_IMAGES}
                  />
                  <label htmlFor="image-upload" className={`${styles.imageUploadBtn} ${uploadedImages.length >= MAX_IMAGES ? styles.disabled : ''}`}>
                    <i className="fa-regular fa-image"></i>
                    <span className={styles.imageCount}>{uploadedImages.length}/{MAX_IMAGES}</span>
                  </label>
                </div>
                <button 
                  className={styles.postBtn}
                  onClick={handlePostSubmit}
                  disabled={isSubmitting}
                  style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? '등록 중...' : '게시'}
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <i className={`fa-solid fa-magnifying-glass ${styles.searchIcon}`}></i>
            <input 
              type="text" 
              className={styles.searchInput} 
              placeholder="태그나 내용을 검색해보세요 (예: #마비노기)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 2. Filter Tabs */}
          <div className={styles.feedTabs}>
            <div 
              className={`${styles.tab} ${activeTab === '전체' ? styles.active : ''}`}
              onClick={() => setActiveTab('전체')}
            >
              전체
            </div>
            <div 
              className={`${styles.tab} ${activeTab === '잡담' ? styles.active : ''}`}
              onClick={() => setActiveTab('잡담')}
            >
              잡담
            </div>
            <div 
              className={`${styles.tab} ${activeTab === '질문' ? styles.active : ''}`}
              onClick={() => setActiveTab('질문')}
            >
              Q&A
            </div>
            <div 
              className={`${styles.tab} ${activeTab === '정보' ? styles.active : ''}`}
              onClick={() => setActiveTab('정보')}
            >
              정보
            </div>
          </div>

          {/* Feed Items */}
          {posts.map((post) => (
            <article 
              key={post._id} 
              className={styles.feedCard}
              onClick={() => router.push(`/community/${post._id}`)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.userMeta}>
                  <img src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`} className={styles.uAvatar} alt="User Avatar" />
                  <div className={styles.uInfo}>
                    <span className={styles.uName}>{post.author.name}</span>
                    <span className={styles.uTime}>
                      {new Date(post.createdAt).toLocaleString()}
                      {post.updatedAt !== post.createdAt && <span className={styles.edited}> · 수정됨</span>}
                    </span>
                  </div>
                </div>
                <div className={`${styles.badge} ${
                  post.type === '잡담' ? styles.free : 
                  post.type === '질문' ? styles.question : 
                  styles.tip
                }`}>
                  {post.type === '질문' ? (post.isSolved ? '해결됨' : '답변 대기중') : post.type}
                </div>

                {/* Dropdown Menu for Author */}
                {(session?.user as any)?.id === post.author.id && (
                  <div 
                    className={styles.postActions} 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Prevent document listener from firing
                      e.nativeEvent.stopImmediatePropagation();
                    }}
                  >
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Prevent document listener from firing
                        e.nativeEvent.stopImmediatePropagation();
                        setActiveDropdown(activeDropdown === post._id ? null : post._id);
                      }}
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    
                    {activeDropdown === post._id && (
                      <div className={styles.dropdown}>
                        <button
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handleStartEdit(e, post);
                          }}
                        >
                          수정
                        </button>
                        <button
                          className={`${styles.dropdownItem} ${styles.delete}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handleDeleteClick(e, post._id);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
{editingPostId === post._id ? (
                <div
                  className={`${styles.editWrapper} ${isEditDragging ? styles.editDragging : ''}`}
                  onClick={(e) => e.stopPropagation()}
                  onDragOver={handleEditDragOver}
                  onDragLeave={handleEditDragLeave}
                  onDrop={handleEditDrop}
                >
                  <textarea
                    className={styles.editInput}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="내용을 입력하세요 (이미지를 드래그해서 첨부할 수 있습니다)"
                    autoFocus
                  />

                  {/* Edit Images Preview */}
                  {editImages.length > 0 && (
                    <div className={styles.imagePreviewArea}>
                      {editImages.map((url, index) => (
                        <div key={index} className={styles.previewImageWrapper}>
                          <img src={url} alt={`Image ${index}`} className={styles.previewImage} />
                          <button
                            className={styles.removeImageBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditImages(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isEditUploading && (
                    <div className={styles.editUploadingIndicator}>
                      <i className="fa-solid fa-spinner fa-spin"></i> 업로드 중...
                    </div>
                  )}

                  <div className={styles.editActions}>
                    <div className={styles.editImageUpload}>
                      <input
                        type="file"
                        id={`edit-image-${post._id}`}
                        multiple
                        accept="image/*"
                        className={styles.hiddenInput}
                        onChange={handleEditImageUpload}
                        disabled={editImages.length >= MAX_IMAGES}
                      />
                      <label
                        htmlFor={`edit-image-${post._id}`}
                        className={`${styles.imageUploadBtn} ${editImages.length >= MAX_IMAGES ? styles.disabled : ''}`}
                      >
                        <i className="fa-regular fa-image"></i>
                        <span className={styles.imageCount}>{editImages.length}/{MAX_IMAGES}</span>
                      </label>
                    </div>
                    <div className={styles.editBtns}>
                      <button
                        className={styles.cancelBtn}
                        onClick={handleCancelEdit}
                      >
                        취소
                      </button>
                      <button
                        className={styles.saveBtn}
                        onClick={(e) => handleSaveEdit(e, post._id)}
                        disabled={isSavingEdit || isEditUploading}
                      >
                        {isSavingEdit ? "저장 중..." : "저장"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.postContent}>
                  {renderContentWithHashtags(post.content)}
                </div>
              )}
              
              {post.images && post.images.length > 0 && (
                <div className={styles.imagePlaceholder} style={{ background: 'none', height: 'auto', display: 'block' }}>
                  <img src={post.images[0]} alt="Post Image" className={styles.postImg} />
                  {post.images.length > 1 && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      + {post.images.length - 1} more images
                    </div>
                  )}
                </div>
              )}

              {/* 채택된 답변 미리보기 */}
              {post.acceptedComment && (
                <div className={styles.acceptedAnswerPreview}>
                  <div className={styles.acceptedAnswerHeader}>
                    <i className="fa-solid fa-check-circle"></i>
                    <span>채택된 답변</span>
                  </div>
                  <div className={styles.acceptedAnswerContent}>
                    <img
                      src={post.acceptedComment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.acceptedComment.author.id}`}
                      className={styles.acceptedAnswerAvatar}
                      alt="Answerer"
                    />
                    <div className={styles.acceptedAnswerText}>
                      <span className={styles.acceptedAnswerAuthor}>{post.acceptedComment.author.name}</span>
                      <p>{post.acceptedComment.content.length > 100
                        ? post.acceptedComment.content.slice(0, 100) + '...'
                        : post.acceptedComment.content}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.statItem}>
                  <i className="fa-regular fa-comment"></i> {post.commentCount || 0}
                </span>
                <button
                  className={`${styles.likeBtn} ${post.likedBy?.includes((session?.user as any)?.id) ? styles.liked : ''}`}
                  onClick={(e) => handleLike(e, post._id)}
                >
                  <i className={post.likedBy?.includes((session?.user as any)?.id) ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                  <span>{post.likes || 0}</span>
                </button>
                <span className={styles.statItem}>
                  <i className="fa-regular fa-eye"></i> {post.viewCount || 0}
                </span>
              </div>
            </article>
          ))}
          
        </main>

        {/* Sidebar (Trending) */}
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

            {trendingPosts.length > 0 ? (
              trendingPosts.map((post, index) => (
                <div
                  key={post._id}
                  className={styles.trendRow}
                  onClick={() => router.push(`/community/${post._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.trendRank}>{index + 1}</div>
                  <div className={styles.trendContent}>
                    <span className={styles.tTitle}>
                      {post.content.length > 25 ? post.content.slice(0, 25) + '...' : post.content}
                    </span>
                    <span className={styles.tMeta}>
                      조회 {post.recentViewCount || 0} · 댓글 {post.commentCount || 0}
                    </span>
                  </div>
                  <span
                    className={styles.tBadge}
                    style={
                      post.type === '정보'
                        ? { background: '#E8F5FD', color: 'var(--accent)' }
                        : post.type === '질문'
                        ? { background: '#FFF4E5', color: 'var(--warning)' }
                        : {}
                    }
                  >
                    {post.type}
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.emptyTrending}>
                아직 인기글이 없습니다
              </div>
            )}
          </div>

          {topAnswerers.length > 0 && (
            <div className={styles.widget}>
              <div className={styles.widgetH}>이번 주 지식인</div>
              {topAnswerers.map((answerer, index) => (
                <div key={answerer.userId} className={styles.answererRow}>
                  <span className={styles.answererRank} style={{
                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-sub)'
                  }}>
                    {index + 1}
                  </span>
                  <img
                    src={answerer.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${answerer.userId}`}
                    className={styles.answererAvatar}
                    alt={answerer.name}
                  />
                  <span className={styles.answererName}>{answerer.name}</span>
                  <span className={styles.answererCount}>{answerer.acceptCount}회 채택</span>
                </div>
              ))}
            </div>
          )}
        </aside>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>게시글 삭제</h3>
            </div>
            <div className={styles.modalBody}>
              <p>정말 이 게시글을 삭제하시겠습니까?</p>
              <p className={styles.modalWarning}>삭제된 게시글은 복구할 수 없습니다.</p>
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.modalCancelBtn}
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                취소
              </button>
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
    </>
  );
}
