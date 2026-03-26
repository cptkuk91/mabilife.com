import { Metadata } from 'next';
import RankingClient from './RankingClient';

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '마비노기 모바일 랭킹',
  description: '마비노기 모바일 서버별 전투력 랭킹을 확인하세요. 실시간 순위와 직업별 분포를 한눈에 볼 수 있습니다.',
  keywords: ['마비노기 모바일 랭킹', '마비노기 모바일 전투력', '전투력 순위', '서버 랭킹', '직업별 랭킹'],
  openGraph: {
    title: '마비노기 모바일 랭킹 | Mabi Life',
    description: '마비노기 모바일 서버별 전투력 랭킹을 확인하세요. 실시간 순위와 직업별 분포를 한눈에 볼 수 있습니다.',
    url: `${SITE_URL}/ranking`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '마비노기 모바일 랭킹 | Mabi Life',
    description: '마비노기 모바일 서버별 전투력 랭킹을 확인하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/ranking`,
  },
};

export default function RankingPage() {
  return <RankingClient />;
}
