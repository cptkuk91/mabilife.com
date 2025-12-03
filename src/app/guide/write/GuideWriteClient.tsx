"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import RichTextEditorWrapper, { RichTextEditorHandle } from "@/components/Editor/RichTextEditorWrapper";
import { createGuide, getGuideById, updateGuide } from "@/actions/guide";
import { getPresignedUrlAction } from "@/actions/upload";

import styles from "./write.module.css";

function GuideWriteContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 수정 모드일 때 기존 데이터 불러오기
  useEffect(() => {
    if (editId) {
      loadGuideData(editId);
    }
  }, [editId]);

  const loadGuideData = async (id: string) => {
    setIsLoading(true);
    const result = await getGuideById(id);

    if (result.success && result.data) {
      const guide = result.data as any;
      setTitle(guide.title || "");
      setCategory(guide.category || "초보 가이드");
      setContent(guide.content || "");
      setThumbnail(guide.thumbnail || null);
    } else {
      alert("가이드를 불러오는데 실패했습니다.");
      router.push("/guide");
    }
    setIsLoading(false);
  };

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
      <div className={styles.pageContainer}>
        <div className={styles.loading}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.hubHeader}>
        <div>
          <div className={styles.hubTitle}>{isEditMode ? "공략 수정" : "공략 작성"}</div>
          <div className={styles.hubSubtitle}>
            {isEditMode ? "공략 내용을 수정하세요." : "나만의 꿀팁을 다른 유저들과 공유해보세요."}
          </div>
        </div>
      </header>

      <div className={styles.writeForm}>
        {/* Category Selection */}
        <div className={styles.formGroup}>
          <label className={styles.label}>카테고리</label>
          <div className={styles.categorySelect}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`${styles.categoryBtn} ${category === cat ? styles.active : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className={styles.formGroup}>
          <label className={styles.label}>썸네일 이미지 (선택)</label>
          {thumbnail ? (
            <div className={styles.thumbnailPreview}>
              <img src={thumbnail} alt="썸네일 미리보기" className={styles.thumbnailImage} />
              <button
                type="button"
                onClick={handleRemoveThumbnail}
                className={styles.removeThumbnailBtn}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <div
              className={`${styles.thumbnailUpload} ${isDragging ? styles.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="thumbnail-upload"
                accept="image/*"
                onChange={handleFileSelect}
                className={styles.hiddenInput}
                disabled={isUploading}
              />
              <label htmlFor="thumbnail-upload" className={styles.uploadLabel}>
                {isUploading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>업로드 중...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-image"></i>
                    <span>클릭하거나 이미지를 드래그하세요</span>
                    <span className={styles.uploadHint}>권장 크기: 1200 x 630px</span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className={styles.formGroup}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className={styles.titleInput}
          />
        </div>

        {/* Editor */}
        <div className={styles.formGroup}>
          <RichTextEditorWrapper
            ref={editorRef}
            value={content}
            onChange={setContent}
            placeholder="공략 내용을 자세히 적어주세요. 이미지도 첨부할 수 있습니다."
            height={500}
          />
        </div>

        {/* Action Buttons */}
        <div className={styles.formActions}>
          <button
            onClick={() => router.back()}
            className={styles.cancelBtn}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={styles.submitBtn}
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
    <Suspense fallback={<div className={styles.pageContainer}><div className={styles.loading}>로딩 중...</div></div>}>
      <GuideWriteContent />
    </Suspense>
  );
}
