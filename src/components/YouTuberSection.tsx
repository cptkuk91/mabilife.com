"use client";

import Image from "next/image";
import { YouTubeChannel } from "@/actions/youtube";
import styles from "./YouTuberSection.module.css";

type Props = {
  channels: YouTubeChannel[] | null;
};

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
    case 0: return styles.rank1;
    case 1: return styles.rank2;
    case 2: return styles.rank3;
    default: return styles.rankDefault;
  }
};

export default function YouTuberSection({ channels }: Props) {
  if (!channels || channels.length === 0) {
    return null;
  }

  return (
    <section className={styles.section}>
      {/* Section Header */}
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>인기 크리에이터</h2>
        <a
          href="https://www.youtube.com/results?search_query=%EB%A7%88%EB%B9%84%EB%85%B8%EA%B8%B0+%EB%AA%A8%EB%B0%94%EC%9D%BC"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.moreLink}
        >
          더보기
          <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px' }}></i>
        </a>
      </div>

      {/* Channel Cards Grid */}
      <div className={styles.grid}>
        {channels.slice(0, 4).map((channel, index) => (
          <a
            key={channel.id}
            href={channel.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            {/* Rank Badge */}
            <div className={`${styles.rankBadge} ${getRankClass(index)}`}>
              {index + 1}
            </div>

            {/* Channel Info */}
            <div className={styles.channelInfo}>
              {/* Thumbnail */}
              <div className={styles.thumbnail}>
                <Image
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  width={72}
                  height={72}
                />
              </div>

              {/* Name */}
              <h3 className={styles.channelName}>{channel.title}</h3>

              {/* Stats */}
              <div className={styles.stats}>
                <span className={styles.subscribers}>
                  구독자 {formatSubscribers(channel.subscriberCount)}
                </span>
                <span className={styles.videoCount}>
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
