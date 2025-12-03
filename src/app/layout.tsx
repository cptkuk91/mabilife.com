import type { Metadata } from "next";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import Footer from "@/components/Footer";

const SITE_URL = "https://www.mabilife.com";
const SITE_NAME = "Mabi Life";
const SITE_DESCRIPTION = "마비노기 모바일 공략, 팁, 커뮤니티. 에린의 모든 모험가들과 함께 정보를 공유하세요.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - 마비노기 모바일 공략 커뮤니티`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "마비노기 모바일",
    "마비노기",
    "마비모바일",
    "공략",
    "가이드",
    "팁",
    "커뮤니티",
    "게임",
    "MMORPG",
    "넥슨",
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
    title: `${SITE_NAME} - 마비노기 모바일 공략 커뮤니티`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - 마비노기 모바일 공략 커뮤니티`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - 마비노기 모바일 공략 커뮤니티`,
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
    canonical: SITE_URL,
  },
  verification: {
    // google: "구글 서치 콘솔 인증 코드",
    // naver: "네이버 서치어드바이저 인증 코드",
  },
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
      <body>
        <AuthProvider>
          <GoogleAnalytics />
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
