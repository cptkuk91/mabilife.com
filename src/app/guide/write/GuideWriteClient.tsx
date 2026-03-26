"use client";

import Image from "next/image";
import { useState, useEffect, useEffectEvent, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import RichTextEditorWrapper, { RichTextEditorHandle } from "@/components/Editor/RichTextEditorWrapper";
import { createGuide, getGuideById, updateGuide } from "@/actions/guide";
import { getPresignedUrlAction } from "@/actions/upload";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
const pageClass = "mx-auto max-w-[800px] px-4 pb-20 pt-24 md:px-5 md:pt-28";
const loadingClass = "rounded-[28px] bg-white px-6 py-24 text-center text-base text-app-body shadow-elev-card";
const titleClass = "text-[34px] font-extrabold tracking-[-0.04em] text-app-title md:text-[40px]";
const subtitleClass = "mt-1 text-[16px] text-app-body md:text-[20px]";
const formClass = "mt-8 flex flex-col gap-6";
const sectionCardClass = "rounded-[24px] bg-white p-5 shadow-elev-card md:p-6";
const sectionLabelClass = "mb-3 block text-sm font-semibold text-app-title";
const categoryButtonClass =
  "rounded-full border border-app-border bg-white px-4 py-2 text-sm font-medium text-app-title transition hover:bg-app-bg";
const activeCategoryButtonClass = "border-app-accent bg-app-accent text-white hover:bg-app-accent";
const titleInputClass =
  "w-full rounded-[16px] border border-black/10 bg-white px-5 py-4 text-[24px] font-bold tracking-[-0.03em] text-app-title outline-none transition placeholder:text-black/20 focus:border-app-accent";
const actionButtonClass =
  "rounded-[12px] px-5 py-3 text-sm font-semibold transition md:text-base";

type EditableGuide = {
  title?: string;
  category?: string;
  content?: string;
  thumbnail?: string | null;
};

function GuideWriteContent() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;
  const editorRef = useRef<RichTextEditorHandle>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("초보 가이드");
  const [content, setContent] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ["초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];
  const loadGuideData = useEffectEvent(async (guideId: string) => {
    setIsLoading(true);
    const result = await getGuideById(guideId);

    if (result.success && result.data) {
      const guide = result.data as EditableGuide;
      setTitle(guide.title || "");
      setCategory(guide.category || "초보 가이드");
      setContent(guide.content || "");
      setThumbnail(guide.thumbnail || null);
    } else {
      alert("가이드를 불러오는데 실패했습니다.");
      router.push("/guide");
    }
    setIsLoading(false);
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 수정 모드일 때 기존 데이터 불러오기
  useEffect(() => {
    if (editId) {
      void loadGuideData(editId);
    }
  }, [editId]);

  const uploadThumbnail = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setIsUploading(true);

    try {
      const { success, signedUrl, publicUrl, error } = await getPresignedUrlAction(file.name, file.type);

      if (!success || !signedUrl || !publicUrl) {
        console.error("Failed to get presigned URL:", error);
        alert("업로드에 실패했습니다.");
        return;
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
        alert("업로드에 실패했습니다.");
        return;
      }

      setThumbnail(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadThumbnail(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadThumbnail(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnail(null);
  };

  const handleSubmit = async () => {
    // 에디터에서 직접 콘텐츠 가져오기 (디바운스 문제 해결)
    const editorContent = editorRef.current?.getContent() || content;

    if (!title.trim() || !editorContent.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    let result;
    if (isEditMode && editId) {
      result = await updateGuide(editId, {
        title: title.trim(),
        content: editorContent,
        category,
        thumbnail: thumbnail || undefined,
      });
    } else {
      result = await createGuide({
        title: title.trim(),
        content: editorContent,
        category,
        thumbnail: thumbnail || undefined,
      });
    }

    setIsSubmitting(false);

    if (result.success) {
      if (isEditMode && editId) {
        router.push(`/guide/${editId}`);
      } else {
        router.push("/guide");
      }
    } else {
      alert(result.error || "가이드 저장에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className={pageClass}>
        <div className={loadingClass}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={pageClass}>
      <header>
        <div>
          <div className={titleClass}>{isEditMode ? "공략 수정" : "공략 작성"}</div>
          <div className={subtitleClass}>
            {isEditMode ? "공략 내용을 수정하세요." : "나만의 꿀팁을 다른 유저들과 공유해보세요."}
          </div>
        </div>
      </header>

      <div className={formClass}>
        {/* Category Selection */}
        <div className={sectionCardClass}>
          <label className={sectionLabelClass}>카테고리</label>
          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(categoryButtonClass, category === cat && activeCategoryButtonClass)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className={sectionCardClass}>
          <label className={sectionLabelClass}>썸네일 이미지 (선택)</label>
          {thumbnail ? (
            <div className="relative aspect-[1200/630] max-w-[420px] overflow-hidden rounded-[16px]">
              <Image
                src={thumbnail}
                alt="썸네일 미리보기"
                fill
                sizes="(max-width: 768px) 100vw, 420px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveThumbnail}
                className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-[16px] border-2 border-dashed border-black/15 bg-black/[0.015] px-5 py-12 text-center transition hover:border-app-accent hover:bg-app-accent/[0.02]",
                isDragging && "border-app-accent bg-app-accent/[0.05]",
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="thumbnail-upload"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label htmlFor="thumbnail-upload" className="flex cursor-pointer flex-col items-center gap-3 text-app-body">
                {isUploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-3xl text-app-body"></i>
                    <span>업로드 중...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-image text-3xl text-app-body"></i>
                    <span>클릭하거나 이미지를 드래그하세요</span>
                    <span className="text-xs text-app-body">권장 크기: 1200 x 630px</span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className={sectionCardClass}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className={titleInputClass}
          />
        </div>

        {/* Editor */}
        <div className={sectionCardClass}>
          <label className={sectionLabelClass}>내용</label>
          <RichTextEditorWrapper
            ref={editorRef}
            value={content}
            onChange={setContent}
            placeholder="공략 내용을 자세히 적어주세요. 이미지도 첨부할 수 있습니다."
            height={500}
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(actionButtonClass, "bg-app-bg text-app-title hover:bg-black/[0.08]")}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              actionButtonClass,
              "bg-app-accent text-white hover:bg-app-accent-hover disabled:cursor-not-allowed disabled:opacity-70",
            )}
          >
            {isSubmitting ? '저장 중...' : isEditMode ? '수정하기' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuideWriteClient() {
  return (
    <Suspense fallback={<div className={pageClass}><div className={loadingClass}>로딩 중...</div></div>}>
      <GuideWriteContent />
    </Suspense>
  );
}
