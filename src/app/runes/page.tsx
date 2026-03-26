import { Metadata } from 'next';
import RunesClient from './RunesClient';
import getRuneModel, { IRune } from '@/models/Rune';
import { connectToDatabase } from '@/lib/mongodb';

type SerializedRune = Pick<
  IRune,
  'id' | 'name' | 'slot' | 'grade' | 'effect' | 'description' | 'imageUrl' | 'tags' | 'isSaleable' | 'createdAt' | 'updatedAt'
> & {
  _id: { toString: () => string };
};

const SITE_URL = "https://www.mabilife.com";

export const metadata: Metadata = {
  title: '직업별 추천 룬 | Mabi Life',
  description: '마비노기 모바일 직업별 최적의 룬 조합을 확인하세요. 전사, 궁수, 마법사 등 모든 직업의 추천 룬 세팅을 제공합니다.',
  keywords: ['마비노기 모바일 룬', '직업별 룬 추천', '룬 세팅', '전투력 올리기'],
  openGraph: {
    title: '직업별 추천 룬 | Mabi Life',
    description: '마비노기 모바일 직업별 최적의 룬 조합을 확인하세요.',
    url: `${SITE_URL}/runes`,
    type: 'website',
    images: [{ url: '/assets/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '직업별 추천 룬 | Mabi Life',
    description: '마비노기 모바일 직업별 최적의 룬 조합을 확인하세요.',
    images: ['/assets/og-image.png'],
  },
  alternates: {
    canonical: `${SITE_URL}/runes`,
  },
};

async function getRunes() {
  await connectToDatabase();
  const Rune = await getRuneModel();
  const runes = await Rune.find({}).lean<SerializedRune[]>();
  
  // Serialize ObjectId and Date to be passed to client component
  return runes.map((rune) => ({
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
