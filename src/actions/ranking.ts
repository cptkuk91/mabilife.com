"use server";

import { connectToDatabase } from '@/lib/mongodb';
import Ranking from '@/models/Ranking';
import { crawlRankingData } from '@/lib/crawler';
import { revalidatePath } from 'next/cache';

export async function refreshRankingData() {
  try {
    await connectToDatabase();
    
    // Crawl Data
    const data = await crawlRankingData();
    
    if (data.length === 0) {
        return { success: false, message: '데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.' };
    }

    const batchDate = new Date();
    const rankingDocs = data.map(item => ({
        ...item,
        crawledAt: batchDate
    }));

    // Option: Clear old data or keep history? 
    // Let's keep recent ones. Maybe delete data older than 1 day to save space for now
    // await Ranking.deleteMany({}); 

    await Ranking.insertMany(rankingDocs);

    revalidatePath('/');
    revalidatePath('/ranking');
    revalidatePath('/statistics');
    return { success: true, count: data.length, message: `성공적으로 ${data.length}개의 데이터를 업데이트했습니다.` };

  } catch (error: unknown) {
    console.error('Action Error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getRankingStatistics(type: string = 'total') {
    await connectToDatabase();

    // Construct query to support legacy data (where rankingType might be missing) for 'total'
    const query: Record<string, unknown> = {};
    if (type === 'total') {
        query.$or = [{ rankingType: 'total' }, { rankingType: { $exists: false } }];
    } else {
        query.rankingType = type;
    }

    // Find the latest batch date for this specific type
    const latestEntry = await Ranking.findOne(query)
        .sort({ crawledAt: -1 })
        .select('crawledAt');
        
    if (!latestEntry) return null;

    const latestDate = latestEntry.crawledAt;
    
    // Add date to query
    const dataQuery = { ...query, crawledAt: latestDate };

    // Fetch ALL records for this batch and type
    const allRankings = await Ranking.find(dataQuery).lean();
    
    // 1. Sort by Score Descending
    allRankings.sort((a, b) => b.score - a.score);

    // 2. Take Global Top 200 (or all if less)
    const TOP_N = 200;
    const globalTop200 = allRankings.slice(0, TOP_N);

    // 3. Aggregate Stats from Global Top 200
    const serverCount: Record<string, number> = {};
    const jobCount: Record<string, number> = {};

    globalTop200.forEach((r) => {
        // Server Stats
        serverCount[r.server] = (serverCount[r.server] || 0) + 1;
        // Job Stats
        jobCount[r.job] = (jobCount[r.job] || 0) + 1;
    });

    // Convert to Array and Sort
    const serverStats = Object.entries(serverCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const jobStats = Object.entries(jobCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    // Top 10 for display
    const topRankers = globalTop200.slice(0, 10);

    return {
        date: latestDate,
        serverStats,
        jobStats,
        topRankers: JSON.parse(JSON.stringify(topRankers)),
        totalAnalyzed: globalTop200.length, // Let client know how many were analyzed
    };
}
