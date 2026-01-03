import SearchClient from "./SearchClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "검색",
  description: "마비노기 모바일 공략, 팁, 커뮤니티 게시글을 검색하세요.",
  openGraph: {
    title: "검색 | Mabi Life",
    description: "마비노기 모바일 공략, 팁, 커뮤니티 게시글을 검색하세요.",
  },
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
