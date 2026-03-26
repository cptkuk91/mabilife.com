"use client";

import Image from "next/image";
import Link from "next/link";

type GuideItem = {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  category: string;
  views: number;
  likes: number;
  createdAt?: string;
  thumbnail: string;
};

type PostItem = {
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

type HomeSearchResultsProps = {
  displayQuery: string;
  guideItems: GuideItem[];
  postItems: PostItem[];
  loading: boolean;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
const numberFmt = new Intl.NumberFormat("ko-KR");

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
const fmt = (value?: number) => numberFmt.format(value ?? 0);

const relTime = (date?: string) => {
  if (!date) return "업데이트 예정";
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

export default function HomeSearchResults({
  displayQuery,
  guideItems,
  postItems,
  loading,
}: HomeSearchResultsProps) {
  const totalResults = guideItems.length + postItems.length;

  return (
    <section className="mx-auto mt-8 w-full max-w-[1100px] px-5 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[#E3E2DE] bg-[#FBFBFA] p-6 md:p-8">
        <div className="flex flex-col gap-1 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">Search</div>
            <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#37352F] md:text-[24px]">
              {loading ? "검색 중…" : `"${displayQuery}" 결과`}
            </h2>
          </div>
        </div>

        <p className="mt-1 text-[13px] text-[#9B9A97]">
          {loading
            ? "공략과 커뮤니티 결과를 불러오고 있습니다."
            : totalResults > 0
              ? `총 ${fmt(totalResults)}건의 결과`
              : "결과가 없습니다. 다른 키워드로 시도해보세요."}
        </p>

        {loading ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SearchSkeleton key={index} />
            ))}
          </div>
        ) : totalResults > 0 ? (
          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[13px] font-semibold text-[#37352F]">공략 {fmt(guideItems.length)}건</span>
                <Link href={`/search?q=${encodeURIComponent(displayQuery)}`} className="text-[12px] text-[#2F80ED] hover:underline">
                  전체 검색
                </Link>
              </div>
              <div className="grid gap-3">
                {guideItems.length > 0 ? (
                  guideItems.map((item) => <SearchGuideCard key={item.id} item={item} />)
                ) : (
                  <p className="py-4 text-center text-[13px] text-[#B4B4B0]">공략 결과가 없습니다.</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-3">
                <span className="text-[13px] font-semibold text-[#37352F]">게시글 {fmt(postItems.length)}건</span>
                <Link href={`/search?q=${encodeURIComponent(displayQuery)}`} className="text-[12px] text-[#2F80ED] hover:underline">
                  전체 검색
                </Link>
              </div>
              <div className="grid gap-3">
                {postItems.length > 0 ? (
                  postItems.map((item) => <SearchPostCard key={item.id} item={item} />)
                ) : (
                  <p className="py-4 text-center text-[13px] text-[#B4B4B0]">게시글 결과가 없습니다.</p>
                )}
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
  );
}

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

function SearchGuideCard({ item }: { item: GuideItem }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group overflow-hidden rounded-xl border border-[#E3E2DE] bg-white transition-all duration-200 hover:border-[#D3D1CB] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
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
        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-[#37352F]">{item.title}</h3>
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

function SearchPostCard({ item }: { item: PostItem }) {
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

function SearchSkeleton() {
  return (
    <div className="rounded-xl border border-[#E3E2DE] bg-white p-4">
      <div className="h-3 w-16 rounded bg-[#F1F1EF]" />
      <div className="mt-3 h-4 w-3/4 rounded bg-[#F7F6F3]" />
      <div className="mt-2 h-4 w-11/12 rounded bg-[#F7F6F3]" />
      <div className="mt-4 flex gap-2">
        <div className="h-3 w-14 rounded bg-[#F1F1EF]" />
        <div className="h-3 w-14 rounded bg-[#F1F1EF]" />
      </div>
    </div>
  );
}
