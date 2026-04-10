import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import Ranking from '@/models/Ranking';
import { SERVERS } from '@/lib/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for crawling

async function pickStalestServer(): Promise<(typeof SERVERS)[number]> {
  const latestPerServer: Array<{ _id: string; latestCrawledAt: Date }> = await Ranking.aggregate([
    { $group: { _id: '$server', latestCrawledAt: { $max: '$crawledAt' } } },
  ]);

  const lastUpdateByName = new Map(latestPerServer.map((r) => [r._id, r.latestCrawledAt]));

  // Servers that have never been crawled come first (Date(0)), otherwise pick the oldest crawledAt.
  return SERVERS.reduce((stalest, candidate) => {
    const candidateDate = lastUpdateByName.get(candidate.name) ?? new Date(0);
    const stalestDate = lastUpdateByName.get(stalest.name) ?? new Date(0);
    return candidateDate < stalestDate ? candidate : stalest;
  });
}

export async function GET() {
  try {
    await connectToDatabase();
    const { crawlRankingData } = await import('@/lib/crawler');

    const targetServer = await pickStalestServer();
    logger.debug(`Starting ranking crawl for server: ${targetServer.name} (id: ${targetServer.id})`);

    const data = await crawlRankingData(targetServer.id);
    logger.debug(`Crawled ${data.length} entries for ${targetServer.name}.`);

    if (data.length === 0) {
        return NextResponse.json({ message: 'No data crawled. Check selectors or cloudflare protection.', success: false }, { status: 500 });
    }

    const batchDate = new Date();
    const rankingDocs = data.map(item => ({
        ...item,
        crawledAt: batchDate
    }));

    await Ranking.insertMany(rankingDocs);
    logger.debug('Data saved to DB successfully.');

    revalidatePath('/');
    revalidatePath('/ranking');
    revalidatePath('/statistics');

    return NextResponse.json({
        message: 'Ranking data crawled and saved successfully',
        server: targetServer.name,
        count: data.length,
        date: batchDate
    });

  } catch (error: unknown) {
    logger.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
