import { Metadata } from 'next';
import RunesClient from './RunesClient';
import getRuneModel from '@/models/Rune';
import { connectToDatabase } from '@/lib/mongodb';

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '직업별 추천 룬 | Mabi Life',
  description: '마비노기 모바일 직업별 추천 룬 정보를 확인하세요.',
  alternates: {
    canonical: `${SITE_URL}/runes`,
  },
};

async function getRunes() {
  await connectToDatabase();
  const Rune = await getRuneModel();
  const runes = await Rune.find({}).lean();
  
  // Serialize ObjectId and Date to be passed to client component
  return runes.map((rune: any) => ({
    ...rune,
    _id: rune._id.toString(),
    createdAt: rune.createdAt?.toISOString(),
    updatedAt: rune.updatedAt?.toISOString(),
  }));
}

export default async function RunesPage() {
  const runes = await getRunes();
  return <RunesClient initialRunes={runes} />;
}
