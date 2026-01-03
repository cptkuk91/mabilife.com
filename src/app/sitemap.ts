import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongodb";
import getGuideModel from "@/models/Guide";
import getPostModel from "@/models/Post";

const SITE_URL = "https://www.mabilife.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/ranking`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/statistics`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/runes`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/homework`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // 동적 페이지 - 공략 (slug 기반 URL 사용)
  let guidePages: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
    const Guide = await getGuideModel();
    const guides = await Guide.find({})
      .select("_id slug updatedAt")
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();

    guidePages = guides.map((guide: any) => ({
      url: `${SITE_URL}/guide/${encodeURIComponent(guide.slug || guide._id.toString())}`,
      lastModified: new Date(guide.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error("Sitemap: Failed to fetch guides", error);
  }

  // 동적 페이지 - 커뮤니티 게시글
  let postPages: MetadataRoute.Sitemap = [];
  try {
    await connectToDatabase();
    const Post = await getPostModel();
    const posts = await Post.find({})
      .select("_id updatedAt")
      .sort({ updatedAt: -1 })
      .limit(1000)
      .lean();

    postPages = posts.map((post: any) => ({
      url: `${SITE_URL}/community/${post._id.toString()}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error("Sitemap: Failed to fetch posts", error);
  }

  return [...staticPages, ...guidePages, ...postPages];
}

