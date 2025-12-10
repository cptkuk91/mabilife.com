"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./home.module.css";
import EventList from "@/components/EventList";
import YouTuberSection from "@/components/YouTuberSection";
import { getGuides, getGuideById } from "@/actions/guide";
import { getPosts } from "@/actions/post";
import { fetchMabinogiMobileYouTubers, YouTubeChannel } from "@/actions/youtube";

// Editor's Choice 고정 ID
const EDITORS_CHOICE_ID = "692fbf2c9e1c94a15a09f963";

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

// 카테고리별 색상
const categoryColors: Record<string, string> = {
  "초보 가이드": "#0071E3",
  "전투/던전": "#F44336",
  "메인스트림": "#FF9800",
  "생활/알바": "#00BA7C",
  "패션/뷰티": "#9C27B0",
  "돈벌기": "#FF9500",
  "질문": "#FF9500",
  "정보": "#0071E3",
  "잡담": "#666",
};

// Placeholder 이미지
const placeholderImages = [
  '/assets/placeholder/mm1.webp',
  '/assets/placeholder/mm2.jpg',
  '/assets/placeholder/mm3.jpg',
];

const getPlaceholderImage = (index: number) => {
  return placeholderImages[index % placeholderImages.length];
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

export default function HomeClient({ initialStats }: { initialStats?: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchGuides, setSearchGuides] = useState<any[]>([]);
  const [searchPosts, setSearchPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 피드용 데이터
  const [feedGuides, setFeedGuides] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [editorsChoice, setEditorsChoice] = useState<any>(null);
  const [youtubers, setYoutubers] = useState<YouTubeChannel[] | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);

  // 피드 데이터 로드
  useEffect(() => {
    loadFeedData();
  }, []);

  const loadFeedData = async () => {
    setFeedLoading(true);
    const [guideResult, postResult, editorsChoiceResult, youtubersResult] = await Promise.all([
      getGuides({ limit: 4, sort: 'latest' }),
      getPosts(1, 4),
      getGuideById(EDITORS_CHOICE_ID),
      fetchMabinogiMobileYouTubers()
    ]);

    if (guideResult.success && guideResult.data) {
      setFeedGuides(guideResult.data as any[]);
    }
    if (postResult.success) {
      setFeedPosts(postResult.posts);
    }
    if (editorsChoiceResult.success && editorsChoiceResult.data) {
      setEditorsChoice(editorsChoiceResult.data);
    }
    setYoutubers(youtubersResult);
    setFeedLoading(false);
  };

  // 검색
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchGuides([]);
      setSearchPosts([]);
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
      setSearchGuides(guideResult.data as any[]);
    }
    if (postResult.success) {
      setSearchPosts(postResult.posts);
    }

    setLoading(false);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchGuides([]);
    setSearchPosts([]);
    setIsSearching(false);
  };

  const totalResults = searchGuides.length + searchPosts.length;

  // 피드 아이템들 조합 (공략 + 커뮤니티 섞기)
  const feedItems: any[] = [];
  const maxItems = Math.max(feedGuides.length, feedPosts.length);
  for (let i = 0; i < maxItems; i++) {
    if (feedGuides[i]) feedItems.push({ ...feedGuides[i], _type: 'guide' });
    if (feedPosts[i]) feedItems.push({ ...feedPosts[i], _type: 'post' });
  }

  return (
    <>
      {/* Hero Section */}
      <header className={styles.hero}>
        <h1>나만의 판타지 라이프.</h1>
        <p>에린에서 시작된 소중한 인연.<br />오늘 당신의 모험은 어떠셨나요?</p>

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

        {/* Quick Tags */}
        <div className={styles.quickTags}>
          <Link href="/search?q=초보가이드" className={styles.tagPill}>#초보가이드</Link>
          <Link href="/search?q=던전공략" className={styles.tagPill}>#던전공략</Link>
          <Link href="/search?q=생활스킬" className={styles.tagPill}>#생활스킬</Link>
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
              {searchGuides.length > 0 && (
                <div className={styles.resultSection}>
                  <div className={styles.sectionHeader}>
                    <span>공략</span>
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={styles.seeAll}>
                      전체보기
                    </Link>
                  </div>
                  <div className={styles.resultList}>
                    {searchGuides.map((guide) => {
                      const icon = categoryIcons[guide.category] || "fa-lightbulb";
                      return (
                        <Link href={`/guide/${guide._id}`} key={guide._id} className={styles.resultItem}>
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
              {searchPosts.length > 0 && (
                <div className={styles.resultSection}>
                  <div className={styles.sectionHeader}>
                    <span>커뮤니티</span>
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className={styles.seeAll}>
                      전체보기
                    </Link>
                  </div>
                  <div className={styles.resultList}>
                    {searchPosts.map((post) => {
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
          {/* Main Feed (Bento Grid Layout) */}
          <section className={styles.dashboardGrid}>

            {/* Card 1: Editor's Choice (Large) */}
            {editorsChoice && (
              <Link href={`/guide/${editorsChoice._id}`} className={`${styles.card} ${styles.colSpan8} ${styles.rowSpan2} ${styles.imgCard}`} style={{backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.85)), url('${editorsChoice.thumbnail || getPlaceholderImage(0)}')`}}>
                <div className={styles.cardCategory}>Editor's Choice</div>
                <div className={styles.cardTitle}>{editorsChoice.title}</div>
                <div className={styles.cardDesc}>{extractText(editorsChoice.content, 80)}</div>
                <div className={styles.cardFooter} style={{borderTopColor: 'rgba(255,255,255,0.2)'}}>
                  <img src={editorsChoice.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editorsChoice.author?.id}`} className={styles.avatar} alt="User Avatar" />
                  <span className={styles.userInfo} style={{color:'white'}}>{editorsChoice.author?.name || '익명'}</span>
                  <span className={styles.likes} style={{color:'white'}}><i className="fa-solid fa-heart"></i> {editorsChoice.likes || 0}</span>
                </div>
              </Link>
            )}

            {feedLoading ? (
              <div className={`${styles.card} ${styles.colSpan4}`}>
                <div className={styles.cardDesc}>로딩 중...</div>
              </div>
            ) : (
              <>
                {/* 실제 데이터 카드들 */}
                {feedItems.slice(0, 4).map((item, index) => {
                  const isGuide = item._type === 'guide';
                  const category = isGuide ? item.category : item.type;
                  const color = categoryColors[category] || '#666';
                  const title = isGuide ? item.title : extractText(item.content, 40);
                  const desc = extractText(isGuide ? item.content : item.content, 60);
                  const link = isGuide ? `/guide/${item._id}` : `/community/${item._id}`;
                  const authorName = item.author?.name || '익명';
                  const authorImage = item.author?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author?.id || index}`;
                  const likes = isGuide ? (item.likes || 0) : (item.likes || 0);
                  const comments = !isGuide ? (item.commentCount || 0) : null;

                  // 그리드 배치: 0,1은 colSpan4, 2,3은 colSpan6
                  const spanClass = index < 2 ? styles.colSpan4 : styles.colSpan6;

                  return (
                    <Link href={link} key={item._id} className={`${styles.card} ${spanClass}`}>
                      <div className={styles.cardCategory} style={{color}}>{category}</div>
                      <div className={styles.cardTitle} style={{fontSize: index < 2 ? '18px' : '20px'}}>{title}</div>
                      <div className={styles.cardDesc}>{desc}</div>
                      <div className={styles.cardFooter}>
                        <img src={authorImage} className={styles.avatar} alt="User Avatar" />
                        <span className={styles.userInfo}>{authorName}</span>
                        {comments !== null ? (
                          <span className={styles.likes}><i className="fa-regular fa-comment"></i> {comments}</span>
                        ) : (
                          <span className={styles.likes}><i className="fa-solid fa-heart"></i> {likes}</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            )}

          </section>

          {/* Ranking / Job Recommendation Section */}
          {initialStats && initialStats.jobStats && (
            <section className={styles.sectionContainer}>
                <div className={styles.sectionHeader}>
                    <h2>🏆 랭커가 선택한 직업은?</h2>
                    <Link href="/statistics" className={styles.seeAll}>
                        더보기 <i className="fa-solid fa-chevron-right"></i>
                    </Link>
                </div>
                
                <div className={styles.rankingGrid}>
                     {initialStats.jobStats.slice(0, 3).map((stat: any, index: number) => (
                        <div key={index} className={`${styles.rankingCard} ${index === 0 ? styles.rankingFirst : ''}`}>
                            <div className={styles.rankingBadge}>{index + 1}위</div>
                            <div className={styles.rankingContent}>
                                <div className={styles.rankingName}>{stat.name}</div>
                                <div className={styles.rankingCount}>{stat.count}명 선택</div>
                            </div>
                            {index === 0 && <i className="fa-solid fa-crown" style={{ color: '#FFD700', fontSize: '24px', position: 'absolute', top: '16px', right: '16px' }}></i>}
                        </div>
                     ))}
                </div>
            </section>
          )}

          {/* YouTuber Section */}
          <YouTuberSection channels={youtubers} />

          {/* Event List */}
          <EventList />
        </>
      )}
    </>
  );
}
