
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserCharacters, toggleTask, createCharacter, deleteCharacter } from "@/actions/homework";
import { IHomeworkData } from "@/types/homework";

/* ─── Helpers ────────────────────────────────────────── */

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const fr = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2";
const DEMO_DATA: IHomeworkData = {
  _id: "demo", userId: "demo", characterName: "체험용 캐릭터",
  weekStartDate: new Date(), lastDailyReset: new Date(),
  daily: { dailyMission: false, dailyDungeon: false, silverCoin: false, deepDungeon: false, partTimeJob: false, dailyGift: false, gemBox: false },
  weekly: { barrier: false, blackHole: false, fieldBoss: false, abyss: false, raid: false },
  memo: "",
};

type HomeworkTab = "daily" | "weekly";
type DailyTaskKey = keyof IHomeworkData["daily"];
type WeeklyTaskKey = keyof IHomeworkData["weekly"];
type TaskPath = `daily.${DailyTaskKey}` | `weekly.${WeeklyTaskKey}`;
type TaskCardProps = {
  title: string;
  path: TaskPath;
  value: boolean;
  icon: string;
  color?: string;
};

const ConfirmDialog = dynamic(() => import("@/components/ui/ConfirmDialog"));

/* ─── Component ──────────────────────────────────────── */

export default function HomeworkClient() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [characters, setCharacters] = useState<IHomeworkData[]>([]);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [newCharName, setNewCharName] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [activeTab, setActiveTab] = useState<HomeworkTab>("daily");

  const activeHomework = characters[activeCharIndex];

  const [showLoginAlert, setShowLoginAlert] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number; id: string; name: string }>({
    isOpen: false, index: -1, id: "", name: "",
  });
  const fetchData = useCallback(async () => {
    try {
      const result = await getUserCharacters();
      if (result.success && result.characters) {
        setCharacters(result.characters);
        if (activeCharIndex >= result.characters.length) setActiveCharIndex(0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [activeCharIndex]);

  useEffect(() => {
    if (status === "unauthenticated") { setCharacters([DEMO_DATA]); setLoading(false); }
    else if (status === "authenticated") void fetchData();
  }, [status, fetchData]);

  useEffect(() => {
    const timer = setInterval(calcTime, 1000);
    calcTime();
    return () => clearInterval(timer);
  }, []);

  const calcTime = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 3600000);
    let days = (8 - kst.getUTCDay()) % 7;
    if (days === 0 && kst.getUTCHours() >= 6) days = 7;
    const target = new Date(kst);
    target.setUTCDate(kst.getUTCDate() + days);
    target.setUTCHours(6, 0, 0, 0);
    const diff = target.getTime() - kst.getTime();
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setTimeLeft(`${d}일 ${h}시간 ${m}분 ${s}초`);
  };

  const requireAuth = () => { if (status !== "authenticated") { setShowLoginAlert(true); return false; } return true; };

  const handleAddCharacter = async () => {
    if (!requireAuth() || !newCharName.trim()) return;
    const result = await createCharacter(newCharName);
    if (result.success && result.character) {
      setCharacters([...characters, result.character]);
      setActiveCharIndex(characters.length);
      setIsAdding(false); setNewCharName("");
    } else { alert(result.error); }
  };

  const confirmDelete = (e: React.MouseEvent<HTMLButtonElement>, i: number, id: string, name: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, index: i, id, name });
  };

  const handleDelete = async () => {
    const { index, id } = deleteModal;
    const result = await deleteCharacter(id);
    if (result.success) {
      const nc = characters.filter((_, i) => i !== index);
      setCharacters(nc);
      if (activeCharIndex >= index && activeCharIndex > 0) setActiveCharIndex(activeCharIndex - 1);
      else if (nc.length === 0) void fetchData();
    }
    setDeleteModal({ isOpen: false, index: -1, id: "", name: "" });
  };

  const calcProgress = (type: HomeworkTab) => {
    if (!activeHomework) return 0;
    const values = Object.values(activeHomework[type]);
    const done = values.filter(Boolean).length;
    return values.length === 0 ? 0 : Math.round((done / values.length) * 100);
  };

  const handleToggle = async (path: TaskPath, currentVal: boolean) => {
    if (!requireAuth() || !activeHomework) return;
    const [group, taskKey] = path.split(".") as [HomeworkTab, DailyTaskKey | WeeklyTaskKey];
    const nextValue = !currentVal;
    setCharacters((prev) =>
      prev.map((character, index) => {
        if (index !== activeCharIndex) return character;
        if (group === "daily") {
          const dailyKey = taskKey as DailyTaskKey;
          return { ...character, daily: { ...character.daily, [dailyKey]: nextValue } };
        }
        const weeklyKey = taskKey as WeeklyTaskKey;
        return { ...character, weekly: { ...character.weekly, [weeklyKey]: nextValue } };
      }),
    );
    await toggleTask(activeHomework._id, path, nextValue);
  };

  /* ─── Task Card ── */
  const TaskCard = ({ title, path, value, icon, color = "#37352F" }: TaskCardProps) => (
    <button
      type="button"
      className={cn(
        "group relative flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition",
        value
          ? "border-[#27AE60]/30 bg-[#27AE60]/5"
          : "border-[#E3E2DE] bg-white hover:border-[#D3D1CB] hover:bg-[#FBFBFA]",
        fr,
      )}
      onClick={() => handleToggle(path, value)}
      aria-pressed={Boolean(value)}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[16px] transition"
        style={{ background: value ? color : "#F1F1EF", color: value ? "white" : "#9B9A97" }}
      >
        <i className={icon} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn("text-[14px] font-semibold transition", value ? "text-[#9B9A97] line-through" : "text-[#37352F]")}>
          {title}
        </div>
        <div className="text-[11px] text-[#B4B4B0]">{value ? "완료" : "미완료"}</div>
      </div>
      <div className={cn(
        "flex size-5 items-center justify-center rounded-full bg-[#27AE60] text-[10px] text-white transition-all duration-300",
        value ? "scale-100 opacity-100" : "scale-75 opacity-0",
      )}>
        {value && <i className="fa-solid fa-check" aria-hidden="true" />}
      </div>
    </button>
  );

  return (
    <div className="mx-auto min-h-screen max-w-[1100px] bg-white px-5 pb-24 pt-16 sm:px-6 md:pb-16 md:pt-20 lg:px-8">

      {/* ── Delete Modal ── */}
      {deleteModal.isOpen && (
        <ConfirmDialog
          title="캐릭터 삭제"
          description={
            <>
              정말로 <strong className="text-[#37352F]">{deleteModal.name}</strong> 캐릭터를 삭제하시겠습니까?
            </>
          }
          note="삭제된 데이터는 복구할 수 없습니다."
          confirmLabel="삭제하기"
          confirmTone="danger"
          onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
          onConfirm={() => {
            void handleDelete();
          }}
        />
      )}

      {/* ── Login Alert Modal ── */}
      {showLoginAlert && (
        <ConfirmDialog
          title="로그인 필요"
          description="숙제 트래커 기능을 이용하려면 로그인이 필요합니다."
          note="로그인 페이지로 이동하시겠습니까?"
          confirmLabel="로그인하기"
          confirmTone="accent"
          noteClassName="mt-1 text-[14px] leading-relaxed text-[#787774]"
          onCancel={() => setShowLoginAlert(false)}
          onConfirm={() => {
            setShowLoginAlert(false);
            router.push("/login");
          }}
        />
      )}

      {/* ── Header ── */}
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#9B9A97]">Homework Tracker</div>
          <h1 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#37352F] md:text-[32px]">숙제 트래커</h1>
        </div>
        <div className="rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] px-4 py-2.5 text-right">
          <div className="text-[11px] text-[#9B9A97]">주간 초기화까지</div>
          <div className="mt-0.5 font-mono text-[15px] font-bold text-[#2F80ED]">{timeLeft}</div>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <i className="fa-solid fa-spinner fa-spin text-[20px] text-[#B4B4B0]" aria-hidden="true" />
            <p className="mt-3 text-[14px] text-[#9B9A97]">로딩중…</p>
          </div>
        </div>
      ) : !activeHomework ? null : (
        <>
          {/* ── Character Selector ── */}
          <div className="mb-6 rounded-xl border border-[#E3E2DE] bg-[#FBFBFA] p-4">
            <div className="flex flex-wrap gap-2">
              {characters.map((ch, i) => (
                <div
                  key={ch._id}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium transition",
                    i === activeCharIndex
                      ? "bg-[#37352F] text-white"
                      : "bg-white text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
                    fr,
                  )}
                  onClick={() => setActiveCharIndex(i)}
                >
                  {ch.characterName}
                  {characters.length > 1 && (
                    <button type="button" className="ml-0.5 text-[10px] opacity-60 transition hover:opacity-100" onClick={(e) => confirmDelete(e, i, ch._id, ch.characterName)}>
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}

              {isAdding ? (
                <div className="flex w-full max-w-[300px] items-center gap-2 max-sm:max-w-full">
                  <input
                    className={cn("min-w-0 flex-1 rounded-lg border border-[#E3E2DE] bg-white px-3 py-2 text-[13px] text-[#37352F] outline-none transition focus:border-[#2F80ED]", fr)}
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="캐릭터명"
                    autoFocus
                  />
                  <button type="button" className={cn("shrink-0 rounded-lg bg-[#2F80ED] px-3 py-2 text-[12px] font-medium text-white transition hover:bg-[#1A66CC]", fr)} onClick={handleAddCharacter}>추가</button>
                  <button type="button" className="rounded-lg bg-white px-3 py-2 text-[12px] font-medium text-[#787774] transition hover:bg-[#F7F6F3]" onClick={() => setIsAdding(false)}>취소</button>
                </div>
              ) : (
                <button
                  type="button"
                  className={cn("inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#D3D1CB] px-3.5 py-2 text-[13px] font-medium text-[#9B9A97] transition hover:border-[#2F80ED] hover:text-[#2F80ED]", fr)}
                  onClick={() => setIsAdding(true)}
                >
                  <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
                  캐릭터 추가
                </button>
              )}
            </div>
          </div>

          {/* ── Main Grid ── */}
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            {/* Left: Progress */}
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-[#E3E2DE] p-4">
                <h2 className="mb-4 text-[15px] font-bold text-[#37352F]">진행도</h2>
                <ProgressBar label="일일 숙제" pct={calcProgress("daily")} color="#2F80ED" />
                <div className="mt-3" />
                <ProgressBar label="주간 숙제" pct={calcProgress("weekly")} color="#27AE60" />
              </div>
            </div>

            {/* Right: Tasks */}
            <div>
              {/* Tab bar */}
              <div className="mb-5 flex gap-1.5">
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition",
                    activeTab === "daily" ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
                    fr,
                  )}
                  onClick={() => setActiveTab("daily")}
                >
                  일일 숙제
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-md px-3 py-1.5 text-[13px] font-medium transition",
                    activeTab === "weekly" ? "bg-[#37352F] text-white" : "text-[#787774] hover:bg-[#F7F6F3] hover:text-[#37352F]",
                    fr,
                  )}
                  onClick={() => setActiveTab("weekly")}
                >
                  주간 숙제
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {activeTab === "daily" && (
                  <>
                    <TaskSection title="필수 미션">
                      <TaskCard title="일일 미션" path="daily.dailyMission" value={activeHomework.daily.dailyMission} icon="fa-solid fa-flag" color="#EB5757" />
                      <TaskCard title="아르바이트" path="daily.partTimeJob" value={activeHomework.daily.partTimeJob} icon="fa-solid fa-briefcase" color="#F2994A" />
                    </TaskSection>
                    <TaskSection title="던전">
                      <TaskCard title="요일 던전" path="daily.dailyDungeon" value={activeHomework.daily.dailyDungeon} icon="fa-regular fa-calendar" />
                      <TaskCard title="은동전" path="daily.silverCoin" value={activeHomework.daily.silverCoin} icon="fa-solid fa-coins" color="#9B9A97" />
                      <TaskCard title="심층 던전" path="daily.deepDungeon" value={activeHomework.daily.deepDungeon} icon="fa-solid fa-dungeon" color="#9B51E0" />
                    </TaskSection>
                    <TaskSection title="상점 & 교환">
                      <TaskCard title="보석 상자" path="daily.gemBox" value={activeHomework.daily.gemBox} icon="fa-solid fa-gem" color="#2F80ED" />
                      <TaskCard title="무료 상품" path="daily.dailyGift" value={activeHomework.daily.dailyGift} icon="fa-solid fa-gift" color="#E84393" />
                    </TaskSection>
                  </>
                )}
                {activeTab === "weekly" && (
                  <TaskSection title="주간 숙제">
                    <TaskCard title="결계" path="weekly.barrier" value={activeHomework.weekly.barrier} icon="fa-solid fa-shield" color="#2F80ED" />
                    <TaskCard title="검은 구멍" path="weekly.blackHole" value={activeHomework.weekly.blackHole} icon="fa-solid fa-circle" color="#37352F" />
                    <TaskCard title="필드 보스" path="weekly.fieldBoss" value={activeHomework.weekly.fieldBoss} icon="fa-solid fa-dragon" color="#EB5757" />
                    <TaskCard title="어비스" path="weekly.abyss" value={activeHomework.weekly.abyss} icon="fa-solid fa-dungeon" color="#9B51E0" />
                    <TaskCard title="레이드" path="weekly.raid" value={activeHomework.weekly.raid} icon="fa-solid fa-users" color="#F2994A" />
                  </TaskSection>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────── */

function TaskSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[14px] font-bold text-[#37352F]">{title}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">{children}</div>
    </div>
  );
}

function ProgressBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-medium text-[#37352F]">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F1F1EF]">
        <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
