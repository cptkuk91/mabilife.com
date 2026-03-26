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

    // Find the latest batch date to filter by
    // We assume the latest batch contains data for ALL types since our crawler runs them sequentially.
    // Ideally, find latest date for the SPECIFIC type effectively.
    
    // Construct type query to handle legacy data
    const typeQuery = type === 'total' 
        ? { $or: [{ rankingType: 'total' }, { rankingType: { $exists: false } }] }
        : { rankingType: type };

    // Find the latest batch date to filter by
    const latestEntry = await Ranking.findOne(typeQuery)
        .sort({ crawledAt: -1 })
        .select('crawledAt');
        
    if (!latestEntry) return { data: [], total: 0, lastUpdated: null };

    const latestDate = latestEntry.crawledAt;

    // Build Query
    const query: Record<string, unknown> = { 
        crawledAt: latestDate,
        ...typeQuery 
    };

    if (server && server !== 'All') {
        query.server = server;
    }

    if (job && job !== 'All') {
        query.job = job;
    }

    const total = await Ranking.countDocuments(query);

    const rankings = await Ranking.find(query)
        .sort({ score: -1 }) // Sort by score descending (or rank ascending if rank is reliable globally)
        // Note: 'rank' field from crawled data is per-server rank usually. 
        // If viewing 'All' servers, sorting by score is the correct way to merge them.
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // If 'All' servers are selected, the 'rank' field from specific server might be confusing (e.g. multiple Rank 1s).
    // So if server is 'All', we might need to recalculate rank dynamically or just show explicit "Server Rank".
    // For now, let's return data as is, client can handle display index as dynamic rank if sorted by score.

    return {
        data: JSON.parse(JSON.stringify(rankings)), // Serialize
        total,
        lastUpdated: latestDate
    };
}
