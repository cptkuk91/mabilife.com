import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const HomeworkClient = dynamic(() => import('./HomeworkClient'), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '숙제 트래커 | Mabi Life',
  description: '마비노기 모바일 일일 숙제와 주간 숙제를 체크리스트로 관리하세요. 놓치는 보상 없이 효율적으로 플레이할 수 있습니다.',
  keywords: ['마비노기 모바일 숙제', '일일 퀘스트', '주간 퀘스트', '체크리스트'],
  openGraph: {
    title: '숙제 트래커 | Mabi Life',
    description: '마비노기 모바일 일일 숙제와 주간 숙제를 체크리스트로 관리하세요.',
    url: `${SITE_URL}/homework`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '숙제 트래커 | Mabi Life',
    description: '마비노기 모바일 일일/주간 숙제를 관리하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/homework`,
  },
};

export default function HomeworkPage() {
  return <HomeworkClient />;
}
