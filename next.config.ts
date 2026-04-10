import type { NextConfig } from "next";

const rankingCrawlerTraceIncludes = [
  "./node_modules/@sparticuz/chromium/bin/**/*",
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "dszw1qtcnsa5e.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "d2gg9iclns4v4e.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "http",
        hostname: "k.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
      },
    ],
  },
  // Vercel's traced function bundle can omit the Chromium brotli assets unless
  // they are explicitly included for the ranking crawl route.
  outputFileTracingIncludes: {
    "/api/cron/crawl-ranking": rankingCrawlerTraceIncludes,
  },
};

export default nextConfig;
