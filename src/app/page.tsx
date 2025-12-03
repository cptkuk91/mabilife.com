import HomeClient from "./HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Mabi Life - 마비노기 모바일 공략 커뮤니티",
  },
  description: "마비노기 모바일의 모든 공략과 정보를 한곳에서 확인하세요.",
};

export default function Home() {
  return <HomeClient />;
}
