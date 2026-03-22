
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getUserCharacters, toggleTask, createCharacter, deleteCharacter } from "@/actions/homework";
import { IHomeworkData } from "@/types/homework";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
const pageClass = "mx-auto max-w-[var(--max-width)] px-4 pb-24 pt-20 md:px-5 md:pb-20";
const overlayClass = "fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm";
const modalClass = "w-full max-w-[400px] rounded-[24px] bg-white p-7 shadow-elev-hover";
const modalTitleClass = "mb-3 text-[20px] font-bold text-app-title";
const modalDescClass = "mb-6 text-[15px] leading-6 text-app-body";
const modalActionsClass = "flex justify-end gap-3";
const modalButtonClass = "rounded-[12px] px-5 py-2.5 text-sm font-semibold transition";
const headerClass = "mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between";
const headerTitleClass = "flex items-center gap-3 text-[28px] font-bold tracking-[-0.03em] text-app-title";
const timerClass = "rounded-[14px] border border-app-border bg-white px-5 py-3 text-right shadow-elev-soft";
const timerLabelClass = "text-[12px] text-app-body";
const timerTimeClass = "mt-1 font-mono text-[16px] font-bold text-app-accent";
const loadingClass = "flex min-h-[50vh] items-center justify-center text-base text-app-body";
const sectionCardClass = "rounded-[20px] border border-app-border bg-white p-4 shadow-elev-soft md:p-5";
const charListClass = "flex flex-wrap gap-2";
const charChipClass =
  "inline-flex items-center gap-2 rounded-full border border-transparent bg-black/[0.04] px-4 py-2 text-sm font-semibold text-app-body transition";
const activeCharChipClass = "bg-app-accent text-white shadow-[0_2px_8px_rgba(0,113,227,0.3)]";
const addCharBtnClass = "border-dashed border-app-body bg-transparent text-app-body hover:border-app-accent hover:text-app-accent";
const taskGridClass = "grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4";
const panelTitleClass = "mb-5 text-[18px] font-bold text-app-title";
const progressLabelClass = "mb-2 flex items-center justify-between text-sm font-semibold text-app-title";
const progressBarClass = "h-2.5 overflow-hidden rounded-full bg-black/[0.06]";
const tabsClass = "mb-6 flex w-fit gap-2 rounded-[16px] bg-white p-1.5 shadow-elev-soft";
const tabClass = "rounded-[12px] px-5 py-2.5 text-[15px] font-semibold text-app-body transition";
const activeTabClass = "bg-app-accent text-white shadow-[0_2px_10px_rgba(0,113,227,0.3)]";
const sectionTitleClass = "mb-4 text-[18px] font-bold text-app-main";

export default function HomeworkClient() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Multiple characters
  const [characters, setCharacters] = useState<IHomeworkData[]>([]);
  const [activeCharIndex, setActiveCharIndex] = useState(0);
  
  // Create mode
  const [isAdding, setIsAdding] = useState(false);
  const [newCharName, setNewCharName] = useState("");

  const [timeLeft, setTimeLeft] = useState("");
  const [activeTab, setActiveTab] = useState("daily"); // daily, weekly

  const activeHomework = characters[activeCharIndex];

  // Login Alert Modal
  const [showLoginAlert, setShowLoginAlert] = useState(false);

  // Demo data for unauthenticated users
  const demoData: IHomeworkData = {
    _id: 'demo',
    userId: 'demo',
    characterName: '체험용 캐릭터',
    weekStartDate: new Date(),
    lastDailyReset: new Date(),
    daily: {
      dailyMission: false,
      dailyDungeon: false,
      silverCoin: false,
      deepDungeon: false,
      partTimeJob: false,
      dailyGift: false,
      gemBox: false,
    },
    weekly: {
      barrier: false,
      blackHole: false,
      fieldBoss: false,
      abyss: false,
      raid: false,
    },
    memo: '',
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      // Show demo data instead of redirecting
      setCharacters([demoData]);
      setLoading(false);
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);
    calculateTimeLeft();
    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = () => {
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    
    // Reset Target: Next Monday 6AM KST
    let daysToAdd = (8 - kstNow.getUTCDay()) % 7;
    if (daysToAdd === 0 && kstNow.getUTCHours() >= 6) {
        daysToAdd = 7;
    }
    
    const resetTarget = new Date(kstNow);
    resetTarget.setUTCDate(kstNow.getUTCDate() + daysToAdd);
    resetTarget.setUTCHours(6, 0, 0, 0);
    
    const diff = resetTarget.getTime() - kstNow.getTime();
    
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${d}일 ${h}시간 ${m}분 ${s}초`);
  };

  const fetchData = async () => {
    try {
      const result = await getUserCharacters();
      if (result.success && result.characters) {
        setCharacters(result.characters);
        // If active index is out of bounds (deleted char), reset to 0
        if (activeCharIndex >= result.characters.length) {
            setActiveCharIndex(0);
        }
      }
    } catch (error) {
      console.error("Failed to fetch characters", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated before any action
  const requireAuth = () => {
    if (status !== "authenticated") {
      setShowLoginAlert(true);
      return false;
    }
    return true;
  };

  const handleAddCharacter = async () => {
      if (!requireAuth()) return;
      if (!newCharName.trim()) return;
      
      const result = await createCharacter(newCharName);
      if (result.success && result.character) {
          setCharacters([...characters, result.character]);
          setActiveCharIndex(characters.length); // Switch to new char
          setIsAdding(false);
          setNewCharName("");
      } else {
          alert(result.error);
      }
  };

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; index: number; id: string; name: string }>({
      isOpen: false,
      index: -1,
      id: '',
      name: ''
  });

  const confirmDeleteCharacter = (e: any, index: number, id: string, name: string) => {
      e.stopPropagation();
      setDeleteModal({ isOpen: true, index, id, name });
  };

  const handleDeleteCharacter = async () => {
      const { index, id } = deleteModal;
      
      const result = await deleteCharacter(id);
      if (result.success) {
          const newChars = characters.filter((_, i) => i !== index);
          setCharacters(newChars);
          if (activeCharIndex >= index && activeCharIndex > 0) {
              setActiveCharIndex(activeCharIndex - 1);
          } else if (newChars.length === 0) {
              fetchData();
          }
      }
      setDeleteModal({ isOpen: false, index: -1, id: '', name: '' });
  };

  const calculateProgress = (type: 'daily' | 'weekly') => {
    if (!activeHomework) return 0;
    
    let total = 0;
    let completed = 0;
    
    const tasks = activeHomework[type];
    for (const key in tasks) {
      if (typeof (tasks as any)[key] === 'boolean') {
        total++;
        if ((tasks as any)[key]) completed++;
      }
    }
    
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const handleToggle = async (path: string, currentVal: any) => {
    if (!requireAuth()) return;
    if (!activeHomework) return;

    // Optimistic Update
    const keys = path.split('.');
    let newVal;
    
    // Clone state deep
    const newChars = JSON.parse(JSON.stringify(characters));
    const targetChar = newChars[activeCharIndex];
    
    // Traverse
    let ref = targetChar;
    for (let i = 0; i < keys.length - 1; i++) {
        ref = ref[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    
    // Toggle logic
    if (typeof currentVal === 'boolean') {
        newVal = !currentVal;
        ref[lastKey] = newVal;
    } else if (typeof currentVal === 'number') {
        newVal = (currentVal + 1) % 11;
        ref[lastKey] = newVal;
    } else {
        newVal = !ref[lastKey];
        ref[lastKey] = newVal;
    }

    setCharacters(newChars);

    // Server call
    await toggleTask(activeHomework._id, path, newVal);
  };

  // UI Components
  const TaskCard = ({ title, path, value, icon, color = "var(--text-main)" }: any) => (
    <button
        type="button"
        className={cn(
          "group relative flex w-full items-center gap-4 rounded-[16px] border p-4 text-left transition",
          value
            ? "border-app-success bg-app-success/10"
            : "border-app-border bg-white hover:-translate-y-0.5 hover:border-app-accent hover:shadow-elev-soft",
        )}
        onClick={() => handleToggle(path, value)}
        aria-pressed={Boolean(value)}
    >
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-[14px] text-lg transition"
          style={{ background: value ? color : "#EEE", color: value ? "white" : "#999" }}
        >
            <i className={icon}></i>
        </div>
        <div className="min-w-0 flex-1">
            <div className={cn("mb-1 text-[15px] font-semibold transition", value && "text-app-sub line-through")}>
              {title}
            </div>
            <div className="text-[12px] text-app-sub">{value ? '완료' : '미완료'}</div>
        </div>
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-full bg-app-success text-[12px] text-white transition-all duration-300",
            value ? "scale-100 opacity-100" : "scale-75 opacity-0",
          )}
        >
            {value && <i className="fa-solid fa-check"></i>}
        </div>
    </button>
  );
  
  return (
    <div className={pageClass}>
      {deleteModal.isOpen && (
          <div className={overlayClass} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>
              <div className={modalClass} onClick={e => e.stopPropagation()}>
                  <h3 className={modalTitleClass}>캐릭터 삭제</h3>
                  <p className={modalDescClass}>
                      정말로 <strong>{deleteModal.name}</strong> 캐릭터를 삭제하시겠습니까?<br/>
                      삭제된 데이터는 복구할 수 없습니다.
                  </p>
                  <div className={modalActionsClass}>
                      <button 
                        type="button"
                        className={cn(modalButtonClass, "bg-app-bg text-app-title hover:bg-black/[0.08]")}
                        onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                      >
                          취소
                      </button>
                      <button 
                        type="button"
                        className={cn(modalButtonClass, "bg-[#FF3B30] text-white hover:bg-[#FF2D55]")}
                        onClick={handleDeleteCharacter}
                      >
                          삭제하기
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showLoginAlert && (
          <div className={overlayClass} onClick={() => setShowLoginAlert(false)}>
              <div className={modalClass} onClick={e => e.stopPropagation()}>
                  <h3 className={modalTitleClass}>로그인 필요</h3>
                  <p className={modalDescClass}>
                      숙제 트래커 기능을 이용하려면 로그인이 필요합니다.<br/>
                      로그인 페이지로 이동하시겠습니까?
                  </p>
                  <div className={modalActionsClass}>
                      <button 
                        type="button"
                        className={cn(modalButtonClass, "bg-app-bg text-app-title hover:bg-black/[0.08]")}
                        onClick={() => setShowLoginAlert(false)}
                      >
                          취소
                      </button>
                      <button 
                        type="button"
                        className={cn(modalButtonClass, "bg-app-accent text-white hover:bg-[#005BBB]")}
                        onClick={() => router.push('/login')}
                      >
                          로그인하기
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className={headerClass}>
        <h1 className={headerTitleClass}><i className="fa-solid fa-calendar-check"></i> 숙제 트래커</h1>
        <div className={timerClass}>
            <div className={timerLabelClass}>주간 초기화까지</div>
            <div className={timerTimeClass}>{timeLeft}</div>
        </div>
      </div>

      {loading ? (
        <div className={loadingClass}>로딩중...</div>
      ) : !activeHomework ? (
        null
      ) : (
        <>
          {/* Character Selector */}
          <div className={sectionCardClass}>
              <div className={charListClass}>
                  {characters.map((char, idx) => (
                      <div 
                        key={char._id} 
                        className={cn(charChipClass, idx === activeCharIndex && activeCharChipClass)}
                        onClick={() => setActiveCharIndex(idx)}
                      >
                          {char.characterName}
                          {characters.length > 1 && (
                              <button
                                type="button"
                                className="ml-1 text-[12px] opacity-70 transition hover:opacity-100"
                                onClick={(e) => confirmDeleteCharacter(e, idx, char._id, char.characterName)}
                              >
                                  <i className="fa-solid fa-xmark"></i>
                              </button>
                          )}
                      </div>
                  ))}

                  {isAdding ? (
                      <div className="flex w-full max-w-[320px] items-center gap-2 max-[480px]:max-w-full">
                          <input 
                            className="min-w-0 flex-1 rounded-[10px] border border-app-border px-3 py-2 text-base outline-none transition focus:border-app-accent" 
                            value={newCharName} 
                            onChange={(e) => setNewCharName(e.target.value)}
                            placeholder="캐릭터명"
                            autoFocus
                          />
                          <button
                            type="button"
                            className="shrink-0 rounded-[10px] bg-app-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-app-accent-hover"
                            onClick={handleAddCharacter}
                          >
                            추가
                          </button>
                          <button
                            type="button"
                            className={charChipClass}
                            onClick={() => setIsAdding(false)}
                          >
                            취소
                          </button>
                      </div>
                  ) : (
                      <button
                        type="button"
                        className={cn(charChipClass, addCharBtnClass)}
                        onClick={() => setIsAdding(true)}
                      >
                          <i className="fa-solid fa-plus"></i> 캐릭터 추가
                      </button>
                  )}
              </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
              {/* Left Column: Progress */}
              <div className="flex flex-col gap-6">
                <div className={sectionCardClass}>
                    <h2 className={panelTitleClass}>진행도</h2>
                    <div className="mb-4">
                        <div className={progressLabelClass}>
                            <span>일일 숙제</span>
                            <span>{calculateProgress('daily')}%</span>
                        </div>
                        <div className={progressBarClass}>
                            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${calculateProgress('daily')}%`, background: '#0071E3' }}></div>
                        </div>
                    </div>
                    <div>
                        <div className={progressLabelClass}>
                            <span>주간 숙제</span>
                            <span>{calculateProgress('weekly')}%</span>
                        </div>
                        <div className={progressBarClass}>
                            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${calculateProgress('weekly')}%`, background: '#34C759' }}></div>
                        </div>
                    </div>
                </div>
              </div>

              {/* Right Column: Tasks */}
              <div className="flex flex-col">
                  <div className={tabsClass}>
                      <button 
                        type="button"
                        className={cn(tabClass, activeTab === 'daily' && activeTabClass)}
                        onClick={() => setActiveTab('daily')}
                      >
                        일일 숙제
                      </button>
                      <button 
                        type="button"
                        className={cn(tabClass, activeTab === 'weekly' && activeTabClass)}
                        onClick={() => setActiveTab('weekly')}
                      >
                        주간 숙제
                      </button>
                  </div>

                  <div className="flex flex-col gap-8">
                      {activeTab === 'daily' && (
                          <>
                            <div>
                              <h3 className={sectionTitleClass}>필수 미션</h3>
                              <div className={taskGridClass}>
                                <TaskCard title="일일 미션" path="daily.dailyMission" value={activeHomework.daily.dailyMission} icon="fa-solid fa-flag" color="#FF3B30" />
                                <TaskCard title="아르바이트" path="daily.partTimeJob" value={activeHomework.daily.partTimeJob} icon="fa-solid fa-briefcase" color="#FF9500" />
                              </div>
                            </div>

                            <div>
                              <h3 className={sectionTitleClass}>던전</h3>
                              <div className={taskGridClass}>
                                <TaskCard title="요일 던전" path="daily.dailyDungeon" value={activeHomework.daily.dailyDungeon} icon="fa-regular fa-calendar" />
                                <TaskCard title="은동전" path="daily.silverCoin" value={activeHomework.daily.silverCoin} icon="fa-solid fa-coins" color="#A9A9A9" />
                                <TaskCard title="심층 던전" path="daily.deepDungeon" value={activeHomework.daily.deepDungeon} icon="fa-solid fa-dungeon" color="#5856D6" />
                              </div>
                            </div>

                            <div>
                              <h3 className={sectionTitleClass}>상점 & 교환</h3>
                              <div className={taskGridClass}>
                                <TaskCard title="보석 상자" path="daily.gemBox" value={activeHomework.daily.gemBox} icon="fa-solid fa-gem" color="#5AC8FA" />
                                <TaskCard title="무료 상품" path="daily.dailyGift" value={activeHomework.daily.dailyGift} icon="fa-solid fa-gift" color="#FF2D55" />
                              </div>
                            </div>
                          </>
                      )}

                      {activeTab === 'weekly' && (
                          <>
                            <div>
                              <h3 className={sectionTitleClass}>주간 숙제</h3>
                              <div className={taskGridClass}>
                                <TaskCard title="결계" path="weekly.barrier" value={activeHomework.weekly.barrier} icon="fa-solid fa-shield" color="#0071E3" />
                                <TaskCard title="검은 구멍" path="weekly.blackHole" value={activeHomework.weekly.blackHole} icon="fa-solid fa-circle" color="#1C1C1E" />
                                <TaskCard title="필드 보스" path="weekly.fieldBoss" value={activeHomework.weekly.fieldBoss} icon="fa-solid fa-dragon" color="#FF3B30" />
                                <TaskCard title="어비스" path="weekly.abyss" value={activeHomework.weekly.abyss} icon="fa-solid fa-dungeon" color="#5856D6" />
                                <TaskCard title="레이드" path="weekly.raid" value={activeHomework.weekly.raid} icon="fa-solid fa-users" color="#FF9500" />
                              </div>
                            </div>
                          </>
                      )}
                  </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}
