import dynamic from "next/dynamic";
import type { Metadata } from "next";

const CommunityClient = dynamic(() => import("./CommunityClient"), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "커뮤니티 - Mabi Life",
  description: "마비노기 모바일 유저들과 소통하세요. 질문, 정보 공유, 자유로운 이야기를 나눌 수 있습니다.",
  keywords: ["마비노기 모바일 커뮤니티", "마비노기 질문", "마비노기 정보"],
  openGraph: {
    title: "커뮤니티 | Mabi Life",
    description: "마비노기 모바일 유저들과 소통하세요. 질문, 정보 공유, 자유로운 이야기를 나눌 수 있습니다.",
    url: `${SITE_URL}/community`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '커뮤니티 | Mabi Life',
    description: '마비노기 모바일 유저들과 소통하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
};

export default function CommunityPage() {
  return <CommunityClient />;
}
