"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./home.module.css";
import EventList from "@/components/EventList";
import { getGuides } from "@/actions/guide";
import { getPosts } from "@/actions/post";

// 카테고리별 아이콘 매핑 (모노크롬)
const categoryIcons: Record<string, string> = {
  "초보 가이드": "fa-graduation-cap",
  "전투/던전": "fa-dungeon",
  "메인스트림": "fa-book-open",
  "생활/알바": "fa-hammer",
  "패션/뷰티": "fa-shirt",
  "돈벌기": "fa-sack-dollar",
};

// 게시글 타입별 아이콘
const postTypeIcons: Record<string, string> = {
  "질문": "fa-circle-question",
  "정보": "fa-circle-info",
  "잡담": "fa-comment",
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

// HTML 태그 제거
const extractText = (html: string, maxLength: number = 100) => {
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [guides, setGuides] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setGuides([]);
      setPosts([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setLoading(true);
    setIsSearching(true);

    const [guideResult, postResult] = await Promise.all([
      getGuides({ search: searchQuery, limit: 5 }),
      getPosts(1, 5, undefined, searchQuery)
    ]);

    if (guideResult.success && guideResult.data) {
      setGuides(guideResult.data as any[]);
    }
    if (postResult.success) {
      setPosts(postResult.posts);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setGuides([]);
    setPosts([]);
    setIsSearching(false);
  };

  const totalResults = guides.length + posts.length;

  return (
    <>
      {/* Hero Section */}
      <header className={styles.hero}>
        <h1>나만의 판타지 라이프.</h1>
        <p>에린의 모든 모험가들과 함께 이야기를 만들어가세요.<br />오늘 알게 된 꿀팁은 무엇인가요?</p>

        {/* Search Bar */}
        <div className={styles.writeWrapper}>
          <i className="fa-solid fa-magnifying-glass" style={{color:'#aaa', marginLeft:'5px'}}></i>
          <input
            type="text"
            className={styles.writeInput}
            placeholder="공략, 게시글 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClear}
              style={{background: 'none', border: 'none', cursor: 'pointer', padding: '8px'}}
            >
              <i className="fa-solid fa-circle-xmark" style={{color: '#aaa', fontSize: '16px'}}></i>
            </button>
          )}
        </div>
      </header>

      {/* Search Results */}
      {isSearching ? (
        <section className={styles.searchResults}>
          {/* Search Info */}
          <div className={styles.searchInfo}>
            &quot;{searchQuery}&quot; 검색 결과 {totalResults}건
          </div>

          {loading ? (
            <div className={styles.loading}>검색 중...</div>
          ) : totalResults === 0 ? (
            <div className={styles.emptyState}>
              <i className="fa-solid fa-face-sad-tear"></i>
              <p>검색 결과가 없습니다</p>
            </div>
          ) : (
            <>
              {/* 공략 결과 */}
              {guides.length > 0 && (
                <div className={styles.resultSection}>
                  <div className={styles.sectionHeader}>
                    <span>공략</span>
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={styles.seeAll}>
                      전체보기
                    </Link>
                  </div>
                  <div className={styles.resultList}>
                    {guides.map((guide) => {
                      const icon = categoryIcons[guide.category] || "fa-lightbulb";
                      return (
                        <Link href={`/guide/tips/${guide._id}`} key={guide._id} className={styles.resultItem}>
                          <div className={styles.resultIcon}>
                            <i className={`fa-solid ${icon}`}></i>
                          </div>
                          <div className={styles.resultContent}>
                            <div className={styles.resultMeta}>
                              <span className={styles.resultCategory}>{guide.category}</span>
                              <span className={styles.resultTime}>{formatRelativeTime(guide.createdAt)}</span>
                            </div>
                            <div className={styles.resultTitle}>{guide.title}</div>
                            <div className={styles.resultStats}>
                              <span><i className="fa-regular fa-eye"></i> {guide.views || 0}</span>
                              <span><i className="fa-regular fa-heart"></i> {guide.likes || 0}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 커뮤니티 결과 */}
              {posts.length > 0 && (
                <div className={styles.resultSection}>
                  <div className={styles.sectionHeader}>
                    <span>커뮤니티</span>
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={styles.seeAll}>
                      전체보기
                    </Link>
                  </div>
                  <div className={styles.resultList}>
                    {posts.map((post) => {
                      const icon = postTypeIcons[post.type] || "fa-comment";
                      return (
                        <Link href={`/community/${post._id}`} key={post._id} className={styles.resultItem}>
                          <div className={styles.resultIcon}>
                            <i className={`fa-solid ${icon}`}></i>
                          </div>
                          <div className={styles.resultContent}>
                            <div className={styles.resultMeta}>
                              <span className={styles.resultCategory}>{post.type}</span>
                              <span className={styles.resultTime}>{formatRelativeTime(post.createdAt)}</span>
                            </div>
                            <div className={styles.resultTitle}>{extractText(post.content, 50)}</div>
                            <div className={styles.resultStats}>
                              <span><i className="fa-regular fa-eye"></i> {post.viewCount || 0}</span>
                              <span><i className="fa-regular fa-heart"></i> {post.likes || 0}</span>
                              <span><i className="fa-regular fa-comment"></i> {post.commentCount || 0}</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      ) : (
        <>
          {/* Tags Filter */}
          <div className={styles.tagsBar}>
            <div className={`${styles.tagPill} ${styles.active}`}>전체</div>
            <div className={styles.tagPill}>#초보자가이드</div>
            <div className={styles.tagPill}>#전투공략</div>
            <div className={styles.tagPill}>#생활스킬</div>
            <div className={styles.tagPill}>#득템인증</div>
            <div className={styles.tagPill}>#코디자랑</div>
          </div>

          {/* Main Feed (Bento Grid Layout) */}
          <section className={styles.dashboardGrid}>

            {/* Card 1: Featured Strategy (Large) */}
            <article className={`${styles.card} ${styles.colSpan8} ${styles.rowSpan2} ${styles.imgCard}`} style={{backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url('https://picsum.photos/id/122/800/600')"}}>
              <div className={styles.cardCategory}>Editor's Choice</div>
              <div className={styles.cardTitle}>G1 여신강림: 글라스 기브넨<br />완벽 공략 가이드</div>
              <div className={styles.cardDesc}>메인스트림의 마지막 관문, 글라스 기브넨의 패턴 분석과 추천 장비 세팅을 확인하세요.</div>
              <div className={styles.cardFooter} style={{borderTopColor: 'rgba(255,255,255,0.2)'}}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" className={styles.avatar} alt="User Avatar" />
                <span className={styles.userInfo} style={{color:'white'}}>GM나오</span>
                <span className={styles.likes} style={{color:'white'}}><i className="fa-solid fa-heart"></i> 1,240</span>
              </div>
            </article>

            {/* Card 2: Q&A (Small) */}
            <article className={`${styles.card} ${styles.colSpan4}`}>
              <div className={styles.cardCategory} style={{color:'#FF9500'}}>Q&A</div>
              <div className={styles.cardTitle}>정령 무기 질문이요!</div>
              <div className={styles.cardDesc}>사회 레벨 20 찍으려면 보석 어떤거 먹이는게 제일 가성비 좋나요?</div>
              <div className={styles.cardFooter}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Quser" className={styles.avatar} alt="User Avatar" />
                <span className={styles.userInfo}>뉴비1호</span>
                <span className={styles.likes}><i className="fa-regular fa-comment"></i> 5</span>
              </div>
            </article>

            {/* Card 3: Item DB (Small - Image Focus) */}
            <article className={`${styles.card} ${styles.colSpan4}`}>
              <div className={styles.cardCategory} style={{color:'#30D158'}}>득템 제보</div>
              <div className={styles.cardTitle} style={{fontSize: '20px'}}>켈틱 로열 나이트 소드</div>
              <div className={styles.cardDesc}>와.. 알상하에서 드랍됐습니다. 옵션 상급이네요.</div>
              {/* Item Image Placeholder */}
              <div style={{marginTop:'10px', height:'120px', background:'#f0f0f0', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <i className="fa-solid fa-khanda" style={{fontSize:'40px', color:'#ccc'}}></i>
              </div>
              <div className={styles.cardFooter}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucker" className={styles.avatar} alt="User Avatar" />
                <span className={styles.userInfo}>될놈될</span>
              </div>
            </article>

            {/* Card 4: Normal Post (Wide) */}
            <article className={`${styles.card} ${styles.colSpan6}`}>
              <div className={styles.cardCategory} style={{color:'#AF52DE'}}>팁 & 노하우</div>
              <div className={styles.cardTitle}>양털 깎기 매크로 없이 하는 법</div>
              <div className={styles.cardDesc}>채집 속도 개조된 단검 두 자루 끼고 풍년가 불면 생각보다 빠릅니다. 영상 첨부합니다.</div>
              <div className={styles.cardFooter}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sheep" className={styles.avatar} alt="User Avatar" />
                <span className={styles.userInfo}>양치기소년</span>
                <span className={styles.likes}><i className="fa-solid fa-heart"></i> 84</span>
              </div>
            </article>

            {/* Card 5: Fashion (Wide) */}
            <article className={`${styles.card} ${styles.colSpan6}`}>
              <div className={styles.cardCategory} style={{color:'#FF2D55'}}>패션 / 코디</div>
              <div className={styles.cardTitle}>오늘의 지향색: 리블 & 리화</div>
              <div className={styles.cardDesc}>역시 마비노기의 근본은 리얼 블랙과 리얼 화이트죠. 이번 키트 의상 염색 공유합니다.</div>
              <div className={styles.cardFooter}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Fashion" className={styles.avatar} alt="User Avatar" />
                <span className={styles.userInfo}>패션리더</span>
                <span className={styles.likes}><i className="fa-solid fa-heart"></i> 320</span>
              </div>
            </article>

          </section>

          {/* Event List */}
          <EventList />
        </>
      )}
    </>
  );
}
