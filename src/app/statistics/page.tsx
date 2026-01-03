import { Metadata } from 'next';
import StatisticsClient from './StatisticsClient';
import { getRankingStatistics } from '@/actions/ranking';

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '통계 | Mabi Life',
  description: '마비노기 모바일 서버별, 직업별 랭킹 통계를 확인하세요.',
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
