import SearchClient from "./SearchClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "마비노기 모바일 검색",
  description: "마비노기 모바일 공략, 팁, 커뮤니티 게시글을 검색하세요.",
  keywords: ['마비노기 모바일 검색', '공략 검색', '게시글 찾기'],
  openGraph: {
    title: "마비노기 모바일 검색 | Mabi Life",
    description: "마비노기 모바일 공략, 팁, 커뮤니티 게시글을 검색하세요.",
    url: `${SITE_URL}/search`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '마비노기 모바일 검색 | Mabi Life',
    description: '마비노기 모바일 공략, 팁, 커뮤니티 게시글을 검색하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
