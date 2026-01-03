import CommunityClient from "./CommunityClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "커뮤니티 - Mabi Life",
  description: "마비노기 모바일 유저들과 소통하세요. 질문, 정보 공유, 자유로운 이야기를 나눌 수 있습니다.",
  keywords: ["마비노기 모바일 커뮤니티", "마비노기 질문", "마비노기 정보"],
  openGraph: {
    title: "커뮤니티 | Mabi Life",
    description: "마비노기 모바일 유저들과 소통하세요. 질문, 정보 공유, 자유로운 이야기를 나눌 수 있습니다.",
  },
  alternates: {
    canonical: `${SITE_URL}/community`,
  },
};

export default function CommunityPage() {
  return <CommunityClient />;
}
