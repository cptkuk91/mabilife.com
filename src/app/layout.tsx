import type { Metadata } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";
import { Noto_Sans_KR, Song_Myung } from "next/font/google";

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto',
});

const songMyung = Song_Myung({
  weight: '400',
  display: 'swap',
  variable: '--font-song',
});

const SITE_URL = "https://www.mabilife.com";
const SITE_NAME = "Mabi Life";
const SITE_TITLE = "마비노기 모바일 공략 커뮤니티";
const SITE_DESCRIPTION = "마비노기 모바일 공략, 랭킹, 통계, 룬 추천, 숙제 트래커까지. 마비노기 모바일의 모든 정보를 한곳에서 확인하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_TITLE} - ${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "마비노기 모바일",
    "마비노기 모바일 공략",
    "마비노기 모바일 공략 사이트",
    "마비노기",
    "마비모바일",
    "마비노기모바일",
    "공략",
    "가이드",
    "랭킹",
    "룬 추천",
    "숙제 트래커",
    "커뮤니티",
    "넥슨",
    "MMORPG",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_TITLE} - ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_TITLE} - ${SITE_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_TITLE} - ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: ["/assets/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/assets/logo/kakao-logo.webp",
    shortcut: "/assets/logo/kakao-logo.webp",
    apple: "/assets/logo/kakao-logo.webp",
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "./",
  },
  verification: {},
};

// JSON-LD 구조화 데이터
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/assets/logo/kakao-logo.webp`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${notoSansKr.variable} ${songMyung.variable} min-h-screen overflow-x-hidden bg-white pb-20 font-app text-app-title antialiased md:pb-0`}>
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        ) : null}
        <AuthProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
