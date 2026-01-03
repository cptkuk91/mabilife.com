import { Metadata } from 'next';
import StatisticsClient from './StatisticsClient';
import { getRankingStatistics } from '@/actions/ranking';

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '통계 | Mabi Life',
  description: '마비노기 모바일 서버별, 직업별 랭킹 통계를 확인하세요. 차트와 그래프로 한눈에 파악할 수 있습니다.',
  keywords: ['마비노기 모바일 통계', '직업 분포', '서버 통계', '전투력 분석'],
  openGraph: {
    title: '통계 | Mabi Life',
    description: '마비노기 모바일 서버별, 직업별 랭킹 통계를 확인하세요.',
    url: `${SITE_URL}/statistics`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '통계 | Mabi Life',
    description: '마비노기 모바일 서버별, 직업별 랭킹 통계를 확인하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/statistics`,
  },
};

export default async function StatisticsPage() {
  const rawData = await getRankingStatistics('total');
  // Serialize Date objects to strings to match Client Component props
  const initialData = rawData ? JSON.parse(JSON.stringify(rawData)) : null;
  
  return <StatisticsClient initialData={initialData} />;
}
