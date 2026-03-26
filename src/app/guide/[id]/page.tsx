import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { getGuideById } from "@/actions/guide";
import { decodeHtmlEntities, htmlToPlainText } from "@/lib/text";

const TipDetailClient = dynamic(() => import("./TipDetailClient"), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

type GuideMetadataSource = {
  title: string;
  content: string;
  thumbnail?: string | null;
  category: string;
  slug?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    name?: string | null;
  };
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getGuideById(id);

  if (!result.success || !result.data || Array.isArray(result.data)) {
    return {
      title: "공략을 찾을 수 없습니다 - Mabi Life",
    };
  }

  const guide = result.data as unknown as GuideMetadataSource;
  const title = decodeHtmlEntities(guide.title);
  const description = htmlToPlainText(guide.content).slice(0, 160);
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
      canonical: `${SITE_URL}/guide/${encodeURIComponent(guide.slug || id)}`,
    },
  };
}

export default async function TipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TipDetailClient id={id} />;
}
