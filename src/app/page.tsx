import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import { getRankingStatistics } from "@/actions/ranking";
import { fetchMabinogiMobileYouTubers, type YouTubeChannel } from "@/actions/youtube";
import { logger } from "@/lib/logger";

const HomeClient = dynamic(() => import("./HomeClient"), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

type HomeRanker = {
  rank: number;
  characterName: string;
  job: string;
  server: string;
  score: number;
};

type HomeStats = {
  date?: string;
  totalAnalyzed?: number;
  jobStats?: Array<{ name: string; count: number }>;
  topRankers?: HomeRanker[];
};

type HomeAuthor = {
  name?: string | null;
  image?: string | null;
};

type HomeGuide = {
  _id?: string;
  title?: string;
  content?: string;
  category?: string;
  views?: number;
  likes?: number;
  author?: HomeAuthor;
  createdAt?: string;
  thumbnail?: string;
};

type HomePost = {
  _id?: string;
  content?: string;
  type?: string;
  viewCount?: number;
  likes?: number;
  commentCount?: number;
  author?: HomeAuthor;
  createdAt?: string;
};

type HomeInitialData = {
  guides?: HomeGuide[] | null;
  posts?: HomePost[] | null;
  youtubers?: YouTubeChannel[] | null;
};

function toPlainJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function logSettledError(section: string, result: PromiseSettledResult<unknown>) {
  if (result.status === "rejected") {
    logger.error(`Home ${section} load error:`, result.reason);
  }
}

const getCachedHomeStats = unstable_cache(
  async (): Promise<HomeStats | null> => {
    const stats = await getRankingStatistics("total");

    if (!stats) {
      return null;
    }

    return {
      date: stats.date instanceof Date ? stats.date.toISOString() : undefined,
      totalAnalyzed: stats.totalAnalyzed,
      jobStats: toPlainJson(stats.jobStats),
      topRankers: toPlainJson(stats.topRankers),
    };
  },
  ["home-ranking-stats"],
  { revalidate: 300 },
);

async function loadHomeInitialData(): Promise<HomeInitialData> {
  const [guideResult, postResult, youtuberResult] = await Promise.allSettled([
    getGuides({ limit: 6, sort: "latest" }),
    getPosts(1, 4),
    fetchMabinogiMobileYouTubers(),
  ]);

  logSettledError("guides", guideResult);
  logSettledError("posts", postResult);
  logSettledError("youtubers", youtuberResult);

  return {
    guides:
      guideResult.status === "fulfilled" && guideResult.value.success && Array.isArray(guideResult.value.data)
        ? guideResult.value.data.map((guide) => ({
            _id: guide._id,
            title: guide.title,
            content: guide.content,
            category: guide.category,
            views: guide.views,
            likes: guide.likes,
            author: guide.author,
            createdAt: guide.createdAt,
            thumbnail: guide.thumbnail ?? undefined,
          }))
        : [],
    posts:
      postResult.status === "fulfilled" && postResult.value.success
        ? postResult.value.posts.map((post) => ({
            _id: post._id,
            content: post.content,
            type: post.type,
            viewCount: post.viewCount,
            likes: post.likes,
            commentCount: post.commentCount,
            author: post.author,
            createdAt: post.createdAt,
          }))
        : [],
    youtubers:
      youtuberResult.status === "fulfilled" && youtuberResult.value
        ? toPlainJson(youtuberResult.value)
        : null,
  };
}

async function loadHomeStats() {
  try {
    return await getCachedHomeStats();
  } catch (error) {
    logger.error("Home stats load error:", error);
    return null;
  }
}

export const metadata: Metadata = {
  title: {
    absolute: "마비노기 모바일 공략 - Mabi Life | 랭킹·룬·숙제 트래커",
  },
  description: "마비노기 모바일 공략, 랭킹, 통계, 룬 추천, 숙제 트래커까지. 마비노기 모바일의 모든 정보를 한곳에서 확인하세요.",
  keywords: ['마비노기 모바일', '마비노기 모바일 공략', '마비노기 모바일 공략 사이트', '마비모바일', '마비노기모바일', '랭킹', '룬 추천', '숙제 트래커', '커뮤니티', '가이드'],
  openGraph: {
    title: '마비노기 모바일 공략 - Mabi Life | 랭킹·룬·숙제 트래커',
    description: '마비노기 모바일 공략, 랭킹, 통계, 룬 추천, 숙제 트래커까지. 모든 정보를 한곳에서 확인하세요.',
    url: SITE_URL,
    type: 'website',
    siteName: 'Mabi Life',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: '마비노기 모바일 공략 커뮤니티 - Mabi Life' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '마비노기 모바일 공략 - Mabi Life | 랭킹·룬·숙제 트래커',
    description: '마비노기 모바일 공략, 랭킹, 통계, 룬 추천, 숙제 트래커까지. 모든 정보를 한곳에서 확인하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function Home() {
  const statsPromise = loadHomeStats();
  const homeDataPromise = loadHomeInitialData();
  const [initialStats, initialHomeData] = await Promise.all([statsPromise, homeDataPromise]);

  return <HomeClient initialStats={initialStats} initialHomeData={initialHomeData} />;
}
