import { Metadata } from 'next';
import StatisticsClient from './StatisticsClient';
import { getRankingStatistics } from '@/actions/ranking';

export const metadata: Metadata = {
  title: '통계 | Mabi Life',
  description: '마비노기 모바일 서버별, 직업별 랭킹 통계를 확인하세요.',
};

export default async function StatisticsPage() {
  const initialData = await getRankingStatistics();
  return <StatisticsClient initialData={initialData} />;
}
