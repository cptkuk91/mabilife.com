"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getPresignedUrlAction } from "@/actions/upload";
import { createPost, getPosts, deletePost, updatePost, getTrendingPosts, TrendingPeriod, toggleLike } from "@/actions/post";
import { getWeeklyTopAnswerers } from "@/actions/comment";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const pageClass =
  "mx-auto grid max-w-[var(--max-width)] grid-cols-1 gap-6 px-4 pb-24 pt-20 md:px-5 xl:grid-cols-[minmax(0,1fr)_340px]";
const feedSectionClass = "min-w-0 flex flex-col gap-4";
const cardClass = "rounded-[24px] bg-white p-5 shadow-elev-card";
const interactiveCardClass =
  "relative rounded-[24px] bg-white p-5 shadow-elev-card transition duration-200 hover:-translate-y-0.5 hover:shadow-elev-hover max-md:hover:translate-y-0";
const dropdownClass =
  "absolute right-0 top-full z-20 mt-2 min-w-[108px] overflow-hidden rounded-[14px] border border-black/8 bg-white py-1 shadow-elev-hover";
const dropdownItemClass =
  "block w-full px-4 py-2.5 text-left text-sm font-medium text-app-title transition hover:bg-app-bg";
const dangerDropdownItemClass = "text-[#FF3B30] hover:bg-[#FFF0F0]";
const menuButtonClass =
  "flex h-9 w-9 items-center justify-center rounded-[10px] text-app-body transition hover:bg-app-bg hover:text-app-title";
const actionButtonClass =
  "inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1 text-[13px] text-app-body transition hover:bg-[#FFF0F0] hover:text-[#FF3B30]";
const likedActionButtonClass = "text-[#FF3B30]";
const modalOverlayClass = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm";
const modalCardClass = "w-full max-w-[400px] rounded-[24px] bg-white p-7 shadow-elev-hover";
const modalActionsClass = "mt-6 flex justify-end gap-3";
const modalSecondaryButtonClass =
  "rounded-[12px] bg-app-bg px-5 py-2.5 text-sm font-semibold text-app-title transition hover:bg-black/[0.08]";
const modalDangerButtonClass =
  "rounded-[12px] bg-[#FF3B30] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#E02B21] disabled:cursor-not-allowed disabled:opacity-60";
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

export default function CommunityClient() {
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
  const [trendingPeriod, setTrendingPeriod] = useState<TrendingPeriod>("week");
  const [topAnswerers, setTopAnswerers] = useState<any[]>([]);
  const MAX_IMAGES = 5;

  useEffect(() => {
    loadPosts();
    loadTopAnswerers();

    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeTab]);

  useEffect(() => {
    loadTrendingPosts();
  }, [trendingPeriod]);

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

  const uploadFiles = async (imageFiles: File[], target: "create" | "edit") => {
    if (imageFiles.length === 0) return [];

    const currentCount = target === "create" ? uploadedImages.length : editImages.length;
    if (currentCount + imageFiles.length > MAX_IMAGES) {
      alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return [];
    }

    target === "create" ? setIsUploading(true) : setIsEditUploading(true);

    try {
      const uploadPromises = imageFiles.map(async (file) => {
        const { success, signedUrl, publicUrl, error } = await getPresignedUrlAction(file.name, file.type);

        if (!success || !signedUrl || !publicUrl) {
          console.error("Failed to get presigned URL:", error);
          return null;
        }

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });

        if (!uploadResponse.ok) {
          console.error("Failed to upload to S3");
          return null;
        }

        return publicUrl;
      });

      const results = await Promise.all(uploadPromises);
      return results.filter((url): url is string => url !== null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      return [];
    } finally {
      target === "create" ? setIsUploading(false) : setIsEditUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const uploaded = await uploadFiles(imageFiles, "create");
    if (uploaded.length > 0) {
      setUploadedImages((prev) => [...prev, ...uploaded]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const uploaded = await uploadFiles(imageFiles, "create");
    if (uploaded.length > 0) {
      setUploadedImages((prev) => [...prev, ...uploaded]);
    }
    e.target.value = "";
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
        type: postType as "잡담" | "질문" | "정보",
        images: uploadedImages,
      });

      if (result.success) {
        setContent("");
        setUploadedImages([]);
        setPostType("잡담");
        loadPosts();
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
      setPosts(
        posts.map((post) => {
          if (post._id === postId) {
            const userId = (session.user as any).id;
            const isCurrentlyLiked = post.likedBy?.includes(userId);
            return {
              ...post,
              likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1,
              likedBy: isCurrentlyLiked
                ? post.likedBy.filter((id: string) => id !== userId)
                : [...(post.likedBy || []), userId],
            };
          }
          return post;
        }),
      );
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

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const uploaded = await uploadFiles(imageFiles, "edit");
    if (uploaded.length > 0) {
      setEditImages((prev) => [...prev, ...uploaded]);
    }
    e.target.value = "";
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
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const uploaded = await uploadFiles(imageFiles, "edit");
    if (uploaded.length > 0) {
      setEditImages((prev) => [...prev, ...uploaded]);
    }
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

  const currentUserId = (session?.user as any)?.id;

  return (
    <>
      <div className={pageClass}>
        <main className={feedSectionClass}>
          <div className={cn(cardClass, "relative overflow-hidden")}>
            {!session && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-[24px] bg-white/70 backdrop-blur-sm">
                <p className="text-[16px] font-semibold text-app-title">로그인하고 글을 작성해보세요!</p>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="rounded-full bg-app-accent px-6 py-2.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition hover:bg-[#0062CC]"
                >
                  로그인하기
                </button>
              </div>
            )}

            <div
              className={cn(
                "relative flex gap-3 rounded-[16px] p-2 transition",
                !session && "pointer-events-none select-none blur-[4px]",
                isDragging && "bg-[#0071E3]/5 outline outline-2 outline-dashed outline-app-accent",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Image
                src={
                  session?.user?.image ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${(session?.user as any)?.id || "Me"}`
                }
                className="h-10 w-10 rounded-full bg-black/10 object-cover"
                alt="My Avatar"
                width={40}
                height={40}
              />

              <div className="relative mt-2 min-h-[150px] flex-1">
                <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden whitespace-pre-wrap break-words px-0.5 py-0.5 text-[16px] leading-6 text-app-title">
                  {renderContentWithHashtags(content)}
                </div>

                <textarea
                  className={cn(
                    "absolute inset-0 z-[2] h-full w-full resize-none border-none bg-transparent px-0.5 py-0.5 text-[16px] leading-6 outline-none placeholder:text-app-body/60",
                    content && "text-transparent caret-app-title",
                  )}
                  rows={6}
                  placeholder="무슨 생각을 하고 계신가요? (이미지를 드래그해서 첨부할 수 있습니다)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  spellCheck={false}
                  disabled={!session}
                ></textarea>
              </div>

              {isUploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[16px] bg-white/80 text-2xl text-app-accent">
                  <i className="fa-solid fa-spinner fa-spin"></i>
                </div>
              )}
            </div>

            {uploadedImages.length > 0 && (
              <div className={cn("mt-3 flex gap-2.5 overflow-x-auto pb-1", !session && "pointer-events-none select-none blur-[4px]")}>
                {uploadedImages.map((url, index) => (
                  <div key={index} className="relative h-20 w-20 shrink-0">
                    <img src={url} alt={`Uploaded ${index}`} className="h-full w-full rounded-[10px] border border-black/8 object-cover" />
                    <button
                      type="button"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3B30] text-[11px] text-white shadow"
                      onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className={cn(
                "mt-4 flex flex-col gap-3 border-t border-black/8 pt-4 sm:flex-row sm:items-center sm:justify-between",
                !session && "pointer-events-none select-none blur-[4px]",
              )}
            >
              <div className="flex flex-wrap gap-2">
                {["잡담", "질문", "정보"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={cn(
                      "rounded-full border border-black/10 bg-white px-3 py-1.5 text-[13px] font-semibold text-app-body transition hover:bg-app-bg hover:text-app-title disabled:cursor-not-allowed disabled:opacity-50",
                      postType === type && "border-app-title bg-app-title text-white hover:bg-app-title hover:text-white",
                    )}
                    onClick={() => setPostType(type)}
                    disabled={!session}
                  >
                    {type === "질문" ? "질문" : type}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <div className="relative">
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploadedImages.length >= MAX_IMAGES || !session}
                  />
                  <label
                    htmlFor="image-upload"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[15px] text-app-accent transition hover:bg-[#0071E3]/5",
                      (uploadedImages.length >= MAX_IMAGES || !session) && "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <i className="fa-regular fa-image"></i>
                    <span className="text-[13px] font-semibold text-app-body">
                      {uploadedImages.length}/{MAX_IMAGES}
                    </span>
                  </label>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-app-accent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handlePostSubmit}
                  disabled={isSubmitting || !session}
                >
                  {isSubmitting ? "등록 중..." : "게시"}
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-app-body"></i>
            <input
              type="text"
              className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-app-title outline-none transition focus:border-app-accent focus:shadow-[0_0_0_3px_rgba(0,113,227,0.1)] placeholder:text-app-body"
              placeholder="태그나 내용을 검색해보세요 (예: #마비노기)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex rounded-[14px] bg-white p-1 shadow-elev-card">
            {["전체", "잡담", "질문", "정보"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "flex-1 rounded-[10px] px-3 py-2.5 text-sm font-semibold text-app-body transition hover:bg-app-bg",
                  activeTab === tab && "bg-app-title text-white hover:bg-app-title",
                )}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "질문" ? "Q&A" : tab}
              </button>
            ))}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-[24px] bg-white px-6 py-16 text-center text-sm text-app-body shadow-elev-card">
              표시할 게시글이 없습니다.
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post._id}
                className={interactiveCardClass}
                onClick={() => router.push(`/community/${post._id}`)}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <Image
                      src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`}
                      className="h-9 w-9 rounded-full bg-black/10 object-cover"
                      alt="User Avatar"
                      width={36}
                      height={36}
                    />
                    <div className="min-w-0 flex flex-col">
                      <span className="truncate text-[14px] font-bold text-app-title">{post.author.name}</span>
                      <span className="text-[12px] text-app-body">
                        {new Date(post.createdAt).toLocaleString()}
                        {post.updatedAt !== post.createdAt && <span className="italic text-app-body/80"> · 수정됨</span>}
                      </span>
                    </div>
                  </div>

                  <div className={getPostBadgeClass(post.type, post.isSolved)}>{getPostBadgeText(post.type, post.isSolved)}</div>

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
                          setActiveDropdown(activeDropdown === post._id ? null : post._id);
                        }}
                        aria-label="게시글 메뉴"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>

                      {activeDropdown === post._id && (
                        <div className={dropdownClass}>
                          <button
                            type="button"
                            className={dropdownItemClass}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.nativeEvent.stopImmediatePropagation();
                              handleStartEdit(e, post);
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
                    className={cn(
                      "rounded-[16px] p-2 transition",
                      isEditDragging && "bg-[#0071E3]/5 outline outline-2 outline-dashed outline-app-accent",
                    )}
                    onClick={(e) => e.stopPropagation()}
                    onDragOver={handleEditDragOver}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                  >
                    <textarea
                      className="mb-3 min-h-[200px] w-full rounded-[12px] border border-black/10 bg-white px-4 py-4 text-[16px] leading-6 text-app-title outline-none transition focus:border-app-accent"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="내용을 입력하세요 (이미지를 드래그해서 첨부할 수 있습니다)"
                      autoFocus
                    />

                    {editImages.length > 0 && (
                      <div className="mb-3 flex gap-2.5 overflow-x-auto pb-1">
                        {editImages.map((url, index) => (
                          <div key={index} className="relative h-20 w-20 shrink-0">
                            <img src={url} alt={`Image ${index}`} className="h-full w-full rounded-[10px] border border-black/8 object-cover" />
                            <button
                              type="button"
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#FF3B30] text-[11px] text-white shadow"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditImages((prev) => prev.filter((_, i) => i !== index));
                              }}
                            >
                              <i className="fa-solid fa-xmark"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {isEditUploading && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-app-accent">
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        업로드 중...
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center">
                        <input
                          type="file"
                          id={`edit-image-${post._id}`}
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleEditImageUpload}
                          disabled={editImages.length >= MAX_IMAGES}
                        />
                        <label
                          htmlFor={`edit-image-${post._id}`}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[15px] text-app-accent transition hover:bg-[#0071E3]/5",
                            editImages.length >= MAX_IMAGES && "cursor-not-allowed opacity-50 hover:bg-transparent",
                          )}
                        >
                          <i className="fa-regular fa-image"></i>
                          <span className="text-[13px] font-semibold text-app-body">
                            {editImages.length}/{MAX_IMAGES}
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-[10px] border border-black/10 bg-app-bg px-4 py-2 text-sm font-medium text-app-body transition hover:bg-black/[0.08]"
                          onClick={handleCancelEdit}
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          className="rounded-[10px] bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0062CC] disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={(e) => handleSaveEdit(e, post._id)}
                          disabled={isSavingEdit || isEditUploading}
                        >
                          {isSavingEdit ? "저장 중..." : "저장"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 whitespace-pre-wrap break-words text-[16px] leading-6 text-app-title">
                    {renderContentWithHashtags(post.content)}
                  </div>
                )}

                {post.images && post.images.length > 0 && (
                  <div className="mb-3">
                    <Image
                      src={post.images[0]}
                      alt="Post Image"
                      className="h-auto w-full rounded-[16px] border border-black/8 object-cover"
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: "100%", height: "auto" }}
                    />
                    {post.images.length > 1 && (
                      <div className="mt-1 text-[12px] text-app-body">+ {post.images.length - 1} more images</div>
                    )}
                  </div>
                )}

                {post.acceptedComment && (
                  <div className="mb-3 rounded-[16px] border border-[#34C759]/15 bg-[#34C759]/5 p-4">
                    <div className="mb-3 flex items-center gap-1.5 text-[12px] font-semibold text-[#34C759]">
                      <i className="fa-solid fa-check-circle"></i>
                      <span>채택된 답변</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Image
                        src={
                          post.acceptedComment.author.image ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.acceptedComment.author.id}`
                        }
                        className="h-7 w-7 rounded-full bg-black/10 object-cover"
                        alt="Answerer"
                        width={28}
                        height={28}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="mb-1 block text-[12px] font-semibold text-app-title">
                          {post.acceptedComment.author.name}
                        </span>
                        <p className="overflow-hidden text-[13px] leading-5 text-app-body [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                          {post.acceptedComment.content.length > 100
                            ? `${post.acceptedComment.content.slice(0, 100)}...`
                            : post.acceptedComment.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-app-body">
                  <span className="inline-flex items-center gap-1.5">
                    <i className="fa-regular fa-comment"></i>
                    {post.commentCount || 0}
                  </span>
                  <button
                    type="button"
                    className={cn(actionButtonClass, post.likedBy?.includes(currentUserId) && likedActionButtonClass)}
                    onClick={(e) => handleLike(e, post._id)}
                  >
                    <i
                      className={
                        post.likedBy?.includes(currentUserId) ? "fa-solid fa-heart" : "fa-regular fa-heart"
                      }
                    ></i>
                    <span>{post.likes || 0}</span>
                  </button>
                  <span className="inline-flex items-center gap-1.5">
                    <i className="fa-regular fa-eye"></i>
                    {post.viewCount || 0}
                  </span>
                </div>
              </article>
            ))
          )}
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
              {trendingPosts.map((post, index) => (
                <div
                  key={post._id}
                  className="mx-[-8px] flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2.5 transition hover:bg-app-bg"
                  onClick={() => router.push(`/community/${post._id}`)}
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
                      {post.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <div className="mb-4 text-[16px] font-extrabold text-app-title">이번 주 답변왕 🏆</div>
            <div className="flex flex-col">
              {topAnswerers.map((user, index) => (
                <div
                  key={user._id}
                  className={cn("flex items-center gap-3 py-2", index !== topAnswerers.length - 1 && "border-b border-black/8")}
                >
                  <div className="w-5 shrink-0 text-center text-[14px] font-bold text-app-title">{index + 1}</div>
                  <img
                    src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`}
                    className="h-8 w-8 shrink-0 rounded-full bg-black/10 object-cover"
                    alt="User"
                  />
                  <div className="flex-1 truncate text-[14px] font-semibold text-app-title">{user.name}</div>
                  <div className="rounded-full bg-[#34C759]/10 px-2 py-1 text-[12px] font-semibold text-[#34C759]">
                    채택 답변 {user.acceptedCount}개
                  </div>
                </div>
              ))}
              {topAnswerers.length === 0 && (
                <div className="py-5 text-center text-[13px] text-app-body">아직 이번 주 답변왕이 없습니다.</div>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <div className="mb-4 text-[16px] font-extrabold text-app-title">커뮤니티 수칙</div>
            <div className="flex flex-col gap-2">
              <div className="text-[14px] leading-6 text-app-body">• 서로 존중하고 배려하는 언어를 사용해주세요.</div>
              <div className="text-[14px] leading-6 text-app-body">• 불법 프로그램이나 버그 악용 공유는 금지됩니다.</div>
              <div className="text-[14px] leading-6 text-app-body">• 도배나 광고성 게시글은 삭제될 수 있습니다.</div>
              <div className="text-[14px] leading-6 text-app-body">• 개인정보 유출에 주의해주세요.</div>
            </div>
          </div>
        </aside>
      </div>

      {showDeleteModal && (
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
    </>
  );
}
