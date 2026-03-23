"use client";

import { startTransition, useDeferredValue, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import type { YouTubeChannel } from "@/actions/youtube";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

type RawAuthor = {
  name?: string | null;
  image?: string | null;
};

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

type StatItem = {
  name: string;
  count: number;
};

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

const pageShell = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B6CB0]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E7]";
const numberFormatter = new Intl.NumberFormat("ko-KR");

const placeholderImages = [
  "/assets/placeholder/mm1.webp",
  "/assets/placeholder/mm2.jpg",
  "/assets/placeholder/mm3.jpg",
];

const guideColors: Record<string, string> = {
  "초보 가이드": "#3D78BF",
  "전투/던전": "#C97A32",
  "메인스트림": "#7460C4",
  "생활/알바": "#2F7F6D",
  "패션/뷰티": "#B1688B",
  돈벌기: "#B6852E",
};

const postColors: Record<string, string> = {
  질문: "#BA7E1F",
  정보: "#2E71B9",
  잡담: "#596A7D",
};

const searchTags = [
  { href: "/search?q=초보가이드", label: "#초보가이드" },
  { href: "/search?q=전투던전", label: "#전투던전" },
  { href: "/search?q=생활알바", label: "#생활알바" },
  { href: "/search?q=랭커직업", label: "#랭커직업" },
  { href: "/search?q=질문", label: "#질문" },
  { href: "/search?q=정보", label: "#정보" },
];

const searchScopes = [
  {
    icon: "fa-book-open",
    label: "공략 본문",
    description: "제목과 본문 기준으로 필요한 가이드를 바로 찾습니다.",
  },
  {
    icon: "fa-comments",
    label: "커뮤니티 글",
    description: "질문, 정보, 잡담 흐름을 키워드 단위로 좁혀봅니다.",
  },
  {
    icon: "fa-wand-magic-sparkles",
    label: "직업 키워드",
    description: "메타, 세팅, 직업명처럼 자주 찾는 주제를 빠르게 확인합니다.",
  },
];

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const formatCount = (value?: number) => numberFormatter.format(value ?? 0);

const formatRelativeTime = (dateString?: string) => {
  if (!dateString) return "업데이트 예정";

  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
};

const formatSnapshotDate = (dateString?: string) => {
  if (!dateString) return "업데이트 예정";

  return new Date(dateString).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
};

const formatSubscribers = (count?: string) => {
  const value = Number.parseInt(count || "0", 10);
  if (Number.isNaN(value)) return "0";
  if (value >= 10000) return `${(value / 10000).toFixed(1)}만`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}천`;
  return value.toLocaleString("ko-KR");
};

const formatVideoCount = (count?: string) => {
  const value = Number.parseInt(count || "0", 10);
  if (Number.isNaN(value)) return "0";
  return value.toLocaleString("ko-KR");
};

const formatPercent = (value: number, total: number) => {
  if (total <= 0) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

const toGuideArray = (value: unknown): RawGuide[] => (Array.isArray(value) ? (value as RawGuide[]) : []);

const toPostArray = (value: unknown): RawPost[] => (Array.isArray(value) ? (value as RawPost[]) : []);

const getAuthorImage = (item: { author?: RawAuthor }, seed: string) =>
  item.author?.image || `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

const getGuideMeta = (guide: RawGuide, index: number): GuideMeta => ({
  id: guide._id || `guide-${index}`,
  href: guide._id ? `/guide/${guide._id}` : "/guide",
  title: decodeHtmlEntities(guide.title || "제목 없는 공략"),
  excerpt: extractPreviewText(guide.content || "", 110) || "핵심 내용을 빠르게 읽을 수 있도록 미리보기를 준비했습니다.",
  category: guide.category || "공략",
  views: guide.views || 0,
  likes: guide.likes || 0,
  authorName: guide.author?.name || "익명",
  authorImage: getAuthorImage(guide, `guide-${guide._id || index}`),
  createdAt: guide.createdAt,
  color: guideColors[guide.category || ""] || "#3D78BF",
  thumbnail: guide.thumbnail || placeholderImages[index % placeholderImages.length],
});

const getPostMeta = (post: RawPost, index: number): PostMeta => ({
  id: post._id || `post-${index}`,
  href: post._id ? `/community/${post._id}` : "/community",
  title: extractPreviewText(post.content || "", 44) || "내용 미리보기를 준비 중입니다.",
  excerpt: extractPreviewText(post.content || "", 96) || "내용 미리보기를 준비 중입니다.",
  type: post.type || "커뮤니티",
  views: post.viewCount || 0,
  likes: post.likes || 0,
  comments: post.commentCount || 0,
  authorName: post.author?.name || "익명",
  authorImage: getAuthorImage(post, `post-${post._id || index}`),
  createdAt: post.createdAt,
  color: postColors[post.type || ""] || "#596A7D",
});

function SectionChip({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        dark ? "border-white/12 bg-white/8 text-[#E0BF86]" : "border-[#CFD6DE] bg-white/84 text-[#23486B]",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-[#E0BF86]" : "bg-[#2B6CB0]")} />
      {children}
    </div>
  );
}

function JobSignalCard({
  job,
  index,
  total,
}: {
  job: StatItem;
  index: number;
  total: number;
}) {
  const width = total > 0 ? Math.max((job.count / total) * 100, 10) : 10;

  return (
    <div className="rounded-[22px] border border-[#D8DEE5] bg-white/76 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-[#162435]">
          <span className="flex size-7 items-center justify-center rounded-full bg-[#162435] text-[11px] font-bold text-white">
            {index + 1}
          </span>
          {job.name}
        </div>
        <div className="text-[13px] font-medium text-[#62707D]">{formatCount(job.count)}명</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8EDF3]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#20476A_0%,#C68D3A_100%)]"
          style={{ width: `${width}%` }}
        />
      </div>
      <div className="mt-2 text-[12px] font-medium text-[#6C7581]">{formatPercent(job.count, total)} 점유</div>
    </div>
  );
}

function GuideStackCard({ item }: { item: GuideMeta }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group overflow-hidden rounded-[28px] border border-[#D7DDE4] bg-[#FFFCF7]/96 shadow-[0_18px_50px_rgba(12,18,28,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#BBC4CF] max-md:hover:translate-y-0",
        focusRingClass,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#E6EBF0]">
        <Image
          src={item.thumbnail}
          alt={item.title}
          fill
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,20,31,0)_28%,rgba(12,20,31,0.32)_100%)]" />
        <div className="absolute left-4 top-4 rounded-full border border-white/14 bg-black/22 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
          {item.category}
        </div>
      </div>

      <div className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: item.color }}>
          {formatRelativeTime(item.createdAt)}
        </div>
        <h3 className="mt-3 line-clamp-2 text-[21px] font-semibold leading-[1.22] tracking-[-0.03em] text-[#162435]">
          {item.title}
        </h3>
        <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-[#5D6673]">{item.excerpt}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-[#6B7481] [font-variant-numeric:tabular-nums]">
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-regular fa-eye" aria-hidden="true"></i>
            {formatCount(item.views)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="fa-regular fa-heart" aria-hidden="true"></i>
            {formatCount(item.likes)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PostStackCard({ item }: { item: PostMeta }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group rounded-[26px] border border-[#D7DDE4] bg-white/88 p-5 shadow-[0_16px_46px_rgba(12,18,28,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#BBC4CF] max-md:hover:translate-y-0",
        focusRingClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
            <span style={{ color: item.color }}>{item.type}</span>
            <span className="text-[#7B8490]">{formatRelativeTime(item.createdAt)}</span>
          </div>
          <h3 className="mt-3 break-words text-[19px] font-semibold leading-[1.28] tracking-[-0.03em] text-[#162435]">
            {item.title}
          </h3>
        </div>
        <div
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-black/6 bg-[#F6F8FA]"
          style={{ color: item.color }}
        >
          <i className="fa-solid fa-comment-dots" aria-hidden="true"></i>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-[14px] leading-6 text-[#5D6673]">{item.excerpt}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-[#6B7481] [font-variant-numeric:tabular-nums]">
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-regular fa-eye" aria-hidden="true"></i>
          {formatCount(item.views)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-regular fa-heart" aria-hidden="true"></i>
          {formatCount(item.likes)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="fa-regular fa-message" aria-hidden="true"></i>
          {formatCount(item.comments)}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-[#E4E8EE] pt-4">
        <Image
          src={item.authorImage}
          alt={item.authorName}
          width={34}
          height={34}
          className="size-[34px] rounded-full border border-black/8 bg-[#E6EBF0] object-cover"
        />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[#162435]">{item.authorName}</div>
          <div className="text-[12px] text-[#717B88]">커뮤니티 작성자</div>
        </div>
      </div>
    </Link>
  );
}

function RankerRow({ ranker }: { ranker: Ranker }) {
  return (
    <div className="rounded-[22px] border border-[#D7DDE4] bg-[#FCFBF8] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6C7581]">Rank {ranker.rank}</div>
          <div className="mt-2 truncate text-[18px] font-semibold tracking-[-0.03em] text-[#162435]">
            {ranker.characterName}
          </div>
          <div className="mt-1 text-[13px] text-[#62707D]">
            {ranker.job} · {ranker.server}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6C7581]">Score</div>
          <div className="mt-2 text-[16px] font-semibold text-[#162435]">{formatCount(ranker.score)}</div>
        </div>
      </div>
    </div>
  );
}

function CreatorCard({ channel, index }: { channel: YouTubeChannel; index: number }) {
  return (
    <a
      href={channel.channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative overflow-hidden rounded-[28px] border border-[#D7DDE4] bg-white/88 p-5 shadow-[0_18px_50px_rgba(12,18,28,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#BBC4CF] max-md:hover:translate-y-0",
        focusRingClass,
      )}
    >
      <div className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-[#13263B] text-[11px] font-bold text-white">
        {index + 1}
      </div>
      <div className="flex items-start gap-4 pr-8">
        <Image
          src={channel.thumbnailUrl}
          alt={channel.title}
          width={72}
          height={72}
          className="size-[72px] rounded-[22px] border border-black/8 bg-[#EEF1F5] object-cover"
        />
        <div className="min-w-0">
          <div className="text-[18px] font-semibold tracking-[-0.03em] text-[#162435]">{channel.title}</div>
          <div className="mt-2 flex flex-col gap-1 text-[13px] text-[#62707D]">
            <span>구독자 {formatSubscribers(channel.subscriberCount)}</span>
            <span>영상 {formatVideoCount(channel.videoCount)}개</span>
          </div>
        </div>
      </div>
      <div className="mt-5 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#23486B]">
        Channel Visit
        <i className="fa-solid fa-arrow-right text-[10px]" aria-hidden="true"></i>
      </div>
    </a>
  );
}

function SearchSkeletonCard() {
  return (
    <div className="animate-pulse rounded-[26px] border border-[#D7DDE4] bg-[#FCFBF8] p-5">
      <div className="h-3 w-20 rounded bg-black/8" />
      <div className="mt-4 h-6 w-4/5 rounded bg-black/8" />
      <div className="mt-3 h-4 w-full rounded bg-black/6" />
      <div className="mt-2 h-4 w-11/12 rounded bg-black/6" />
      <div className="mt-6 h-10 w-32 rounded bg-black/8" />
    </div>
  );
}

export default function HomeClient({ initialStats, initialHomeData }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [searchGuides, setSearchGuides] = useState<RawGuide[]>([]);
  const [searchPosts, setSearchPosts] = useState<RawPost[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRequestRef = useRef(0);

  const guides = toGuideArray(initialHomeData?.guides).map(getGuideMeta);
  const posts = toPostArray(initialHomeData?.posts).map(getPostMeta);
  const youtubers: YouTubeChannel[] = Array.isArray(initialHomeData?.youtubers) ? initialHomeData.youtubers : [];
  const topJobs = initialStats?.jobStats?.slice(0, 4) || [];
  const topRankers = initialStats?.topRankers?.slice(0, 5) || [];
  const analyzedTotal =
    initialStats?.totalAnalyzed || topJobs.reduce((sum, job) => sum + job.count, 0);

  const guideDeck = guides.slice(0, 6);
  const searchGuideItems = searchGuides.map(getGuideMeta);
  const searchPostItems = searchPosts.map(getPostMeta);
  const totalResults = searchGuideItems.length + searchPostItems.length;
  const hasSearch = searchQuery.trim().length > 0;
  const displayedQuery = deferredSearchQuery.trim() || searchQuery.trim();
  const leadJob = topJobs[0] || null;
  const leadRanker = topRankers[0] || null;
  const latestPost = posts[0] || null;
  const leadCreator = youtubers[0] || null;

  useEffect(() => {
    const query = deferredSearchQuery.trim();
    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;

    if (!query) {
      startTransition(() => {
        setSearchGuides([]);
        setSearchPosts([]);
      });
      setLoading(false);
      return;
    }

    const search = async () => {
      setLoading(true);

      try {
        const [guideResult, postResult] = await Promise.all([
          getGuides({ search: query, limit: 4, sort: "latest" }),
          getPosts(1, 4, undefined, query),
        ]);

        if (searchRequestRef.current !== requestId) return;

        startTransition(() => {
          setSearchGuides(guideResult.success ? toGuideArray(guideResult.data) : []);
          setSearchPosts(postResult.success ? toPostArray(postResult.posts) : []);
        });
      } catch (error) {
        if (searchRequestRef.current === requestId) {
          startTransition(() => {
            setSearchGuides([]);
            setSearchPosts([]);
          });
        }
        console.error("Home search failed:", error);
      } finally {
        if (searchRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    };

    void search();
  }, [deferredSearchQuery]);

  const handleClear = () => {
    searchRequestRef.current += 1;
    setSearchQuery("");
    startTransition(() => {
      setSearchGuides([]);
      setSearchPosts([]);
    });
    setLoading(false);
  };

  const signalRows = [
    {
      label: "Dominant Job",
      value: leadJob?.name || "집계 대기",
      note: leadJob ? `${formatCount(leadJob.count)}명의 랭커가 선택했습니다.` : "랭킹 데이터가 준비되면 자동 반영됩니다.",
    },
    {
      label: "Lead Ranker",
      value: leadRanker?.characterName || "업데이트 예정",
      note: leadRanker ? `${leadRanker.job} · ${leadRanker.server}` : "상위 랭커 스냅샷을 기다리는 중입니다.",
    },
    {
      label: "Community Tone",
      value: latestPost?.type || "신호 대기",
      note: latestPost ? `${formatRelativeTime(latestPost.createdAt)} 기준 새 글 흐름입니다.` : "커뮤니티 데이터가 준비되면 여기에 반영됩니다.",
    },
  ];

  return (
    <main className="relative overflow-hidden pb-24 pt-24 md:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,86,140,0.14),transparent_32%),radial-gradient(circle_at_88%_14%,rgba(192,144,74,0.15),transparent_22%),linear-gradient(180deg,#F7F1E5_0%,#F5EFE4_42%,#FBF9F4_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(18,35,53,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(18,35,53,0.9)_1px,transparent_1px)] [background-size:28px_28px]" />

      <section className={pageShell}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_380px]">
          <div className="relative overflow-hidden rounded-[42px] border border-[#E4D8C8] bg-[linear-gradient(180deg,#FBF8F2_0%,#F3EBDD_100%)] text-[#162435] shadow-[0_24px_70px_rgba(17,24,39,0.08)]">
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(35,72,109,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(35,72,109,0.9)_1px,transparent_1px)] [background-size:28px_28px]" />
            <div className="pointer-events-none absolute -left-12 top-10 h-44 w-44 rounded-full bg-[#E7D0A3]/38 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#C9DDF0]/45 blur-3xl" />

            <div className="relative z-10 p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <SectionChip>Home Search</SectionChip>
                <div className="rounded-full border border-[#DCCFBC] bg-white/74 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-[#6C7581]">
                  {initialStats?.date ? `${formatSnapshotDate(initialStats.date)} Snapshot` : "Live Snapshot"}
                </div>
              </div>

              <div className="mt-8">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A6630]">
                    Mabi Life / Search First
                  </p>
                  <h1 className="mt-4 max-w-[11ch] text-balance font-display text-[clamp(2.8rem,6vw,4.9rem)] leading-[0.88] tracking-[-0.06em] text-[#132238]">
                    필요한 정보부터 바로 찾는 홈.
                  </h1>
                  <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-[#5D6673] md:text-[17px]">
                    소개나 요약 지표를 한 번 더 반복하지 않고, 홈 첫 블록에서는 검색과 탐색만 바로 시작할 수 있게
                    정리했습니다. 아래 섹션에서 공략, 랭킹, 커뮤니티 흐름이 이어집니다.
                  </p>

                  <div className="mt-8 overflow-hidden rounded-[30px] border border-[#D7DDE4] bg-white/84 shadow-[0_18px_44px_rgba(12,18,28,0.06)] backdrop-blur">
                    <div className="border-b border-[#E5E9EE] px-5 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#23486B]">
                        Unified Search
                      </div>
                      <div className="mt-1 text-[13px] text-[#62707D]">공략과 커뮤니티를 한 번에 검색합니다.</div>
                    </div>

                    <div className="flex items-center gap-3 px-5 py-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-[15px] border border-[#D9E3EE] bg-[#F4F8FC] text-[#23486B]">
                        <i className="fa-solid fa-magnifying-glass text-sm" aria-hidden="true"></i>
                      </div>
                      <label htmlFor="home-search" className="sr-only">
                        공략과 게시글 검색
                      </label>
                      <input
                        id="home-search"
                        name="query"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="직업, 가이드, 게시글 키워드를 입력해보세요."
                        aria-label="공략과 게시글 검색"
                        className="min-w-0 flex-1 border-none bg-transparent px-1 py-2 text-[15px] text-[#132238] outline-none placeholder:text-[#8A94A1] md:text-base"
                      />
                      {searchQuery ? (
                        <button
                          type="button"
                          onClick={handleClear}
                          aria-label="검색어 지우기"
                          className={cn(
                            "flex size-9 items-center justify-center rounded-full text-[#7B8490] transition hover:bg-[#EDF3F8] hover:text-[#23486B]",
                            focusRingClass,
                          )}
                        >
                          <i className="fa-solid fa-circle-xmark text-base" aria-hidden="true"></i>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {searchTags.map((tag) => (
                      <Link
                        key={tag.href}
                        href={tag.href}
                        className={cn(
                          "rounded-full border border-[#D7DDE4] bg-white/76 px-4 py-2 text-[12px] font-medium text-[#5D6673] transition hover:-translate-y-0.5 hover:border-[#C2CDD8] hover:bg-[#F8FBFD] hover:text-[#23486B]",
                          focusRingClass,
                        )}
                      >
                        {tag.label}
                      </Link>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-3 md:grid-cols-3">
                    {searchScopes.map((scope) => (
                      <div
                        key={scope.label}
                        className="rounded-[22px] border border-[#D7DDE4] bg-white/72 p-4 shadow-[0_12px_30px_rgba(12,18,28,0.04)]"
                      >
                        <div className="flex size-10 items-center justify-center rounded-[14px] bg-[#EEF4FA] text-[#23486B]">
                          <i className={`fa-solid ${scope.icon}`} aria-hidden="true"></i>
                        </div>
                        <div className="mt-4 text-[15px] font-semibold tracking-[-0.02em] text-[#132238]">{scope.label}</div>
                        <div className="mt-2 text-[13px] leading-6 text-[#62707D]">{scope.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="grid gap-4">
            <div className="relative overflow-hidden rounded-[34px] border border-[#D8DEE5] bg-[linear-gradient(180deg,#FFFCF7_0%,#F7EFDF_100%)] p-5 shadow-[0_20px_58px_rgba(11,18,28,0.08)]">
              <div className="pointer-events-none absolute -right-8 top-0 h-28 w-28 rounded-full bg-[#E0BF86]/30 blur-3xl" />
              <SectionChip>Today Snapshot</SectionChip>
              <div className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#6C7581]">최신 직업 분포</div>
              <div className="mt-2 font-display text-[42px] leading-[0.9] tracking-[-0.05em] text-[#162435]">
                {leadJob?.name || "집계 대기"}
              </div>
              <div className="mt-3 text-[14px] leading-6 text-[#5D6673]">
                {leadJob
                  ? `${formatSnapshotDate(initialStats?.date)} 기준 ${formatCount(leadJob.count)}명의 랭커가 선택했습니다.`
                  : "랭킹 데이터가 준비되면 직업 분포 스냅샷이 여기에 표시됩니다."}
              </div>

              <div className="mt-5 grid gap-3">
                {topJobs.length > 0 ? (
                  topJobs.map((job, index) => (
                    <JobSignalCard key={job.name} job={job} index={index} total={analyzedTotal} />
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[#CBD2DA] bg-white/70 p-4 text-sm leading-6 text-[#6C7581]">
                    랭킹 데이터 수집을 기다리는 중입니다.
                  </div>
                )}
              </div>

              <Link
                href="/statistics"
                className={cn(
                  "mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#23486B] transition hover:text-[#162435]",
                  focusRingClass,
                )}
              >
                통계 페이지 열기
                <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true"></i>
              </Link>
            </div>

            <div className="rounded-[34px] border border-[#D8DEE5] bg-white/88 p-5 shadow-[0_20px_58px_rgba(11,18,28,0.08)]">
              <SectionChip>Signal Stack</SectionChip>
              <div className="mt-5 grid gap-3">
                {signalRows.map((signal) => (
                  <div key={signal.label} className="rounded-[22px] border border-[#D7DDE4] bg-[#FCFBF8] p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6C7581]">
                      {signal.label}
                    </div>
                    <div className="mt-2 text-[18px] font-semibold tracking-[-0.03em] text-[#162435]">{signal.value}</div>
                    <div className="mt-2 text-[13px] leading-6 text-[#62707D]">{signal.note}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/ranking"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-[#D7DDE4] bg-[#F7F8FA] px-4 py-2 text-[13px] font-semibold text-[#23486B] transition hover:border-[#BCC7D2] hover:text-[#162435]",
                    focusRingClass,
                  )}
                >
                  랭킹 보기
                </Link>
                <Link
                  href="/search"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border border-[#D7DDE4] bg-[#F7F8FA] px-4 py-2 text-[13px] font-semibold text-[#23486B] transition hover:border-[#BCC7D2] hover:text-[#162435]",
                    focusRingClass,
                  )}
                >
                  검색 열기
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {hasSearch ? (
        <section className={`${pageShell} mt-8`}>
          <div className="relative overflow-hidden rounded-[38px] border border-[#D8DEE5] bg-white/86 p-6 shadow-[0_20px_58px_rgba(11,18,28,0.08)] backdrop-blur md:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(44,108,176,0.08),transparent)]" />
            <div className="relative z-10">
              <div className="flex flex-col gap-4 border-b border-[#D8DEE5] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <SectionChip>Search Desk</SectionChip>
                  <h2 className="mt-4 text-balance font-display text-[40px] leading-[0.92] tracking-[-0.05em] text-[#162435]">
                    {loading ? "검색 중입니다." : `"${displayedQuery}" 결과`}
                  </h2>
                </div>
                <div className="max-w-[360px] text-[14px] leading-6 text-[#5D6673]">
                  {loading
                    ? "공략과 커뮤니티 결과를 동시에 불러오고 있습니다."
                    : totalResults > 0
                      ? `총 ${formatCount(totalResults)}건의 결과를 찾았습니다.`
                      : "일치하는 결과가 없다면 키워드를 더 짧게 바꾸거나 검색 태그를 활용해보세요."}
                </div>
              </div>

              {loading ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <SearchSkeletonCard key={index} />
                  ))}
                </div>
              ) : totalResults > 0 ? (
                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-[30px] border border-[#D8DEE5] bg-[#FCFBF8] p-5">
                    <div className="flex items-center justify-between gap-3 border-b border-[#E2E7ED] pb-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2B6CB0]">
                          Guide Match
                        </div>
                        <div className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#162435]">
                          공략 결과 {formatCount(searchGuideItems.length)}
                        </div>
                      </div>
                      <Link href={`/search?q=${encodeURIComponent(displayedQuery)}`} className={cn("text-sm font-semibold text-[#23486B] transition hover:text-[#162435]", focusRingClass)}>
                        전체 검색
                      </Link>
                    </div>
                    <div className="mt-5 grid gap-4">
                      {searchGuideItems.length > 0 ? (
                        searchGuideItems.map((item) => <GuideStackCard key={item.id} item={item} />)
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-[#CBD2DA] bg-white p-5 text-sm leading-6 text-[#66707D]">
                          공략 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[30px] border border-[#D8DEE5] bg-[#FCFBF8] p-5">
                    <div className="flex items-center justify-between gap-3 border-b border-[#E2E7ED] pb-4">
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C17D1C]">
                          Community Match
                        </div>
                        <div className="mt-2 text-[24px] font-semibold tracking-[-0.03em] text-[#162435]">
                          게시글 결과 {formatCount(searchPostItems.length)}
                        </div>
                      </div>
                      <Link href={`/search?q=${encodeURIComponent(displayedQuery)}`} className={cn("text-sm font-semibold text-[#23486B] transition hover:text-[#162435]", focusRingClass)}>
                        전체 검색
                      </Link>
                    </div>
                    <div className="mt-5 grid gap-4">
                      {searchPostItems.length > 0 ? (
                        searchPostItems.map((item) => <PostStackCard key={item.id} item={item} />)
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-[#CBD2DA] bg-white p-5 text-sm leading-6 text-[#66707D]">
                          게시글 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-[30px] border border-dashed border-[#CBD2DA] bg-[#FCFBF8] px-6 py-10 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-[#D7DDE4] bg-white text-[#23486B]">
                    <i className="fa-solid fa-compass" aria-hidden="true"></i>
                  </div>
                  <div className="mt-4 text-[20px] font-semibold tracking-[-0.03em] text-[#162435]">검색 결과가 없습니다.</div>
                  <div className="mt-2 text-[14px] leading-6 text-[#62707D]">
                    다른 직업명이나 카테고리 키워드로 다시 시도해보세요.
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className={`${pageShell} mt-8`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[34px] border border-[#D8DEE5] bg-white/88 p-5 shadow-[0_20px_58px_rgba(11,18,28,0.08)]">
                <SectionChip>Rank Deck</SectionChip>
                <div className="mt-5 space-y-3">
                  {topRankers.length > 0 ? (
                    topRankers.map((ranker) => <RankerRow key={`${ranker.rank}-${ranker.characterName}`} ranker={ranker} />)
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-[#CBD2DA] bg-[#FCFBF8] p-4 text-sm leading-6 text-[#66707D]">
                      랭커 보드를 준비 중입니다.
                    </div>
                  )}
                </div>
                <Link
                  href="/ranking"
                  className={cn(
                    "mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#23486B] transition hover:text-[#162435]",
                    focusRingClass,
                  )}
                >
                  전체 랭킹 열기
                  <i className="fa-solid fa-arrow-right text-[11px]" aria-hidden="true"></i>
                </Link>
              </div>

              <div className="overflow-hidden rounded-[34px] border border-[#173752]/40 bg-[linear-gradient(135deg,#102437_0%,#173754_100%)] p-5 text-white shadow-[0_24px_62px_rgba(11,22,35,0.18)]">
                <SectionChip dark>System Note</SectionChip>
                <div className="mt-5 font-display text-[32px] leading-[0.92] tracking-[-0.05em] text-white">
                  공략 피드와 랭킹 흐름을
                  <br />
                  바로 이어서 읽도록 정리했습니다.
                </div>
                <div className="mt-4 text-[14px] leading-7 text-white/70">
                  대표 공략 카드 중복은 제거하고, 필요한 정보가 보이는 순서를 더 짧고 단단하게 맞췄습니다.
                </div>
              </div>
            </div>
          </section>

          <section className={`${pageShell} mt-8`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="rounded-[38px] border border-[#D8DEE5] bg-white/86 p-6 shadow-[0_20px_58px_rgba(11,18,28,0.08)] backdrop-blur md:p-7">
                <div className="flex flex-col gap-4 border-b border-[#D8DEE5] pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionChip>Guide Flow</SectionChip>
                    <h2 className="mt-4 text-balance font-display text-[40px] leading-[0.92] tracking-[-0.05em] text-[#162435]">
                      최신 공략 피드
                    </h2>
                  </div>
                  <Link href="/guide" className={cn("text-sm font-semibold text-[#23486B] transition hover:text-[#162435]", focusRingClass)}>
                    전체 공략 보기
                  </Link>
                </div>

                <div className="mt-6 grid gap-5 xl:grid-cols-2">
                  {guideDeck.length > 0 ? (
                    guideDeck.map((item) => <GuideStackCard key={item.id} item={item} />)
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-[#CBD2DA] bg-[#FCFBF8] p-5 text-sm leading-6 text-[#66707D]">
                      홈에 노출할 공략이 아직 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[38px] border border-[#D8DEE5] bg-white/86 p-6 shadow-[0_20px_58px_rgba(11,18,28,0.08)] backdrop-blur md:p-7">
                <div className="flex flex-col gap-4 border-b border-[#D8DEE5] pb-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionChip>Community Pulse</SectionChip>
                    <h2 className="mt-4 text-balance font-display text-[40px] leading-[0.92] tracking-[-0.05em] text-[#162435]">
                      방금 올라온 이야기
                    </h2>
                  </div>
                  <Link href="/community" className={cn("text-sm font-semibold text-[#23486B] transition hover:text-[#162435]", focusRingClass)}>
                    커뮤니티 열기
                  </Link>
                </div>

                <div className="mt-6 grid gap-4">
                  {posts.length > 0 ? (
                    posts.slice(0, 4).map((item) => <PostStackCard key={item.id} item={item} />)
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-[#CBD2DA] bg-[#FCFBF8] p-5 text-sm leading-6 text-[#66707D]">
                      홈에 노출할 게시글이 아직 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={`${pageShell} mt-8`}>
            <div className="rounded-[38px] border border-[#D8DEE5] bg-white/86 p-6 shadow-[0_20px_58px_rgba(11,18,28,0.08)] backdrop-blur md:p-7">
              <div className="flex flex-col gap-4 border-b border-[#D8DEE5] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <SectionChip>Creator Watch</SectionChip>
                  <h2 className="mt-4 text-balance font-display text-[40px] leading-[0.92] tracking-[-0.05em] text-[#162435]">
                    함께 보는 영상 채널
                  </h2>
                </div>
                <div className="max-w-[360px] text-[14px] leading-6 text-[#5D6673]">
                  {leadCreator
                    ? `${leadCreator.title} 포함 ${formatCount(youtubers.length)}개 채널을 홈에서 바로 연결합니다.`
                    : "YouTube API가 연결되면 홈에서 인기 채널을 바로 확인할 수 있습니다."}
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {youtubers.length > 0 ? (
                  youtubers.map((channel, index) => <CreatorCard key={channel.id} channel={channel} index={index} />)
                ) : (
                  <div className="rounded-[26px] border border-dashed border-[#CBD2DA] bg-[#FCFBF8] p-5 text-sm leading-6 text-[#66707D] md:col-span-2 xl:col-span-4">
                    YouTube API 키가 없거나 채널 데이터를 불러오지 못해 크리에이터 섹션을 준비 중입니다.
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
