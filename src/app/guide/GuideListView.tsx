"use client";

import Image from "next/image";
import Link from "next/link";
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

const avatarSrc = (guide: GuideSummary) =>
  guide.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${guide.author?.id || guide._id}`;

export default function GuideListView({ guides }: { guides: GuideSummary[] }) {
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
