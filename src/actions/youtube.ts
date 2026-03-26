"use server";

import { logger } from "@/lib/logger";

export type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
  videoCount: string;
  channelUrl: string;
};

type YouTubeApiChannelItem = {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
  statistics: {
    subscriberCount?: string;
    videoCount?: string;
  };
};

type YouTubeChannelsResponse = {
  items?: YouTubeApiChannelItem[];
};

// Curated list of popular Mabinogi Mobile YouTubers (Channel IDs)
const MABINOGI_MOBILE_CHANNEL_IDS = [
  "UCf7Ss7nWdiCT4v-jD71dPzg", // 마비노기 모바일 공식
  "UCVmFthSi0wHDMQ9DUld6k_Q", // 센터로드
  "UCt_Uacs4q6jMI0sosgTZDNg", // 모닝이
  "UCVRFMSz2EKb_eghbeaEe4Ug", // 빙식이
];

/**
 * Fetch Mabinogi Mobile YouTuber channel information
 * Returns curated list of popular Mabinogi Mobile content creators
 */
export const fetchMabinogiMobileYouTubers = async (): Promise<YouTubeChannel[] | null> => {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      logger.warn("YouTube API key not configured");
      return null;
    }

    // Fetch all channels in a single API call using comma-separated IDs
    const params = new URLSearchParams({
      key: apiKey,
      id: MABINOGI_MOBILE_CHANNEL_IDS.join(","),
      part: "snippet,statistics",
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      logger.warn(`YouTube API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as YouTubeChannelsResponse;
    if (!data.items || data.items.length === 0) {
      logger.warn("No channels found");
      return null;
    }

    const channels: YouTubeChannel[] = data.items.map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description.slice(0, 100),
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      subscriberCount: item.statistics.subscriberCount || "0",
      videoCount: item.statistics.videoCount || "0",
      channelUrl: `https://www.youtube.com/channel/${item.id}`,
    }));

    channels.sort((a, b) =>
      parseInt(b.subscriberCount) - parseInt(a.subscriberCount)
    );

    return channels;
  } catch (error) {
    logger.error("Fetching YouTubers failed", error);
    return null;
  }
};
