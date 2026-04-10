import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { cache } from "react";
import type { SerializedGuide } from "@/actions/guide";
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

const getCachedGuideDetail = cache(async (idOrSlug: string): Promise<SerializedGuide | null> => {
  const result = await getGuideById(idOrSlug);

  if (!result.success || !result.data || Array.isArray(result.data)) {
    return null;
  }

  return result.data as SerializedGuide;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const guide = await getCachedGuideDetail(id);

  if (!guide) {
    return {
      title: "공략을 찾을 수 없습니다",
    };
  }

  const metadataGuide = guide as unknown as GuideMetadataSource;
  const title = decodeHtmlEntities(metadataGuide.title);
  const description = htmlToPlainText(metadataGuide.content).slice(0, 160);
  const thumbnail = metadataGuide.thumbnail;
  const category = metadataGuide.category;

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
      publishedTime: new Date(metadataGuide.createdAt).toISOString(),
      modifiedTime: new Date(metadataGuide.updatedAt).toISOString(),
      authors: [metadataGuide.author?.name || "익명"],
      section: category,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mabi Life`,
      description,
      images: thumbnail ? [thumbnail] : ["/assets/og-image.png"],
    },
    alternates: {
      canonical: `${SITE_URL}/guide/${encodeURIComponent(metadataGuide.slug || id)}`,
    },
  };
}

export default async function TipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guide = await getCachedGuideDetail(id);

  return <TipDetailClient key={id} id={id} initialGuide={guide} />;
}
