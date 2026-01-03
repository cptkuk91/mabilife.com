"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getGuides } from "@/actions/guide";
import styles from "./guide.module.css";
import { useSession } from "next-auth/react";

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

// Placeholder 이미지 배열
const placeholderImages = [
  '/assets/placeholder/mm1.webp',
  '/assets/placeholder/mm2.jpg',
  '/assets/placeholder/mm3.jpg',
];

// 인덱스에 따른 placeholder 이미지 반환
const getPlaceholderImage = (index: number) => {
  return placeholderImages[index % placeholderImages.length];
};

type ViewMode = 'grid' | 'list';

export default function GuideClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const categories = ["전체", "초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];

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

  const handleWriteClick = () => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    router.push("/guide/write");
  };

  return (
    <div className={styles.pageContainer}>

      {/* Header */}
      <header className={styles.hubHeader}>
        <div>
          <div className={styles.hubTitle}>공략</div>
          <div className={styles.hubSubtitle}>에린 생활에 필요한 모든 지식</div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className={styles.filterBar}>
        {categories.map((cat) => (
          <div
            key={cat}
            className={`${styles.filterItem} ${activeTab === cat ? styles.active : ''}`}
            onClick={() => setActiveTab(cat)}
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

      {/* View Mode Toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
          onClick={() => setViewMode('grid')}
          title="그리드 보기"
        >
          <i className="fa-solid fa-table-cells"></i>
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
          onClick={() => setViewMode('list')}
          title="리스트 보기"
        >
          <i className="fa-solid fa-list"></i>
        </button>
      </div>

      {/* Guide Grid/List */}
      <div className={viewMode === 'grid' ? styles.guideGrid : styles.guideList}>
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : guides.length === 0 ? (
          <div className={styles.empty}>
            <i className="fa-solid fa-file-circle-question"></i>
            <p>아직 등록된 공략이 없습니다.</p>
            <button onClick={handleWriteClick} className={styles.writeBtn}>
              첫 공략 작성하기
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          guides.map((guide, index) => (
            <Link href={`/guide/${guide.slug || guide._id}`} key={guide._id} className={styles.guideCard}>
              <div className={styles.cardThumb}>
                <Image
                  src={guide.thumbnail || getPlaceholderImage(index)}
                  alt={guide.title}
                  fill
                  className={styles.thumbImage}
                  sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                  priority={index < 3}
                />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardCat}>{guide.category}</div>
                <div className={styles.cardT}>{guide.title}</div>
                <div className={styles.cardDesc}>{extractDescription(guide.content)}</div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardAuth}>
                    <img src={guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id}`} alt="Author" />
                    <span>{guide.author?.name || '익명'}</span>
                  </div>
                  <div className={styles.cardStats}>
                    <span><i className="fa-regular fa-eye"></i> {guide.views || 0}</span>
                    <span><i className="fa-regular fa-heart"></i> {guide.likes || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          // List View
          guides.map((guide) => {
            const style = categoryStyles[guide.category] || { icon: "fa-lightbulb", bg: "#EAF4FF", color: "#0071E3" };
            return (
              <Link href={`/guide/${guide.slug || guide._id}`} key={guide._id} className={styles.listItem}>
                <div className={styles.listIcon} style={{ background: style.bg, color: style.color }}>
                  <i className={`fa-solid ${style.icon}`}></i>
                </div>
                <div className={styles.listContent}>
                  <div className={styles.listHeader}>
                    <span className={styles.listCat}>{guide.category}</span>
                    <span className={styles.listTime}>{formatRelativeTime(guide.createdAt)}</span>
                  </div>
                  <div className={styles.listTitle}>{guide.title}</div>
                  <div className={styles.listDesc}>{extractDescription(guide.content, 100)}</div>
                  <div className={styles.listFooter}>
                    <div className={styles.listAuthor}>
                      <img src={guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id}`} alt="Author" />
                      <span>{guide.author?.name || '익명'}</span>
                    </div>
                    <div className={styles.listStats}>
                      <span><i className="fa-regular fa-eye"></i> {guide.views || 0}</span>
                      <span><i className="fa-regular fa-heart"></i> {guide.likes || 0}</span>
                      <span><i className="fa-regular fa-comment"></i> {guide.commentCount || 0}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
      
      {/* Floating Write Button */}
      <button className={styles.writeBtn} onClick={handleWriteClick} title="공략 작성">
        <i className="fa-solid fa-pen-to-square"></i>
      </button>
    </div>
  );
}
