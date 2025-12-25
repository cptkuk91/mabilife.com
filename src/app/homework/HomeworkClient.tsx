
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./homework.module.css";
import { getUserCharacters, toggleTask, createCharacter, deleteCharacter } from "@/actions/homework";
import { IHomeworkData } from "@/types/homework";

export default function HomeworkClient() {
  const { data: session, status } = useSession();
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
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

  const handleAddCharacter = async () => {
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

    const countBool = (val: boolean) => {
        total++;
        if (val) completed++;
    };
    
    const processObj = (obj: any) => {
        for (const key in obj) {
            if (typeof obj[key] === 'boolean') {
                countBool(obj[key]);
            } else if (Array.isArray(obj[key])) {
                obj[key].forEach((v: any) => {
                   if (typeof v === 'boolean') countBool(v); 
                });
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                processObj(obj[key]);
            }
        }
    };
    
    processObj(activeHomework[type]);
    
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const handleToggle = async (path: string, currentVal: any) => {
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
    <div 
        className={`${styles.taskCard} ${value ? styles.completed : ''}`}
        onClick={() => handleToggle(path, value)}
    >
        <div className={styles.taskIcon} style={{ background: value ? color : '#eee', color: value ? 'white' : '#999' }}>
            <i className={icon}></i>
        </div>
        <div className={styles.taskInfo}>
            <div className={styles.taskTitle}>{title}</div>
            <div className={styles.taskStatus}>{value ? '완료' : '미완료'}</div>
        </div>
        <div className={styles.check}>
            {value && <i className="fa-solid fa-check"></i>}
        </div>
    </div>
  );
  
  const ArrayTaskCard = ({ title, path, values, max }: any) => (
      <div className={styles.taskCard}>
          <div className={styles.taskInfo}>
              <div className={styles.taskTitle}>{title}</div>
              <div className={styles.steps}>
                  {values.map((v: boolean, i: number) => (
                      <div 
                        key={i} 
                        className={`${styles.step} ${v ? styles.stepDone : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(`${path}.${i}`, v);
                        }}
                      >
                          {i + 1}
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  if (loading) return <div className={styles.loading}>로딩중...</div>;
  if (!activeHomework) return null; // Should have at least one character

  return (
    <div className={styles.container}>
      {deleteModal.isOpen && (
          <div className={styles.modalOverlay} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                  <h3 className={styles.modalTitle}>캐릭터 삭제</h3>
                  <p className={styles.modalDesc}>
                      정말로 <strong>{deleteModal.name}</strong> 캐릭터를 삭제하시겠습니까?<br/>
                      삭제된 데이터는 복구할 수 없습니다.
                  </p>
                  <div className={styles.modalActions}>
                      <button 
                        className={`${styles.modalBtn} ${styles.btnCancel}`}
                        onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                      >
                          취소
                      </button>
                      <button 
                        className={`${styles.modalBtn} ${styles.btnDanger}`}
                        onClick={handleDeleteCharacter}
                      >
                          삭제하기
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className={styles.header}>
        <h1><i className="fa-solid fa-calendar-check"></i> 숙제 트래커</h1>
        <div className={styles.timer}>
            <div className={styles.timerLabel}>주간 초기화까지</div>
            <div className={styles.timerTime}>{timeLeft}</div>
        </div>
      </div>

      {/* Character Selector */}
      <div className={styles.charSelector}>
          <div className={styles.charList}>
              {characters.map((char, idx) => (
                  <div 
                    key={char._id} 
                    className={`${styles.charChip} ${idx === activeCharIndex ? styles.active : ''}`}
                    onClick={() => setActiveCharIndex(idx)}
                  >
                      {char.characterName}
                      {characters.length > 1 && (
                          <span 
                            className={styles.deleteBtn}
                            onClick={(e) => confirmDeleteCharacter(e, idx, char._id, char.characterName)}
                          >
                              <i className="fa-solid fa-xmark"></i>
                          </span>
                      )}
                  </div>
              ))}

              {isAdding ? (
                  <div className={styles.addCharForm}>
                      <input 
                        className={styles.charInput} 
                        value={newCharName} 
                        onChange={(e) => setNewCharName(e.target.value)}
                        placeholder="캐릭터명"
                        autoFocus
                      />
                      <button className={styles.confirmBtn} onClick={handleAddCharacter}>추가</button>
                      <button className={styles.charChip} onClick={() => setIsAdding(false)}>취소</button>
                  </div>
              ) : (
                  <button className={`${styles.charChip} ${styles.addCharBtn}`} onClick={() => setIsAdding(true)}>
                      <i className="fa-solid fa-plus"></i> 캐릭터 추가
                  </button>
              )}
          </div>
      </div>

      <div className={styles.grid}>
          {/* Left Column: Progress */}
          <div className={styles.sideCol}>
            <div className={styles.card}>
                <h2>진행도</h2>
                <div className={styles.progressItem}>
                    <div className={styles.progressLabel}>
                        <span>일일 숙제</span>
                        <span>{calculateProgress('daily')}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${calculateProgress('daily')}%`, background: '#0071E3' }}></div>
                    </div>
                </div>
                <div className={styles.progressItem}>
                    <div className={styles.progressLabel}>
                        <span>주간 숙제</span>
                        <span>{calculateProgress('weekly')}%</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${calculateProgress('weekly')}%`, background: '#34C759' }}></div>
                    </div>
                </div>
            </div>
          </div>

          {/* Right Column: Tasks */}
          <div className={styles.mainCol}>
              <div className={styles.tabs}>
                  <button 
                    className={`${styles.tab} ${activeTab === 'daily' ? styles.active : ''}`}
                    onClick={() => setActiveTab('daily')}
                  >
                    일일 숙제
                  </button>
                  <button 
                    className={`${styles.tab} ${activeTab === 'weekly' ? styles.active : ''}`}
                    onClick={() => setActiveTab('weekly')}
                  >
                    주간 숙제
                  </button>
              </div>

              <div className={styles.taskList}>
                  {activeTab === 'daily' && (
                      <>
                        <h3 className={styles.sectionTitle}>필수 미션</h3>
                        <div className={styles.taskGrid}>
                            <TaskCard title="일일 미션" path="daily.dailyMission" value={activeHomework.daily.dailyMission} icon="fa-solid fa-flag" color="#FF3B30" />
                            <TaskCard title="아르바이트" path="daily.partTimeJob" value={activeHomework.daily.partTimeJob} icon="fa-solid fa-briefcase" color="#FF9500" />
                        </div>

                        <h3 className={styles.sectionTitle}>던전</h3>
                        <div className={styles.taskGrid}>
                            <ArrayTaskCard title="검은 달의 교단 (3회)" path="daily.blackHole" values={activeHomework.daily.blackHole} />
                            <ArrayTaskCard title="소환의 징표 (2회)" path="daily.summoningBadge" values={activeHomework.daily.summoningBadge} />
                            <TaskCard title="심연의 코일" path="daily.deepDungeon" value={activeHomework.daily.deepDungeon} icon="fa-solid fa-dungeon" color="#5856D6" />
                            <TaskCard title="망령의 탑" path="daily.tower" value={activeHomework.daily.tower} icon="fa-solid fa-chess-rook" color="#AF52DE" />
                            <TaskCard title="요일 던전" path="daily.dailyDungeon" value={activeHomework.daily.dailyDungeon} icon="fa-regular fa-calendar" />
                        </div>

                        <h3 className={styles.sectionTitle}>상점 & 교환</h3>
                        <div className={styles.taskGrid}>
                            <TaskCard title="일일 의상 (무료)" path="daily.dailyGift" value={activeHomework.daily.dailyGift} icon="fa-solid fa-shirt" color="#FF2D55" />
                            <TaskCard title="퍼거스 광석 교환" path="daily.fergusOre" value={activeHomework.daily.fergusOre} icon="fa-solid fa-gem" color="#5AC8FA" />
                            <TaskCard title="엔델리온 축복의 포션" path="daily.endelyonHolyWater" value={activeHomework.daily.endelyonHolyWater} icon="fa-solid fa-flask" color="#34C759" />
                            {/* Crystal Box Counter */}
                            <div 
                                className={`${styles.taskCard}`}
                                onClick={() => handleToggle('daily.crystalBox', activeHomework.daily.crystalBox)}
                            >
                                <div className={styles.taskIcon} style={{ background: activeHomework.daily.crystalBox >= 10 ? '#34C759' : '#eee', color: activeHomework.daily.crystalBox >= 10 ? 'white' : '#999' }}>
                                    <i className="fa-solid fa-cube"></i>
                                </div>
                                <div className={styles.taskInfo}>
                                    <div className={styles.taskTitle}>수정 상자 (10회)</div>
                                    <div className={styles.taskStatus}>{activeHomework.daily.crystalBox}/10 완료</div>
                                </div>
                            </div>
                        </div>
                      </>
                  )}

                  {activeTab === 'weekly' && (
                      <>
                        <h3 className={styles.sectionTitle}>주간 미션</h3>
                        <div className={styles.taskGrid}>
                            <TaskCard title="주간 미션" path="weekly.weeklyMission" value={activeHomework.weekly.weeklyMission} icon="fa-regular fa-flag" color="#FF3B30" />
                        </div>

                        <h3 className={styles.sectionTitle}>길드 협동</h3>
                        <div className={styles.taskGrid}>
                             <ArrayTaskCard title="길드 미션 (6단계)" path="weekly.guildMission" values={activeHomework.weekly.guildMission} />
                        </div>

                        <h3 className={styles.sectionTitle}>필드 보스</h3>
                        <div className={styles.taskGrid}>
                            <TaskCard title="페리" path="weekly.fieldBosses.peri" value={activeHomework.weekly.fieldBosses.peri} icon="fa-solid fa-dragon" color="#FF3B30" />
                            <TaskCard title="크라브" path="weekly.fieldBosses.crabvach" value={activeHomework.weekly.fieldBosses.crabvach} icon="fa-solid fa-spider" color="#AF52DE" />
                            <TaskCard title="크라마" path="weekly.fieldBosses.krama" value={activeHomework.weekly.fieldBosses.krama} icon="fa-solid fa-skull" color="#5856D6" />
                            <TaskCard title="드로네" path="weekly.fieldBosses.drohnenem" value={activeHomework.weekly.fieldBosses.drohnenem} icon="fa-solid fa-bug" color="#FF9500" />
                        </div>

                        <h3 className={styles.sectionTitle}>심연 & 레이드</h3>
                        <div className={styles.taskGrid}>
                            <TaskCard title="복원된 유적 (심연)" path="weekly.sunkenRuins" value={activeHomework.weekly.sunkenRuins} icon="fa-solid fa-landmark" color="#0071E3" />
                            <TaskCard title="붕괴된 제단 (심연)" path="weekly.collapsedAltar" value={activeHomework.weekly.collapsedAltar} icon="fa-solid fa-cube" color="#0071E3" />
                            <TaskCard title="파괴의 장소 (심연)" path="weekly.hallOfDestruction" value={activeHomework.weekly.hallOfDestruction} icon="fa-solid fa-fire" color="#FF3B30" />
                            <TaskCard title="글라스 기브넨 (레이드)" path="weekly.glasGhaibhleann" value={activeHomework.weekly.glasGhaibhleann} icon="fa-solid fa-ghost" color="#AF52DE" />
                            <TaskCard title="가디언 (레이드)" path="weekly.guardian" value={activeHomework.weekly.guardian} icon="fa-solid fa-shield-halved" color="#FF9500" />
                            <TaskCard title="벨라스트 (레이드)" path="weekly.bellast" value={activeHomework.weekly.bellast} icon="fa-solid fa-person-military-rifle" color="#34C759" />
                        </div>
                        
                        <h3 className={styles.sectionTitle}>주간 상점</h3>
                        <div className={styles.taskGrid}>
                            <TaskCard title="주간 상점 구매" path="weekly.weeklyShop" value={activeHomework.weekly.weeklyShop} icon="fa-solid fa-cart-shopping" color="#0071E3" />
                            <TaskCard title="고급 인장 교환" path="weekly.advancedSeal" value={activeHomework.weekly.advancedSeal} icon="fa-solid fa-certificate" color="#FFCC00" />
                        </div>
                      </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
