"use client";

import { useState, useEffect } from 'react';
import styles from './ranking.module.css';
import { getRankings } from '@/actions/getRankings';

const RANKING_TYPES = [
    { id: 'total', label: '종합 랭킹' },
    { id: 'combat', label: '전투력 랭킹' },
    { id: 'charm', label: '매력 랭킹' },
    { id: 'life', label: '생활력 랭킹' },
];

const SERVERS = ['All', '데이안', '아이라', '던컨', '알리사', '메이븐', '라사', '칼릭스'];
const JOBS = ['All', '전사', '궁수', '마법사', '힐러', '바드', '연금술사', '인형사', '슈터', '닌자', '체인', '격투가']; // Update with actual job list if different

interface RankingData {
    rank: number;
    server: string;
    characterName: string;
    job: string;
    score: number;
    rankingType: string;
}

export default function RankingClient() {
  const [activeType, setActiveType] = useState('total');
  const [selectedServer, setSelectedServer] = useState('All');
  const [selectedJob, setSelectedJob] = useState('All');
  
  const [data, setData] = useState<RankingData[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getRankings({
                page,
                limit: 20,
                type: activeType,
                server: selectedServer,
                job: selectedJob
            });
            
            setData(res.data);
            setTotal(res.total);
            setLastUpdated(res.lastUpdated ? new Date(res.lastUpdated).toISOString() : null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [activeType, selectedServer, selectedJob, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeType, selectedServer, selectedJob]);

  // Date Formatter
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>랭킹</h1>
        <p className={styles.lastUpdated}>
            마지막 업데이트: {formatDate(lastUpdated)}
        </p>
      </div>

      <div className={styles.filterContainer}>
        {/* Type Tabs */}
        <div className={styles.typeTabs}>
            {RANKING_TYPES.map(type => (
                <button 
                    key={type.id}
                    className={`${styles.tab} ${activeType === type.id ? styles.active : ''}`}
                    onClick={() => setActiveType(type.id)}
                >
                    {type.label}
                </button>
            ))}
        </div>

        {/* Dropdowns */}
        <div className={styles.filters}>
            <div className={styles.selectGroup}>
                <span className={styles.label}>서버</span>
                <select 
                    className={styles.select}
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                >
                    {SERVERS.map(s => <option key={s} value={s}>{s === 'All' ? '전체 서버' : s}</option>)}
                </select>
            </div>

            <div className={styles.selectGroup}>
                <span className={styles.label}>직업</span>
                <select 
                    className={styles.select}
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                >
                    {JOBS.map(j => <option key={j} value={j}>{j === 'All' ? '전체 직업' : j}</option>)}
                </select>
            </div>
            
            {(selectedServer !== 'All' || selectedJob !== 'All') && (
                <button 
                    className={styles.resetBtn} 
                    onClick={() => {
                        setSelectedServer('All');
                        setSelectedJob('All');
                    }}
                    title="필터 초기화"
                >
                    <i className="fa-solid fa-rotate-left"></i>
                    초기화
                </button>
            )}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        {loading ? (
            <div className={styles.loading}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
                <p>랭킹 정보를 불러오는 중입니다...</p>
            </div>
        ) : data.length > 0 ? (
            <>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: 80 }}>순위</th>
                            <th>캐릭터명</th>
                            <th>서버</th>
                            <th>직업</th>
                            <th>점수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => {
                            const rank = (page - 1) * 20 + idx + 1; // Dynamic numbering
                            return (
                                <tr key={idx}>
                                    <td>
                                        <span className={`${styles.rankBadge} ${rank <= 3 ? styles[`rank${rank}`] : ''}`}>
                                            {rank}
                                        </span>
                                    </td>
                                    <td className={styles.charName}>{item.characterName}</td>
                                    <td><span className={styles.serverTag}>{item.server}</span></td>
                                    <td><span className={styles.jobTag}>{item.job}</span></td>
                                    <td className={styles.score}>{item.score.toLocaleString()}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className={styles.pagination}>
                    <button 
                        className={styles.pageBtn} 
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span className={styles.pageInfo}>{page} / {totalPages || 1}</span>
                    <button 
                        className={styles.pageBtn} 
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </>
        ) : (
            <div className={styles.empty}>
                <i className="fa-solid fa-trophy"></i>
                <p>해당 조건의 랭킹 데이터가 없습니다.</p>
            </div>
        )}
      </div>
    </div>
  );
}
