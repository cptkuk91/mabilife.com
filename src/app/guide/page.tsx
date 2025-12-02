"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GuidePage() {
  const router = useRouter();

  return (
    <>


      <div className="page-container">
        
        {/* Header */}
        <header className="hub-header">
          <div>
            <div className="hub-title">공략 라이브러리</div>
            <div className="hub-subtitle">에린 생활의 모든 지혜를 모았습니다.</div>
          </div>
          <button className="write-btn" onClick={() => router.push('/guide/write')}>
            <i className="fa-solid fa-pen-to-square" style={{marginRight: '6px'}}></i>
            공략 작성
          </button>
        </header>

        {/* 1. Categories (Quick Access) */}
        <section className="category-grid">
          <div className="cat-item">
            <div className="cat-icon"><i className="fa-solid fa-graduation-cap"></i></div>
            <span className="cat-name">초보 가이드</span>
          </div>
          <div className="cat-item">
            <div className="cat-icon"><i className="fa-solid fa-khanda"></i></div>
            <span className="cat-name">전투 / 던전</span>
          </div>
          <div className="cat-item">
            <div className="cat-icon"><i className="fa-solid fa-scroll"></i></div>
            <span className="cat-name">메인스트림</span>
          </div>
          <div className="cat-item">
            <div className="cat-icon"><i className="fa-solid fa-hammer"></i></div>
            <span className="cat-name">생활 / 알바</span>
          </div>
          <div className="cat-item">
            <div className="cat-icon"><i className="fa-solid fa-shirt"></i></div>
            <span className="cat-name">패션 / 뷰티</span>
          </div>
          <div className="cat-item">
            <div className="cat-icon"><i className="fa-solid fa-coins"></i></div>
            <span className="cat-name">돈벌기 팁</span>
          </div>
        </section>

        {/* 2. Featured Hero (Curated) */}
        <section className="featured-hero">
          <div className="hero-bg"></div>
          <div className="hero-info">
            <div className="hero-badge">EDITOR'S CHOICE</div>
            <div className="hero-text">이번 주말, 환생하기 전<br />꼭 확인해야 할 체크리스트</div>
            <div className="hero-sub">AP 효율 극대화하는 방법부터 스킬 수련 팁까지</div>
          </div>
        </section>

        {/* 3. Recent Tips (List Style) - Moved Up */}
        <section className="scroll-section">
          <div className="section-title">
            <span>실시간 유저 팁</span>
            <Link href="/guide/tips" className="view-all">모두 보기</Link>
          </div>
          <div className="list-group">
            <div className="list-item">
              <div className="list-icon"><i className="fa-solid fa-lightbulb"></i></div>
              <div className="list-content">
                <div className="list-title">오늘의 요일 효과 확인하세요 (화요일)</div>
                <div className="list-desc">던전 아이템 드랍률 증가 효과가 있으니 오늘은 룬상하 달리세요.</div>
              </div>
              <div className="list-meta">5분 전</div>
            </div>
            <div className="list-item">
              <div className="list-icon" style={{background:'#FFF0F5', color:'#FF2D55'}}><i className="fa-solid fa-palette"></i></div>
              <div className="list-content">
                <div className="list-title">지향색 코드 공유합니다 (리블/리화)</div>
                <div className="list-desc">RGB 값 정확하게 찍어왔습니다. 염색 앰플 참고하세요.</div>
              </div>
              <div className="list-meta">20분 전</div>
            </div>
            <div className="list-item">
              <div className="list-icon" style={{background:'#F0F8FF', color:'#4682B4'}}><i className="fa-solid fa-bug"></i></div>
              <div className="list-content">
                <div className="list-title">간헐적으로 펫 소환 안되는 버그 해결법</div>
                <div className="list-desc">채널 이동하면 풀리긴 하는데, 임시 방편으로 재접속 추천합니다.</div>
              </div>
              <div className="list-meta">1시간 전</div>
            </div>
          </div>
        </section>

        {/* 4. Horizontal Scroll (Topic 1: Combat) */}
        <section className="scroll-section">
          <div className="section-title">
            던전 완전 정복 <Link href="/guide/tips?category=전투/던전" className="view-all">모두 보기</Link>
          </div>
          <div className="scroll-container">
            {/* Card 1 */}
            <div className="guide-card">
              <div className="card-thumb" style={{backgroundImage: 'url(https://picsum.photos/id/1015/400/300)'}}></div>
              <div className="card-body">
                <span className="card-cat">던전 공략</span>
                <div className="card-t">알비 상급 던전 솔플 가이드</div>
                <div className="card-auth"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" /> 류트 · 굇수</div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="guide-card">
              <div className="card-thumb" style={{backgroundImage: 'url(https://picsum.photos/id/1016/400/300)'}}></div>
              <div className="card-body">
                <span className="card-cat">레이드</span>
                <div className="card-t">글라스 기브넨 패턴 완벽 분석</div>
                <div className="card-auth"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" alt="User" /> 만돌린 · 레이드장</div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="guide-card">
              <div className="card-thumb" style={{backgroundImage: 'url(https://picsum.photos/id/1018/400/300)'}}></div>
              <div className="card-body">
                <span className="card-cat">G1 여신강림</span>
                <div className="card-t">저세상 가는 방법 (바올 던전)</div>
                <div className="card-auth"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Zack" alt="User" /> 하프 · 올드비</div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Horizontal Scroll (Topic 2: Life) */}
        <section className="scroll-section">
          <div className="section-title">
            <span>생활 / 알바 🌿</span>
            <Link href="/guide/tips?category=생활/알바" className="view-all">전체보기</Link>
          </div>
          <div className="scroll-container">
            {/* Card 1 */}
            <div className="guide-card">
              <div className="card-thumb" style={{backgroundImage: 'url(https://picsum.photos/id/1025/400/300)'}}></div>
              <div className="card-body">
                <span className="card-cat">아르바이트</span>
                <div className="card-t">축복의 포션 알바 루트 최적화</div>
                <div className="card-auth"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Molly" alt="User" /> 울프 · 성당알바</div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="guide-card">
              <div className="card-thumb" style={{backgroundImage: 'url(https://picsum.photos/id/106/400/300)'}}></div>
              <div className="card-body">
                <span className="card-cat">제작</span>
                <div className="card-t">블랙스미스 1랭크 찍는 비용 정리</div>
                <div className="card-auth"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sam" alt="User" /> 류트 · 대장장이</div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="guide-card">
              <div className="card-thumb" style={{backgroundImage: 'url(https://picsum.photos/id/292/400/300)'}}></div>
              <div className="card-body">
                <span className="card-cat">요리</span>
                <div className="card-t">페스티벌 푸드 레시피 모음</div>
                <div className="card-auth"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Cook" alt="User" /> 만돌린 · 요리사</div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
