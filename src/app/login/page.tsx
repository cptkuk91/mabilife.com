import LoginClient from "./LoginClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "로그인",
  description: "마비노기 모바일 공략 사이트 Mabi Life에 로그인하고 더 많은 기능을 이용해보세요.",
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

interface LoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedCallbackUrl = Array.isArray(params?.callbackUrl) ? params.callbackUrl[0] : params?.callbackUrl;
  const callbackUrl =
    requestedCallbackUrl && requestedCallbackUrl.startsWith("/") && !requestedCallbackUrl.startsWith("//")
      ? requestedCallbackUrl
      : "/";

  return <LoginClient callbackUrl={callbackUrl} />;
}
