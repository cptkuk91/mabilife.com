import dynamic from "next/dynamic";
import type { Metadata } from "next";

const GuideWriteClient = dynamic(() => import("./GuideWriteClient"), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "마비노기 모바일 공략 작성",
  description: "나만의 마비노기 모바일 공략을 작성하고 공유해보세요.",
  alternates: {
    canonical: `${SITE_URL}/guide/write`,
  },
};

export default function GuideWritePage() {
  return <GuideWriteClient />;
}
