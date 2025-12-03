import TipDetailClient from "./TipDetailClient";
import type { Metadata } from "next";
import { getGuideById } from "@/actions/guide";

const SITE_URL = "https://mabilife.com";

// HTML 태그 제거 함수
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getGuideById(id);

  if (!result.success || !result.data) {
    return {
      title: "공략을 찾을 수 없습니다 - Mabi Life",
    };
  }

  const guide = result.data as any;
  const title = guide.title;
  const description = stripHtml(guide.content).slice(0, 160);
  const thumbnail = guide.thumbnail;
  const category = guide.category;

  return {
    title,
    description,
    keywords: [category, "마비노기 모바일", "공략", "가이드"],
    openGraph: {
      title: `${title} | Mabi Life`,
      description,
      url: `${SITE_URL}/guide/${id}`,
      type: "article",
      images: thumbnail
        ? [{ url: thumbnail, width: 1200, height: 630, alt: title }]
        : [{ url: "/assets/og-image.png", width: 1200, height: 630 }],
      publishedTime: new Date(guide.createdAt).toISOString(),
      modifiedTime: new Date(guide.updatedAt).toISOString(),
      authors: [guide.author?.name || "익명"],
      section: category,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mabi Life`,
      description,
      images: thumbnail ? [thumbnail] : ["/assets/og-image.png"],
    },
    alternates: {
      canonical: `${SITE_URL}/guide/${id}`,
    },
  };
}

export default async function TipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TipDetailClient id={id} />;
}
