"use client";

import { useState, useMemo } from 'react';
import styles from './runes.module.css';
import { RUNE_DATABASE, Rune } from '@/data/runes';

// ... other types ...
type SubJob = {
  id: string;
  name: string;
  runeIds: string[];
};

type JobCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
  subJobs: SubJob[];
};

const JOB_DATA: JobCategory[] = [
  {
    "id": "warrior",
    "name": "전사 계열",
    "icon": "fa-solid fa-shield-halved",
    "description": "근접 전투의 전문가, 강력한 체력과 공격력을 자랑합니다.",
    "subJobs": [
      {
        "id": "warrior-basic",
        "name": "전사",
        "runeIds": [
          "hero",
          "beast-plus",
          "flame",
          "last-mercy",
          "crystal",
          "mountain-lord",
          "ruthless-predator",
          "distant-light",
          "archmage",
          "pure-power",
          "collapse-plus",
          "pole-plus",
          "onslaught-plus",
          "charge-plus",
          "slash-plus",
          "claw-plus",
          "sweeping-wind",
          "delicate-hands",
          "overwhelming-power",
          "immortal"
        ]
      },
      {
        "id": "greatsword",
        "name": "대검전사",
        "runeIds": [
          "crystal",
          "flame",
          "fighter-plus",
          "흰 까마귀",
          "echoing-wrath",
          "distant-light",
          "archmage",
          "cracked-earth",
          "광전사+",
          "탄력+",
          "회전+",
          "반격+",
          "회심+",
          "overwhelming-power",
          "snowy-mountain",
          "blind-prophet",
          "immortal",
          "delicate-hands"
        ]
      },
      {
        "id": "swordsman",
        "name": "검술사",
        "runeIds": [
          "sword-dance-plus",
          "물결치는 날",
          "last-mercy",
          "fighter-plus",
          "echoing-wrath",
          "mountain-lord",
          "cracked-earth",
          "흩날리는 검",
          "distant-light",
          "일섬+",
          "평정+",
          "관통+",
          "무희+",
          "맹렬+",
          "ancient-guardian",
          "바위 감시자",
          "overwhelming-power",
          "elemental-harmony",
          "wildfire"
        ]
      }
    ]
  },
  {
    "id": "archer",
    "name": "궁수 계열",
    "icon": "fa-solid fa-bullseye",
    "description": "원거리에서 적을 제압하며, 높은 명중률과 치명타를 가집니다.",
    "subJobs": [
      {
        "id": "archer-basic",
        "name": "궁수",
        "runeIds": [
          "폭풍+",
          "독수리 눈+",
          "달빛+",
          "thunder",
          "beast-plus",
          "distant-light",
          "archmage",
          "mountain-lord",
          "집중+",
          "속사+",
          "약점 사격+",
          "저격+",
          "연사+",
          "delicate-hands",
          "overwhelming-power",
          "blind-prophet",
          "sweeping-wind",
          "wildfire"
        ]
      },
      {
        "id": "crossbow",
        "name": "석궁사수",
        "runeIds": [
          "폭풍+",
          "독수리 눈+",
          "thunder",
          "달빛+",
          "beast-plus",
          "distant-light",
          "archmage",
          "관통 사격+",
          "작렬+",
          "속사+",
          "집중+",
          "약점 사격+",
          "delicate-hands",
          "overwhelming-power",
          "blind-prophet",
          "sweeping-wind",
          "wildfire"
        ]
      },
      {
        "id": "longbow",
        "name": "장궁병",
        "runeIds": [
          "폭풍+",
          "독수리 눈+",
          "beast-plus",
          "달빛+",
          "thunder",
          "distant-light",
          "archmage",
          "집중+",
          "저격+",
          "약점 사격+",
          "속사+",
          "연사+",
          "delicate-hands",
          "overwhelming-power",
          "blind-prophet",
          "sweeping-wind",
          "wildfire"
        ]
      }
    ]
  },
  {
    "id": "mage",
    "name": "마법사 계열",
    "icon": "fa-solid fa-wand-magic-sparkles",
    "description": "원소의 힘을 다루어 강력한 마법 공격을 펼칩니다.",
    "subJobs": [
      {
        "id": "mage-basic",
        "name": "마법사",
        "runeIds": [
          "별똥별",
          "서리+",
          "flame",
          "thunder",
          "마나 순환+",
          "archmage",
          "distant-light",
          "마력 증폭+",
          "원소 집중+",
          "마나 흐름+",
          "신속 마법+",
          "마법 가속+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "pyromancer",
        "name": "화염술사",
        "runeIds": [
          "flame",
          "별똥별",
          "서리+",
          "thunder",
          "마나 순환+",
          "archmage",
          "distant-light",
          "화염 증폭+",
          "원소 집중+",
          "마력 증폭+",
          "마나 흐름+",
          "마법 가속+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "cryomancer",
        "name": "빙결술사",
        "runeIds": [
          "서리+",
          "flame",
          "별똥별",
          "thunder",
          "마나 순환+",
          "archmage",
          "distant-light",
          "빙결 증폭+",
          "원소 집중+",
          "마력 증폭+",
          "마나 흐름+",
          "마법 가속+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "electromancer",
        "name": "전격술사",
        "runeIds": [
          "thunder",
          "서리+",
          "flame",
          "별똥별",
          "마나 순환+",
          "archmage",
          "distant-light",
          "전격 증폭+",
          "원소 집중+",
          "마력 증폭+",
          "마나 흐름+",
          "마법 가속+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      }
    ]
  },
  {
    "id": "healer",
    "name": "힐러 계열",
    "icon": "fa-solid fa-heart-pulse",
    "description": "아군을 치유하고 보호하며, 전투의 지속력을 높입니다.",
    "subJobs": [
      {
        "id": "healer-basic",
        "name": "힐러",
        "runeIds": [
          "생명의 나무",
          "치유의 빛+",
          "회복의 물결+",
          "수호의 축복+",
          "정화의 손길+",
          "distant-light",
          "archmage",
          "mountain-lord",
          "치유 강화+",
          "보호 강화+",
          "마나 회복+",
          "신속 치유+",
          "광역 치유+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "priest",
        "name": "사제",
        "runeIds": [
          "생명의 나무",
          "치유의 빛+",
          "회복의 물결+",
          "수호의 축복+",
          "정화의 손길+",
          "distant-light",
          "archmage",
          "mountain-lord",
          "치유 강화+",
          "보호 강화+",
          "마나 회복+",
          "신속 치유+",
          "광역 치유+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "monk",
        "name": "수도사",
        "runeIds": [
          "무한",
          "망각+",
          "옛 마법사",
          "distant-light",
          "강격+",
          "약점+",
          "전진+",
          "열혈+",
          "격파+",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "blind-prophet",
          "snowy-mountain"
        ]
      },
      {
        "id": "dark-mage",
        "name": "암흑술사",
        "runeIds": [
          "어둠의 계약+",
          "영혼 착취+",
          "암흑 폭발+",
          "고통의 저주+",
          "망각의 손아귀+",
          "archmage",
          "distant-light",
          "암흑 강화+",
          "저주 강화+",
          "마력 증폭+",
          "원소 집중+",
          "마나 흐름+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      }
    ]
  },
  {
    "id": "bard",
    "name": "음유시인 계열",
    "icon": "fa-solid fa-music",
    "description": "음악으로 아군을 강화하고 적을 약화시킵니다.",
    "subJobs": [
      {
        "id": "bard-basic",
        "name": "음유시인",
        "runeIds": [
          "황홀경+",
          "광시곡+",
          "야상곡+",
          "행진곡+",
          "자장가+",
          "distant-light",
          "선율+",
          "화음+",
          "리듬+",
          "절정+",
          "울림+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "dancer",
        "name": "댄서",
        "runeIds": [
          "황홀경+",
          "광시곡+",
          "야상곡+",
          "행진곡+",
          "자장가+",
          "distant-light",
          "스텝+",
          "회전+",
          "도약+",
          "매혹+",
          "열정+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      },
      {
        "id": "musician",
        "name": "악사",
        "runeIds": [
          "불협화음+",
          "즉흥 연주+",
          "돌림 노래+",
          "행진곡+",
          "자장가+",
          "distant-light",
          "선율+",
          "화음+",
          "리듬+",
          "절정+",
          "울림+",
          "blind-prophet",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "snowy-mountain"
        ]
      }
    ]
  },
  {
    "id": "rogue",
    "name": "도적 계열",
    "icon": "fa-solid fa-user-secret",
    "description": "빠른 몸놀림과 은신으로 적을 기습합니다.",
    "subJobs": [
      {
        "id": "rogue-basic",
        "name": "도적",
        "runeIds": [
          "그림자+",
          "독칼+",
          "기습+",
          "절개+",
          "은신+",
          "distant-light",
          "ruthless-predator",
          "mountain-lord",
          "출혈+",
          "독+",
          "급소+",
          "기절+",
          "약점+",
          "delicate-hands",
          "overwhelming-power",
          "황혼",
          "blind-prophet",
          "wildfire"
        ]
      },
      {
        "id": "fighter",
        "name": "격투가",
        "runeIds": [
          "무한",
          "망각+",
          "옛 마법사",
          "distant-light",
          "강격+",
          "약점+",
          "전진+",
          "열혈+",
          "격파+",
          "delicate-hands",
          "overwhelming-power",
          "wildfire",
          "blind-prophet",
          "snowy-mountain"
        ]
      },
      {
        "id": "dual-blade",
        "name": "듀얼블레이드",
        "runeIds": [
          "flame",
          "fighter-plus",
          "sword-dance-plus",
          "종언+",
          "hero",
          "distant-light",
          "ruthless-predator",
          "mountain-lord",
          "천침+",
          "질주+",
          "속행+",
          "열상+",
          "보름달+",
          "delicate-hands",
          "overwhelming-power",
          "황혼",
          "blind-prophet",
          "wildfire"
        ]
      }
    ]
  }
];

interface RunesClientProps {
  initialRunes?: any[];
}

export default function RunesClient({ initialRunes = [] }: RunesClientProps) {
  // Construct database from props, falling back to local file if empty
  const runesMap = useMemo(() => {
    if (initialRunes && initialRunes.length > 0) {
      return initialRunes.reduce((acc, rune) => {
        acc[rune.id] = rune;
        return acc;
      }, {} as Record<string, Rune>);
    }
    return RUNE_DATABASE;
  }, [initialRunes]);
  
  const [activeJobId, setActiveJobId] = useState(JOB_DATA[0].id);
  const isDictionary = activeJobId === 'rune-dictionary';
  
  const activeJob = !isDictionary ? (JOB_DATA.find(job => job.id === activeJobId) || JOB_DATA[0]) : null;
  const [activeSubJobId, setActiveSubJobId] = useState(activeJob ? activeJob.subJobs[0].id : '');
  const [dictionaryTab, setDictionaryTab] = useState("전체");
  const [searchTerm, setSearchTerm] = useState("");

  // When changing job, select first subjob of new job
  const handleJobChange = (jobId: string) => {
    setActiveJobId(jobId);
    if (jobId !== 'rune-dictionary') {
      const newJob = JOB_DATA.find(j => j.id === jobId);
      if (newJob && newJob.subJobs.length > 0) {
        setActiveSubJobId(newJob.subJobs[0].id);
      }
    } else {
      // Reset search when entering dictionary
      setSearchTerm("");
    }
  };

  const currentSubJob = activeJob ? (activeJob.subJobs.find(sub => sub.id === activeSubJobId) || activeJob.subJobs[0]) : null;

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <nav className={styles.sidebar}>
        <button
          className={`${styles.categoryItem} ${isDictionary ? styles.active : ''}`}
          onClick={() => handleJobChange('rune-dictionary')}
        >
          <i className="fa-solid fa-book-journal-whills"></i>
          <span>전체 룬 도감</span>
        </button>

        <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', margin: '8px 12px' }}></div>

        {JOB_DATA.map((job) => (
          <button
            key={job.id}
            className={`${styles.categoryItem} ${activeJobId === job.id ? styles.active : ''}`}
            onClick={() => handleJobChange(job.id)}
          >
            <i className={job.icon}></i>
            <span>{job.name}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className={styles.content}>
        {isDictionary ? (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>전체 룬 도감</h1>
              <p className={styles.description}>
                마비노기 모바일에 등장하는 모든 룬 정보를 획득처와 함께 확인해보세요.<br/>
                (현재 {Object.keys(runesMap).length}개의 룬이 등록되어 있습니다)
              </p>
            </div>

            {/* Search Input */}
            <div className={styles.searchWrapper}>
              <i className="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                placeholder="룬 이름 또는 효과를 검색해보세요" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            {/* Dictionary Category Tabs */}
            <div className={styles.subTabs}>
              {["전체", "무기", "방어구", "장신구", "엠블럼", "보석"].map((tab) => (
                <button
                  key={tab}
                  className={`${styles.subTab} ${dictionaryTab === tab ? styles.active : ''}`}
                  onClick={() => setDictionaryTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={styles.runeContentWrapper}>
              {["무기", "방어구", "장신구", "엠블럼", "보석"]
                .filter(slot => dictionaryTab === "전체" || dictionaryTab === slot)
                .map((slot) => {
                const runesInSlot = Object.values(runesMap).filter(rune => 
                  rune.slot === slot &&
                  (searchTerm === "" || 
                   rune.name.includes(searchTerm) || 
                   rune.effect.includes(searchTerm))
                );
                if (runesInSlot.length === 0) return null;

                return (
                  <div key={slot} className={styles.slotSection}>
                    <h3 className={styles.slotTitle}>{slot} <span style={{fontSize: '14px', color: 'var(--text-dim)', fontWeight: 'normal'}}>({runesInSlot.length})</span></h3>
                    <div className={styles.runeTableWrapper}>
                      <table className={styles.runeTable}>
                        <thead>
                          <tr>
                            <th style={{width: '180px'}}>이름</th>
                            <th>효과</th>
                          </tr>
                        </thead>
                        <tbody>
                          {runesInSlot.map((rune) => (
                            <tr key={rune.id}>
                              <td className={`${styles.nameCell} ${rune.grade ? styles[rune.grade] : ''}`}>
                                {rune.name}
                              </td>
                              <td style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: '1.5' }}>
                                {rune.effect}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.title}>{activeJob?.name}</h1>
              <p className={styles.description}>{activeJob?.description}</p>
            </div>

            {/* Sub Job Tabs */}
            {activeJob?.subJobs && activeJob.subJobs.length > 0 && (
              <div className={styles.subTabs}>
                {activeJob.subJobs.map((subJob) => (
                  <button
                    key={subJob.id}
                    className={`${styles.subTab} ${activeSubJobId === subJob.id ? styles.active : ''}`}
                    onClick={() => setActiveSubJobId(subJob.id)}
                  >
                    {subJob.name}
                  </button>
                ))}
              </div>
            )}

            {/* Content Area */}
            {currentSubJob && currentSubJob.runeIds && currentSubJob.runeIds.length > 0 ? (
              <div className={styles.runeContentWrapper}>
                {["무기", "방어구", "장신구", "엠블럼", "보석"].map((slot) => {
                  // Map IDs to Rune objects and filter by current slot
                  const runesInSlot = currentSubJob.runeIds
                    .map(id => runesMap[id])
                    .filter(rune => rune && rune.slot === slot)
                    .slice(0, 5);

                  if (runesInSlot.length === 0) return null;

                  return (
                    <div key={slot} className={styles.slotSection}>
                      <h3 className={styles.slotTitle}>{slot}</h3>
                      <div className={styles.runeTableWrapper}>
                        <table className={styles.runeTable}>
                          <thead>
                            <tr>
                              <th className={styles.rankHeader}>순위</th>
                              <th>이름</th>
                            </tr>
                          </thead>
                          <tbody>
                            {runesInSlot.map((rune, index) => {
                              const rank = index + 1;
                              let badgeClass = styles.rankNormal;
                              if (rank === 1) badgeClass = styles.rank1;
                              else if (rank === 2) badgeClass = styles.rank2;
                              else if (rank === 3) badgeClass = styles.rank3;

                              return (
                                <tr key={index}>
                                  <td className={styles.rankCell}>
                                    <span className={`${styles.rankBadge} ${badgeClass}`}>
                                      {rank}
                                    </span>
                                  </td>
                                  <td className={`${styles.nameCell} ${rune.grade ? styles[rune.grade] : ''}`}>
                                    {rune.name}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <i className="fa-regular fa-file-lines"></i>
                <p>아직 등록된 추천 룬 정보가 없습니다.</p>
                <p style={{ fontSize: '14px' }}>곧 업데이트될 예정입니다!</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
