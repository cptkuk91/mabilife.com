import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { connectToDatabase } from '@/lib/mongodb';
import Ranking from '@/models/Ranking';
import { crawlRankingData } from '@/lib/crawler';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for crawling

export async function GET() {
  try {
    await connectToDatabase();
    
    // 1. Crawl Data
    console.log('Starting ranking crawl...');
    const data = await crawlRankingData();
    console.log(`Crawled ${data.length} entries.`);

    if (data.length === 0) {
        return NextResponse.json({ message: 'No data crawled. Check selectors or cloudflare protection.', success: false }, { status: 500 });
    }

    // 2. Save to DB
    // Option A: Replace all data (if we only care about current ranking)
    // await Ranking.deleteMany({});
    
    // Option B: Append new batch (if we want history/statistics)
    // We will use Option B and maybe clean up old data later via another cron
    const batchDate = new Date();
    const rankingDocs = data.map(item => ({
        ...item,
        crawledAt: batchDate
    }));

    await Ranking.insertMany(rankingDocs);
    console.log('Data saved to DB successfully.');

    revalidatePath('/');
    revalidatePath('/ranking');
    revalidatePath('/statistics');

    return NextResponse.json({ 
        message: 'Ranking data crawled and saved successfully', 
        count: data.length, 
        date: batchDate 
    });

  } catch (error: unknown) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 });
  }
}
