"use server";

import { getRankingStatistics } from '@/actions/ranking';

export async function fetchStatisticsAction(type: string) {
    try {
        const data = await getRankingStatistics(type);
        return { success: true, data };
    } catch (error: any) {
        console.error('Fetch Stats Error:', error);
        return { success: false, error: error.message };
    }
}
