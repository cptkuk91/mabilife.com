"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditorWrapper from "@/components/Editor/RichTextEditorWrapper";

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

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      router.push("/guide");
    }, 1000);
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', paddingTop: '100px' }}>
      <header className="hub-header" style={{ marginBottom: '30px' }}>
        <div>
          <div className="hub-title">공략 작성</div>
          <div className="hub-subtitle">나만의 꿀팁을 다른 유저들과 공유해보세요.</div>
        </div>
      </header>

      <div className="write-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Category Selection */}
        <div className="form-group">
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1D1D1F' }}>카테고리</label>
          <div className="category-select" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '99px',
                  border: `1px solid ${category === cat ? '#0071E3' : '#E5E5EA'}`,
                  background: category === cat ? '#0071E3' : 'white',
                  color: category === cat ? 'white' : '#1D1D1F',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: '0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '24px',
              fontWeight: '700',
              border: 'none',
              borderBottom: '2px solid #E5E5EA',
              outline: 'none',
              background: 'transparent',
              color: '#1D1D1F'
            }}
          />
        </div>

        {/* Editor */}
        <div className="form-group">
          <RichTextEditorWrapper
            value={content}
            onChange={setContent}
            placeholder="공략 내용을 자세히 적어주세요. 이미지도 첨부할 수 있습니다."
            height={500}
          />
        </div>

        {/* Action Buttons */}
        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={() => router.back()}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#F5F5F7',
              color: '#1D1D1F',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              border: 'none',
              background: '#0071E3',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
