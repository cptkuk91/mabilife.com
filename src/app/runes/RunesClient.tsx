"use client";

import { useState } from 'react';
import styles from './runes.module.css';
import { RUNE_DATABASE, Rune } from '@/data/runes';

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
    id: "warrior",
    name: "전사 계열",
    icon: "fa-solid fa-shield-halved",
    description: "근접 전투의 전문가, 강력한 체력과 공격력을 자랑합니다.",
    subJobs: [
      {
        id: "warrior-basic",
        name: "전사",
        runeIds: []
      },
      {
        id: "greatsword",
        name: "대검전사",
        runeIds: []
      },
      {
        id: "swordsman",
        name: "검술사",
        runeIds: []
      }
    ]
  },
  {
    id: "archer",
    name: "궁수 계열",
    icon: "fa-solid fa-bullseye",
    description: "원거리에서 적을 제압하며, 높은 명중률과 치명타를 가집니다.",
    subJobs: [
      {
        id: "archer-basic",
        name: "궁수",
        runeIds: []
      },
      {
        id: "crossbow",
        name: "석궁사수",
        runeIds: []
      },
      {
        id: "longbow",
        name: "장궁병",
        runeIds: []
      }
    ]
  },
  {
    id: "mage",
    name: "마법사 계열",
    icon: "fa-solid fa-wand-magic-sparkles",
    description: "원소의 힘을 다루어 강력한 마법 공격을 펼칩니다.",
    subJobs: [
      {
        id: "mage-basic",
        name: "마법사",
        runeIds: []
      },
      {
        id: "pyromancer",
        name: "화염술사",
        runeIds: []
      },
      {
        id: "cryomancer",
        name: "빙결술사",
        runeIds: []
      },
      {
        id: "electromancer",
        name: "전격술사",
        runeIds: []
      }
    ]
  },
  {
    id: "healer",
    name: "힐러 계열",
    icon: "fa-solid fa-heart-pulse",
    description: "아군을 치유하고 보호하며, 전투의 지속력을 높입니다.",
    subJobs: [
      {
        id: "healer-basic",
        name: "힐러",
        runeIds: []
      },
      {
        id: "priest",
        name: "사제",
        runeIds: []
      },
      {
        id: "monk",
        name: "수도사",
        runeIds: []
      },
      {
        id: "dark-mage",
        name: "암흑술사",
        runeIds: []
      }
    ]
  },
  {
    id: "bard",
    name: "음유시인 계열",
    icon: "fa-solid fa-music",
    description: "음악으로 아군을 강화하고 적을 약화시킵니다.",
    subJobs: [
      {
        id: "bard-basic",
        name: "음유시인",
        runeIds: []
      },
      {
        id: "dancer",
        name: "댄서",
        runeIds: []
      },
      {
        id: "musician",
        name: "악사",
        runeIds: []
      }
    ]
  },
  {
    id: "rogue",
    name: "도적 계열",
    icon: "fa-solid fa-user-secret",
    description: "빠른 몸놀림과 은신으로 적을 기습합니다.",
    subJobs: [
      {
        id: "rogue-basic",
        name: "도적",
        runeIds: []
      },
      {
        id: "fighter",
        name: "격투가",
        runeIds: []
      },
      {
        id: "dual-blade",
        name: "듀얼블레이드",
        runeIds: []
      }
    ]
  }
];

export default function RunesClient() {
  const [activeJobId, setActiveJobId] = useState(JOB_DATA[0].id);
  const activeJob = JOB_DATA.find(job => job.id === activeJobId) || JOB_DATA[0];
  
  const [activeSubJobId, setActiveSubJobId] = useState(activeJob.subJobs[0].id);

  // When changing job, select first subjob of new job
  const handleJobChange = (jobId: string) => {
    setActiveJobId(jobId);
    const newJob = JOB_DATA.find(j => j.id === jobId);
    if (newJob && newJob.subJobs.length > 0) {
      setActiveSubJobId(newJob.subJobs[0].id);
    }
  };

  const currentSubJob = activeJob.subJobs.find(sub => sub.id === activeSubJobId) || activeJob.subJobs[0];

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <nav className={styles.sidebar}>
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
        <div className={styles.header}>
          <h1 className={styles.title}>{activeJob.name}</h1>
          <p className={styles.description}>{activeJob.description}</p>
        </div>

        {/* Sub Job Tabs */}
        {activeJob.subJobs.length > 0 && (
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
        {currentSubJob.runeIds && currentSubJob.runeIds.length > 0 ? (
          <div className={styles.runeContentWrapper}>
            {["무기", "방어구", "장신구", "엠블럼", "보석"].map((slot) => {
              // Map IDs to Rune objects and filter by current slot
              const runesInSlot = currentSubJob.runeIds
                .map(id => RUNE_DATABASE[id])
                .filter(rune => rune && rune.slot === slot);

              if (runesInSlot.length === 0) return null;

              return (
                <div key={slot} className={styles.slotSection}>
                  <h3 className={styles.slotTitle}>{slot}</h3>
                  <div className={styles.runeTableWrapper}>
                    <table className={styles.runeTable}>
                      <thead>
                        <tr>
                          <th>이름</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runesInSlot.map((rune, index) => (
                          <tr key={index}>
                            <td className={`${styles.nameCell} ${rune.grade ? styles[rune.grade] : ''}`}>
                              {rune.name}
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
        ) : (
          <div className={styles.emptyState}>
            <i className="fa-regular fa-file-lines"></i>
            <p>아직 등록된 추천 룬 정보가 없습니다.</p>
            <p style={{ fontSize: '14px' }}>곧 업데이트될 예정입니다!</p>
          </div>
        )}
      </main>
    </div>
  );
}
