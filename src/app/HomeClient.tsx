"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import EventList from "@/components/EventList";
import YouTuberSection from "@/components/YouTuberSection";
import { getGuides, getGuideById } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import { fetchMabinogiMobileYouTubers, YouTubeChannel } from "@/actions/youtube";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

// Editor's Choice 고정 ID
const EDITORS_CHOICE_ID = "692fbf2c9e1c94a15a09f963";

// 카테고리별 아이콘 매핑 (모노크롬)
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

// 카테고리별 색상
const categoryColors: Record<string, string> = {
  "초보 가이드": "#0071E3",
  "전투/던전": "#F44336",
  "메인스트림": "#FF9800",
  "생활/알바": "#00BA7C",
  "패션/뷰티": "#9C27B0",
  "돈벌기": "#FF9500",
  "질문": "#FF9500",
  "정보": "#0071E3",
  "잡담": "#666",
};

// Placeholder 이미지
const placeholderImages = [
  '/assets/placeholder/mm1.webp',
  '/assets/placeholder/mm2.jpg',
  '/assets/placeholder/mm3.jpg',
];

const getPlaceholderImage = (index: number) => {
  return placeholderImages[index % placeholderImages.length];
};

const shellClass = "mx-auto max-w-[var(--max-width)] px-4 md:px-5";
const cardClass =
  "group relative flex min-h-[220px] flex-col overflow-hidden rounded-[28px] bg-white p-5 shadow-elev-card transition duration-300 hover:-translate-y-1 hover:shadow-elev-hover md:p-7 max-md:rounded-[22px] max-md:hover:translate-y-0";
const resultSectionClass = "mb-10 md:mb-12";
const resultHeaderClass =
  "mb-5 flex items-center justify-between gap-4 border-b border-black/6 pb-3";
const resultLinkClass =
  "text-sm font-semibold text-app-accent transition hover:text-app-accent-hover";
const resultItemClass =
  "group flex gap-4 rounded-[20px] bg-white p-5 shadow-elev-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-elev-card max-md:p-4";
const resultIconClass =
  "flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-app-bg text-lg text-app-title max-md:size-11 max-md:text-base";
const resultMetaClass = "mb-2 flex flex-wrap items-center gap-x-3 gap-y-1";
const resultCategoryClass =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-app-accent";
const resultTimeClass = "text-xs text-app-body";
const resultTitleClass =
  "text-[17px] font-semibold leading-[1.35] tracking-[-0.01em] text-app-title";
const resultStatsClass =
  "mt-3 flex flex-wrap gap-4 text-[13px] text-app-body [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5";
const sectionHeaderClass = "mb-5 flex items-center justify-between gap-4";
const sectionTitleClass =
  "text-[20px] font-bold tracking-[-0.03em] text-app-title md:text-[22px]";

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

export default function HomeClient({ initialStats }: { initialStats?: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchGuides, setSearchGuides] = useState<any[]>([]);
  const [searchPosts, setSearchPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 피드용 데이터
  const [feedGuides, setFeedGuides] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [editorsChoice, setEditorsChoice] = useState<any>(null);
  const [youtubers, setYoutubers] = useState<YouTubeChannel[] | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);

  // 피드 데이터 로드
  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    setFeedLoading(true);
    const [guideResult, postResult, editorsChoiceResult, youtubersResult] = await Promise.all([
      getGuides({ limit: 4, sort: 'latest' }),
      getPosts(1, 4),
      getGuideById(EDITORS_CHOICE_ID),
      fetchMabinogiMobileYouTubers()
    ]);

    if (guideResult.success && guideResult.data) {
      setFeedGuides(guideResult.data as any[]);
    }
    if (postResult.success) {
      setFeedPosts(postResult.posts);
    }
    if (editorsChoiceResult.success && editorsChoiceResult.data) {
      setEditorsChoice(editorsChoiceResult.data);
    }
    setYoutubers(youtubersResult);
    setFeedLoading(false);
  };

  // 검색
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchGuides([]);
      setSearchPosts([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setIsSearching(true);

    const [guideResult, postResult] = await Promise.all([
      getGuides({ search: searchQuery, limit: 5 }),
      getPosts(1, 5, undefined, searchQuery)
    ]);

    if (guideResult.success && guideResult.data) {
      setSearchGuides(guideResult.data as any[]);
    }
    if (postResult.success) {
      setSearchPosts(postResult.posts);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchGuides([]);
    setSearchPosts([]);
    setIsSearching(false);
  };

  const totalResults = searchGuides.length + searchPosts.length;

  // 피드 아이템들 조합 (공략 + 커뮤니티 섞기)
  const feedItems: any[] = [];
  const maxItems = Math.max(feedGuides.length, feedPosts.length);
  for (let i = 0; i < maxItems; i++) {
    if (feedGuides[i]) feedItems.push({ ...feedGuides[i], _type: 'guide' });
    if (feedPosts[i]) feedItems.push({ ...feedPosts[i], _type: 'post' });
  }

  return (
    <>
      {/* Hero Section */}
      <header className={`${shellClass} pb-10 pt-24 text-center md:pb-12 md:pt-28`}>
        <h1 className="text-[32px] font-bold tracking-[-0.04em] text-app-title sm:text-[40px] md:text-[48px]">
          나만의 판타지 라이프.
        </h1>
        <p className="mx-auto mt-3 max-w-[620px] text-[15px] leading-7 text-app-body sm:text-[18px] md:text-[21px] md:leading-[1.45]">
          에린에서 시작된 소중한 인연.
          <br />
          오늘 당신의 모험은 어떠셨나요?
        </p>

        {/* Search Bar */}
        <div className="mx-auto mt-8 flex max-w-[640px] items-center gap-3 rounded-[18px] border border-black/5 bg-white px-4 py-3 shadow-elev-soft transition duration-300 focus-within:scale-[1.01] focus-within:shadow-elev-card max-md:rounded-[16px] max-md:px-3 max-md:py-2.5 max-md:focus-within:scale-100">
          <i className="fa-solid fa-magnifying-glass ml-1 text-sm text-black/35 md:text-base"></i>
          <input
            type="text"
            className="min-w-0 flex-1 border-none bg-transparent px-1 py-2 text-[15px] text-app-title outline-none placeholder:text-app-body/80 md:text-base"
            placeholder="공략, 게시글 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full text-app-body transition hover:bg-black/[0.04] hover:text-app-title"
              onClick={handleClear}
              aria-label="검색어 지우기"
            >
              <i className="fa-solid fa-circle-xmark text-base"></i>
            </button>
          )}
        </div>

        {/* Quick Tags */}
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <Link
            href="/search?q=초보가이드"
            className="rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-medium text-app-title transition hover:bg-app-title hover:text-white md:px-5 md:text-sm"
          >
            #초보가이드
          </Link>
          <Link
            href="/search?q=던전공략"
            className="rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-medium text-app-title transition hover:bg-app-title hover:text-white md:px-5 md:text-sm"
          >
            #던전공략
          </Link>
          <Link
            href="/search?q=생활스킬"
            className="rounded-full bg-black/[0.04] px-4 py-2 text-[13px] font-medium text-app-title transition hover:bg-app-title hover:text-white md:px-5 md:text-sm"
          >
            #생활스킬
          </Link>
        </div>
      </header>

      {/* Search Results */}
      {isSearching ? (
        <section className="mx-auto max-w-[720px] px-4 pb-10 md:px-5">
          {/* Search Info */}
          <div className="mb-8 text-center text-[15px] text-app-body md:mb-10 md:text-[17px]">
            &quot;{searchQuery}&quot; 검색 결과 {totalResults}건
          </div>

          {loading ? (
            <div className="rounded-[24px] bg-white px-6 py-14 text-center text-[15px] text-app-body shadow-elev-soft md:text-[17px]">
              검색 중...
            </div>
          ) : totalResults === 0 ? (
            <div className="rounded-[28px] bg-white px-6 py-16 text-center shadow-elev-card">
              <i className="fa-solid fa-face-sad-tear mb-5 block text-5xl text-black/15 md:text-[56px]"></i>
              <p className="text-[16px] text-app-body md:text-[19px]">검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              {/* 공략 결과 */}
              {searchGuides.length > 0 && (
                <div className={resultSectionClass}>
                  <div className={resultHeaderClass}>
                    <span className={sectionTitleClass}>공략</span>
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={resultLinkClass}>
                      전체보기
                    </Link>
                  </div>
                  <div className="flex flex-col gap-3">
                    {searchGuides.map((guide) => {
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
                            <div className={resultStatsClass}>
                              <span><i className="fa-regular fa-eye"></i> {guide.views || 0}</span>
                              <span><i className="fa-regular fa-heart"></i> {guide.likes || 0}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 커뮤니티 결과 */}
              {searchPosts.length > 0 && (
                <div className={resultSectionClass}>
                  <div className={resultHeaderClass}>
                    <span className={sectionTitleClass}>커뮤니티</span>
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={resultLinkClass}>
                      전체보기
                    </Link>
                  </div>
                  <div className="flex flex-col gap-3">
                    {searchPosts.map((post) => {
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
                            <div className={resultTitleClass}>{extractPreviewText(post.content, 50)}</div>
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
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          {/* Main Feed (Bento Grid Layout) */}
          <section className={`${shellClass} grid grid-cols-1 gap-4 pb-2 md:gap-5 lg:grid-cols-12 lg:gap-6`}>

            {/* Card 1: Editor's Choice (Large) */}
            {editorsChoice && (
              <Link
                href={`/guide/${editorsChoice._id}`}
                className={`${cardClass} min-h-[260px] bg-app-title/80 p-6 text-white lg:col-span-8 lg:row-span-2 lg:min-h-[420px]`}
              >
                <Image 
                  src={editorsChoice.thumbnail || getPlaceholderImage(0)} 
                  alt={decodeHtmlEntities(editorsChoice.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.28),rgba(0,0,0,0.82))]" />
                
                <div className="relative z-10 mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                  Editor&apos;s Choice
                </div>
                <div className="relative z-10 mb-3 text-[22px] font-bold leading-[1.2] tracking-[-0.03em] text-white md:text-[28px]">
                  {decodeHtmlEntities(editorsChoice.title)}
                </div>
                <div className="relative z-10 mb-6 max-w-[520px] text-sm leading-6 text-white/85 md:text-[16px]">
                  {extractPreviewText(editorsChoice.content, 80)}
                </div>
                <div className="relative z-10 mt-auto flex items-center gap-3 border-t border-white/20 pt-4 text-[13px] text-white/85">
                  <Image 
                    src={editorsChoice.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editorsChoice.author?.id}`} 
                    className="size-8 rounded-full bg-white/15 object-cover" 
                    alt="User Avatar"
                    width={32}
                    height={32}
                  />
                  <span className="text-[13px] font-medium text-white">
                    {editorsChoice.author?.name || "익명"}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-white">
                    <i className="fa-solid fa-heart text-[#FF5D7D]"></i> {editorsChoice.likes || 0}
                  </span>
                </div>
              </Link>
            )}

            {feedLoading ? (
              <div className={`${cardClass} animate-pulse lg:col-span-4`}>
                <div className="mt-auto text-sm leading-6 text-app-body">로딩 중...</div>
              </div>
            ) : (
              <>
                {/* 실제 데이터 카드들 */}
                {feedItems.slice(0, 4).map((item, index) => {
                  const isGuide = item._type === 'guide';
                  const category = isGuide ? item.category : item.type;
                  const color = categoryColors[category] || '#666';
                  const title = isGuide
                    ? decodeHtmlEntities(item.title)
                    : extractPreviewText(item.content, 40);
                  const desc = extractPreviewText(item.content, 60);
                  const link = isGuide ? `/guide/${item._id}` : `/community/${item._id}`;
                  const authorName = item.author?.name || '익명';
                  const authorImage = item.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author?.id || index}`;
                  const likes = isGuide ? (item.likes || 0) : (item.likes || 0);
                  const comments = !isGuide ? (item.commentCount || 0) : null;

                  // 그리드 배치: 0,1은 colSpan4, 2,3은 colSpan6
                  const spanClass = index < 2 ? "lg:col-span-4" : "lg:col-span-6";
                  const titleClass =
                    index < 2
                      ? "mb-3 text-[18px] font-bold leading-[1.25] tracking-[-0.03em] text-app-title"
                      : "mb-3 text-[20px] font-bold leading-[1.22] tracking-[-0.03em] text-app-title md:text-[22px]";

                  return (
                    <Link href={link} key={item._id} className={`${cardClass} ${spanClass}`}>
                      <div
                        className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color }}
                      >
                        {category}
                      </div>
                      <div className={titleClass}>{title}</div>
                      <div className="mb-6 text-sm leading-6 text-app-body md:text-[15px]">
                        {desc}
                      </div>
                      <div className="mt-auto flex items-center gap-3 border-t border-black/6 pt-4 text-[13px] text-app-body">
                        <Image 
                          src={authorImage} 
                          className="size-8 rounded-full bg-app-bg object-cover" 
                          alt="User Avatar"
                          width={32}
                          height={32}
                        />
                        <span className="text-[13px] font-medium text-app-title">{authorName}</span>
                        {comments !== null ? (
                          <span className="ml-auto inline-flex items-center gap-1.5">
                            <i className="fa-regular fa-comment"></i> {comments}
                          </span>
                        ) : (
                          <span className="ml-auto inline-flex items-center gap-1.5">
                            <i className="fa-solid fa-heart text-[#FF5D7D]"></i> {likes}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}

          </section>

          {/* Ranking / Job Recommendation Section */}
          {initialStats && initialStats.jobStats && (
            <section className={`${shellClass} pb-2 pt-10 md:pt-12`}>
                <div className={sectionHeaderClass}>
                    <h2 className={sectionTitleClass}>🏆 랭커가 선택한 직업은?</h2>
                    <Link href="/statistics" className={resultLinkClass}>
                        더보기 <i className="fa-solid fa-chevron-right text-[11px]"></i>
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 gap-3 md:gap-4 lg:grid-cols-3">
                     {initialStats.jobStats.slice(0, 3).map((stat: any, index: number) => {
                        const cardTone =
                          index === 0
                            ? "border-[#FFEBA6] bg-[linear-gradient(135deg,#FFF9E6_0%,#FFFDF5_100%)]"
                            : "border-black/5 bg-white";
                        const badgeTone =
                          index === 0
                            ? "bg-[#FFD700] text-white"
                            : index === 1
                              ? "bg-[#C0C0C0] text-white"
                              : "bg-[#CD7F32] text-white";

                        return (
                          <div
                            key={index}
                            className={`relative flex items-center gap-4 rounded-[22px] border px-5 py-5 shadow-elev-soft transition duration-200 hover:-translate-y-1 hover:shadow-elev-card max-md:hover:translate-y-0 lg:flex-col lg:items-start lg:gap-3 lg:px-6 lg:py-6 ${cardTone}`}
                          >
                            <div className={`inline-flex size-8 items-center justify-center rounded-[10px] text-[13px] font-bold ${badgeTone}`}>
                              {index + 1}위
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-[18px] font-bold tracking-[-0.02em] text-app-title">
                                {stat.name}
                              </div>
                              <div className="mt-1 text-sm text-app-body">{stat.count}명 선택</div>
                            </div>
                            {index === 0 && (
                              <i className="fa-solid fa-crown absolute right-5 top-1/2 -translate-y-1/2 text-2xl text-[#FFD700] lg:top-5 lg:translate-y-0"></i>
                            )}
                          </div>
                        );
                     })}
                </div>
            </section>
          )}

          {/* YouTuber Section */}
          <YouTuberSection channels={youtubers} />

          {/* Event List */}
          <EventList />
        </>
      )}
    </>
  );
}
