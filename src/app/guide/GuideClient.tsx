"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getGuides } from "@/actions/guide";
import { useSession } from "next-auth/react";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

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

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
const pageClass = "mx-auto max-w-[var(--max-width)] px-4 pb-24 pt-20 md:px-5 md:pb-16";
const headerClass = "mb-6 flex items-end justify-between gap-4";
const titleClass = "text-[34px] font-extrabold tracking-[-0.04em] text-app-title md:text-[40px]";
const subtitleClass = "mt-1 text-[16px] text-app-body md:text-[20px]";
const chipBarClass =
  "mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const chipClass =
  "shrink-0 rounded-full bg-black/[0.04] px-4 py-2 text-sm font-medium text-app-body transition hover:bg-black/[0.08] hover:text-app-title";
const activeChipClass = "bg-app-title text-white hover:bg-app-title hover:text-white";
const searchBarClass =
  "mb-5 flex flex-wrap items-center gap-3 rounded-[16px] border border-black/8 bg-white px-4 py-3 shadow-elev-soft transition focus-within:border-app-accent focus-within:shadow-[0_0_0_3px_rgba(0,113,227,0.1)]";
const searchInputClass =
  "min-w-0 flex-1 border-none bg-transparent text-[15px] text-app-title outline-none placeholder:text-app-body/80";
const viewToggleClass = "mb-5 flex justify-end gap-1.5";
const viewButtonClass =
  "flex size-11 items-center justify-center rounded-[10px] border border-black/10 bg-white text-lg text-app-title transition hover:bg-app-bg";
const activeViewButtonClass = "border-app-accent bg-app-accent text-white hover:bg-app-accent";
const guideGridClass = "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3";
const guideCardClass =
  "group flex flex-col overflow-hidden rounded-[22px] bg-white shadow-elev-card transition duration-300 hover:-translate-y-1 hover:shadow-elev-hover max-md:hover:translate-y-0";
const guideListClass = "flex flex-col gap-3";
const listItemClass =
  "group flex gap-4 rounded-[22px] bg-white p-5 shadow-elev-soft transition duration-200 hover:bg-[#FAFAFC] hover:shadow-elev-card max-sm:p-4";
const resultStatsClass =
  "flex flex-wrap gap-3 text-[12px] text-app-body [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1";
const floatingWriteButtonClass =
  "fixed bottom-[88px] right-5 z-[100] flex size-14 items-center justify-center rounded-full bg-app-accent text-white shadow-[0_4px_12px_rgba(0,113,227,0.3)] transition hover:bg-[#0062CC] md:bottom-10 md:right-10";

export default function GuideClient() {
  const router = useRouter();
  const { status } = useSession();
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  const categories = ["전체", "초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];

  useEffect(() => {
    // 탭이나 검색어가 바뀌면 초기화 후 로드
    setGuides([]);
    setHasMore(true);
    loadGuides(true);
  }, [activeTab, searchQuery]);

  const loadGuides = async (isInitial = false) => {
    setLoading(true);
    // 초기 로드면 skip 0, 아니면 현재 개수만큼 skip
    const currentSkip = isInitial ? 0 : guides.length;

    const result = await getGuides({
      category: activeTab === "전체" ? undefined : activeTab,
      search: searchQuery || undefined,
      limit: LIMIT,
      skip: currentSkip,
      sort: 'latest'
    });

    if (result.success && result.data) {
      const newGuides = result.data as any[];
      
      // 가져온 데이터가 limit보다 적으면 더 이상 데이터가 없음
      if (newGuides.length < LIMIT) {
        setHasMore(false);
      }

      setGuides(prev => isInitial ? newGuides : [...prev, ...newGuides]);
    }
    setLoading(false);
  };

  const handleLoadMore = () => {
    loadGuides(false);
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
    <div className={pageClass}>

      {/* Header */}
      <header className={headerClass}>
        <div>
          <h1 className={titleClass}>공략</h1>
          <div className={subtitleClass}>에린 생활에 필요한 모든 지식</div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className={chipBarClass}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cn(chipClass, activeTab === cat && activeChipClass)}
            onClick={() => setActiveTab(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <form className={searchBarClass} onSubmit={handleSearch}>
        <i className="fa-solid fa-magnifying-glass text-sm text-app-body"></i>
        <input
          type="text"
          placeholder="공략 검색..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={searchInputClass}
        />
        {searchInput && (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-sm text-app-body transition hover:bg-app-bg hover:text-app-title"
            onClick={handleClearSearch}
            aria-label="검색어 지우기"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
        <button
          type="submit"
          className="rounded-[10px] bg-app-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0062CC]"
        >
          검색
        </button>
      </form>

      {/* Search Result Info */}
      {searchQuery && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[#EAF4FF] px-4 py-3 text-sm text-app-accent">
          <span>&quot;{searchQuery}&quot; 검색 결과</span>
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-[13px] underline underline-offset-2 transition hover:text-[#0062CC]"
          >
            검색 초기화
          </button>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className={viewToggleClass}>
        <button
          type="button"
          className={cn(viewButtonClass, viewMode === 'grid' && activeViewButtonClass)}
          onClick={() => setViewMode('grid')}
          title="그리드 보기"
        >
          <i className="fa-solid fa-table-cells"></i>
        </button>
        <button
          type="button"
          className={cn(viewButtonClass, viewMode === 'list' && activeViewButtonClass)}
          onClick={() => setViewMode('list')}
          title="리스트 보기"
        >
          <i className="fa-solid fa-list"></i>
        </button>
      </div>

      {/* Guide Grid/List */}
      <div className={viewMode === 'grid' ? guideGridClass : guideListClass}>
        {loading && guides.length === 0 ? (
          <div className="col-span-full rounded-[24px] bg-white px-6 py-16 text-center text-sm text-app-body shadow-elev-card">
            로딩 중...
          </div>
        ) : guides.length === 0 ? (
          <div className="col-span-full rounded-[28px] bg-white px-6 py-16 text-center shadow-elev-card">
            <i className="fa-solid fa-file-circle-question mb-4 block text-5xl text-black/20"></i>
            <p className="mb-5 text-[16px] text-app-body">아직 등록된 공략이 없습니다.</p>
            <button
              type="button"
              onClick={handleWriteClick}
              className="inline-flex items-center gap-2 rounded-full bg-app-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0062CC]"
            >
              첫 공략 작성하기
            </button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              // Grid View
              guides.map((guide, index) => (
                <Link href={`/guide/${guide.slug || guide._id}`} key={guide._id} className={guideCardClass}>
                  <div className="relative h-[180px] overflow-hidden bg-app-bg">
                    <Image
                      src={guide.thumbnail || getPlaceholderImage(index)}
                      alt={decodeHtmlEntities(guide.title)}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw"
                      priority={index < 3}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-app-accent">
                      {guide.category}
                    </div>
                    <div className="mb-2 overflow-hidden text-[17px] font-bold leading-[1.3] text-app-title [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {decodeHtmlEntities(guide.title)}
                    </div>
                    <div className="mb-3 flex-1 overflow-hidden text-[13px] leading-6 text-app-body [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {extractPreviewText(guide.content)}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/6 pt-3">
                      <div className="flex min-w-0 items-center gap-2 text-[12px] text-app-body">
                        <img
                          src={guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id}`}
                          alt="Author"
                          className="size-6 rounded-full object-cover"
                        />
                        <span>{guide.author?.name || '익명'}</span>
                      </div>
                      <div className={resultStatsClass}>
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
                  <Link href={`/guide/${guide.slug || guide._id}`} key={guide._id} className={listItemClass}>
                    <div
                      className="flex size-14 shrink-0 items-center justify-center rounded-[14px] text-2xl max-sm:size-12 max-sm:text-xl"
                      style={{ background: style.bg, color: style.color }}
                    >
                      <i className={`fa-solid ${style.icon}`}></i>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-app-accent">{guide.category}</span>
                        <span className="text-[12px] text-app-body">{formatRelativeTime(guide.createdAt)}</span>
                      </div>
                      <div className="mb-2 truncate text-[16px] font-semibold text-app-title">
                        {decodeHtmlEntities(guide.title)}
                      </div>
                      <div className="mb-3 overflow-hidden text-[13px] leading-6 text-app-body [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                        {extractPreviewText(guide.content, 100)}
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
                        <div className="flex items-center gap-2 text-[12px] text-app-body">
                          <img
                            src={guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id}`}
                            alt="Author"
                            className="size-5 rounded-full object-cover"
                          />
                          <span>{guide.author?.name || '익명'}</span>
                        </div>
                        <div className={resultStatsClass}>
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
          </>
        )}
      </div>

      {loading && guides.length > 0 && (
         <div className="col-span-full py-8 text-center text-sm text-app-body">
           <i className="fa-solid fa-spinner fa-spin"></i> 로딩 중...
         </div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && guides.length > 0 && (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-8 py-3 text-[15px] font-semibold text-app-title shadow-elev-soft transition hover:-translate-y-0.5 hover:bg-app-bg hover:shadow-elev-card"
          >
            더 보기 <i className="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      )}
      
      {/* Floating Write Button */}
      <button type="button" className={floatingWriteButtonClass} onClick={handleWriteClick} title="공략 작성">
        <i className="fa-solid fa-pen-to-square"></i>
      </button>
    </div>
  );
}
