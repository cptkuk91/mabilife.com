import HomeClient from "./HomeClient";
import type { Metadata } from "next";

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

import { getRankingStatistics } from "@/actions/ranking";

export default async function Home() {
  const stats = await getRankingStatistics('total');
  // stats might be null if no data, or contain jobStats etc.

  // We need to pass serializable data. getRankingStatistics returns plain object or mongoose doc?
  // It returns Mongoose Documents if we used .lean()? 
  // Wait, in previous steps I added .lean(), but Documents might have `_id` as ObjectId which is not serializable.
  // We should serialize it.
  
  const serializedStats = stats ? JSON.parse(JSON.stringify(stats)) : null;

  return <HomeClient initialStats={serializedStats} />;
}
