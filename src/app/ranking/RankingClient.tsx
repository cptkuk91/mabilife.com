"use client";

import { useState, useEffect } from "react";
import { getRankings } from "@/actions/getRankings";

/* ─── Constants ──────────────────────────────────────── */

const RANKING_TYPES = [
  { id: "total", label: "종합 랭킹" },
  { id: "combat", label: "전투력 랭킹" },
  { id: "charm", label: "매력 랭킹" },
  { id: "life", label: "생활력 랭킹" },
];

const SERVERS = ["All", "데이안", "아이라", "던컨", "알리사", "메이븐", "라사", "칼릭스"];
const JOBS = [
  "All",
  "전사",
  "대검전사",
  "검술사",
  "궁수",
  "석궁사수",
  "장궁병",
  "마법사",
  "화염술사",
  "빙결술사",
  "전격술사",
  "힐러",
  "사제",
  "수도사",
  "암흑술사",
  "음유시인",
  "댄서",
  "악사",
  "도적",
  "격투가",
  "듀얼블레이드",
  "견습 전사",
  "견습 궁수",
  "견습 마법사",
  "견습 힐러",
  "견습 음유시인",
  "견습 도적",
];

/* ─── Helpers ────────────────────────────────────────── */

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const fr = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";

const fmtDate = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const rankBadge: Record<number, string> = {
  1: "bg-[#F2994A] text-white",
  2: "bg-[#BDBDBD] text-white",
  3: "bg-[#CD9B6A] text-white",
};

/* ─── Types ──────────────────────────────────────────── */

interface RankingData {
  rank: number;
  server: string;
  characterName: string;
  job: string;
  score: number;
  rankingType: string;
}

/* ─── Component ──────────────────────────────────────── */

export default function RankingClient() {
  const [activeType, setActiveType] = useState("total");
  const [selectedServer, setSelectedServer] = useState("All");
  const [selectedJob, setSelectedJob] = useState("All");
  const [data, setData] = useState<RankingData[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await getRankings({ page, limit: LIMIT, type: activeType, server: selectedServer, job: selectedJob });
        setData(res.data);
        setTotal(res.total);
        setLastUpdated(res.lastUpdated ? new Date(res.lastUpdated).toISOString() : null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeType, selectedServer, selectedJob, page]);

  useEffect(() => { setPage(1); }, [activeType, selectedServer, selectedJob]);

  const totalPages = Math.ceil(total / LIMIT);
  const hasFilter = selectedServer !== "All" || selectedJob !== "All";

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] bg-white px-5 pb-24 pt-16 sm:px-6 md:pb-16 md:pt-20 lg:px-8">

      {/* ── Header ── */}
      <header className="pb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">Rankings</div>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#37352F] md:text-[32px]">랭킹</h1>
        <p className="mt-1 text-[13px] text-[#B4B4B0]">
          마지막 업데이트: {fmtDate(lastUpdated)}
        </p>
        <p className="mt-1 text-[13px] text-[#9B9A97]">
          서버 및 랭킹 타입별 상위 200 기준
        </p>
      </header>

      {/* ── Ranking Type Tabs ── */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RANKING_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition",
              activeType === t.id
                ? "bg-[#37352F] text-white"
                : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
              fr,
            )}
            onClick={() => setActiveType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] px-4 py-3 max-md:flex-col max-md:items-stretch">
        {/* Server */}
        <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
          <label className="text-[12px] font-semibold text-[#9B9A97]">서버</label>
          <div className="relative">
            <select
              className={cn(
                "min-w-[130px] cursor-pointer appearance-none rounded-lg border border-[#E3E2DE] bg-white px-3 py-2 pr-8 text-[13px] text-[#37352F] outline-none transition focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)] max-md:w-full",
                fr,
              )}
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
            >
              {SERVERS.map((s) => (
                <option key={s} value={s}>{s === "All" ? "전체 서버" : s}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#B4B4B0]" aria-hidden="true" />
          </div>
        </div>

        {/* Job */}
        <div className="flex items-center gap-2 max-md:flex-col max-md:items-stretch">
          <label className="text-[12px] font-semibold text-[#9B9A97]">직업</label>
          <div className="relative">
            <select
              className={cn(
                "min-w-[130px] cursor-pointer appearance-none rounded-lg border border-[#E3E2DE] bg-white px-3 py-2 pr-8 text-[13px] text-[#37352F] outline-none transition focus:border-[#2F80ED] focus:shadow-[0_0_0_3px_rgba(47,128,237,0.1)] max-md:w-full",
                fr,
              )}
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              {JOBS.map((j) => (
                <option key={j} value={j}>{j === "All" ? "전체 직업" : j}</option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#B4B4B0]" aria-hidden="true" />
          </div>
        </div>

        {/* Reset */}
        {hasFilter && (
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border border-[#E3E2DE] bg-white px-3 py-2 text-[12px] font-medium text-[#787774] transition hover:bg-[#F7F6F3] hover:text-[#37352F]",
              fr,
            )}
            onClick={() => { setSelectedServer("All"); setSelectedJob("All"); }}
          >
            <i className="fa-solid fa-rotate-left text-[10px]" aria-hidden="true" />
            초기화
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-xl border border-[#E3E2DE]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa-solid fa-spinner fa-spin text-[20px] text-[#B4B4B0]" aria-hidden="true" />
            <p className="mt-3 text-[14px] text-[#9B9A97]">랭킹 정보를 불러오는 중입니다…</p>
          </div>
        ) : data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F1F1EF] bg-[#FBFBFA]">
                    <th className="w-[64px] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">순위</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">캐릭터명</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">서버</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">직업</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, idx) => {
                    const rank = (page - 1) * LIMIT + idx + 1;
                    return (
                      <tr key={`${item.server}-${item.characterName}-${rank}`} className="border-b border-[#F1F1EF] transition-colors last:border-b-0 hover:bg-[#FBFBFA]">
                        <td className="w-[64px] px-4 py-3 text-center">
                          <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold", rankBadge[rank] || "text-[#B4B4B0]")}>
                            {rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[14px] font-semibold text-[#37352F]">{item.characterName}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-[#F7F6F3] px-2 py-0.5 text-[12px] text-[#787774]">{item.server}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-[#F7F6F3] px-2 py-0.5 text-[12px] text-[#787774]">{item.job}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[14px] font-semibold text-[#2F80ED]">
                          {item.score.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 border-t border-[#F1F1EF] bg-[#FBFBFA] px-4 py-3">
              <button
                type="button"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border border-[#E3E2DE] text-[12px] text-[#787774] transition hover:bg-white hover:text-[#37352F] disabled:cursor-not-allowed disabled:opacity-40",
                  fr,
                )}
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className="min-w-[80px] text-center text-[13px] tabular-nums text-[#787774]">
                {page} / {totalPages || 1}
              </span>
              <button
                type="button"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md border border-[#E3E2DE] text-[12px] text-[#787774] transition hover:bg-white hover:text-[#37352F] disabled:cursor-not-allowed disabled:opacity-40",
                  fr,
                )}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[20px] text-[#B4B4B0]">
              <i className="fa-solid fa-trophy" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-[#37352F]">랭킹 데이터가 없습니다</p>
            <p className="mt-1 text-[13px] text-[#9B9A97]">해당 조건의 데이터를 찾을 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
