import GuideClient from "./GuideClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "공략 - Mabi Life",
  description: "마비노기 모바일 초보 가이드, 전투/던전, 메인스트림, 생활 컨텐츠 공략을 확인하세요.",
  keywords: ["마비노기 모바일 공략", "마비노기 가이드", "던전 공략", "초보 가이드"],
  openGraph: {
    title: "공략 | Mabi Life",
    description: "마비노기 모바일 초보 가이드, 전투/던전, 메인스트림, 생활 컨텐츠 공략을 확인하세요.",
  },
  alternates: {
    canonical: `${SITE_URL}/guide`,
  },
};

export default function GuidePage() {
  return <GuideClient />;
}
