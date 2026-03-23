"use client";

import Image from "next/image";
import { YouTubeChannel } from "@/actions/youtube";

type Props = {
  channels: YouTubeChannel[] | null;
};

const sectionShellClass = "w-full px-4 pb-4 pt-10 sm:px-6 md:pt-12 lg:px-8";
const sectionInnerClass = "mx-auto w-full max-w-[1240px]";
const frameClass =
  "relative overflow-hidden rounded-[32px] border border-[#D7DCE2] bg-white/76 shadow-[0_20px_54px_rgba(11,18,28,0.08)] backdrop-blur-md";
const frameInnerClass = "relative z-10 px-5 py-6 md:px-7 md:py-7";
const badgeClass =
  "inline-flex items-center gap-2 rounded-full border border-[#CCD4DD] bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#23486D]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E72C6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ECE9E1]";
const titleClass = "mt-4 text-balance font-display text-[28px] leading-[0.96] tracking-[-0.05em] text-[#132238] md:text-[40px]";
const moreLinkClass =
  `inline-flex items-center gap-1.5 text-sm font-semibold text-[#23486D] transition-colors hover:text-[#132238] ${focusRingClass}`;
const gridClass = "mt-6 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4";
const cardClass =
  `group relative overflow-hidden rounded-[24px] border border-[#D8DDE2] bg-[#FDFBF8]/92 px-4 py-5 text-center shadow-[0_16px_44px_rgba(10,18,28,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#B8C1CB] hover:shadow-[0_24px_52px_rgba(10,18,28,0.1)] md:px-5 md:py-6 max-md:hover:translate-y-0 ${focusRingClass}`;
const rankBadgeClass =
  "absolute right-3 top-3 flex size-7 items-center justify-center rounded-full text-[11px] font-bold md:right-4 md:top-4";
const channelNameClass =
  "mt-4 w-full truncate text-[14px] font-semibold tracking-[-0.01em] text-[#132238] transition group-hover:text-[#23486D] md:text-[16px]";
const statsClass =
  "mt-2 flex flex-col items-center gap-1 text-[11px] md:flex-row md:justify-center md:gap-2.5 md:text-xs";

const formatSubscribers = (count: string) => {
  const num = parseInt(count, 10);
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}천`;
  return num.toLocaleString();
};

const getRankClass = (index: number) => {
  switch (index) {
    case 0:
      return "bg-[#D4B26D] text-[#1A1511]";
    case 1:
      return "bg-[#B7BBC4] text-[#1A1511]";
    case 2:
      return "bg-[#B17442] text-white";
    default:
      return "bg-black/[0.05] text-[#6B625B]";
  }
};

export default function YouTuberSection({ channels }: Props) {
  if (!channels || channels.length === 0) {
    return null;
  }

  return (
    <section className={sectionShellClass}>
      <div className={`${sectionInnerClass} ${frameClass}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(39,83,128,0.08),transparent_30%)]" />
        <div className={frameInnerClass}>
          <div className="flex flex-col gap-4 border-b border-[#D7DCE2] pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className={badgeClass}>Creator Ledger</div>
              <h2 className={titleClass}>인기 크리에이터</h2>
            </div>
            <a
              href="https://www.youtube.com/results?search_query=%EB%A7%88%EB%B9%84%EB%85%B8%EA%B8%B0+%EB%AA%A8%EB%B0%94%EC%9D%BC"
              target="_blank"
              rel="noopener noreferrer"
              className={moreLinkClass}
            >
              더보기
              <i className="fa-solid fa-chevron-right text-[12px]" aria-hidden="true"></i>
            </a>
          </div>

          <div className={gridClass}>
            {channels.slice(0, 4).map((channel, index) => (
              <a
                key={channel.id}
                href={channel.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                <div className={`${rankBadgeClass} ${getRankClass(index)}`}>{index + 1}</div>

                <div className="flex flex-col items-center text-center">
                  <div className="overflow-hidden rounded-full border-[3px] border-[#D6DDE6] bg-[#EEF2F6] transition group-hover:border-[#88A9CC]">
                    <Image
                      src={channel.thumbnailUrl}
                      alt={channel.title}
                      width={80}
                      height={80}
                      className="size-16 object-cover transition duration-500 group-hover:scale-[1.05] md:size-20"
                    />
                  </div>

                  <h3 className={channelNameClass}>{channel.title}</h3>

                  <div className={statsClass}>
                    <span className="font-semibold text-[#23486D]">
                      구독자 {formatSubscribers(channel.subscriberCount)}
                    </span>
                    <span className="text-[#66707D]">
                      영상 {parseInt(channel.videoCount, 10).toLocaleString()}개
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
