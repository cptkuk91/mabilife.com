"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getPresignedUrlAction } from "@/actions/upload";
import { createPost, getPosts, deletePost, updatePost, getTrendingPosts, TrendingPeriod, toggleLike } from "@/actions/post";
import { getWeeklyTopAnswerers } from "@/actions/comment";

/* ─── Helpers ────────────────────────────────────────── */

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

/* ─── Component ──────────────────────────────────────── */

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

  useEffect(() => { loadPosts(); loadTopAnswerers(); const h = () => setActiveDropdown(null); document.addEventListener("click", h); return () => document.removeEventListener("click", h); }, [activeTab]);
  useEffect(() => { loadTrendingPosts(); }, [trendingPeriod]);
  useEffect(() => { const t = setTimeout(() => loadPosts(), 500); return () => clearTimeout(t); }, [searchQuery]);

  const loadPosts = async () => { const r = await getPosts(1, 20, activeTab, searchQuery); if (r.success) setPosts(r.posts); };
  const loadTrendingPosts = async () => { const r = await getTrendingPosts(trendingPeriod, 5); if (r.success) setTrendingPosts(r.posts); };
  const loadTopAnswerers = async () => { const r = await getWeeklyTopAnswerers(5); if (r.success) setTopAnswerers(r.answerers); };

  /* ── Upload helpers ── */
  const uploadFiles = async (files: File[], target: "create" | "edit") => {
    if (!files.length) return [];
    const cur = target === "create" ? uploadedImages.length : editImages.length;
    if (cur + files.length > MAX_IMAGES) { alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`); return []; }
    target === "create" ? setIsUploading(true) : setIsEditUploading(true);
    try {
      const results = await Promise.all(files.map(async (f) => {
        const { success, signedUrl, publicUrl } = await getPresignedUrlAction(f.name, f.type);
        if (!success || !signedUrl || !publicUrl) return null;
        const r = await fetch(signedUrl, { method: "PUT", body: f, headers: { "Content-Type": f.type } });
        return r.ok ? publicUrl : null;
      }));
      return results.filter((u): u is string => u !== null);
    } catch { alert("이미지 업로드 중 오류가 발생했습니다."); return []; }
    finally { target === "create" ? setIsUploading(false) : setIsEditUploading(false); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); const imgs = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")); const u = await uploadFiles(imgs, "create"); if (u.length) setUploadedImages(p => [...p, ...u]); };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files) return; const imgs = Array.from(e.target.files).filter(f => f.type.startsWith("image/")); const u = await uploadFiles(imgs, "create"); if (u.length) setUploadedImages(p => [...p, ...u]); e.target.value = ""; };

  /* ── Post actions ── */
  const handlePostSubmit = async () => {
    if (!content.trim()) { alert("내용을 입력해주세요."); return; }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { const r = await createPost({ content, type: postType as "잡담" | "질문" | "정보", images: uploadedImages }); if (r.success) { setContent(""); setUploadedImages([]); setPostType("잡담"); loadPosts(); } else { alert(r.error || "게시글 등록에 실패했습니다."); } }
    catch { alert("오류가 발생했습니다."); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setDeleteTargetId(id); setShowDeleteModal(true); setActiveDropdown(null); };
  const handleDeleteConfirm = async () => { if (!deleteTargetId) return; setIsDeleting(true); const r = await deletePost(deleteTargetId); if (r.success) loadPosts(); else alert(r.error || "삭제에 실패했습니다."); setIsDeleting(false); setShowDeleteModal(false); setDeleteTargetId(null); };
  const handleDeleteCancel = () => { setShowDeleteModal(false); setDeleteTargetId(null); };

  const handleLike = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!session?.user) { alert("로그인이 필요합니다."); return; }
    const r = await toggleLike(postId);
    if (r.success) {
      setPosts(posts.map(p => {
        if (p._id === postId) { const uid = (session.user as any).id; const liked = p.likedBy?.includes(uid); return { ...p, likes: liked ? p.likes - 1 : p.likes + 1, likedBy: liked ? p.likedBy.filter((id: string) => id !== uid) : [...(p.likedBy || []), uid] }; }
        return p;
      }));
    } else alert(r.error || "좋아요 처리에 실패했습니다.");
  };

  const handleStartEdit = (e: React.MouseEvent, post: any) => { e.stopPropagation(); setEditingPostId(post._id); setEditContent(post.content); setEditImages(post.images || []); setActiveDropdown(null); };
  const handleCancelEdit = (e: React.MouseEvent) => { e.stopPropagation(); setEditingPostId(null); setEditContent(""); setEditImages([]); };
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files) return; const imgs = Array.from(e.target.files).filter(f => f.type.startsWith("image/")); const u = await uploadFiles(imgs, "edit"); if (u.length) setEditImages(p => [...p, ...u]); e.target.value = ""; };
  const handleEditDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsEditDragging(true); };
  const handleEditDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsEditDragging(false); };
  const handleEditDrop = async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsEditDragging(false); const imgs = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")); const u = await uploadFiles(imgs, "edit"); if (u.length) setEditImages(p => [...p, ...u]); };
  const handleSaveEdit = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    if (!editContent.trim()) { alert("내용을 입력해주세요."); return; }
    setIsSavingEdit(true);
    try { const r = await updatePost(postId, editContent, editImages); if (r.success) { setEditingPostId(null); setEditContent(""); setEditImages([]); loadPosts(); } else alert(r.error || "수정에 실패했습니다."); }
    catch { alert("오류가 발생했습니다."); }
    finally { setIsSavingEdit(false); }
  };

  const renderHashtags = (text: string) =>
    text.split("\n").map((line, li) => (
      <div key={li} className="min-h-[1.5em]">
        {line.split(/((?:^|\s)#[^\s#]+)/g).map((part, pi) =>
          part.trim().startsWith("#")
            ? <span key={pi} className="rounded-md bg-[#E8F0FE] px-1 py-0.5 font-semibold text-[#2F80ED]">{part}</span>
            : <span key={pi}>{part}</span>
        )}
        {line === "" && <br />}
      </div>
    ));

  const currentUserId = (session?.user as any)?.id;

  return (
    <>
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-6 bg-white px-5 pb-24 pt-16 sm:px-6 md:pb-16 md:pt-20 lg:px-8 xl:grid-cols-[minmax(0,1fr)_300px]">

        {/* ── Feed Column ── */}
        <main className="flex min-w-0 flex-col gap-4">

          {/* ── Compose Card ── */}
          <div className="relative overflow-hidden rounded-xl border border-[#E3E2DE] bg-white p-4">
            {!session && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/80 backdrop-blur-sm">
                <p className="text-[15px] font-semibold text-[#37352F]">로그인하고 글을 작성해보세요!</p>
                <button type="button" onClick={() => router.push("/login")} className={cn("rounded-lg bg-[#2F80ED] px-5 py-2 text-[13px] font-medium text-white transition hover:bg-[#1A66CC]", fr)}>
                  로그인하기
                </button>
              </div>
            )}

            <div
              className={cn("relative flex gap-3 rounded-lg p-1 transition", !session && "pointer-events-none select-none blur-[4px]", isDragging && "bg-[#2F80ED]/5 outline outline-2 outline-dashed outline-[#2F80ED]")}
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
              <Image src={session?.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(session?.user as any)?.id || "anonymous"}`} className="size-9 rounded-full border border-[#E3E2DE] object-cover" alt="Avatar" width={36} height={36} />
              <div className="relative mt-1 min-h-[120px] flex-1">
                <div className="pointer-events-none absolute inset-0 z-[1] whitespace-pre-wrap break-words px-0.5 py-0.5 text-[14px] leading-6 text-[#37352F]">{renderHashtags(content)}</div>
                <textarea
                  className={cn("absolute inset-0 z-[2] h-full w-full resize-none border-none bg-transparent px-0.5 py-0.5 text-[14px] leading-6 outline-none placeholder:text-[#C4C4C0]", content && "text-transparent caret-[#37352F]")}
                  rows={5} placeholder="무슨 생각을 하고 계신가요?" value={content} onChange={e => setContent(e.target.value)} spellCheck={false} disabled={!session}
                />
              </div>
              {isUploading && <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80 text-[20px] text-[#2F80ED]"><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /></div>}
            </div>

            {uploadedImages.length > 0 && (
              <div className={cn("mt-3 flex gap-2 overflow-x-auto pb-1", !session && "pointer-events-none select-none blur-[4px]")}>
                {uploadedImages.map((url, i) => (
                  <div key={i} className="relative size-16 shrink-0">
                    <img src={url} alt={`Uploaded ${i}`} className="size-full rounded-lg border border-[#E3E2DE] object-cover" />
                    <button type="button" className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#EB5757] text-[9px] text-white shadow" onClick={() => setUploadedImages(p => p.filter((_, j) => j !== i))}>
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={cn("mt-3 flex flex-col gap-3 border-t border-[#F1F1EF] pt-3 sm:flex-row sm:items-center sm:justify-between", !session && "pointer-events-none select-none blur-[4px]")}>
              <div className="flex gap-1.5">
                {["잡담", "질문", "정보"].map(t => (
                  <button key={t} type="button" disabled={!session}
                    className={cn("rounded-md px-3 py-1.5 text-[12px] font-medium transition", postType === t ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]", fr)}
                    onClick={() => setPostType(t)}
                  >{t}</button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <div className="relative">
                  <input type="file" id="image-upload" multiple accept="image/*" className="hidden" onChange={handleFileSelect} disabled={uploadedImages.length >= MAX_IMAGES || !session} />
                  <label htmlFor="image-upload" className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[#2F80ED] transition hover:bg-[#E8F0FE]", (uploadedImages.length >= MAX_IMAGES || !session) && "cursor-not-allowed opacity-50")}>
                    <i className="fa-regular fa-image" aria-hidden="true" />
                    <span className="text-[12px] text-[#9B9A97]">{uploadedImages.length}/{MAX_IMAGES}</span>
                  </label>
                </div>
                <button type="button" className={cn("rounded-lg bg-[#2F80ED] px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-60", fr)} onClick={handlePostSubmit} disabled={isSubmitting || !session}>
                  {isSubmitting ? "등록 중..." : "게시"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-[#B4B4B0]" aria-hidden="true" />
            <input type="text" className={cn("w-full rounded-xl border border-[#E3E2DE] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#37352F] outline-none transition focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)] placeholder:text-[#C4C4C0]", fr)}
              placeholder="태그나 내용을 검색해보세요" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-1.5">
            {["전체", "잡담", "질문", "정보"].map(tab => (
              <button key={tab} type="button"
                className={cn("rounded-md px-3 py-1.5 text-[13px] font-medium transition", activeTab === tab ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]", fr)}
                onClick={() => setActiveTab(tab)}
              >{tab === "질문" ? "Q&A" : tab}</button>
            ))}
          </div>

          {/* ── Posts ── */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[20px] text-[#B4B4B0]"><i className="fa-regular fa-comment-dots" aria-hidden="true" /></div>
              <p className="mt-3 text-[14px] text-[#9B9A97]">표시할 게시글이 없습니다.</p>
            </div>
          ) : posts.map(post => (
            <article key={post._id} className="cursor-pointer rounded-xl border border-[#E3E2DE] bg-white p-4 transition-all duration-200 hover:border-[#D3D1CB] hover:bg-[#FBFBFA]" onClick={() => router.push(`/community/${post._id}`)}>
              {/* Header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Image src={post.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`} className="size-8 rounded-full border border-[#E3E2DE] object-cover" alt="Avatar" width={32} height={32} />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-bold text-[#37352F]">{post.author.name}</span>
                    <span className="text-[11px] text-[#B4B4B0]">
                      {new Date(post.createdAt).toLocaleString()}
                      {post.updatedAt !== post.createdAt && <span className="italic"> · 수정됨</span>}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold", badgeStyle(post.type, post.isSolved))}>{badgeText(post.type, post.isSolved)}</span>
                  {currentUserId === post.author.id && (
                    <div className="relative" onClick={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}>
                      <button type="button" className="flex size-7 items-center justify-center rounded-md text-[#B4B4B0] transition hover:bg-[#F7F6F3] hover:text-[#787774]" onClick={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); setActiveDropdown(activeDropdown === post._id ? null : post._id); }} aria-label="메뉴">
                        <i className="fa-solid fa-ellipsis-vertical text-[12px]" aria-hidden="true" />
                      </button>
                      {activeDropdown === post._id && (
                        <div className="absolute right-0 top-full z-20 mt-1 min-w-[100px] overflow-hidden rounded-lg border border-[#E3E2DE] bg-white py-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                          <button type="button" className="block w-full px-3 py-2 text-left text-[12px] font-medium text-[#37352F] transition hover:bg-[#F7F6F3]" onClick={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleStartEdit(e, post); }}>수정</button>
                          <button type="button" className="block w-full px-3 py-2 text-left text-[12px] font-medium text-[#EB5757] transition hover:bg-[#FEF0F0]" onClick={e => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); handleDeleteClick(e, post._id); }}>삭제</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              {editingPostId === post._id ? (
                <div className={cn("rounded-lg p-1 transition", isEditDragging && "bg-[#2F80ED]/5 outline outline-2 outline-dashed outline-[#2F80ED]")} onClick={e => e.stopPropagation()} onDragOver={handleEditDragOver} onDragLeave={handleEditDragLeave} onDrop={handleEditDrop}>
                  <textarea className={cn("mb-2 min-h-[160px] w-full rounded-lg border border-[#E3E2DE] bg-white px-3 py-3 text-[14px] leading-6 text-[#37352F] outline-none transition focus:border-[#2F80ED]", fr)} value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="내용을 입력하세요" autoFocus />
                  {editImages.length > 0 && (
                    <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                      {editImages.map((url, i) => (<div key={i} className="relative size-16 shrink-0"><img src={url} alt={`Image ${i}`} className="size-full rounded-lg border border-[#E3E2DE] object-cover" /><button type="button" className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#EB5757] text-[9px] text-white shadow" onClick={e => { e.stopPropagation(); setEditImages(p => p.filter((_, j) => j !== i)); }}><i className="fa-solid fa-xmark" aria-hidden="true" /></button></div>))}
                    </div>
                  )}
                  {isEditUploading && <div className="mb-2 flex items-center gap-1.5 text-[12px] text-[#2F80ED]"><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> 업로드 중...</div>}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div><input type="file" id={`edit-image-${post._id}`} multiple accept="image/*" className="hidden" onChange={handleEditImageUpload} disabled={editImages.length >= MAX_IMAGES} /><label htmlFor={`edit-image-${post._id}`} className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-[#2F80ED] hover:bg-[#E8F0FE]", editImages.length >= MAX_IMAGES && "cursor-not-allowed opacity-50")}><i className="fa-regular fa-image" aria-hidden="true" /><span className="text-[12px] text-[#9B9A97]">{editImages.length}/{MAX_IMAGES}</span></label></div>
                    <div className="flex gap-2">
                      <button type="button" className={cn("rounded-lg bg-[#F7F6F3] px-3 py-1.5 text-[12px] font-medium text-[#787774] transition hover:bg-[#F1F1EF]", fr)} onClick={handleCancelEdit}>취소</button>
                      <button type="button" className={cn("rounded-lg bg-[#2F80ED] px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-[#1A66CC] disabled:cursor-not-allowed disabled:opacity-60", fr)} onClick={e => handleSaveEdit(e, post._id)} disabled={isSavingEdit || isEditUploading}>{isSavingEdit ? "저장 중..." : "저장"}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-3 whitespace-pre-wrap break-words text-[14px] leading-6 text-[#37352F]">{renderHashtags(post.content)}</div>
              )}

              {/* Image */}
              {post.images?.length > 0 && (
                <div className="mb-3">
                  <Image src={post.images[0]} alt="Post" className="h-auto w-full rounded-xl border border-[#E3E2DE] object-cover" width={0} height={0} sizes="100vw" style={{ width: "100%", height: "auto" }} />
                  {post.images.length > 1 && <div className="mt-1 text-[11px] text-[#B4B4B0]">+ {post.images.length - 1} more images</div>}
                </div>
              )}

              {/* Accepted Answer */}
              {post.acceptedComment && (
                <div className="mb-3 rounded-xl border border-[#27AE60]/15 bg-[#27AE60]/5 p-3">
                  <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold text-[#27AE60]"><i className="fa-solid fa-check-circle" aria-hidden="true" /> 채택된 답변</div>
                  <div className="flex items-start gap-2.5">
                    <Image src={post.acceptedComment.author.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.acceptedComment.author.id}`} className="size-6 rounded-full border border-[#E3E2DE] object-cover" alt="Answerer" width={24} height={24} />
                    <div className="min-w-0 flex-1">
                      <span className="mb-0.5 block text-[11px] font-semibold text-[#37352F]">{post.acceptedComment.author.name}</span>
                      <p className="line-clamp-2 text-[12px] leading-5 text-[#787774]">{post.acceptedComment.content.length > 100 ? `${post.acceptedComment.content.slice(0, 100)}...` : post.acceptedComment.content}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 text-[12px] text-[#9B9A97]">
                <span className="inline-flex items-center gap-1"><i className="fa-regular fa-comment" aria-hidden="true" /> {post.commentCount || 0}</span>
                <button type="button" className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-[#FEF0F0] hover:text-[#EB5757]", post.likedBy?.includes(currentUserId) && "text-[#EB5757]")} onClick={e => handleLike(e, post._id)}>
                  <i className={post.likedBy?.includes(currentUserId) ? "fa-solid fa-heart" : "fa-regular fa-heart"} aria-hidden="true" /> {post.likes || 0}
                </button>
                <span className="inline-flex items-center gap-1"><i className="fa-regular fa-eye" aria-hidden="true" /> {post.viewCount || 0}</span>
              </div>
            </article>
          ))}
        </main>

        {/* ── Sidebar ── */}
        <aside className="sticky top-14 hidden flex-col gap-4 self-start xl:flex">
          {/* Trending */}
          <div className="rounded-xl border border-[#E3E2DE] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#37352F]">실시간 인기글</h3>
              <div className="flex gap-0.5 rounded-md bg-[#F7F6F3] p-0.5">
                {(["week", "month"] as TrendingPeriod[]).map(p => (
                  <button key={p} type="button" className={cn("rounded-md px-2.5 py-1 text-[11px] font-medium transition", trendingPeriod === p ? "bg-white text-[#37352F] shadow-sm" : "text-[#9B9A97] hover:text-[#787774]")} onClick={() => setTrendingPeriod(p)}>
                    {p === "week" ? "주간" : "월간"}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              {trendingPosts.map((post, i) => (
                <div key={post._id} className="flex cursor-pointer items-center gap-2.5 rounded-lg py-2 transition hover:bg-[#F7F6F3]" onClick={() => router.push(`/community/${post._id}`)}>
                  <span className={cn("flex size-5 shrink-0 items-center justify-center text-[11px] font-bold", i < 3 ? "text-[#EB5757]" : "text-[#B4B4B0]")}>{i + 1}</span>
                  <div className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#37352F]">{post.content}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Answerers */}
          <div className="rounded-xl border border-[#E3E2DE] p-4">
            <h3 className="mb-3 text-[14px] font-bold text-[#37352F]">이번 주 답변왕 🏆</h3>
            <div className="flex flex-col">
              {topAnswerers.map((user, i) => (
                <div key={user._id} className={cn("flex items-center gap-2.5 py-2", i !== topAnswerers.length - 1 && "border-b border-[#F1F1EF]")}>
                  <div className="w-4 shrink-0 text-center text-[12px] font-bold text-[#37352F]">{i + 1}</div>
                  <img src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user._id}`} className="size-7 shrink-0 rounded-full border border-[#E3E2DE] object-cover" alt="User" />
                  <div className="flex-1 truncate text-[13px] font-medium text-[#37352F]">{user.name}</div>
                  <div className="rounded-md bg-[#27AE60]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#27AE60]">채택 {user.acceptedCount}개</div>
                </div>
              ))}
              {topAnswerers.length === 0 && <div className="py-5 text-center text-[12px] text-[#B4B4B0]">아직 이번 주 답변왕이 없습니다.</div>}
            </div>
          </div>

          {/* Rules */}
          <div className="rounded-xl border border-[#E3E2DE] p-4">
            <h3 className="mb-3 text-[14px] font-bold text-[#37352F]">커뮤니티 수칙</h3>
            <div className="flex flex-col gap-1.5">
              <div className="text-[12px] leading-5 text-[#787774]">• 서로 존중하고 배려하는 언어를 사용해주세요.</div>
              <div className="text-[12px] leading-5 text-[#787774]">• 불법 프로그램이나 버그 악용 공유는 금지됩니다.</div>
              <div className="text-[12px] leading-5 text-[#787774]">• 도배나 광고성 게시글은 삭제될 수 있습니다.</div>
              <div className="text-[12px] leading-5 text-[#787774]">• 개인정보 유출에 주의해주세요.</div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm" onClick={handleDeleteCancel}>
          <div className="w-full max-w-[380px] rounded-2xl border border-[#E3E2DE] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.1)]" onClick={e => e.stopPropagation()}>
            <h3 className="mb-2 text-[18px] font-bold text-[#37352F]">게시글 삭제</h3>
            <p className="text-[14px] text-[#787774]">정말로 이 게시글을 삭제하시겠습니까?</p>
            <p className="mt-1 text-[12px] text-[#EB5757]">삭제된 게시글은 복구할 수 없습니다.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={cn("rounded-lg bg-[#F7F6F3] px-4 py-2 text-[13px] font-medium text-[#37352F] transition hover:bg-[#F1F1EF]", fr)} onClick={handleDeleteCancel}>취소</button>
              <button type="button" className={cn("rounded-lg bg-[#EB5757] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#E04040] disabled:cursor-not-allowed disabled:opacity-60", fr)} onClick={handleDeleteConfirm} disabled={isDeleting}>{isDeleting ? "삭제 중..." : "삭제"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
