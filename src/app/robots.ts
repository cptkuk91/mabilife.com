import { MetadataRoute } from "next";

const SITE_URL = "https://www.mabilife.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/profile",
          "/guide/write",
          "/_next/",
          "/private/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/profile", "/guide/write"],
      },
      {
        userAgent: "Yeti", // Naver
        allow: "/",
        disallow: ["/api/", "/profile", "/guide/write"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
