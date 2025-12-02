"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getPost, incrementViewCount, deletePost, updatePost } from "@/actions/post";
import styles from "../community.module.css";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = use(params);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPost();
    incrementViewCount(id);

    // Close dropdown when clicking outside
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [id]);

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

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    setIsDeleting(true);
    const result = await deletePost(id);
    
    if (result.success) {
      alert("게시글이 삭제되었습니다.");
      router.push("/community");
    } else {
      alert(result.error || "삭제에 실패했습니다.");
      setIsDeleting(false);
    }
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
                        e.stopPropagation(); // Prevent bubbling
                        // Note: We don't need stopImmediatePropagation here because handleDelete navigates away or alerts
                        // But for consistency:
                        e.nativeEvent.stopImmediatePropagation();
                        handleDelete();
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '삭제 중...' : '삭제'}
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
            <span className={styles.statItem}>댓글 {post.commentCount || 0}</span>
            <span className={styles.statItem}>좋아요 {post.likes || 0}</span>
            <span className={styles.statItem}>조회 {post.views || 0}</span>
          </div>
        </article>
        
        <button className={styles.postBtn} onClick={() => router.back()} style={{ width: 'fit-content', marginTop: '20px' }}>
          목록으로
        </button>
      </main>
    </div>
  );
}
