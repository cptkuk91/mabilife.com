"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import type { YouTubeChannel } from "@/actions/youtube";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

/* ─── Types ──────────────────────────────────────────── */

type RawAuthor = { name?: string | null; image?: string | null };

type RawGuide = {
  _id?: string;
  title?: string;
  content?: string;
  category?: string;
  views?: number;
  likes?: number;
  author?: RawAuthor;
  createdAt?: string;
  thumbnail?: string;
};

type RawPost = {
  _id?: string;
  content?: string;
  type?: string;
  viewCount?: number;
  likes?: number;
  commentCount?: number;
  author?: RawAuthor;
  createdAt?: string;
};

type Ranker = {
  rank: number;
  characterName: string;
  job: string;
  server: string;
  score: number;
};

type StatItem = { name: string; count: number };

type HomeStats = {
  date?: string;
  totalAnalyzed?: number;
  jobStats?: StatItem[];
  topRankers?: Ranker[];
};

type InitialHomeData = {
  guides?: RawGuide[] | null;
  posts?: RawPost[] | null;
  youtubers?: YouTubeChannel[] | null;
};

type Props = {
  initialStats?: HomeStats | null;
  initialHomeData?: InitialHomeData | null;
};

type GuideMeta = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  views: number;
  likes: number;
  authorName: string;
  authorImage: string;
  createdAt?: string;
  color: string;
  thumbnail: string;
};

type PostMeta = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  type: string;
  views: number;
  likes: number;
  comments: number;
  authorName: string;
  authorImage: string;
  createdAt?: string;
  color: string;
};

/* ─── Constants ──────────────────────────────────────── */

const shell = "mx-auto w-full max-w-[1100px] px-5 sm:px-6 lg:px-8";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
const numberFmt = new Intl.NumberFormat("ko-KR");

const placeholderImages = [
  "/assets/placeholder/mm1.webp",
  "/assets/placeholder/mm2.jpg",
  "/assets/placeholder/mm3.jpg",
];

const guideColors: Record<string, string> = {
  "초보 가이드": "#2F80ED",
  "전투/던전": "#EB5757",
  "메인스트림": "#9B51E0",
  "생활/알바": "#27AE60",
  "패션/뷰티": "#E84393",
  돈벌기: "#F2994A",
};

const postColors: Record<string, string> = {
  질문: "#F2994A",
  정보: "#2F80ED",
  잡담: "#828282",
};

const searchTags = [
  { href: "/search?q=초보가이드", label: "초보가이드" },
  { href: "/search?q=전투던전", label: "전투던전" },
  { href: "/search?q=생활알바", label: "생활알바" },
  { href: "/search?q=랭커직업", label: "랭커직업" },
  { href: "/search?q=질문", label: "질문" },
  { href: "/search?q=정보", label: "정보" },
];

/* ─── Utils ──────────────────────────────────────────── */

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const fmt = (v?: number) => numberFmt.format(v ?? 0);

const relTime = (d?: string) => {
  if (!d) return "업데이트 예정";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  if (h < 24) return `${h}시간 전`;
  if (dy < 7) return `${dy}일 전`;
  return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
};

const snapDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })
    : "업데이트 예정";

const fmtSub = (c?: string) => {
  const v = Number.parseInt(c || "0", 10);
  if (Number.isNaN(v)) return "0";
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}천`;
  return v.toLocaleString("ko-KR");
};

const pct = (v: number, t: number) => (t <= 0 ? "0%" : `${((v / t) * 100).toFixed(1)}%`);

const toGuides = (v: unknown): RawGuide[] => (Array.isArray(v) ? v : []);
const toPosts = (v: unknown): RawPost[] => (Array.isArray(v) ? v : []);

const initials = (s: string) =>
  s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

const avatarOf = (a?: RawAuthor, seed = "") =>
  a?.image || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

const guideMeta = (g: RawGuide, i: number): GuideMeta => ({
  id: g._id || `g-${i}`,
  href: g._id ? `/guide/${g._id}` : "/guide",
  title: decodeHtmlEntities(g.title || "제목 없는 공략"),
  excerpt: extractPreviewText(g.content || "", 100) || "미리보기를 준비 중입니다.",
  category: g.category || "공략",
  views: g.views || 0,
  likes: g.likes || 0,
  authorName: g.author?.name || "익명",
  authorImage: avatarOf(g.author, `g-${g._id || i}`),
  createdAt: g.createdAt,
  color: guideColors[g.category || ""] || "#2F80ED",
  thumbnail: g.thumbnail || placeholderImages[i % placeholderImages.length],
});

const postMeta = (p: RawPost, i: number): PostMeta => ({
  id: p._id || `p-${i}`,
  href: p._id ? `/community/${p._id}` : "/community",
  title: extractPreviewText(p.content || "", 44) || "미리보기를 준비 중입니다.",
  excerpt: extractPreviewText(p.content || "", 96) || "미리보기를 준비 중입니다.",
  type: p.type || "커뮤니티",
  views: p.viewCount || 0,
  likes: p.likes || 0,
  comments: p.commentCount || 0,
  authorName: p.author?.name || "익명",
  authorImage: avatarOf(p.author, `p-${p._id || i}`),
  createdAt: p.createdAt,
  color: postColors[p.type || ""] || "#828282",
});

/* ─── Sub-components ─────────────────────────────────── */

function Pill({ children, color }: { children: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
      style={{
        color: color || "#37352F",
        backgroundColor: color ? `${color}14` : "#F1F1EF",
      }}
    >
      {children}
    </span>
  );
}

function SectionHeader({
  label,
  title,
  href,
  linkText,
}: {
  label: string;
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex flex-col gap-1 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">{label}</div>
        <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#37352F] md:text-[24px]">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-medium text-[#2F80ED] transition-colors hover:text-[#1A66CC]",
            focusRing,
          )}
        >
          {linkText || "전체 보기"}
          <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function JobBar({ job, index, total }: { job: StatItem; index: number; total: number }) {
  const w = total > 0 ? Math.max((job.count / total) * 100, 6) : 6;
  const colors = ["#2F80ED", "#9B51E0", "#27AE60", "#F2994A"];
  const c = colors[index % colors.length];

  return (
    <div className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#F7F6F3]">
      <span
        className="flex size-6 items-center justify-center rounded-md text-[11px] font-bold text-white"
        style={{ backgroundColor: c }}
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[14px] font-semibold text-[#37352F]">{job.name}</span>
          <span className="text-[12px] tabular-nums text-[#9B9A97]">{fmt(job.count)}명</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#EDECE9]">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${w}%`, backgroundColor: c }} />
        </div>
        <div className="mt-1 text-[11px] text-[#B4B4B0]">{pct(job.count, total)}</div>
      </div>
    </div>
  );
}

function GuideCard({ item }: { item: GuideMeta }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group overflow-hidden rounded-xl border border-[#E3E2DE] bg-white transition-all duration-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:border-[#D3D1CB]",
        focusRing,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#F7F6F3]">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          sizes="(max-width:1024px) 100vw, 360px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="absolute left-3 top-3">
          <span className="rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#37352F] backdrop-blur-sm">
            {item.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="text-[11px] font-medium text-[#9B9A97]">{relTime(item.createdAt)}</div>
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-[#37352F]">
          {item.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#787774]">{item.excerpt}</p>
        <div className="mt-3 flex items-center gap-3 text-[11px] tabular-nums text-[#B4B4B0]">
          <span className="inline-flex items-center gap-1">
            <i className="fa-regular fa-eye" aria-hidden="true" />
            {fmt(item.views)}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="fa-regular fa-heart" aria-hidden="true" />
            {fmt(item.likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostCard({ item }: { item: PostMeta }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group rounded-xl border border-[#E3E2DE] bg-white p-4 transition-all duration-200 hover:border-[#D3D1CB] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
        focusRing,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Pill color={item.color}>{item.type}</Pill>
            <span className="text-[11px] text-[#B4B4B0]">{relTime(item.createdAt)}</span>
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-snug text-[#37352F]">{item.title}</h3>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#787774]">{item.excerpt}</p>

      <div className="mt-3 flex items-center gap-3 text-[11px] tabular-nums text-[#B4B4B0]">
        <span className="inline-flex items-center gap-1">
          <i className="fa-regular fa-eye" aria-hidden="true" />
          {fmt(item.views)}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="fa-regular fa-heart" aria-hidden="true" />
          {fmt(item.likes)}
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="fa-regular fa-message" aria-hidden="true" />
          {fmt(item.comments)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-[#F1F1EF] pt-3">
        <Image
          src={item.authorImage}
          alt={item.authorName}
          width={24}
          height={24}
          className="size-6 rounded-full border border-[#E3E2DE] object-cover"
        />
        <span className="text-[12px] font-medium text-[#787774]">{item.authorName}</span>
      </div>
    </Link>
  );
}

function CommunityRow({ item }: { item: PostMeta }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-start justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-[#F7F6F3]",
        focusRing,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Pill color={item.color}>{item.type}</Pill>
        </div>
        <h3 className="mt-1 text-[14px] font-medium leading-snug text-[#37352F] group-hover:text-[#2F80ED] transition-colors">
          {item.title}
        </h3>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] tabular-nums text-[#B4B4B0]">
          <span className="inline-flex items-center gap-1">
            <i className="fa-regular fa-message" aria-hidden="true" />
            {fmt(item.comments)}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="fa-regular fa-heart" aria-hidden="true" />
            {fmt(item.likes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="fa-regular fa-eye" aria-hidden="true" />
            {fmt(item.views)}
          </span>
        </div>
      </div>
      <span className="shrink-0 pt-1 text-[11px] text-[#B4B4B0]">{relTime(item.createdAt)}</span>
    </Link>
  );
}

function RankerSpotlight({ ranker }: { ranker: Ranker | null }) {
  if (!ranker) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[#B4B4B0] text-lg">
          <i className="fa-solid fa-trophy" aria-hidden="true" />
        </div>
        <div className="mt-3 text-[15px] font-semibold text-[#37352F]">랭킹 데이터 준비 중</div>
        <p className="mt-1 text-[13px] text-[#9B9A97]">집계가 완료되면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[#E3E2DE] bg-gradient-to-br from-[#FBFBFA] to-white p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#2F80ED] px-2.5 py-1 text-[11px] font-bold text-white">
          <i className="fa-solid fa-crown text-[9px]" aria-hidden="true" />
          1위
        </span>
        <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[15px] font-bold text-[#37352F]">
          {initials(ranker.characterName)}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9B9A97]">Hall Of Fame</div>
        <div className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.03em] text-[#37352F]">
          {ranker.characterName}
        </div>
        <div className="mt-1 text-[13px] text-[#787774]">
          {ranker.job} · {ranker.server}
        </div>
        <div className="mt-4 text-[24px] font-bold tabular-nums tracking-[-0.02em] text-[#2F80ED]">
          {fmt(ranker.score)}
          <span className="ml-1 text-[11px] font-semibold text-[#9B9A97]">pts</span>
        </div>
      </div>
    </div>
  );
}

function RankerRow({ ranker }: { ranker: Ranker }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#F7F6F3]">
      <span className="text-[14px] font-bold tabular-nums text-[#2F80ED]">
        {String(ranker.rank).padStart(2, "0")}
      </span>
      <div className="flex size-8 items-center justify-center rounded-full bg-[#F1F1EF] text-[11px] font-bold text-[#37352F]">
        {initials(ranker.characterName)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[#37352F]">{ranker.characterName}</div>
        <div className="text-[11px] text-[#B4B4B0]">
          {ranker.job} · {ranker.server}
        </div>
      </div>
      <div className="text-[13px] font-semibold tabular-nums text-[#37352F]">{fmt(ranker.score)}</div>
    </div>
  );
}

function CreatorRow({ channel, index }: { channel: YouTubeChannel; index: number }) {
  return (
    <a
      href={channel.channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#F7F6F3]",
        focusRing,
      )}
    >
      <div className="relative shrink-0">
        <Image
          src={channel.thumbnailUrl}
          alt={channel.title}
          width={40}
          height={40}
          className="size-10 rounded-full border border-[#E3E2DE] object-cover"
        />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-[#2F80ED] text-[8px] font-bold text-white ring-2 ring-white">
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-[#37352F]">{channel.title}</div>
        <div className="text-[11px] text-[#B4B4B0]">구독자 {fmtSub(channel.subscriberCount)}</div>
      </div>
      <i className="fa-solid fa-arrow-up-right-from-square text-[11px] text-[#D3D1CB] transition-colors group-hover:text-[#787774]" aria-hidden="true" />
    </a>
  );
}

function SearchSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#E3E2DE] bg-white p-4">
      <div className="h-3 w-16 rounded bg-[#EDECE9]" />
      <div className="mt-3 h-5 w-3/4 rounded bg-[#EDECE9]" />
      <div className="mt-2 h-4 w-full rounded bg-[#F7F6F3]" />
      <div className="mt-2 h-4 w-11/12 rounded bg-[#F7F6F3]" />
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────── */

export default function HomeClient({ initialStats, initialHomeData }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferred = useDeferredValue(searchQuery);
  const [sGuides, setSGuides] = useState<RawGuide[]>([]);
  const [sPosts, setSPosts] = useState<RawPost[]>([]);
  const [loading, setLoading] = useState(false);
  const reqRef = useRef(0);

  const guides = toGuides(initialHomeData?.guides).map(guideMeta);
  const posts = toPosts(initialHomeData?.posts).map(postMeta);
  const youtubers: YouTubeChannel[] = Array.isArray(initialHomeData?.youtubers) ? initialHomeData.youtubers : [];
  const topJobs = initialStats?.jobStats?.slice(0, 4) || [];
  const topRankers = initialStats?.topRankers?.slice(0, 5) || [];
  const total = initialStats?.totalAnalyzed || topJobs.reduce((s, j) => s + j.count, 0);

  const guideDeck = guides.slice(0, 6);
  const sGuideItems = sGuides.map(guideMeta);
  const sPostItems = sPosts.map(postMeta);
  const totalResults = sGuideItems.length + sPostItems.length;
  const hasSearch = searchQuery.trim().length > 0;
  const displayQ = deferred.trim() || searchQuery.trim();
  const leadJob = topJobs[0] || null;
  const leadRanker = topRankers[0] || null;
  const communityDeck = posts.slice(0, 5);
  const creatorDeck = youtubers.slice(0, 4);
  const subRankers = leadRanker ? topRankers.slice(1) : topRankers;

  useEffect(() => {
    const q = deferred.trim();
    const rid = ++reqRef.current;

    if (!q) {
      startTransition(() => { setSGuides([]); setSPosts([]); });
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const [gr, pr] = await Promise.all([
          getGuides({ search: q, limit: 4, sort: "latest" }),
          getPosts(1, 4, undefined, q),
        ]);
        if (reqRef.current !== rid) return;
        startTransition(() => {
          setSGuides(gr.success ? toGuides(gr.data) : []);
          setSPosts(pr.success ? toPosts(pr.posts) : []);
        });
      } catch (e) {
        if (reqRef.current === rid) startTransition(() => { setSGuides([]); setSPosts([]); });
        console.error("Home search failed:", e);
      } finally {
        if (reqRef.current === rid) setLoading(false);
      }
    })();
  }, [deferred]);

  const clearSearch = () => {
    reqRef.current++;
    setSearchQuery("");
    startTransition(() => { setSGuides([]); setSPosts([]); });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white pb-20 pt-16 md:pt-20">
      {/* ═══════════ HERO ═══════════ */}
      <section className={shell}>
        <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Unified Search</Pill>
            <span className="text-[11px] text-[#B4B4B0]">
              {initialStats?.date ? `${snapDate(initialStats.date)} 스냅샷` : "실시간 스냅샷"}
            </span>
          </div>

          <div className="mt-8 max-w-[640px]">
            <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.15] tracking-[-0.03em] text-[#37352F]">
              필요한 정보부터
              <br />
              곧바로 찾아보세요.
            </h1>
            <p className="mt-3 max-w-[480px] text-[14px] leading-relaxed text-[#787774]">
              공략, 커뮤니티, 랭킹을 한 곳에서 검색하세요.
            </p>

            {/* Search */}
            <div className="mt-7 flex items-center gap-2.5 rounded-xl border border-[#E3E2DE] bg-white px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow focus-within:border-[#2F80ED] focus-within:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]">
              <i className="fa-solid fa-magnifying-glass text-[14px] text-[#B4B4B0]" aria-hidden="true" />
              <label htmlFor="home-search" className="sr-only">검색</label>
              <input
                id="home-search"
                name="query"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="직업, 가이드, 게시글 키워드를 입력하세요"
                className="min-w-0 flex-1 border-none bg-transparent py-1 text-[14px] text-[#37352F] outline-none placeholder:text-[#C4C4C0]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="검색어 지우기"
                  className="flex size-6 items-center justify-center rounded-md text-[#B4B4B0] transition hover:bg-[#F1F1EF] hover:text-[#787774]"
                >
                  <i className="fa-solid fa-xmark text-[12px]" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {searchTags.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "rounded-md border border-[#E3E2DE] bg-white px-2.5 py-1 text-[12px] text-[#787774] transition-colors hover:bg-[#F7F6F3] hover:text-[#37352F]",
                    focusRing,
                  )}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SEARCH RESULTS ═══════════ */}
      {hasSearch ? (
        <section className={`${shell} mt-8`}>
          <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-6 md:p-8">
            <SectionHeader
              label="Search"
              title={loading ? "검색 중…" : `"${displayQ}" 결과`}
            />
            <p className="mt-1 text-[13px] text-[#9B9A97]">
              {loading
                ? "공략과 커뮤니티 결과를 불러오고 있습니다."
                : totalResults > 0
                  ? `총 ${fmt(totalResults)}건의 결과`
                  : "결과가 없습니다. 다른 키워드로 시도해보세요."}
            </p>

            {loading ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <SearchSkeleton key={i} />)}
              </div>
            ) : totalResults > 0 ? (
              <div className="mt-5 grid gap-6 xl:grid-cols-2">
                {/* Guides */}
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-[13px] font-semibold text-[#37352F]">
                      공략 {fmt(sGuideItems.length)}건
                    </span>
                    <Link href={`/search?q=${encodeURIComponent(displayQ)}`} className="text-[12px] text-[#2F80ED] hover:underline">전체 검색</Link>
                  </div>
                  <div className="grid gap-3">
                    {sGuideItems.length > 0
                      ? sGuideItems.map((it) => <GuideCard key={it.id} item={it} />)
                      : <p className="py-4 text-center text-[13px] text-[#B4B4B0]">공략 결과가 없습니다.</p>}
                  </div>
                </div>
                {/* Posts */}
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-[13px] font-semibold text-[#37352F]">
                      게시글 {fmt(sPostItems.length)}건
                    </span>
                    <Link href={`/search?q=${encodeURIComponent(displayQ)}`} className="text-[12px] text-[#2F80ED] hover:underline">전체 검색</Link>
                  </div>
                  <div className="grid gap-3">
                    {sPostItems.length > 0
                      ? sPostItems.map((it) => <PostCard key={it.id} item={it} />)
                      : <p className="py-4 text-center text-[13px] text-[#B4B4B0]">게시글 결과가 없습니다.</p>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[#B4B4B0]">
                  <i className="fa-solid fa-compass" aria-hidden="true" />
                </div>
                <div className="mt-3 text-[15px] font-semibold text-[#37352F]">결과가 없습니다</div>
                <div className="mt-1 text-[13px] text-[#9B9A97]">다른 키워드로 다시 시도해보세요.</div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* ═══════════ SNAPSHOT + RANKING ═══════════ */}
          <section className={`${shell} mt-8`}>
            <div className="grid gap-5 xl:grid-cols-12">
              {/* Jobs */}
              <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-5 md:p-6 xl:col-span-4 2xl:col-span-3">
                <SectionHeader label="Today Snapshot" title={leadJob?.name || "집계 대기"} href="/statistics" linkText="통계 보기" />
                <div className="flex items-center justify-between pb-3">
                  <p className="text-[13px] text-[#9B9A97]">
                    {leadJob
                      ? `${snapDate(initialStats?.date)} 기준`
                      : "랭킹 데이터 준비 중"}
                  </p>
                  {total > 0 && (
                    <span className="rounded-md bg-[#F1F1EF] px-2 py-0.5 text-[11px] font-semibold text-[#787774]">
                      표본 {fmt(total)}
                    </span>
                  )}
                </div>
                <div className="-mx-1 divide-y divide-[#F1F1EF]">
                  {topJobs.length > 0
                    ? topJobs.map((j, i) => <JobBar key={j.name} job={j} index={i} total={total} />)
                    : <p className="px-3 py-4 text-[13px] text-[#B4B4B0]">데이터 수집 대기 중</p>}
                </div>
              </div>

              {/* Rankers */}
              <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-5 md:p-6 xl:col-span-8 2xl:col-span-9">
                <SectionHeader label="Hall of Fame" title="지금 가장 앞선 랭커" href="/ranking" linkText="전체 랭킹 보기" />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_300px]">
                  <RankerSpotlight ranker={leadRanker} />
                  <div className="-mx-1 divide-y divide-[#F1F1EF]">
                    {subRankers.length > 0
                      ? subRankers.map((r) => <RankerRow key={`${r.rank}-${r.characterName}`} ranker={r} />)
                      : <p className="px-3 py-4 text-[13px] text-[#B4B4B0]">추가 랭커 준비 중</p>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════ GUIDES ═══════════ */}
          <section className={`${shell} mt-8`}>
            <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-6 md:p-8">
              <SectionHeader label="Latest Guides" title="지금 읽을 공략" href="/guide" linkText="전체 공략 보기" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {guideDeck.length > 0
                  ? guideDeck.map((it) => <GuideCard key={it.id} item={it} />)
                  : <p className="py-8 text-center text-[13px] text-[#B4B4B0] md:col-span-3">공략이 아직 없습니다.</p>}
              </div>
            </div>
          </section>

          {/* ═══════════ COMMUNITY + CREATORS ═══════════ */}
          <section className={`${shell} mt-8`}>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:items-stretch">
              {/* Community */}
              <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-6 md:p-8">
                <SectionHeader label="Community" title="방금 올라온 이야기" href="/community" linkText="커뮤니티 열기" />
                <div className="-mx-1 divide-y divide-[#F1F1EF]">
                  {communityDeck.length > 0
                    ? communityDeck.map((it) => <CommunityRow key={it.id} item={it} />)
                    : <p className="px-3 py-6 text-[13px] text-[#B4B4B0]">게시글이 없습니다.</p>}
                </div>
              </div>

              {/* Creators */}
              <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-6 md:p-8">
                <SectionHeader label="Creator Watch" title="함께 보는 채널" />
                <p className="mb-4 text-[12px] text-[#B4B4B0]">마비노기 모바일 관련 채널</p>
                <div className="-mx-1 divide-y divide-[#F1F1EF]">
                  {creatorDeck.length > 0
                    ? creatorDeck.map((ch, i) => <CreatorRow key={ch.id} channel={ch} index={i} />)
                    : <p className="px-3 py-6 text-[13px] text-[#B4B4B0]">채널 데이터 준비 중</p>}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
