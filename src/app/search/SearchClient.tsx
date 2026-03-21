"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

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

type SearchTab = '통합' | '공략' | '커뮤니티';

const pageClass = "mx-auto min-h-screen max-w-[980px] px-4 pb-20 pt-24 md:px-5 md:pt-28";
const searchHeroClass = "mb-12 text-center";
const searchInputWrapperClass =
  "mx-auto flex max-w-[680px] items-center gap-4 border-b-2 border-black/12 px-0 py-3 transition focus-within:border-app-title";
const searchInputClass =
  "min-w-0 flex-1 border-none bg-transparent text-[20px] font-normal tracking-[-0.02em] text-app-title outline-none placeholder:text-app-body md:text-[32px]";
const clearButtonClass =
  "flex size-10 items-center justify-center rounded-full text-xl text-app-body transition hover:bg-black/[0.04] hover:text-app-title";
const filterBarClass =
  "mx-auto mb-12 flex w-fit items-center gap-2 rounded-[14px] bg-black/[0.04] p-1.5";
const filterItemClass =
  "rounded-[10px] px-4 py-2 text-[13px] font-medium text-app-title transition md:px-6 md:py-2.5 md:text-sm";
const activeFilterItemClass = "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]";
const searchInfoClass = "mb-12 text-center text-[15px] text-app-body md:text-[17px]";
const resultSectionClass = "mb-14";
const sectionHeaderClass =
  "mb-6 flex items-end gap-3 border-b border-black/10 pb-4 max-sm:flex-col max-sm:items-start max-sm:gap-1";
const sectionTitleClass =
  "text-[24px] font-semibold tracking-[-0.03em] text-app-title md:text-[28px]";
const resultCountClass = "text-[15px] text-app-body md:text-[17px]";
const resultItemClass =
  "group flex gap-4 rounded-[20px] bg-white p-5 shadow-elev-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-elev-card max-md:p-4";
const resultIconClass =
  "flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-app-bg text-lg text-app-title max-md:size-11 max-md:text-base";
const resultMetaClass = "mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 max-[480px]:flex-col max-[480px]:items-start";
const resultCategoryClass =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-app-accent";
const resultTimeClass = "text-xs text-app-body";
const resultTitleClass =
  "text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-app-title md:text-[21px]";
const resultSnippetClass =
  "mt-2 overflow-hidden text-sm leading-6 text-app-body [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] md:text-[15px]";
const resultStatsClass =
  "mt-3 flex flex-wrap gap-4 text-[13px] text-app-body [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5";
const loadingClass = "rounded-[28px] bg-white px-6 py-16 text-center text-[15px] text-app-body shadow-elev-card md:text-[17px]";
const emptyStateClass = "rounded-[28px] bg-white px-6 py-20 text-center shadow-elev-card";

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

    const shouldLoadGuides = activeTab === "통합" || activeTab === "공략";
    const shouldLoadPosts = activeTab === "통합" || activeTab === "커뮤니티";
    const [guideResult, postResult] = await Promise.all([
      shouldLoadGuides ? getGuides({ search: query, limit: 10 }) : Promise.resolve(null),
      shouldLoadPosts ? getPosts(1, 10, undefined, query) : Promise.resolve(null),
    ]);

    if (guideResult && guideResult.success && guideResult.data) {
      setGuides(guideResult.data as any[]);
    } else {
      setGuides([]);
    }

    if (postResult && postResult.success) {
      setPosts(postResult.posts);
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
    <div className={pageClass}>
      {/* Search Input */}
      <section className={searchHeroClass}>
        <form onSubmit={handleSearch} className={searchInputWrapperClass}>
          <i className="fa-solid fa-magnifying-glass text-xl text-app-body md:mr-1 md:text-2xl"></i>
          <input
            type="text"
            className={searchInputClass}
            placeholder="공략, 게시글 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            autoFocus
          />
          {searchInput && (
            <button type="button" className={clearButtonClass} onClick={handleClear} aria-label="검색어 지우기">
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
          )}
        </form>
      </section>

      {/* Filter Tabs */}
      <div className={filterBarClass}>
        {(['통합', '공략', '커뮤니티'] as SearchTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${filterItemClass} ${activeTab === tab ? activeFilterItemClass : "hover:bg-white/60"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search Info */}
      {(!hasSearched || !query) && <h1 className="sr-only">통합 검색</h1>}
      
      {hasSearched && query && (
        <h1 className={searchInfoClass}>
          &quot;{query}&quot; 검색 결과 {totalResults}건
        </h1>
      )}

      {/* Results */}
      <main className="min-h-[400px]">
        {loading ? (
          <div className={loadingClass}>검색 중...</div>
        ) : !hasSearched ? (
          <div className={emptyStateClass}>
            <i className="fa-solid fa-magnifying-glass mb-6 block text-5xl text-black/15 md:text-[64px]"></i>
            <p className="text-[17px] text-app-body md:text-[21px]">검색어를 입력해주세요</p>
          </div>
        ) : totalResults === 0 ? (
          <div className={emptyStateClass}>
            <i className="fa-solid fa-face-sad-tear mb-6 block text-5xl text-black/15 md:text-[64px]"></i>
            <p className="text-[17px] text-app-body md:text-[21px]">검색 결과가 없습니다</p>
          </div>
        ) : (
          <>
            {/* 공략 결과 */}
            {guides.length > 0 && (
              <section className={resultSectionClass}>
                <div className={sectionHeaderClass}>
                  <span className={sectionTitleClass}>공략</span>
                  <span className={resultCountClass}>{guides.length}건</span>
                </div>
                <div className="flex flex-col gap-3">
                  {guides.map((guide) => {
                    const icon = categoryIcons[guide.category] || "fa-lightbulb";
                    return (
                      <Link href={`/guide/${guide._id}`} key={guide._id} className={resultItemClass}>
                        <div className={resultIconClass}>
                          <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={resultMetaClass}>
                            <span className={resultCategoryClass}>{guide.category}</span>
                            <span className={resultTimeClass}>{formatRelativeTime(guide.createdAt)}</span>
                          </div>
                          <div className={resultTitleClass}>{decodeHtmlEntities(guide.title)}</div>
                          <div className={resultSnippetClass}>{extractPreviewText(guide.content)}</div>
                          <div className={resultStatsClass}>
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
              <section className={resultSectionClass}>
                <div className={sectionHeaderClass}>
                  <span className={sectionTitleClass}>커뮤니티</span>
                  <span className={resultCountClass}>{posts.length}건</span>
                </div>
                <div className="flex flex-col gap-3">
                  {posts.map((post) => {
                    const icon = postTypeIcons[post.type] || "fa-comment";
                    return (
                      <Link href={`/community/${post._id}`} key={post._id} className={resultItemClass}>
                        <div className={resultIconClass}>
                          <i className={`fa-solid ${icon}`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={resultMetaClass}>
                            <span className={resultCategoryClass}>{post.type}</span>
                            <span className={resultTimeClass}>{formatRelativeTime(post.createdAt)}</span>
                          </div>
                          <div className={resultTitleClass}>{extractPreviewText(post.content, 60)}</div>
                          <div className={resultSnippetClass}>{extractPreviewText(post.content, 120)}</div>
                          <div className={resultStatsClass}>
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
    <Suspense fallback={<div className={loadingClass}>로딩 중...</div>}>
      <SearchContent />
    </Suspense>
  );
}
