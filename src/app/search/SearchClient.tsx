"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import styles from "./search.module.css";

// 카테고리별 아이콘 매핑 (애플 스타일 - 모노크롬)
const categoryIcons: Record<string, string> = {
  "초보 가이드": "fa-graduation-cap",
  "전투/던전": "fa-dungeon",
  "메인스트림": "fa-book-open",
  "생활/알바": "fa-hammer",
  "패션/뷰티": "fa-shirt",
  "돈벌기": "fa-sack-dollar",
};

// 게시글 타입별 아이콘
const postTypeIcons: Record<string, string> = {
  "질문": "fa-circle-question",
  "정보": "fa-circle-info",
  "잡담": "fa-comment",
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

// HTML 태그 제거
const extractText = (html: string, maxLength: number = 100) => {
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

type SearchTab = '통합' | '공략' | '커뮤니티';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>('통합');
  const [guides, setGuides] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    }
  }, [query, activeTab]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    if (activeTab === '통합' || activeTab === '공략') {
      const guideResult = await getGuides({ search: query, limit: 10 });
      if (guideResult.success && guideResult.data) {
        setGuides(guideResult.data as any[]);
      }
    } else {
      setGuides([]);
    }

    if (activeTab === '통합' || activeTab === '커뮤니티') {
      const postResult = await getPosts(1, 10, undefined, query);
      if (postResult.success) {
        setPosts(postResult.posts);
      }
    } else {
      setPosts([]);
    }

    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      // URL 업데이트
      window.history.pushState({}, "", `/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchInput("");
    setQuery("");
    setGuides([]);
    setPosts([]);
    setHasSearched(false);
  };

  const totalResults = guides.length + posts.length;

  return (
    <div className={styles.pageContainer}>
      {/* Search Input */}
      <section className={styles.searchHero}>
        <form onSubmit={handleSearch} className={styles.searchInputWrapper}>
          <i className={`fa-solid fa-magnifying-glass ${styles.searchIcon}`}></i>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="공략, 게시글 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
          {searchInput && (
            <button type="button" className={styles.clearBtn} onClick={handleClear}>
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </form>
      </section>

      {/* Filter Tabs */}
      <div className={styles.filterBar}>
        {(['통합', '공략', '커뮤니티'] as SearchTab[]).map((tab) => (
          <div
            key={tab}
            className={`${styles.filterItem} ${activeTab === tab ? styles.active : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Search Info */}
      {(!hasSearched || !query) && <h1 className="sr-only">통합 검색</h1>}
      
      {hasSearched && query && (
        <h1 className={styles.searchInfo}>
          &quot;{query}&quot; 검색 결과 {totalResults}건
        </h1>
      )}

      {/* Results */}
      <main className={styles.resultContainer}>
        {loading ? (
          <div className={styles.loading}>검색 중...</div>
        ) : !hasSearched ? (
          <div className={styles.emptyState}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <p>검색어를 입력해주세요</p>
          </div>
        ) : totalResults === 0 ? (
          <div className={styles.emptyState}>
            <i className="fa-solid fa-face-sad-tear"></i>
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 공략 결과 */}
            {guides.length > 0 && (
              <section className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span>공략</span>
                  <span className={styles.resultCount}>{guides.length}건</span>
                </div>
                <div className={styles.resultList}>
                  {guides.map((guide) => {
                    const icon = categoryIcons[guide.category] || "fa-lightbulb";
                    return (
                      <Link href={`/guide/${guide._id}`} key={guide._id} className={styles.resultItem}>
                        <div className={styles.resultIcon}>
                          <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className={styles.resultContent}>
                          <div className={styles.resultMeta}>
                            <span className={styles.resultCategory}>{guide.category}</span>
                            <span className={styles.resultTime}>{formatRelativeTime(guide.createdAt)}</span>
                          </div>
                          <div className={styles.resultTitle}>{guide.title}</div>
                          <div className={styles.resultSnippet}>{extractText(guide.content)}</div>
                          <div className={styles.resultStats}>
                            <span><i className="fa-regular fa-eye"></i> {guide.views || 0}</span>
                            <span><i className="fa-regular fa-heart"></i> {guide.likes || 0}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 커뮤니티 결과 */}
            {posts.length > 0 && (
              <section className={styles.resultSection}>
                <div className={styles.sectionHeader}>
                  <span>커뮤니티</span>
                  <span className={styles.resultCount}>{posts.length}건</span>
                </div>
                <div className={styles.resultList}>
                  {posts.map((post) => {
                    const icon = postTypeIcons[post.type] || "fa-comment";
                    return (
                      <Link href={`/community/${post._id}`} key={post._id} className={styles.resultItem}>
                        <div className={styles.resultIcon}>
                          <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className={styles.resultContent}>
                          <div className={styles.resultMeta}>
                            <span className={styles.resultCategory}>{post.type}</span>
                            <span className={styles.resultTime}>{formatRelativeTime(post.createdAt)}</span>
                          </div>
                          <div className={styles.resultTitle}>{extractText(post.content, 60)}</div>
                          <div className={styles.resultSnippet}>{extractText(post.content, 120)}</div>
                          <div className={styles.resultStats}>
                            <span><i className="fa-regular fa-eye"></i> {post.viewCount || 0}</span>
                            <span><i className="fa-regular fa-heart"></i> {post.likes || 0}</span>
                            <span><i className="fa-regular fa-comment"></i> {post.commentCount || 0}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchClient() {
  return (
    <Suspense fallback={<div className={styles.loading}>로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
