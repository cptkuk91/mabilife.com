import HomeClient from "./HomeClient";
import type { Metadata } from "next";

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: {
    absolute: "Mabi Life - 마비노기 모바일 공략 커뮤니티",
  },
  description: "마비노기 모바일의 모든 공략과 정보를 한곳에서 확인하세요.",
  alternates: {
    canonical: SITE_URL,
  },
};

import { getRankingStatistics } from "@/actions/ranking";

export default async function Home() {
  const stats = await getRankingStatistics('total');
  // stats might be null if no data, or contain jobStats etc.

  // We need to pass serializable data. getRankingStatistics returns plain object or mongoose doc?
  // It returns Mongoose Documents if we used .lean()? 
  // Wait, in previous steps I added .lean(), but Documents might have `_id` as ObjectId which is not serializable.
  // We should serialize it.
  
  const serializedStats = stats ? JSON.parse(JSON.stringify(stats)) : null;

  return <HomeClient initialStats={serializedStats} />;
}
