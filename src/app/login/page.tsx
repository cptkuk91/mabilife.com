import LoginClient from "./LoginClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: "로그인 - Mabi Life",
  description: "Mabi Life에 로그인하고 더 많은 기능을 이용해보세요.",
  alternates: {
    canonical: `${SITE_URL}/login`,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
