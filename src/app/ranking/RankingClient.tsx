"use client";

import { useState, useEffect } from 'react';
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
  const pageShellClass = "mx-auto min-h-screen max-w-[980px] px-4 pb-10 pt-20 md:px-5";
  const cardClass = "rounded-[28px] bg-white p-5 shadow-elev-card md:p-6";

  return (
    <div className={pageShellClass}>
      <div className="mb-8">
        <h1 className="mb-2 text-[28px] font-bold tracking-[-0.03em] text-app-title">랭킹</h1>
        <p className="text-sm text-app-body">
            마지막 업데이트: {formatDate(lastUpdated)}
        </p>
      </div>

      <div className={`${cardClass} mb-6 flex flex-col gap-5`}>
        <div className="flex gap-2 overflow-x-auto border-b border-black/6 pb-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {RANKING_TYPES.map(type => (
                <button 
                    key={type.id}
                    type="button"
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeType === type.id
                        ? "bg-app-accent text-white"
                        : "bg-app-bg text-app-body hover:bg-black/[0.06]"
                    }`}
                    onClick={() => setActiveType(type.id)}
                >
                    {type.label}
                </button>
            ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 max-md:flex-col max-md:items-stretch">
            <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
                <span className="text-sm font-semibold text-app-title">서버</span>
                <div className="relative">
                <select 
                    className="min-w-[140px] appearance-none rounded-[12px] border border-black/10 bg-white px-4 py-2.5 pr-10 text-sm text-app-title outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20 max-md:w-full"
                    value={selectedServer}
                    onChange={(e) => setSelectedServer(e.target.value)}
                >
                    {SERVERS.map(s => <option key={s} value={s}>{s === 'All' ? '전체 서버' : s}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-app-accent"></i>
                </div>
            </div>

            <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
                <span className="text-sm font-semibold text-app-title">직업</span>
                <div className="relative">
                <select 
                    className="min-w-[140px] appearance-none rounded-[12px] border border-black/10 bg-white px-4 py-2.5 pr-10 text-sm text-app-title outline-none transition focus:border-app-accent focus:ring-2 focus:ring-app-accent/20 max-md:w-full"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                >
                    {JOBS.map(j => <option key={j} value={j}>{j === 'All' ? '전체 직업' : j}</option>)}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-app-accent"></i>
                </div>
            </div>
            
            {(selectedServer !== 'All' || selectedJob !== 'All') && (
                <button 
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full bg-app-bg px-4 py-2 text-[13px] font-semibold text-app-body transition hover:bg-black/[0.06] hover:text-app-title"
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
      <div className={`${cardClass} overflow-hidden`}>
        {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center text-app-body">
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
                <p>랭킹 정보를 불러오는 중입니다...</p>
            </div>
        ) : data.length > 0 ? (
            <>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse">
                    <thead className="text-left">
                        <tr>
                            <th className="w-20 border-b border-black/6 px-4 py-4 text-[13px] font-medium whitespace-nowrap text-app-body max-md:px-2 max-md:py-3">순위</th>
                            <th className="border-b border-black/6 px-4 py-4 text-[13px] font-medium whitespace-nowrap text-app-body max-md:px-2 max-md:py-3">캐릭터명</th>
                            <th className="border-b border-black/6 px-4 py-4 text-[13px] font-medium whitespace-nowrap text-app-body max-md:px-2 max-md:py-3">서버</th>
                            <th className="border-b border-black/6 px-4 py-4 text-[13px] font-medium whitespace-nowrap text-app-body max-md:px-2 max-md:py-3">직업</th>
                            <th className="border-b border-black/6 px-4 py-4 text-[13px] font-medium whitespace-nowrap text-app-body max-md:px-2 max-md:py-3">점수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => {
                            const rank = (page - 1) * 20 + idx + 1; // Dynamic numbering
                            const rankClass =
                              rank === 1 ? "bg-[#FFD700] text-white" :
                              rank === 2 ? "bg-[#C0C0C0] text-white" :
                              rank === 3 ? "bg-[#CD7F32] text-white" :
                              "bg-[#E8E8ED] text-app-body";

                            return (
                                <tr key={`${item.server}-${item.characterName}-${rank}`}>
                                    <td className="border-b border-black/4 px-4 py-4 align-middle text-[15px] text-app-title max-md:px-2 max-md:py-3 max-md:text-[13px]">
                                        <span className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-bold max-md:size-6 max-md:text-xs ${rankClass}`}>
                                            {rank}
                                        </span>
                                    </td>
                                    <td className="border-b border-black/4 px-4 py-4 align-middle text-[15px] font-semibold text-app-title max-md:px-2 max-md:py-3 max-md:text-[13px]">{item.characterName}</td>
                                    <td className="border-b border-black/4 px-4 py-4 align-middle text-[15px] text-app-title max-md:px-2 max-md:py-3 max-md:text-[13px]">
                                      <span className="inline-block rounded-md bg-app-bg px-2.5 py-1 text-[13px] text-app-body">{item.server}</span>
                                    </td>
                                    <td className="border-b border-black/4 px-4 py-4 align-middle text-[15px] text-app-title max-md:px-2 max-md:py-3 max-md:text-[13px]">
                                      <span className="inline-block rounded-md bg-app-bg px-2.5 py-1 text-[13px] text-app-body">{item.job}</span>
                                    </td>
                                    <td className="border-b border-black/4 px-4 py-4 align-middle font-mono text-[15px] font-semibold text-app-accent max-md:px-2 max-md:py-3 max-md:text-[13px]">
                                      {item.score.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>

                <div className="mt-8 flex items-center justify-center gap-3">
                    <button 
                        type="button"
                        className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-app-title transition hover:border-app-accent hover:text-app-accent disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <span className="text-sm text-app-body">{page} / {totalPages || 1}</span>
                    <button 
                        type="button"
                        className="flex size-10 items-center justify-center rounded-full border border-black/10 bg-white text-app-title transition hover:border-app-accent hover:text-app-accent disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <i className="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center text-app-body">
                <i className="fa-solid fa-trophy mb-4 text-5xl opacity-30"></i>
                <p>해당 조건의 랭킹 데이터가 없습니다.</p>
            </div>
        )}
      </div>
    </div>
  );
}
