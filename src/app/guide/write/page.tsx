"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditorWrapper from "@/components/Editor/RichTextEditorWrapper";
import { createGuide } from "@/actions/guide";

import styles from "./write.module.css";

export default function GuideWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("초보 가이드");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ["초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const result = await createGuide({
      title: title.trim(),
      content,
      category,
    });

    setIsSubmitting(false);

    if (result.success) {
      router.push("/guide/tips");
    } else {
      alert(result.error || "가이드 작성에 실패했습니다.");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.hubHeader}>
        <div>
          <div className={styles.hubTitle}>공략 작성</div>
          <div className={styles.hubSubtitle}>나만의 꿀팁을 다른 유저들과 공유해보세요.</div>
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
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
