"use client";

import { useState, useEffect } from 'react';
import { fetchStatisticsAction } from '@/actions/fetchStatistics';

interface StatItem {
  name: string;
  count: number;
}

interface RankItem {
  rank: number;
  server: string;
  characterName: string;
  job: string;
  score: number;
}

interface StatisticsData {
  date: string;
  serverStats: StatItem[];
  jobStats: StatItem[];
  topRankers: RankItem[];
  totalAnalyzed?: number;
}

interface StatisticsPayload extends Omit<StatisticsData, "date"> {
  date: Date | string;
}

export default function StatisticsClient({ initialData }: { initialData: StatisticsData | null }) {
  const [data, setData] = useState<StatisticsData | null>(initialData);
  const [loading, setLoading] = useState(false);

  const normalizeStatisticsData = (payload: StatisticsPayload): StatisticsData => ({
    ...payload,
    date: payload.date instanceof Date ? payload.date.toISOString() : payload.date,
  });

  // Fetch data on mount if needed, or if we want to ensure latest.
  // Since we only have one type strictly now, initialData is usually enough.
  // But let's keep the re-fetch logic just in case initialData is empty or stale?
  // Actually, if initialData is provided by server, rely on it.
  // If null, try to fetch client side once.
  
  useEffect(() => {
    if (!initialData) {
        const loadStats = async () => {
            setLoading(true);
            try {
                const res = await fetchStatisticsAction('total');
                if (res.success && res.data) {
                    setData(normalizeStatisticsData(res.data as StatisticsPayload));
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }
  }, [initialData]);

  // Simple date formatter for consistency
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const pageShellClass = "mx-auto min-h-screen max-w-[980px] px-4 pb-10 pt-20 md:px-5";
  const cardClass = "rounded-[28px] bg-white p-6 shadow-elev-card";

  return (
    <div className={pageShellClass}>
      <div className="mb-8 flex items-end justify-between gap-4 max-md:flex-col max-md:items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] text-app-title max-md:text-[22px] max-md:leading-[1.3]">
            상위권 유저는 어떤 직업을 많이 선택할까?
            <span className="ml-3 text-lg font-medium text-app-body max-md:mt-1 max-md:block max-md:ml-0 max-md:text-sm">
               (전체 서버 전투력 상위 {data?.totalAnalyzed || 200}명 기준)
            </span>
          </h1>
          {data && (
            <p className="text-sm text-app-body">
                마지막 업데이트: {formatDate(data.date)}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center px-6 py-24 text-center text-app-body">
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
            <p>데이터를 분석 중입니다...</p>
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center gap-5 px-6 py-24 text-center text-app-body">
            <i className="fa-solid fa-chart-simple text-5xl opacity-30"></i>
            <p>수집된 랭킹 데이터가 없습니다.<br/>매일 00:00시에 갱신됩니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-8">
            <div className={cardClass}>
            <h2 className="mb-5 flex items-center gap-2 text-[18px] font-bold text-app-title">
                <i className="fa-solid fa-users-gear text-app-accent"></i>
                <span>직업별 분포</span>
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {data.jobStats.map((stat, idx) => {
                    const total = data.totalAnalyzed || data.jobStats.reduce((acc, curr) => acc + curr.count, 0);
                    const percent = total > 0 ? ((stat.count / total) * 100).toFixed(1) : '0';
                    const cardTone =
                      idx === 0 ? "border-[#FFEBA6] bg-[linear-gradient(135deg,#FFF9E6_0%,#FFFDF5_100%)]" :
                      idx === 1 ? "border-[#E0E0E5] bg-[linear-gradient(135deg,#F5F5F7_0%,#FAFAFC_100%)]" :
                      idx === 2 ? "border-[#F5E0D0] bg-[linear-gradient(135deg,#FCF5F0_0%,#FFFAF5_100%)]" :
                      "border-transparent bg-app-bg hover:border-black/5 hover:bg-white";
                    const rankTone =
                      idx === 0 ? "bg-[#FFD700] text-white" :
                      idx === 1 ? "bg-[#C0C0C0] text-white" :
                      idx === 2 ? "bg-[#CD7F32] text-white" :
                      "bg-black/5 text-app-body";
                    
                    return (
                        <div
                          key={stat.name}
                          className={`flex items-center justify-between rounded-[16px] border px-5 py-4 text-[15px] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${cardTone}`}
                        >
                            <div className="flex items-center gap-2.5 text-base font-bold text-app-title">
                                <span className={`inline-flex size-6 items-center justify-center rounded-[6px] text-xs font-bold ${rankTone}`}>{idx + 1}</span>
                                {stat.name}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-base font-bold text-app-title">{stat.count}명</span>
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[13px] font-medium text-app-body">{percent}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
