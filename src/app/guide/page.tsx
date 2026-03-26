import dynamic from "next/dynamic";
import type { Metadata } from "next";

const GuideClient = dynamic(() => import("./GuideClient"), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "마비노기 모바일 공략",
  description: "마비노기 모바일 초보 가이드, 전투/던전, 메인스트림, 생활/알바, 돈벌기 공략을 확인하세요.",
  keywords: ["마비노기 모바일 공략", "마비노기 가이드", "던전 공략", "초보 가이드", "메인스트림 공략"],
  openGraph: {
    title: "마비노기 모바일 공략 | Mabi Life",
    description: "마비노기 모바일 초보 가이드, 전투/던전, 메인스트림, 생활/알바, 돈벌기 공략을 확인하세요.",
    url: `${SITE_URL}/guide`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '마비노기 모바일 공략 | Mabi Life',
    description: '마비노기 모바일 초보 가이드, 전투/던전, 메인스트림 공략을 확인하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/guide`,
  },
};

export default function GuidePage() {
  return <GuideClient />;
}
