import HomeClient from "./HomeClient";
import type { Metadata } from "next";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import { getRankingStatistics } from "@/actions/ranking";
import { fetchMabinogiMobileYouTubers } from "@/actions/youtube";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: {
    absolute: "Mabi Life - 마비노기 모바일 공략 커뮤니티",
  },
  description: "마비노기 모바일의 모든 공략과 정보를 한곳에서 확인하세요. 랭킹, 통계, 룬 추천, 숙제 트래커까지 한번에!",
  keywords: ['마비노기 모바일', '마비노기 공략', '마비모바일', '게임 가이드', '커뮤니티'],
  openGraph: {
    title: 'Mabi Life - 마비노기 모바일 공략 커뮤니티',
    description: '마비노기 모바일의 모든 공략과 정보를 한곳에서 확인하세요.',
    url: SITE_URL,
    type: 'website',
    siteName: 'Mabi Life',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630, alt: 'Mabi Life' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mabi Life - 마비노기 모바일 공략 커뮤니티',
    description: '마비노기 모바일의 모든 공략과 정보를 한곳에서 확인하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default async function Home() {
  const [stats, guideResult, postResult, youtubers] = await Promise.all([
    getRankingStatistics("total"),
    getGuides({ limit: 6, sort: "latest" }),
    getPosts(1, 4),
    fetchMabinogiMobileYouTubers(),
  ]);

  const serializedStats = stats ? JSON.parse(JSON.stringify(stats)) : null;
  const initialHomeData = {
    guides: guideResult.success && guideResult.data ? JSON.parse(JSON.stringify(guideResult.data)) : [],
    posts: postResult.success ? JSON.parse(JSON.stringify(postResult.posts)) : [],
    youtubers: youtubers ? JSON.parse(JSON.stringify(youtubers)) : null,
  };

  return <HomeClient initialStats={serializedStats} initialHomeData={initialHomeData} />;
}
