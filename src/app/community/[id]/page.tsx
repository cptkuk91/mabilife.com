import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { getPost } from "@/actions/post";
import { htmlToPlainText } from "@/lib/text";

const PostDetailClient = dynamic(() => import("./PostDetailClient"), {
  loading: () => <div className="min-h-screen bg-white" />,
});

const SITE_URL = "https://www.mabilife.com";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const result = await getPost(id);

  if (!result.success || !result.post) {
    return {
      title: "게시글을 찾을 수 없습니다",
    };
  }

  const post = result.post;
  const content = htmlToPlainText(post.content);
  const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
  const description = content.slice(0, 160);
  const postType = post.type;

  return {
    title: `${title} - ${postType}`,
    description,
    openGraph: {
      title: `${title} | Mabi Life`,
      description,
      url: `${SITE_URL}/community/${id}`,
      type: "article",
      images: post.images && post.images.length > 0 ? [post.images[0]] : ["/assets/og-image.png"],
      publishedTime: new Date(post.createdAt).toISOString(),
      modifiedTime: new Date(post.updatedAt).toISOString(),
      authors: [post.author?.name || "익명"],
      section: postType,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Mabi Life`,
      description,
      images: post.images && post.images.length > 0 ? [post.images[0]] : ["/assets/og-image.png"],
    },
    alternates: {
      canonical: `${SITE_URL}/community/${id}`,
    },
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostDetailClient id={id} />;
}
