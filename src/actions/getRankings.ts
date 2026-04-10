"use server";

import { connectToDatabase } from '@/lib/mongodb';
import Ranking from '@/models/Ranking';

interface GetRankingsParams {
    page?: number;
    limit?: number;
    type?: string;   // 'total', 'combat', 'charm', 'life'
    server?: string; // 'All' or specific server
    job?: string;    // 'All' or specific job
}

export async function getRankings({
    page = 1,
    limit = 20,
    type = 'total',
    server = 'All',
    job = 'All'
}: GetRankingsParams) {
    await connectToDatabase();

    // Each server is crawled independently (one per hour), so we must take the latest
    // crawledAt for every (server, type) combination rather than a single global batch.
    const typeQuery = type === 'total'
        ? { $or: [{ rankingType: 'total' }, { rankingType: { $exists: false } }] }
        : { rankingType: type };

    const latestPerServer: Array<{ _id: string; latestDate: Date }> = await Ranking.aggregate([
        { $match: typeQuery },
        { $sort: { crawledAt: -1 } },
        { $group: { _id: '$server', latestDate: { $first: '$crawledAt' } } },
    ]);

    if (latestPerServer.length === 0) {
        return { data: [], total: 0, lastUpdated: null };
    }

    const serverBatchClauses = latestPerServer
        .filter((entry) => server === 'All' || entry._id === server)
        .map((entry) => ({ server: entry._id, crawledAt: entry.latestDate }));

    if (serverBatchClauses.length === 0) {
        return { data: [], total: 0, lastUpdated: null };
    }

    const query: Record<string, unknown> = {
        $and: [typeQuery, { $or: serverBatchClauses }],
    };

    if (job && job !== 'All') {
        (query.$and as Record<string, unknown>[]).push({ job });
    }

    const total = await Ranking.countDocuments(query);

    const rankings = await Ranking.find(query)
        .sort({ score: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Most recent crawl timestamp across the servers currently in view.
    const lastUpdated = serverBatchClauses.reduce<Date | null>((latest, clause) => {
        const date = clause.crawledAt;
        return !latest || date > latest ? date : latest;
    }, null);

    return {
        data: JSON.parse(JSON.stringify(rankings)),
        total,
        lastUpdated
    };
}
