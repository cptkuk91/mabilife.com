import { Metadata } from 'next';
import HomeworkClient from './HomeworkClient';

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '숙제 트래커 | Mabi Life',
  description: '마비노기 모바일 일일/주간 숙제를 관리하세요.',
  alternates: {
    canonical: `${SITE_URL}/homework`,
  },
};

export default function HomeworkPage() {
  return <HomeworkClient />;
}
