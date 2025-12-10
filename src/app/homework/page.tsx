import { Metadata } from 'next';
import HomeworkClient from './HomeworkClient';

export const metadata: Metadata = {
  title: '숙제 | Mabi Life',
  description: '마비노기 모바일 일일/주간 숙제를 관리하세요.',
};

export default function HomeworkPage() {
  return <HomeworkClient />;
}
