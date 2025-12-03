"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { getGuides } from "@/actions/guide";

import styles from "./tips.module.css";

// 카테고리별 아이콘 및 색상 매핑
const categoryStyles: Record<string, { icon: string; bg: string; color: string }> = {
  "초보 가이드": { icon: "fa-graduation-cap", bg: "#EAF4FF", color: "#0071E3" },
  "전투/던전": { icon: "fa-dungeon", bg: "#FFEBEE", color: "#F44336" },
  "메인스트림": { icon: "fa-book-open", bg: "#FFF3E0", color: "#FF9800" },
  "생활/알바": { icon: "fa-hammer", bg: "#E8FAEB", color: "#00BA7C" },
  "패션/뷰티": { icon: "fa-shirt", bg: "#F3E5F5", color: "#9C27B0" },
  "돈벌기": { icon: "fa-sack-dollar", bg: "#FFF8E1", color: "#FF9500" },
};

// 상대적 시간 포맷
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString();
};

// HTML 태그 제거하여 설명 추출
const extractDescription = (html: string, maxLength: number = 80) => {
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

function TipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "전체";

  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const categories = ["전체", "초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];

  useEffect(() => {
    setActiveTab(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    loadGuides();
  }, [activeTab, searchQuery]);

  const loadGuides = async () => {
    setLoading(true);
    const result = await getGuides({
      category: activeTab === "전체" ? undefined : activeTab,
      search: searchQuery || undefined,
      limit: 20,
      sort: 'latest'
    });

    if (result.success && result.data) {
      setGuides(result.data as any[]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };



  return (
    <div className={styles.pageContainer}>
      <header className={styles.hubHeader}>
        <div>
          <div className={styles.hubTitle}>실시간 유저 팁</div>
          <div className={styles.hubSubtitle}>유저들이 공유하는 따끈따끈한 에린 소식</div>
        </div>
        <button className={styles.writeBtn} onClick={() => router.push('/guide/write')}>
          <i className="fa-solid fa-pen-to-square" style={{marginRight: '6px'}}></i>
          팁 작성
        </button>
      </header>

      {/* Filter Tabs */}
      <div className={styles.filterBar}>
        {categories.map((cat) => (
          <div
            key={cat}
            className={`${styles.filterItem} ${activeTab === cat ? styles.active : ''}`}
            onClick={() => {
              setActiveTab(cat);
              const newUrl = cat === "전체" ? "/guide/tips" : `/guide/tips?category=${cat}`;
              window.history.pushState({}, "", newUrl);
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="공략 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={styles.searchInput}
        />
        {searchInput && (
          <button type="button" className={styles.clearBtn} onClick={handleClearSearch}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
        <button type="submit" className={styles.searchBtn}>검색</button>
      </form>

      {/* Search Result Info */}
      {searchQuery && (
        <div className={styles.searchInfo}>
          <span>&quot;{searchQuery}&quot; 검색 결과 {guides.length}건</span>
          <button onClick={handleClearSearch} className={styles.clearSearchBtn}>
            검색 초기화
          </button>
        </div>
      )}

      <div className={styles.listGroup}>
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : guides.length === 0 ? (
          <div className={styles.empty}>
            <i className="fa-solid fa-file-circle-question"></i>
            <p>아직 등록된 공략이 없습니다.</p>
            <button onClick={() => router.push('/guide/write')} className={styles.writeBtn}>
              첫 공략 작성하기
            </button>
          </div>
        ) : (
          guides.map((guide) => {
            const style = categoryStyles[guide.category] || { icon: "fa-lightbulb", bg: "#EAF4FF", color: "#0071E3" };
            return (
              <Link href={`/guide/tips/${guide._id}`} key={guide._id} className={styles.listItem}>
                {guide.thumbnail ? (
                  <img src={guide.thumbnail} alt="" className={styles.listThumbnail} />
                ) : (
                  <div className={styles.listIcon} style={{ background: style.bg, color: style.color }}>
                    <i className={`fa-solid ${style.icon}`}></i>
                  </div>
                )}
                <div className={styles.listContent}>
                  <div className={styles.listTitle}>{guide.title}</div>
                  <div className={styles.listDesc}>{extractDescription(guide.content)}</div>
                  <div className={styles.listStats}>
                    <span><i className="fa-regular fa-eye"></i> {guide.views || 0}</span>
                    <span><i className="fa-regular fa-heart"></i> {guide.likes || 0}</span>
                  </div>
                </div>
                <div className={styles.listMeta}>{formatRelativeTime(guide.createdAt)}</div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function TipsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TipsContent />
    </Suspense>
  );
}
