"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getGuides } from "@/actions/guide";
import styles from "./guide.module.css";

// 카테고리별 아이콘 및 색상 매핑
const categoryStyles: Record<string, { icon: string; bg: string; color: string }> = {
  "초보 가이드": { icon: "fa-graduation-cap", bg: "#EAF4FF", color: "#0071E3" },
  "전투/던전": { icon: "fa-dungeon", bg: "#FFEBEE", color: "#F44336" },
  "메인스트림": { icon: "fa-book-open", bg: "#FFF3E0", color: "#FF9800" },
  "생활/알바": { icon: "fa-hammer", bg: "#E8FAEB", color: "#00BA7C" },
  "패션/뷰티": { icon: "fa-shirt", bg: "#F3E5F5", color: "#9C27B0" },
  "돈벌기": { icon: "fa-sack-dollar", bg: "#FFF8E1", color: "#FF9500" },
};

// 상대적 시간 포맷
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return date.toLocaleDateString();
};

// HTML 태그 제거하여 설명 추출
const extractDescription = (html: string, maxLength: number = 60) => {
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

// Placeholder 이미지 배열
const placeholderImages = [
  '/assets/placeholder/mm1.webp',
  '/assets/placeholder/mm2.jpg',
  '/assets/placeholder/mm3.jpg',
];

// 인덱스에 따른 placeholder 이미지 반환
const getPlaceholderImage = (index: number) => {
  return placeholderImages[index % placeholderImages.length];
};

export default function GuidePage() {
  const router = useRouter();
  const [latestTips, setLatestTips] = useState<any[]>([]);
  const [dungeonGuides, setDungeonGuides] = useState<any[]>([]);
  const [lifeGuides, setLifeGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    setLoading(true);

    // 최신 팁 3개
    const latestResult = await getGuides({ limit: 3, sort: 'latest' });
    if (latestResult.success && latestResult.data) {
      setLatestTips(latestResult.data as any[]);
    }

    // 전투/던전 카테고리 3개
    const dungeonResult = await getGuides({ category: '전투/던전', limit: 3, sort: 'latest' });
    if (dungeonResult.success && dungeonResult.data) {
      setDungeonGuides(dungeonResult.data as any[]);
    }

    // 생활/알바 카테고리 3개
    const lifeResult = await getGuides({ category: '생활/알바', limit: 3, sort: 'latest' });
    if (lifeResult.success && lifeResult.data) {
      setLifeGuides(lifeResult.data as any[]);
    }

    setLoading(false);
  };

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
          {loading ? (
            <div className={styles.loading}>로딩 중...</div>
          ) : latestTips.length === 0 ? (
            <div className={styles.emptyList}>아직 등록된 팁이 없습니다.</div>
          ) : (
            latestTips.map((tip) => {
              const style = categoryStyles[tip.category] || { icon: "fa-lightbulb", bg: "#EAF4FF", color: "#0071E3" };
              return (
                <Link href={`/guide/tips/${tip._id}`} key={tip._id} className={styles.listItem}>
                  {tip.thumbnail ? (
                    <img src={tip.thumbnail} alt="" className={styles.listThumb} />
                  ) : (
                    <div className={styles.listIcon} style={{ background: style.bg, color: style.color }}>
                      <i className={`fa-solid ${style.icon}`}></i>
                    </div>
                  )}
                  <div className={styles.listContent}>
                    <div className={styles.listTitle}>{tip.title}</div>
                    <div className={styles.listDesc}>{extractDescription(tip.content)}</div>
                  </div>
                  <div className={styles.listMeta}>{formatRelativeTime(tip.createdAt)}</div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* 4. Horizontal Scroll (Topic 1: Dungeon) */}
      <section className={styles.scrollSection}>
        <div className={styles.sectionTitle}>
          <span>던전 완전 정복 ⚔️</span>
          <Link href="/guide/tips?category=전투/던전" className={styles.viewAll}>모두 보기</Link>
        </div>
        <div className={styles.scrollContainer}>
          {dungeonGuides.length === 0 ? (
            <div className={styles.emptyScroll}>아직 등록된 공략이 없습니다.</div>
          ) : (
            dungeonGuides.map((card, index) => (
              <Link href={`/guide/tips/${card._id}`} key={card._id} className={styles.guideCard}>
                <div
                  className={styles.cardThumb}
                  style={{ backgroundImage: `url(${card.thumbnail || getPlaceholderImage(index)})` }}
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardCat}>{card.category}</div>
                  <div className={styles.cardT}>{card.title}</div>
                  <div className={styles.cardAuth}>
                    <img src={card.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author?.id}`} alt="Author" />
                    <span>{card.author?.name || '익명'}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 5. Horizontal Scroll (Topic 2: Life) */}
      <section className={styles.scrollSection}>
        <div className={styles.sectionTitle}>
          <span>생활 / 알바 🌿</span>
          <Link href="/guide/tips?category=생활/알바" className={styles.viewAll}>전체보기</Link>
        </div>
        <div className={styles.scrollContainer}>
          {lifeGuides.length === 0 ? (
            <div className={styles.emptyScroll}>아직 등록된 공략이 없습니다.</div>
          ) : (
            lifeGuides.map((card, index) => (
              <Link href={`/guide/tips/${card._id}`} key={card._id} className={styles.guideCard}>
                <div
                  className={styles.cardThumb}
                  style={{ backgroundImage: `url(${card.thumbnail || getPlaceholderImage(index)})` }}
                />
                <div className={styles.cardBody}>
                  <div className={styles.cardCat}>{card.category}</div>
                  <div className={styles.cardT}>{card.title}</div>
                  <div className={styles.cardAuth}>
                    <img src={card.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${card.author?.id}`} alt="Author" />
                    <span>{card.author?.name || '익명'}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

    </div>
  );
}
