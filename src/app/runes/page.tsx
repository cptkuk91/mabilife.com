import { Metadata } from 'next';
import RunesClient from './RunesClient';

export const metadata: Metadata = {
  title: '직업별 추천 룬 | Mabi Life',
  description: '마비노기 모바일 직업별 추천 룬 정보를 확인하세요.',
};

export default function RunesPage() {
  return <RunesClient />;
}
