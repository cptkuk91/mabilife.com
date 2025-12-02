"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getPresignedUrlAction } from "@/actions/upload";
import { createPost, getPosts, deletePost } from "@/actions/post";
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
  const MAX_IMAGES = 5;

  useEffect(() => {
    loadPosts();

    // Close dropdown when clicking outside
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeTab]); // Reload when tab changes

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

  const handleDelete = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const result = await deletePost(postId);
    
    if (result.success) {
      alert("게시글이 삭제되었습니다.");
      loadPosts();
    } else {
      alert(result.error || "삭제에 실패했습니다.");
    }
    setActiveDropdown(null);
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
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me" className={styles.myAvatar} alt="My Avatar" />
              
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
                          }}
                        >
                          수정
                        </button>
                        <button 
                          className={`${styles.dropdownItem} ${styles.delete}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handleDelete(e, post._id);
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.postContent}>
                {renderContentWithHashtags(post.content)}
              </div>
              
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

              <div className={styles.cardFooter}>
                <span className={styles.statItem}>댓글 {post.commentCount || 0}</span>
                <span className={styles.statItem}>좋아요 {post.likes || 0}</span>
              </div>
            </article>
          ))}
          
        </main>

        {/* Sidebar (Trending) */}
        <aside className={styles.sidebar}>
          <div className={styles.widget}>
            <div className={styles.widgetH}>실시간 인기글</div>
            
            <div className={styles.trendRow}>
              <div>
                <span className={styles.tTitle}>류트 서버 1채널 마비됐나요?</span>
                <span className={styles.tMeta}>조회 1.2k · 댓글 45</span>
              </div>
              <span className={styles.tBadge}>잡담</span>
            </div>
            
            <div className={styles.trendRow}>
              <div>
                <span className={styles.tTitle}>이번 키트 의상 염색 코드 공유 (리블)</span>
                <span className={styles.tMeta}>조회 800 · 좋아요 120</span>
              </div>
              <span className={styles.tBadge} style={{background:'#E8F5FD', color:'var(--accent)'}}>정보</span>
            </div>

            <div className={styles.trendRow}>
              <div>
                <span className={styles.tTitle}>정령 밥 줄 때 주의사항 (필독)</span>
                <span className={styles.tMeta}>조회 500 · 답변 12</span>
              </div>
              <span className={styles.tBadge} style={{background:'#FFF4E5', color:'var(--warning)'}}>질문</span>
            </div>
          </div>

          <div className={styles.widget}>
            <div className={styles.widgetH}>이번 주 지식인</div>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
              <span style={{fontWeight:700, color:'#FFD700'}}>1</span>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Master" style={{width:'30px', borderRadius:'50%'}} alt="Rank 1" />
              <span style={{fontSize:'14px', fontWeight:600}}>마비박사</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontWeight:700, color:'#C0C0C0'}}>2</span>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Help" style={{width:'30px', borderRadius:'50%'}} alt="Rank 2" />
              <span style={{fontSize:'14px', fontWeight:600}}>친절한시민</span>
            </div>
          </div>
        </aside>

      </div>
    </>
  );
}
