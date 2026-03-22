"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import EventList from "@/components/EventList";
import YouTuberSection from "@/components/YouTuberSection";
import { getGuides, getGuideById } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import { fetchMabinogiMobileYouTubers, YouTubeChannel } from "@/actions/youtube";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

const EDITORS_CHOICE_ID = "692fbf2c9e1c94a15a09f963";

type InitialHomeData = {
  editorsChoice?: any | null;
  guides?: any[];
  posts?: any[];
  youtubers?: YouTubeChannel[] | null;
};

const categoryIcons: Record<string, string> = {
  "초보 가이드": "fa-graduation-cap",
  "전투/던전": "fa-dungeon",
  "메인스트림": "fa-book-open",
  "생활/알바": "fa-hammer",
  "패션/뷰티": "fa-shirt",
  "돈벌기": "fa-sack-dollar",
};

const postTypeIcons: Record<string, string> = {
  질문: "fa-circle-question",
  정보: "fa-circle-info",
  잡담: "fa-comment",
};

const categoryColors: Record<string, string> = {
  "초보 가이드": "#1E5DB4",
  "전투/던전": "#B84A2A",
  "메인스트림": "#8E5A1A",
  "생활/알바": "#0F7F5F",
  "패션/뷰티": "#8C4878",
  "돈벌기": "#A56A15",
  질문: "#A56A15",
  정보: "#1E5DB4",
  잡담: "#5F5A55",
};

const placeholderImages = [
  "/assets/placeholder/mm1.webp",
  "/assets/placeholder/mm2.jpg",
  "/assets/placeholder/mm3.jpg",
];

const getPlaceholderImage = (index: number) => placeholderImages[index % placeholderImages.length];
const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const shellClass = "w-full px-4 sm:px-5 md:px-6";
const shellInnerClass = "mx-auto w-full max-w-[1140px]";
const frameClass =
  "relative overflow-hidden rounded-[30px] border border-[#D8C6AF] bg-[linear-gradient(180deg,#FFFDFC_0%,#F8F2E8_100%)] shadow-[0_18px_46px_rgba(30,24,18,0.08)]";
const frameInnerClass = "relative z-10 px-5 py-6 md:px-7 md:py-7";
const badgeClass =
  "inline-flex items-center gap-2 rounded-full border border-[#D6C09A]/55 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6630] backdrop-blur";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EF]";
const darkFocusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2CC9C]/75 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1C1611]";
const sectionLinkClass =
  `inline-flex items-center gap-1.5 text-sm font-semibold text-[#7E5E32] transition-colors hover:text-[#59411E] ${focusRingClass}`;
const searchCardClass =
  "rounded-[22px] border border-[#D2BDA0] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(47,37,24,0.07)] backdrop-blur transition focus-within:border-[#B78F4F] focus-within:ring-2 focus-within:ring-[#D5B16E]/35 md:px-5 md:py-4";
const resultCardClass =
  `group flex gap-4 rounded-[22px] border border-[#D8C6AF] bg-white p-5 shadow-[0_12px_28px_rgba(25,21,18,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#B79255] hover:shadow-[0_18px_38px_rgba(25,21,18,0.09)] max-md:p-4 ${focusRingClass}`;
const resultIconClass =
  "flex size-12 shrink-0 items-center justify-center rounded-[15px] border border-[#D8C5A6]/70 bg-[#FAF4EA] text-lg text-[#1A1715] max-md:size-11";
const feedCardClass =
  `group relative flex min-h-[220px] min-w-0 flex-col overflow-hidden rounded-[24px] border border-[#D8C6AF] bg-white p-5 shadow-[0_14px_30px_rgba(25,21,18,0.06)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[#B79255] hover:shadow-[0_18px_36px_rgba(25,21,18,0.1)] md:p-6 max-md:hover:translate-y-0 ${focusRingClass}`;
const metaRowClass = "mb-3 flex flex-wrap items-center gap-x-3 gap-y-1";
const statRowClass =
  "mt-4 flex flex-wrap gap-4 text-[13px] text-[#6D645C] [font-variant-numeric:tabular-nums] [&_span]:inline-flex [&_span]:items-center [&_span]:gap-1.5";

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

export default function HomeClient({
  initialStats,
  initialHomeData,
}: {
  initialStats?: any;
  initialHomeData?: InitialHomeData;
}) {
  const hasInitialFeed = initialHomeData !== undefined;
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchGuides, setSearchGuides] = useState<any[]>([]);
  const [searchPosts, setSearchPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedGuides, setFeedGuides] = useState<any[]>(initialHomeData?.guides ?? []);
  const [feedPosts, setFeedPosts] = useState<any[]>(initialHomeData?.posts ?? []);
  const [editorsChoice, setEditorsChoice] = useState<any>(initialHomeData?.editorsChoice ?? null);
  const [youtubers, setYoutubers] = useState<YouTubeChannel[] | null>(initialHomeData?.youtubers ?? null);
  const [feedLoading, setFeedLoading] = useState(!hasInitialFeed);

  useEffect(() => {
    if (!hasInitialFeed) {
      loadFeedData();
    }
  }, [hasInitialFeed]);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchGuides([]);
      setSearchPosts([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const loadFeedData = async () => {
    setFeedLoading(true);

    const [guideResult, postResult, editorsChoiceResult, youtubersResult] = await Promise.all([
      getGuides({ limit: 4, sort: "latest" }),
      getPosts(1, 4),
      getGuideById(EDITORS_CHOICE_ID),
      fetchMabinogiMobileYouTubers(),
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

  const performSearch = async () => {
    setLoading(true);
    setIsSearching(true);

    const [guideResult, postResult] = await Promise.all([
      getGuides({ search: searchQuery, limit: 5 }),
      getPosts(1, 5, undefined, searchQuery),
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
  const feedItems: any[] = [];
  const maxItems = Math.max(feedGuides.length, feedPosts.length);

  for (let i = 0; i < maxItems; i += 1) {
    if (feedGuides[i]) feedItems.push({ ...feedGuides[i], _type: "guide" });
    if (feedPosts[i]) feedItems.push({ ...feedPosts[i], _type: "post" });
  }

  const heroStats = [
    {
      label: "랭커 분석",
      value: Intl.NumberFormat("ko-KR").format(initialStats?.totalAnalyzed || 0),
      suffix: "명",
    },
    {
      label: "오늘의 가이드",
      value: feedLoading ? "…" : Intl.NumberFormat("ko-KR").format(feedGuides.length),
      suffix: feedLoading ? "" : "건",
    },
    {
      label: "크리에이터",
      value: youtubers ? Intl.NumberFormat("ko-KR").format(youtubers.length) : feedLoading ? "…" : "준비 중",
      suffix: youtubers ? "팀" : "",
    },
  ];

  const topJob = initialStats?.jobStats?.[0];
  const quickLinks = [
    { href: "/guide", label: "초보자를 위한 공략", desc: "지금 바로 필요한 핵심 가이드" },
    { href: "/community", label: "질문과 답변", desc: "유저들과 실시간으로 답을 찾기" },
    { href: "/statistics", label: "랭커 데이터", desc: "상위권이 고른 직업과 메타 흐름" },
  ];

  return (
    <>
      <header className="relative overflow-hidden pt-24 md:pt-28">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_top_left,rgba(214,181,105,0.28),transparent_36%),radial-gradient(circle_at_85%_20%,rgba(44,85,126,0.1),transparent_24%),linear-gradient(180deg,#F8F2E8_0%,rgba(245,245,247,0)_100%)]" />
        <div className={`${shellClass} relative flex justify-center pb-12 md:pb-14`}>
          <div className={`${shellInnerClass} grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_300px]`}>
            <div className={frameClass}>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.34),transparent_46%,rgba(185,148,84,0.06)_100%)]" />
              <div className="pointer-events-none absolute -left-12 top-8 h-36 w-36 rounded-full bg-[#D4B26D]/18 blur-3xl" />
              <div className="pointer-events-none absolute bottom-6 right-6 h-32 w-32 rounded-full bg-[#16385E]/6 blur-3xl" />
              <div className={`${frameInnerClass} md:px-8 md:py-8`}>
                <div className={badgeClass}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#B88B46]"></span>
                  Erin Archive
                </div>

                <div className="mt-5 max-w-[720px]">
                  <h1 className="max-w-[11ch] text-balance font-display text-[34px] leading-[1.04] tracking-[-0.05em] text-[#171311] sm:text-[44px] md:text-[56px] lg:text-[64px]">
                    오늘의 에린, 필요한 정보만 빠르게.
                  </h1>
                  <p className="mt-5 max-w-[560px] text-[14px] leading-6 text-[#5C544D] sm:text-[16px] md:text-[17px] md:leading-7">
                    공략, 커뮤니티, 랭커 통계, 크리에이터 소식을 한 화면에서 정리했습니다. 과한 장식보다
                    탐색 속도와 읽기 편한 밀도를 우선해 메인 구조를 다시 다듬었습니다.
                  </p>
                </div>

                <div className={`mt-7 ${searchCardClass}`}>
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6630]">
                    <i className="fa-solid fa-compass text-[10px]" aria-hidden="true"></i>
                    Explore
                  </div>
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-magnifying-glass ml-1 text-sm text-[#7B7168] md:text-base" aria-hidden="true"></i>
                    <label htmlFor="home-search" className="sr-only">
                      공략, 게시글, 직업 검색
                    </label>
                    <input
                      id="home-search"
                      name="query"
                      type="text"
                      className="min-w-0 flex-1 border-none bg-transparent px-1 py-2 text-[15px] text-[#171311] outline-none placeholder:text-[#8A8178] md:text-base"
                      placeholder="공략, 게시글, 직업 키워드를 검색해보세요…"
                      aria-label="공략, 게시글, 직업 검색"
                      autoComplete="off"
                      spellCheck={false}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className={cn(
                          "flex size-9 items-center justify-center rounded-full text-[#6B625B] transition hover:bg-black/[0.04] hover:text-[#171311]",
                          focusRingClass,
                        )}
                        onClick={handleClear}
                        aria-label="검색어 지우기"
                      >
                        <i className="fa-solid fa-circle-xmark text-base" aria-hidden="true"></i>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2.5">
                  {[
                    { href: "/search?q=초보가이드", label: "#초보가이드" },
                    { href: "/search?q=던전공략", label: "#던전공략" },
                    { href: "/search?q=생활스킬", label: "#생활스킬" },
                    { href: "/search?q=랭커직업", label: "#랭커직업" },
                  ].map((tag) => (
                    <Link
                      key={tag.href}
                      href={tag.href}
                      className={cn(
                        "rounded-full border border-[#D8C5A6]/80 bg-white/75 px-4 py-2 text-[13px] font-medium text-[#2A251F] transition hover:-translate-y-0.5 hover:border-[#B88B46]/70 hover:bg-white",
                        focusRingClass,
                      )}
                    >
                      {tag.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-7 grid gap-3 border-t border-black/8 pt-5 sm:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-[18px] border border-white/80 bg-white/76 px-4 py-3 backdrop-blur"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A8178]">
                        {stat.label}
                      </div>
                      <div className="mt-2 flex items-end gap-1 text-[#171311]">
                        <span className="font-display text-[26px] leading-none tracking-[-0.05em] md:text-[30px]">
                          {stat.value}
                        </span>
                        {stat.suffix ? <span className="pb-1 text-sm text-[#6B625B]">{stat.suffix}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[26px] border border-[#2D241B] bg-[#1C1611] p-5 text-white shadow-[0_20px_42px_rgba(18,14,11,0.2)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,178,109,0.28),transparent_38%)]" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D8C49A]">
                    Data Pulse
                  </div>
                  <div className="mt-5 text-[13px] text-white/65">이번 주 랭커가 가장 많이 선택한 직업</div>
                  <div className="mt-2 text-balance font-display text-[30px] leading-none tracking-[-0.05em] text-white md:text-[34px]">
                    {topJob?.name || "데이터 준비 중"}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                    <i className="fa-solid fa-crown text-[#D4B26D]" aria-hidden="true"></i>
                    {topJob ? `${topJob.count}명이 선택` : "랭킹 수집 후 표시됩니다"}
                  </div>
                  <Link
                    href="/statistics"
                    className={cn(
                      "mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/14",
                      darkFocusRingClass,
                    )}
                  >
                    메타 흐름 보기
                    <i className="fa-solid fa-arrow-right text-[12px]" aria-hidden="true"></i>
                  </Link>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[26px] border border-[#E6DDD2] bg-white/92 p-5 shadow-[0_16px_34px_rgba(25,21,18,0.05)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#D8C5A6]/80 bg-[#FAF4EA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6630]">
                    Quick Route
                  </div>
                  <i className="fa-solid fa-sparkles text-[#B88B46]" aria-hidden="true"></i>
                </div>
                <div className="flex flex-col gap-3">
                  {quickLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "group rounded-[18px] border border-[#E6DDD2] bg-white px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#C8A977]/60 hover:shadow-[0_14px_30px_rgba(25,21,18,0.05)]",
                        focusRingClass,
                      )}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#F7EDDA] text-[12px] font-bold text-[#8A6630]">
                          0{index + 1}
                        </span>
                        <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#171311] transition group-hover:text-[#6D4D1F]">
                          {link.label}
                        </span>
                      </div>
                      <div className="pl-11 text-sm leading-6 text-[#6B625B]">{link.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {isSearching ? (
        <section className={`${shellClass} flex justify-center pb-12`}>
          <div className={`${shellInnerClass} ${frameClass}`}>
            <div className="pointer-events-none absolute right-8 top-8 h-28 w-28 rounded-full bg-[#D4B26D]/18 blur-3xl" />
            <div className={frameInnerClass}>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className={badgeClass}>Search Ledger</div>
                  <h2 className="mt-4 text-balance font-display text-[30px] leading-[1.04] tracking-[-0.05em] text-[#171311] md:text-[40px]">
                    &quot;{searchQuery}&quot;
                  </h2>
                  <p className="mt-3 text-[15px] leading-7 text-[#5C544D]">
                    공략과 커뮤니티에서 찾은 결과 {totalResults}건
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClear}
                  className={cn(
                    "inline-flex items-center gap-2 self-start rounded-full border border-[#D8C5A6]/80 bg-white/88 px-4 py-2 text-sm font-semibold text-[#6C5126] transition hover:bg-white md:self-auto",
                    focusRingClass,
                  )}
                >
                  검색 초기화
                  <i className="fa-solid fa-rotate-left text-[12px]" aria-hidden="true"></i>
                </button>
              </div>

              {loading ? (
                <div className="mt-8 rounded-[24px] border border-black/8 bg-white/90 px-6 py-14 text-center text-[15px] text-[#5C544D] shadow-[0_10px_30px_rgba(25,21,18,0.05)]">
                  검색 중…
                </div>
              ) : totalResults === 0 ? (
                <div className="mt-8 rounded-[26px] border border-black/8 bg-white/90 px-6 py-16 text-center shadow-[0_12px_34px_rgba(25,21,18,0.05)]">
                  <i className="fa-solid fa-compass-drafting mb-5 block text-5xl text-[#D2BE98]" aria-hidden="true"></i>
                  <p className="text-[16px] text-[#5C544D] md:text-[18px]">검색 결과가 없습니다.</p>
                </div>
              ) : (
                <div className="mt-8 grid gap-8">
                  {searchGuides.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-4 border-b border-black/8 pb-3">
                        <h3 className="font-display text-[26px] tracking-[-0.04em] text-[#171311]">공략</h3>
                        <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={sectionLinkClass}>
                          전체보기
                          <i className="fa-solid fa-chevron-right text-[11px]"></i>
                        </Link>
                      </div>
                      <div className="flex flex-col gap-3">
                        {searchGuides.map((guide) => {
                          const icon = categoryIcons[guide.category] || "fa-lightbulb";
                          return (
                            <Link href={`/guide/${guide._id}`} key={guide._id} className={resultCardClass}>
                              <div className={resultIconClass}>
                                <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={metaRowClass}>
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6630]">
                                    {guide.category}
                                  </span>
                                  <span className="text-xs text-[#7A7169]">{formatRelativeTime(guide.createdAt)}</span>
                                </div>
                                <div className="break-words text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#171311]">
                                  {decodeHtmlEntities(guide.title)}
                                </div>
                                <div className={statRowClass}>
                                  <span><i className="fa-regular fa-eye" aria-hidden="true"></i> {guide.views || 0}</span>
                                  <span><i className="fa-regular fa-heart" aria-hidden="true"></i> {guide.likes || 0}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {searchPosts.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center justify-between gap-4 border-b border-black/8 pb-3">
                        <h3 className="font-display text-[26px] tracking-[-0.04em] text-[#171311]">커뮤니티</h3>
                        <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={sectionLinkClass}>
                          전체보기
                          <i className="fa-solid fa-chevron-right text-[11px]"></i>
                        </Link>
                      </div>
                      <div className="flex flex-col gap-3">
                        {searchPosts.map((post) => {
                          const icon = postTypeIcons[post.type] || "fa-comment";
                          return (
                            <Link href={`/community/${post._id}`} key={post._id} className={resultCardClass}>
                              <div className={resultIconClass}>
                                <i className={`fa-solid ${icon}`} aria-hidden="true"></i>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={metaRowClass}>
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6630]">
                                    {post.type}
                                  </span>
                                  <span className="text-xs text-[#7A7169]">{formatRelativeTime(post.createdAt)}</span>
                                </div>
                                <div className="break-words text-[18px] font-semibold leading-[1.3] tracking-[-0.02em] text-[#171311]">
                                  {extractPreviewText(post.content, 54)}
                                </div>
                                <div className={statRowClass}>
                                  <span><i className="fa-regular fa-eye" aria-hidden="true"></i> {post.viewCount || 0}</span>
                                  <span><i className="fa-regular fa-heart" aria-hidden="true"></i> {post.likes || 0}</span>
                                  <span><i className="fa-regular fa-comment" aria-hidden="true"></i> {post.commentCount || 0}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className={`${shellClass} flex justify-center pb-3`}>
            <div className={`${shellInnerClass} ${frameClass}`}>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),transparent_34%,rgba(212,178,109,0.04)_100%)]" />
              <div className={frameInnerClass}>
                <div className="mb-6 flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className={badgeClass}>Front Page</div>
                    <h2 className="mt-4 text-balance font-display text-[28px] leading-[1.04] tracking-[-0.05em] text-[#171311] md:text-[40px]">
                      오늘의 기록과 사람들
                    </h2>
                  </div>
                  <p className="max-w-[420px] text-sm leading-7 text-[#5C544D] md:text-[15px]">
                    운영자가 고른 에디터스 초이스와 실시간으로 올라오는 가이드, 커뮤니티 흐름을 한눈에 배치했습니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
                  {editorsChoice && (
                    <Link
                      href={`/guide/${editorsChoice._id}`}
                      className={cn(
                        "group relative flex min-h-[320px] flex-col overflow-hidden rounded-[28px] bg-[#1E1915] p-6 text-white shadow-[0_18px_42px_rgba(20,16,13,0.2)] lg:col-span-7 lg:row-span-2 lg:min-h-[430px]",
                        darkFocusRingClass,
                      )}
                    >
                      <Image
                        src={editorsChoice.thumbnail || getPlaceholderImage(0)}
                        alt={decodeHtmlEntities(editorsChoice.title)}
                        fill
                        sizes="(max-width: 768px) 100vw, 800px"
                        className="object-cover transition duration-700 group-hover:scale-[1.04]"
                        priority
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,14,12,0.22)_0%,rgba(17,14,12,0.82)_58%,rgba(17,14,12,0.96)_100%)]" />
                      <div className="pointer-events-none absolute right-6 top-6 h-20 w-20 rounded-full border border-white/12" />

                      <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E7D6B7]">
                        Editor&apos;s Choice
                      </div>
                      <div className="relative z-10 mt-5 max-w-[520px] text-balance font-display text-[30px] leading-[1.04] tracking-[-0.05em] text-white md:text-[42px]">
                        {decodeHtmlEntities(editorsChoice.title)}
                      </div>
                      <div className="relative z-10 mt-4 line-clamp-3 max-w-[520px] text-sm leading-7 text-white/82 md:text-[15px]">
                        {extractPreviewText(editorsChoice.content, 100)}
                      </div>
                      <div className="relative z-10 mt-auto flex items-center gap-3 border-t border-white/14 pt-5 text-[13px] text-white/80">
                        <Image
                          src={editorsChoice.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editorsChoice.author?.id}`}
                          className="size-9 rounded-full bg-white/10 object-cover"
                          alt="User Avatar"
                          width={36}
                          height={36}
                        />
                        <span className="font-medium text-white">{editorsChoice.author?.name || "익명"}</span>
                        <span className="ml-auto inline-flex items-center gap-1.5">
                          <i className="fa-solid fa-heart text-[#FFB2AE]" aria-hidden="true"></i>
                          {editorsChoice.likes || 0}
                        </span>
                      </div>
                    </Link>
                  )}

                  {feedLoading ? (
                    <div className={`${feedCardClass} animate-pulse lg:col-span-4`}>
                      <div className="h-4 w-24 rounded bg-black/6"></div>
                      <div className="mt-4 h-20 w-full rounded-[16px] bg-black/6"></div>
                      <div className="mt-auto h-4 w-2/3 rounded bg-black/6"></div>
                    </div>
                  ) : (
                    <>
                      {feedItems.slice(0, 4).map((item, index) => {
                        const isGuide = item._type === "guide";
                        const category = isGuide ? item.category : item.type;
                        const color = categoryColors[category] || "#666";
                        const title = isGuide ? decodeHtmlEntities(item.title) : extractPreviewText(item.content, 42);
                        const desc = extractPreviewText(item.content, 72);
                        const link = isGuide ? `/guide/${item._id}` : `/community/${item._id}`;
                        const authorName = item.author?.name || "익명";
                        const authorImage =
                          item.author?.image ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author?.id || index}`;
                        const likes = item.likes || 0;
                        const comments = !isGuide ? item.commentCount || 0 : null;
                        const spanClass = editorsChoice ? (index < 2 ? "lg:col-span-5" : "lg:col-span-6") : "lg:col-span-6";

                        return (
                          <Link href={link} key={item._id} className={cn(feedCardClass, spanClass)}>
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div
                                className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color }}
                              >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                                {category}
                              </div>
                              <i
                                className={`fa-solid ${isGuide ? categoryIcons[category] || "fa-lightbulb" : postTypeIcons[category] || "fa-comment"} text-sm`}
                                style={{ color }}
                                aria-hidden="true"
                              ></i>
                            </div>
                            <div className="break-words text-[18px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#171311] md:text-[20px]">
                              {title}
                            </div>
                            <div className="mt-3 text-sm leading-7 text-[#5C544D]">{desc}</div>
                            <div className="mt-auto flex items-center gap-3 border-t border-black/8 pt-4 text-[13px] text-[#6D645C]">
                              <Image
                                src={authorImage}
                                className="size-8 rounded-full bg-[#F2E8D7] object-cover"
                                alt="User Avatar"
                                width={32}
                                height={32}
                              />
                              <span className="font-medium text-[#171311]">{authorName}</span>
                              {comments !== null ? (
                                <span className="ml-auto inline-flex items-center gap-1.5">
                                  <i className="fa-regular fa-comment" aria-hidden="true"></i>
                                  {comments}
                                </span>
                              ) : (
                                <span className="ml-auto inline-flex items-center gap-1.5">
                                  <i className="fa-solid fa-heart text-[#C96A63]" aria-hidden="true"></i>
                                  {likes}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </>
                  )}
                </div>

                {!feedLoading && !editorsChoice && feedItems.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-dashed border-[#D8C5A6] bg-white/78 px-6 py-12 text-center text-sm text-[#6D645C]">
                    메인에 노출할 최신 글을 준비 중입니다.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {initialStats?.jobStats && (
            <section id="rankings" className={`${shellClass} flex justify-center pb-2 pt-10 md:pt-12`}>
              <div className={`${shellInnerClass} relative overflow-hidden rounded-[30px] border border-[#2B2118] bg-[#1A1511] px-5 py-6 text-white shadow-[0_24px_52px_rgba(16,12,9,0.24)] md:px-7 md:py-7`}>
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,178,109,0.28),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]" />
                <div className="relative z-10 mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E2CC9C]">
                      Rank Chronicle
                    </div>
                    <h2 className="mt-4 text-balance font-display text-[28px] leading-[1.04] tracking-[-0.05em] text-white md:text-[40px]">
                      랭커가 선택한 오늘의 직업
                    </h2>
                  </div>
                  <Link
                    href="/statistics"
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-semibold text-[#E2CC9C] transition hover:text-white",
                      darkFocusRingClass,
                    )}
                  >
                    통계 더보기
                    <i className="fa-solid fa-chevron-right text-[11px]" aria-hidden="true"></i>
                  </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.95fr_0.95fr]">
                  {initialStats.jobStats.slice(0, 3).map((stat: any, index: number) => {
                    const emphasisClass =
                      index === 0
                        ? "border-[#D4B26D]/40 bg-[linear-gradient(180deg,rgba(212,178,109,0.18),rgba(255,255,255,0.04))]"
                        : "border-white/10 bg-white/5";
                    const badgeTone =
                      index === 0 ? "bg-[#D4B26D] text-[#1A1511]" : index === 1 ? "bg-[#B7BBC4] text-[#1A1511]" : "bg-[#B17442] text-white";

                    return (
                      <div
                        key={stat.name}
                        className={cn(
                          "relative overflow-hidden rounded-[26px] border px-5 py-5 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08] max-md:hover:translate-y-0 md:px-6 md:py-6",
                          emphasisClass,
                        )}
                      >
                        <div className={`inline-flex size-10 items-center justify-center rounded-full text-[13px] font-bold ${badgeTone}`}>
                          {index + 1}
                        </div>
                        <div className="mt-5 text-balance font-display text-[30px] leading-none tracking-[-0.05em] text-white md:text-[34px]">
                          {stat.name}
                        </div>
                        <div className="mt-3 text-sm text-white/72">{stat.count}명의 랭커가 선택</div>
                        {index === 0 && (
                          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#D4B26D]/45 bg-[#D4B26D]/12 px-3 py-1.5 text-[12px] font-semibold text-[#F2E1B7]">
                            <i className="fa-solid fa-crown text-[#D4B26D]" aria-hidden="true"></i>
                            이번 주 최다 선택
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <YouTuberSection channels={youtubers} />
          <EventList />
        </>
      )}
    </>
  );
}
