"use client";

import { useState, useEffect } from 'react';
import styles from './statistics.module.css';
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

export default function StatisticsClient({ initialData }: { initialData: StatisticsData | null }) {
  const [data, setData] = useState<StatisticsData | null>(initialData);
  const [loading, setLoading] = useState(false);

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
                    setData(res.data as any); 
                }
            } catch(e) {
                console.error(e);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            상위권 유저는 어떤 직업을 많이 선택할까?
            <span className={styles.subtitle}>
               (전체 서버 전투력 상위 {data?.totalAnalyzed || 200}명 기준)
            </span>
          </h1>
          {data && (
            <p className={styles.lastUpdated}>
                마지막 업데이트: {formatDate(data.date)}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
            <p>데이터를 분석 중입니다...</p>
        </div>
      ) : !data ? (
        <div className={styles.emptyState}>
            <i className="fa-solid fa-chart-simple"></i>
            <p>수집된 랭킹 데이터가 없습니다.<br/>매일 00:00시에 갱신됩니다.</p>
        </div>
      ) : (
        <div className={styles.dashboard}>
            {/* Job Stats - Full Width */}
            <div className={styles.card}>
            <h2 className={styles.cardTitle}>
                <i className="fa-solid fa-users-gear"></i> 직업별 분포
            </h2>
            <div className={styles.statsList}>
                {data.jobStats.map((stat, idx) => {
                    const total = data.totalAnalyzed || data.jobStats.reduce((acc, curr) => acc + curr.count, 0);
                    const percent = total > 0 ? ((stat.count / total) * 100).toFixed(1) : '0';
                    
                    return (
                        <div key={idx} className={styles.statItem}>
                            <div className={styles.statName}>
                                <span className={styles.rankIndex}>{idx + 1}</span>
                                {stat.name}
                            </div>
                            <div className={styles.statValue}>
                                <span className={styles.statCount}>{stat.count}명</span>
                                <span className={styles.statPercent}>{percent}%</span>
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
