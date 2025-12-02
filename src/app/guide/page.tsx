"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./guide.module.css";

export default function GuidePage() {
  const router = useRouter();

  // Dummy Data for Guide Cards
  const dungeonGuides = [
    { id: 1, title: "알비 던전 상급 하드모드 공략", cat: "Dungeon", author: "Gamer1", thumb: "https://picsum.photos/id/10/400/300" },
    { id: 2, title: "몽환의 라비 던전 솔플 가이드", cat: "Dungeon", author: "MabiGod", thumb: "https://picsum.photos/id/11/400/300" },
    { id: 3, title: "베테랑 던전 효율적인 클리어 루트", cat: "Dungeon", author: "SpeedRun", thumb: "https://picsum.photos/id/12/400/300" },
  ];

  const lifeGuides = [
    { id: 4, title: "블랙스미스 1랭크 찍는 최단 루트", cat: "Life", author: "Smithy", thumb: "https://picsum.photos/id/13/400/300" },
    { id: 5, title: "교역으로 두카트 부자 되는 법", cat: "Commerce", author: "Merchant", thumb: "https://picsum.photos/id/14/400/300" },
    { id: 6, title: "낭만농장 꾸미기 팁 모음", cat: "Farm", author: "DecoMaster", thumb: "https://picsum.photos/id/15/400/300" },
  ];

  const tips = [
    { id: 1, title: "오늘의 요일 효과 확인하세요 (화요일)", desc: "던전 아이템 드랍률 증가 효과가 있으니 오늘은 룬상하 달리세요.", time: "5분 전", icon: "fa-lightbulb", bg: "#EAF4FF", color: "#0071E3" },
    { id: 2, title: "지향색 코드 공유합니다 (리블/리화)", desc: "RGB 값 정확하게 찍어왔습니다. 염색 앰플 참고하세요.", time: "20분 전", icon: "fa-palette", bg: "#FFF0F5", color: "#FF2D55" },
    { id: 3, title: "간헐적으로 펫 소환 안되는 버그 해결법", desc: "채널 이동하면 풀리긴 하는데, 임시 방편으로 재접속 추천합니다.", time: "1시간 전", icon: "fa-bug", bg: "#F0F8FF", color: "#4682B4" },
  ];

  return (
    <div className={styles.pageContainer}>
      
      {/* 1. Header Area */}
      <header className={styles.hubHeader}>
        <div>
          <div className={styles.hubTitle}>공략</div>
          <div className={styles.hubSubtitle}>에린 생활에 필요한 모든 지식</div>
        </div>
        <button className={styles.writeBtn} onClick={() => router.push('/guide/write')}>
          <i className="fa-solid fa-pen-to-square"></i>
          공략 작성
        </button>
      </header>

      {/* 2. Quick Categories */}
      <div className={styles.categoryGrid}>
        <div className={styles.catItem}>
          <div className={styles.catIcon}><i className="fa-solid fa-dungeon"></i></div>
          <div className={styles.catName}>던전</div>
        </div>
        <div className={styles.catItem}>
          <div className={styles.catIcon}><i className="fa-solid fa-scroll"></i></div>
          <div className={styles.catName}>메인스트림</div>
        </div>
        <div className={styles.catItem}>
          <div className={styles.catIcon}><i className="fa-solid fa-hammer"></i></div>
          <div className={styles.catName}>생활</div>
        </div>
        <div className={styles.catItem}>
          <div className={styles.catIcon}><i className="fa-solid fa-shirt"></i></div>
          <div className={styles.catName}>의장</div>
        </div>
        <div className={styles.catItem}>
          <div className={styles.catIcon}><i className="fa-solid fa-coins"></i></div>
          <div className={styles.catName}>돈벌기</div>
        </div>
        <div className={styles.catItem}>
          <div className={styles.catIcon}><i className="fa-solid fa-paw"></i></div>
          <div className={styles.catName}>펫/파트너</div>
        </div>
      </div>

      {/* 3. Featured Guide (Hero) */}
      <div className={styles.featuredHero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroInfo}>
          <div className={styles.heroBadge}>Editor's Choice</div>
          <div className={styles.heroText}>이번 주말, 룬다 상급 던전을<br />돌아야 하는 이유</div>
          <div className={styles.heroSub}>붕괴된 마력의 정수 드랍률 2배 이벤트 진행 중!</div>
        </div>
      </div>

      {/* 6. Real-time User Tips (List View) */}
      <section className={styles.scrollSection}>
        <div className={styles.sectionTitle}>
          <span>실시간 유저 팁 💡</span>
          <Link href="/guide/tips" className={styles.viewAll}>모두 보기</Link>
        </div>
        <div className={styles.listGroup}>
          {tips.map((tip) => (
            <div key={tip.id} className={styles.listItem}>
              <div className={styles.listIcon} style={{background: tip.bg, color: tip.color}}>
                <i className={`fa-solid ${tip.icon}`}></i>
              </div>
              <div className={styles.listContent}>
                <div className={styles.listTitle}>{tip.title}</div>
                <div className={styles.listDesc}>{tip.desc}</div>
              </div>
              <div className={styles.listMeta}>{tip.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Horizontal Scroll (Topic 1: Dungeon) */}
      <section className={styles.scrollSection}>
        <div className={styles.sectionTitle}>
          <span>던전 완전 정복 ⚔️</span>
          <Link href="/guide/tips?category=전투/던전" className={styles.viewAll}>모두 보기</Link>
        </div>
        <div className={styles.scrollContainer}>
          {dungeonGuides.map((card) => (
            <div key={card.id} className={styles.guideCard}>
              <div className={styles.cardThumb} style={{backgroundImage: `url(${card.thumb})`}}></div>
              <div className={styles.cardBody}>
                <div className={styles.cardCat}>{card.cat}</div>
                <div className={styles.cardT}>{card.title}</div>
                <div className={styles.cardAuth}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author}`} alt="Author" />
                  <span>{card.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Horizontal Scroll (Topic 2: Life) */}
      <section className={styles.scrollSection}>
        <div className={styles.sectionTitle}>
          <span>생활 / 알바 🌿</span>
          <Link href="/guide/tips?category=생활/알바" className={styles.viewAll}>전체보기</Link>
        </div>
        <div className={styles.scrollContainer}>
          {lifeGuides.map((card) => (
            <div key={card.id} className={styles.guideCard}>
              <div className={styles.cardThumb} style={{backgroundImage: `url(${card.thumb})`}}></div>
              <div className={styles.cardBody}>
                <div className={styles.cardCat}>{card.cat}</div>
                <div className={styles.cardT}>{card.title}</div>
                <div className={styles.cardAuth}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author}`} alt="Author" />
                  <span>{card.author}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
