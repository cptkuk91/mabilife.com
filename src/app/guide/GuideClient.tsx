"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { getGuides } from "@/actions/guide";
import { decodeHtmlEntities, extractPreviewText } from "@/lib/text";

export type GuideSummary = {
  _id: string;
  slug?: string;
  title: string;
  content: string;
  category: string;
  views?: number;
  likes?: number;
  commentCount?: number;
  thumbnail?: string | null;
  author?: {
    id?: string;
    name?: string;
    image?: string | null;
  };
  createdAt: string;
};

const categoryColors: Record<string, string> = {
  "초보 가이드": "#2F80ED",
  "전투/던전": "#EB5757",
  "메인스트림": "#9B51E0",
  "생활/알바": "#27AE60",
  "패션/뷰티": "#E84393",
  돈벌기: "#F2994A",
};

const categories = ["전체", "초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];
const LIMIT = 20;

const placeholderImages = [
  "/assets/placeholder/mm1.webp",
  "/assets/placeholder/mm2.jpg",
  "/assets/placeholder/mm3.jpg",
];

const categoryStyles: Record<string, { icon: string; bg: string; color: string }> = {
  "초보 가이드": { icon: "fa-graduation-cap", bg: "#E8F0FE", color: "#2F80ED" },
  "전투/던전": { icon: "fa-dungeon", bg: "#FDECEC", color: "#EB5757" },
  "메인스트림": { icon: "fa-book-open", bg: "#F5ECFE", color: "#9B51E0" },
  "생활/알바": { icon: "fa-hammer", bg: "#E6F8EC", color: "#27AE60" },
  "패션/뷰티": { icon: "fa-shirt", bg: "#FDECF4", color: "#E84393" },
  돈벌기: { icon: "fa-sack-dollar", bg: "#FEF4E6", color: "#F2994A" },
};

const relTime = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return new Date(date).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
};

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
const fr = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";

type ViewMode = "grid" | "list";

const toGuideSummaries = (data: unknown): GuideSummary[] => (Array.isArray(data) ? (data as GuideSummary[]) : []);
const avatarSrc = (guide: GuideSummary) =>
  guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id || guide._id}`;

export default function GuideClient() {
  const router = useRouter();
  const { status } = useSession();
  const [guides, setGuides] = useState<GuideSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [hasMore, setHasMore] = useState(true);

  const loadGuides = useCallback(async (initial = false, skip = 0, nextTab = activeTab, nextSearch = searchQuery) => {
    setLoading(true);

    const result = await getGuides({
      category: nextTab === "전체" ? undefined : nextTab,
      search: nextSearch || undefined,
      limit: LIMIT,
      skip,
      sort: "latest",
    });

    if (result.success && result.data) {
      const nextGuides = toGuideSummaries(result.data);
      setHasMore(nextGuides.length >= LIMIT);
      setGuides((prev) => (initial ? nextGuides : [...prev, ...nextGuides]));
    } else if (initial) {
      setGuides([]);
      setHasMore(false);
    }

    setLoading(false);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadGuides(true, 0, activeTab, searchQuery);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [activeTab, searchQuery, loadGuides]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const handleWrite = () => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    router.push("/guide/write");
  };

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] bg-white px-5 pb-24 pt-16 sm:px-6 md:pb-16 md:pt-20 lg:px-8">
      <header className="pb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">Guides</div>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#37352F] md:text-[32px]">공략</h1>
        <p className="mt-1 text-[14px] text-[#787774]">에린 생활에 필요한 모든 지식</p>
      </header>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition",
              activeTab === category
                ? "bg-[#37352F] text-white"
                : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
              fr,
            )}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-5 flex items-center gap-2.5 rounded-xl border border-[#E3E2DE] bg-white px-4 py-2.5 transition-shadow focus-within:border-[#2F80ED] focus-within:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]"
      >
        <i className="fa-solid fa-magnifying-glass text-[13px] text-[#B4B4B0]" aria-hidden="true" />
        <input
          type="text"
          placeholder="공략 검색..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="min-w-0 flex-1 border-none bg-transparent py-0.5 text-[14px] text-[#37352F] outline-none placeholder:text-[#C4C4C0]"
        />
        {searchInput && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="검색어 지우기"
            className="flex size-6 items-center justify-center rounded-md text-[#B4B4B0] transition hover:bg-[#F1F1EF] hover:text-[#787774]"
          >
            <i className="fa-solid fa-xmark text-[11px]" aria-hidden="true" />
          </button>
        )}
        <button
          type="submit"
          className={cn(
            "rounded-lg bg-[#2F80ED] px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#1A66CC]",
            fr,
          )}
        >
          검색
        </button>
      </form>

      {searchQuery && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-[#E8F0FE] bg-[#F0F6FF] px-4 py-2.5 text-[13px] text-[#2F80ED]">
          <span>&quot;{searchQuery}&quot; 검색 결과</span>
          <button type="button" onClick={clearSearch} className="underline underline-offset-2 transition hover:text-[#1A66CC]">
            초기화
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <span className="text-[13px] text-[#9B9A97]">{!loading && guides.length > 0 && `${guides.length}개의 공략`}</span>
        <div className="flex gap-1">
          <button
            type="button"
            className={cn(
              "flex size-8 items-center justify-center rounded-md border text-[14px] transition",
              viewMode === "grid"
                ? "border-[#2F80ED] bg-[#2F80ED] text-white"
                : "border-[#E3E2DE] text-[#9B9A97] hover:bg-[#F7F6F3] hover:text-[#37352F]",
              fr,
            )}
            onClick={() => setViewMode("grid")}
            title="그리드 보기"
          >
            <i className="fa-solid fa-table-cells" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={cn(
              "flex size-8 items-center justify-center rounded-md border text-[14px] transition",
              viewMode === "list"
                ? "border-[#2F80ED] bg-[#2F80ED] text-white"
                : "border-[#E3E2DE] text-[#9B9A97] hover:bg-[#F7F6F3] hover:text-[#37352F]",
              fr,
            )}
            onClick={() => setViewMode("list")}
            title="리스트 보기"
          >
            <i className="fa-solid fa-list" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-2"}>
        {loading && guides.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] px-6 py-16 text-center">
            <i className="fa-solid fa-spinner fa-spin text-[20px] text-[#B4B4B0]" aria-hidden="true" />
            <p className="mt-3 text-[14px] text-[#9B9A97]">공략을 불러오고 있습니다…</p>
          </div>
        ) : guides.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[20px] text-[#B4B4B0]">
              <i className="fa-solid fa-file-circle-question" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-[#37352F]">등록된 공략이 없습니다</p>
            <p className="mt-1 text-[13px] text-[#9B9A97]">첫 번째 공략을 작성해보세요.</p>
            <button
              type="button"
              onClick={handleWrite}
              className={cn(
                "mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#2F80ED] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#1A66CC]",
                fr,
              )}
            >
              <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
              공략 작성하기
            </button>
          </div>
        ) : viewMode === "grid" ? (
          guides.map((guide, index) => <GridCard key={guide._id} guide={guide} index={index} />)
        ) : (
          <GuideListView guides={guides} />
        )}
      </div>

      {loading && guides.length > 0 && (
        <div className="py-8 text-center text-[13px] text-[#B4B4B0]">
          <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> 불러오는 중…
        </div>
      )}

      {!loading && hasMore && guides.length > 0 && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => void loadGuides(false, guides.length)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-[#E3E2DE] bg-white px-6 py-2.5 text-[14px] font-medium text-[#37352F] transition hover:bg-[#F7F6F3]",
              fr,
            )}
          >
            더 보기
            <i className="fa-solid fa-chevron-down text-[10px] text-[#B4B4B0]" aria-hidden="true" />
          </button>
        </div>
      )}

      <button
        type="button"
        className={cn(
          "fixed bottom-[88px] right-5 z-[100] flex size-12 items-center justify-center rounded-full bg-[#2F80ED] text-white shadow-[0_2px_12px_rgba(47,128,237,0.3)] transition hover:bg-[#1A66CC] hover:shadow-[0_4px_16px_rgba(47,128,237,0.4)] md:bottom-8 md:right-8",
          fr,
        )}
        onClick={handleWrite}
        title="공략 작성"
      >
        <i className="fa-solid fa-pen-to-square text-[16px]" aria-hidden="true" />
      </button>
    </div>
  );
}

function GuideListView({ guides }: { guides: GuideSummary[] }) {
  return (
    <>
      {guides.map((guide) => {
        const style = categoryStyles[guide.category] || { icon: "fa-lightbulb", bg: "#E8F0FE", color: "#2F80ED" };

        return (
          <Link
            key={guide._id}
            href={`/guide/${guide.slug || guide._id}`}
            className="group flex gap-4 rounded-xl border border-[#E3E2DE] bg-white p-4 transition-all duration-200 hover:border-[#D3D1CB] hover:bg-[#FBFBFA]"
          >
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[20px]"
              style={{ background: style.bg, color: style.color }}
            >
              <i className={`fa-solid ${style.icon}`} aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold" style={{ color: style.color }}>
                  {guide.category}
                </span>
                <span className="text-[11px] text-[#B4B4B0]">{relTime(guide.createdAt)}</span>
              </div>

              <h3 className="mt-1 truncate text-[15px] font-semibold text-[#37352F] transition-colors group-hover:text-[#2F80ED]">
                {decodeHtmlEntities(guide.title)}
              </h3>

              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#787774]">
                {extractPreviewText(guide.content, 100)}
              </p>

              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[12px] text-[#787774]">
                  <Image
                    src={avatarSrc(guide)}
                    alt={`${guide.author?.name || "익명"} 프로필`}
                    width={20}
                    height={20}
                    className="size-5 rounded-full border border-[#E3E2DE] object-cover"
                  />
                  <span>{guide.author?.name || "익명"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[11px] tabular-nums text-[#B4B4B0]">
                  <span className="inline-flex items-center gap-1">
                    <i className="fa-regular fa-eye" aria-hidden="true" />
                    {guide.views || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <i className="fa-regular fa-heart" aria-hidden="true" />
                    {guide.likes || 0}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <i className="fa-regular fa-comment" aria-hidden="true" />
                    {guide.commentCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </>
  );
}

function GridCard({ guide, index }: { guide: GuideSummary; index: number }) {
  const color = categoryColors[guide.category] || "#2F80ED";

  return (
    <Link
      href={`/guide/${guide.slug || guide._id}`}
      className="group overflow-hidden rounded-xl border border-[#E3E2DE] bg-white transition-all duration-200 hover:border-[#D3D1CB] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-[#F7F6F3]">
        <Image
          src={guide.thumbnail || placeholderImages[index % placeholderImages.length]}
          alt={decodeHtmlEntities(guide.title)}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(max-width:600px) 100vw, (max-width:900px) 50vw, 33vw"
          priority={index < 3}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="absolute left-3 top-3">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-white backdrop-blur-sm"
            style={{ backgroundColor: `${color}CC` }}
          >
            {guide.category}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[#37352F]">
          {decodeHtmlEntities(guide.title)}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#787774]">
          {extractPreviewText(guide.content, 100)}
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-[#F1F1EF] pt-3">
          <div className="flex items-center gap-2 text-[12px] text-[#787774]">
            <Image
              src={avatarSrc(guide)}
              alt={`${guide.author?.name || "익명"} 프로필`}
              width={20}
              height={20}
              className="size-5 rounded-full border border-[#E3E2DE] object-cover"
            />
            <span>{guide.author?.name || "익명"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] tabular-nums text-[#B4B4B0]">
            <span className="inline-flex items-center gap-1">
              <i className="fa-regular fa-eye" aria-hidden="true" />
              {guide.views || 0}
            </span>
            <span className="inline-flex items-center gap-1">
              <i className="fa-regular fa-heart" aria-hidden="true" />
              {guide.likes || 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
