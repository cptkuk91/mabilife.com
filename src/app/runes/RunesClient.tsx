"use client";

import { useState, useMemo, useDeferredValue } from "react";
import { RUNE_DATABASE, Rune } from "@/data/runes";

/* ─── Types ──────────────────────────────────────────── */

type SubJob = { id: string; name: string; runeIds: string[] };
type JobCategory = { id: string; name: string; icon: string; description: string; subJobs: SubJob[] };

/* ─── Job Data ───────────────────────────────────────── */

const JOB_DATA: JobCategory[] = [
  {
    id: "warrior", name: "전사 계열", icon: "fa-solid fa-shield-halved",
    description: "근접 전투의 전문가, 강력한 체력과 공격력을 자랑합니다.",
    subJobs: [
      { id: "warrior-basic", name: "전사", runeIds: ["hero","beast-plus","flame","last-mercy","crystal","mountain-lord","ruthless-predator","distant-light","archmage","pure-power","collapse-plus","pole-plus","onslaught-plus","charge-plus","slash-plus","claw-plus","sweeping-wind","delicate-hands","overwhelming-power","immortal"] },
      { id: "greatsword", name: "대검전사", runeIds: ["crystal","flame","fighter-plus","흰 까마귀","echoing-wrath","distant-light","archmage","cracked-earth","광전사+","탄력+","회전+","반격+","회심+","overwhelming-power","snowy-mountain","blind-prophet","immortal","delicate-hands"] },
      { id: "swordsman", name: "검술사", runeIds: ["sword-dance-plus","물결치는 날","last-mercy","fighter-plus","echoing-wrath","mountain-lord","cracked-earth","흩날리는 검","distant-light","일섬+","평정+","관통+","무희+","맹렬+","ancient-guardian","바위 감시자","overwhelming-power","elemental-harmony","wildfire"] },
    ],
  },
  {
    id: "archer", name: "궁수 계열", icon: "fa-solid fa-bullseye",
    description: "원거리에서 적을 제압하며, 높은 명중률과 치명타를 가집니다.",
    subJobs: [
      { id: "archer-basic", name: "궁수", runeIds: ["폭풍+","독수리 눈+","달빛+","thunder","beast-plus","distant-light","archmage","mountain-lord","집중+","속사+","약점 사격+","저격+","연사+","delicate-hands","overwhelming-power","blind-prophet","sweeping-wind","wildfire"] },
      { id: "crossbow", name: "석궁사수", runeIds: ["폭풍+","독수리 눈+","thunder","달빛+","beast-plus","distant-light","archmage","관통 사격+","작렬+","속사+","집중+","약점 사격+","delicate-hands","overwhelming-power","blind-prophet","sweeping-wind","wildfire"] },
      { id: "longbow", name: "장궁병", runeIds: ["폭풍+","독수리 눈+","beast-plus","달빛+","thunder","distant-light","archmage","집중+","저격+","약점 사격+","속사+","연사+","delicate-hands","overwhelming-power","blind-prophet","sweeping-wind","wildfire"] },
    ],
  },
  {
    id: "mage", name: "마법사 계열", icon: "fa-solid fa-wand-magic-sparkles",
    description: "원소의 힘을 다루어 강력한 마법 공격을 펼칩니다.",
    subJobs: [
      { id: "mage-basic", name: "마법사", runeIds: ["별똥별","서리+","flame","thunder","마나 순환+","archmage","distant-light","마력 증폭+","원소 집중+","마나 흐름+","신속 마법+","마법 가속+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "pyromancer", name: "화염술사", runeIds: ["flame","별똥별","서리+","thunder","마나 순환+","archmage","distant-light","화염 증폭+","원소 집중+","마력 증폭+","마나 흐름+","마법 가속+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "cryomancer", name: "빙결술사", runeIds: ["서리+","flame","별똥별","thunder","마나 순환+","archmage","distant-light","빙결 증폭+","원소 집중+","마력 증폭+","마나 흐름+","마법 가속+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "electromancer", name: "전격술사", runeIds: ["thunder","서리+","flame","별똥별","마나 순환+","archmage","distant-light","전격 증폭+","원소 집중+","마력 증폭+","마나 흐름+","마법 가속+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
    ],
  },
  {
    id: "healer", name: "힐러 계열", icon: "fa-solid fa-heart-pulse",
    description: "아군을 치유하고 보호하며, 전투의 지속력을 높입니다.",
    subJobs: [
      { id: "healer-basic", name: "힐러", runeIds: ["생명의 나무","치유의 빛+","회복의 물결+","수호의 축복+","정화의 손길+","distant-light","archmage","mountain-lord","치유 강화+","보호 강화+","마나 회복+","신속 치유+","광역 치유+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "priest", name: "사제", runeIds: ["생명의 나무","치유의 빛+","회복의 물결+","수호의 축복+","정화의 손길+","distant-light","archmage","mountain-lord","치유 강화+","보호 강화+","마나 회복+","신속 치유+","광역 치유+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "monk", name: "수도사", runeIds: ["무한","망각+","옛 마법사","distant-light","강격+","약점+","전진+","열혈+","격파+","delicate-hands","overwhelming-power","wildfire","blind-prophet","snowy-mountain"] },
      { id: "dark-mage", name: "암흑술사", runeIds: ["어둠의 계약+","영혼 착취+","암흑 폭발+","고통의 저주+","망각의 손아귀+","archmage","distant-light","암흑 강화+","저주 강화+","마력 증폭+","원소 집중+","마나 흐름+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
    ],
  },
  {
    id: "bard", name: "음유시인 계열", icon: "fa-solid fa-music",
    description: "음악으로 아군을 강화하고 적을 약화시킵니다.",
    subJobs: [
      { id: "bard-basic", name: "음유시인", runeIds: ["황홀경+","광시곡+","야상곡+","행진곡+","자장가+","distant-light","선율+","화음+","리듬+","절정+","울림+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "dancer", name: "댄서", runeIds: ["황홀경+","광시곡+","야상곡+","행진곡+","자장가+","distant-light","스텝+","회전+","도약+","매혹+","열정+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
      { id: "musician", name: "악사", runeIds: ["불협화음+","즉흥 연주+","돌림 노래+","행진곡+","자장가+","distant-light","선율+","화음+","리듬+","절정+","울림+","blind-prophet","delicate-hands","overwhelming-power","wildfire","snowy-mountain"] },
    ],
  },
  {
    id: "rogue", name: "도적 계열", icon: "fa-solid fa-user-secret",
    description: "빠른 몸놀림과 은신으로 적을 기습합니다.",
    subJobs: [
      { id: "rogue-basic", name: "도적", runeIds: ["그림자+","독칼+","기습+","절개+","은신+","distant-light","ruthless-predator","mountain-lord","출혈+","독+","급소+","기절+","약점+","delicate-hands","overwhelming-power","황혼","blind-prophet","wildfire"] },
      { id: "fighter", name: "격투가", runeIds: ["무한","망각+","옛 마법사","distant-light","강격+","약점+","전진+","열혈+","격파+","delicate-hands","overwhelming-power","wildfire","blind-prophet","snowy-mountain"] },
      { id: "dual-blade", name: "듀얼블레이드", runeIds: ["flame","fighter-plus","sword-dance-plus","종언+","hero","distant-light","ruthless-predator","mountain-lord","천침+","질주+","속행+","열상+","보름달+","delicate-hands","overwhelming-power","황혼","blind-prophet","wildfire"] },
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────── */

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const fr = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";

const gradeColor: Record<string, string> = {
  mythic: "#D4A017",
  legendary: "#E06B00",
  epic: "#9B51E0",
};

const rankStyles: Record<number, string> = {
  1: "bg-[#F2994A] text-white",
  2: "bg-[#BDBDBD] text-white",
  3: "bg-[#CD9B6A] text-white",
};

/* ─── Component ──────────────────────────────────────── */

interface RunesClientProps { initialRunes?: Rune[] }

export default function RunesClient({ initialRunes = [] }: RunesClientProps) {
  const runesMap = useMemo(() => {
    if (initialRunes && initialRunes.length > 0) {
      return initialRunes.reduce((acc, rune) => { acc[rune.id] = rune; return acc; }, {} as Record<string, Rune>);
    }
    return RUNE_DATABASE;
  }, [initialRunes]);

  const [activeJobId, setActiveJobId] = useState(JOB_DATA[0].id);
  const isDictionary = activeJobId === "rune-dictionary";
  const activeJob = !isDictionary ? (JOB_DATA.find((j) => j.id === activeJobId) || JOB_DATA[0]) : null;
  const [activeSubJobId, setActiveSubJobId] = useState(activeJob ? activeJob.subJobs[0].id : "");
  const [dictionaryTab, setDictionaryTab] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase());

  const handleJobChange = (id: string) => {
    setActiveJobId(id);
    if (id !== "rune-dictionary") {
      const job = JOB_DATA.find((j) => j.id === id);
      if (job?.subJobs.length) setActiveSubJobId(job.subJobs[0].id);
    } else {
      setSearchTerm("");
    }
  };

  const currentSubJob = activeJob ? (activeJob.subJobs.find((s) => s.id === activeSubJobId) || activeJob.subJobs[0]) : null;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1100px] flex-col gap-6 bg-white px-5 pb-24 pt-16 sm:px-6 md:pb-16 md:pt-20 lg:flex-row lg:gap-8 lg:px-8">

      {/* ── Sidebar ── */}
      <nav className="sticky top-12 z-10 -mx-5 flex gap-1.5 overflow-x-auto border-b border-[#F1F1EF] bg-white px-5 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:top-14 lg:mx-0 lg:w-[220px] lg:shrink-0 lg:flex-col lg:gap-1 lg:self-start lg:overflow-visible lg:border-b-0 lg:border-r lg:border-[#F1F1EF] lg:py-0 lg:pr-6 lg:pl-0">
        {/* Dictionary */}
        <button
          type="button"
          className={cn(
            "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition",
            isDictionary
              ? "bg-[#F7F6F3] text-[#37352F]"
              : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
            fr,
          )}
          onClick={() => handleJobChange("rune-dictionary")}
        >
          <i className="fa-solid fa-book-journal-whills w-4 text-center text-[12px]" aria-hidden="true" />
          <span>전체 룬 도감</span>
        </button>

        <div className="mx-2 hidden h-px bg-[#F1F1EF] lg:block" />

        {JOB_DATA.map((job) => (
          <button
            key={job.id}
            type="button"
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition",
              activeJobId === job.id
                ? "bg-[#F7F6F3] text-[#37352F]"
                : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
              fr,
            )}
            onClick={() => handleJobChange(job.id)}
          >
            <i className={`${job.icon} w-4 text-center text-[12px]`} aria-hidden="true" />
            <span>{job.name}</span>
          </button>
        ))}
      </nav>

      {/* ── Main Content ── */}
      <main className="min-w-0 flex-1">
        {isDictionary ? (
          /* ── Dictionary Mode ── */
          <>
            <header className="pb-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">Rune Index</div>
              <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#37352F] md:text-[32px]">전체 룬 도감</h1>
              <p className="mt-1 text-[14px] text-[#787774]">
                마비노기 모바일에 등장하는 모든 룬 정보를 확인하세요.
                <span className="ml-1 text-[#B4B4B0]">({Object.keys(runesMap).length}개)</span>
              </p>
            </header>

            {/* Search */}
            <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#E3E2DE] bg-white px-4 py-2.5 transition-shadow focus-within:border-[#2F80ED] focus-within:shadow-[0_0_0_3px_rgba(47,128,237,0.1)]">
              <i className="fa-solid fa-magnifying-glass text-[13px] text-[#B4B4B0]" aria-hidden="true" />
              <input
                type="text"
                placeholder="룬 이름 또는 효과를 검색하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent py-0.5 text-[14px] text-[#37352F] outline-none placeholder:text-[#C4C4C0]"
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} className="flex size-6 items-center justify-center rounded-md text-[#B4B4B0] hover:bg-[#F1F1EF] hover:text-[#787774]" aria-label="검색어 지우기">
                  <i className="fa-solid fa-xmark text-[11px]" aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Category chips */}
            <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["전체", "무기", "방어구", "장신구", "엠블럼", "보석"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition",
                    dictionaryTab === tab ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
                    fr,
                  )}
                  onClick={() => setDictionaryTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tables */}
            <div className="flex flex-col gap-6">
              {["무기", "방어구", "장신구", "엠블럼", "보석"]
                .filter((slot) => dictionaryTab === "전체" || dictionaryTab === slot)
                .map((slot) => {
                  const runesInSlot = Object.values(runesMap).filter(
                    (r: Rune) => r.slot === slot && (deferredSearch === "" || r.name.toLowerCase().includes(deferredSearch) || r.effect.toLowerCase().includes(deferredSearch)),
                  );
                  if (runesInSlot.length === 0) return null;
                  return (
                    <div key={slot}>
                      <h3 className="mb-2 flex items-center gap-2 text-[16px] font-bold text-[#37352F]">
                        {slot}
                        <span className="text-[13px] font-normal text-[#B4B4B0]">({runesInSlot.length})</span>
                      </h3>
                      <RuneTable runes={runesInSlot} showEffect />
                    </div>
                  );
                })}
            </div>
          </>
        ) : (
          /* ── Job Runes Mode ── */
          <>
            <header className="pb-5">
              <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">Recommended Runes</div>
              <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#37352F] md:text-[32px]">{activeJob?.name}</h1>
              <p className="mt-1 text-[14px] text-[#787774]">{activeJob?.description}</p>
            </header>

            {/* Subjob tabs */}
            {activeJob && activeJob.subJobs.length > 0 && (
              <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeJob.subJobs.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={cn(
                      "shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition",
                      activeSubJobId === sub.id ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
                      fr,
                    )}
                    onClick={() => setActiveSubJobId(sub.id)}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            {/* Rune tables per slot */}
            {currentSubJob && currentSubJob.runeIds.length > 0 ? (
              <div className="flex flex-col gap-6">
                {["무기", "방어구", "장신구", "엠블럼", "보석"].map((slot) => {
                  const runesInSlot = currentSubJob.runeIds.map((id) => runesMap[id]).filter((r) => r && r.slot === slot).slice(0, 5);
                  if (runesInSlot.length === 0) return null;
                  return (
                    <div key={slot}>
                      <h3 className="mb-2 flex items-center gap-2 text-[16px] font-bold text-[#37352F]">{slot}</h3>
                      <RuneTable runes={runesInSlot} showRank />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-[#F1F1EF] text-[20px] text-[#B4B4B0]">
                  <i className="fa-regular fa-file-lines" aria-hidden="true" />
                </div>
                <p className="mt-3 text-[15px] font-semibold text-[#37352F]">추천 룬 정보가 없습니다</p>
                <p className="mt-1 text-[13px] text-[#9B9A97]">곧 업데이트될 예정입니다!</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ─── Rune Table ─────────────────────────────────────── */

function RuneTable({ runes, showRank, showEffect }: { runes: Rune[]; showRank?: boolean; showEffect?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E3E2DE]">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-[#F1F1EF] bg-[#FBFBFA]">
            {showRank && <th className="w-[56px] px-4 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">순위</th>}
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">이름</th>
            {showEffect && <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9B9A97]">효과</th>}
          </tr>
        </thead>
        <tbody>
          {runes.map((rune, i) => {
            const rank = i + 1;
            const gc = rune.grade ? gradeColor[rune.grade] : undefined;
            return (
              <tr key={rune.id || i} className="border-b border-[#F1F1EF] transition-colors last:border-b-0 hover:bg-[#FBFBFA]">
                {showRank && (
                  <td className="w-[56px] px-4 py-3 text-center">
                    <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-[11px] font-bold", rankStyles[rank] || "text-[#B4B4B0]")}>
                      {rank}
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-[14px] font-medium" style={gc ? { color: gc } : { color: "#37352F" }}>
                  {rune.name}
                </td>
                {showEffect && (
                  <td className="px-4 py-3 text-[13px] leading-relaxed text-[#787774]">{rune.effect}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
