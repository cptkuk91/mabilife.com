"use client";

import Image from "next/image";
import { YouTubeChannel } from "@/actions/youtube";

type Props = {
  channels: YouTubeChannel[] | null;
};

const sectionShellClass = "mx-auto max-w-[var(--max-width)] px-4 md:px-5";
const headerClass = "mb-5 flex items-center justify-between gap-4";
const titleClass = "text-[20px] font-bold tracking-[-0.03em] text-app-title md:text-[22px]";
const moreLinkClass =
  "inline-flex items-center gap-1.5 text-sm font-semibold text-app-accent transition hover:text-app-accent-hover";
const gridClass = "grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4";
const cardClass =
  "group relative overflow-hidden rounded-[22px] bg-white px-4 py-5 text-center shadow-elev-card transition duration-300 hover:-translate-y-1 hover:shadow-elev-hover md:px-5 md:py-6 max-md:hover:translate-y-0";
const rankBadgeClass =
  "absolute right-3 top-3 flex size-6 items-center justify-center rounded-[8px] text-[11px] font-bold md:right-3.5 md:top-3.5";
const channelNameClass =
  "mt-3 w-full truncate text-[13px] font-semibold text-app-title transition group-hover:text-[#FF2D55] md:text-[15px]";
const statsClass =
  "mt-2 flex flex-col items-center gap-1 text-[11px] md:flex-row md:justify-center md:gap-2.5 md:text-xs";

const formatSubscribers = (count: string) => {
  const num = parseInt(count);
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}천`;
  }
  return num.toLocaleString();
};

const getRankClass = (index: number) => {
  switch (index) {
    case 0:
      return "bg-[#FFCC00]/15 text-[#FFCC00]";
    case 1:
      return "bg-[#8E8E93]/15 text-[#8E8E93]";
    case 2:
      return "bg-[#CD7F32]/15 text-[#CD7F32]";
    default:
      return "bg-black/[0.04] text-app-body";
  }
};

export default function YouTuberSection({ channels }: Props) {
  if (!channels || channels.length === 0) {
    return null;
  }

  return (
    <section className={`${sectionShellClass} pb-4 pt-10 md:pt-12`}>
      {/* Section Header */}
      <div className={headerClass}>
        <h2 className={titleClass}>인기 크리에이터</h2>
        <a
          href="https://www.youtube.com/results?search_query=%EB%A7%88%EB%B9%84%EB%85%B8%EA%B8%B0+%EB%AA%A8%EB%B0%94%EC%9D%BC"
          target="_blank"
          rel="noopener noreferrer"
          className={moreLinkClass}
        >
          더보기
          <i className="fa-solid fa-chevron-right text-[12px]"></i>
        </a>
      </div>

      {/* Channel Cards Grid */}
      <div className={gridClass}>
        {channels.slice(0, 4).map((channel, index) => (
          <a
            key={channel.id}
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cardClass}
          >
            {/* Rank Badge */}
            <div className={`${rankBadgeClass} ${getRankClass(index)}`}>
              {index + 1}
            </div>

            {/* Channel Info */}
            <div className="flex flex-col items-center text-center">
              {/* Thumbnail */}
              <div className="overflow-hidden rounded-full border-[3px] border-black/5 transition group-hover:border-[#FF2D55]/20">
                <Image
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  width={72}
                  height={72}
                  className="size-14 object-cover md:size-[72px]"
                />
              </div>

              {/* Name */}
              <h3 className={channelNameClass}>{channel.title}</h3>

              {/* Stats */}
              <div className={statsClass}>
                <span className="font-semibold text-[#FF2D55]">
                  구독자 {formatSubscribers(channel.subscriberCount)}
                </span>
                <span className="text-app-body">
                  {parseInt(channel.videoCount).toLocaleString()}개
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
