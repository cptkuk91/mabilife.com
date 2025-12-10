import { Metadata } from 'next';
import RankingClient from './RankingClient';

export const metadata: Metadata = {
  title: '랭킹 | Mabi Life',
  description: '마비노기 모바일 랭킹 정보를 확인하세요.',
};

export default function RankingPage() {
  return <RankingClient />;
}
