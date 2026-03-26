"use server";

import { getRankingStatistics } from '@/actions/ranking';
import { logger } from '@/lib/logger';

export async function fetchStatisticsAction(type: string) {
    try {
        const data = await getRankingStatistics(type);
        return { success: true, data };
    } catch (error: unknown) {
        logger.error('Fetch Stats Error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
