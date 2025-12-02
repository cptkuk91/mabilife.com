"use client";

import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();

  return (
    <>
      {/* Nav */}
      <nav className="global-nav">
        <div className="nav-content">
          <a href="/" className="nav-logo"><i className="fa-solid fa-leaf"></i> Mabi Life</a>
          <div style={{fontSize:'14px', color:'var(--accent)', cursor: 'pointer'}} onClick={() => router.back()}>닫기</div>
        </div>
      </nav>

      {/* Search Input Hero */}
      <section className="search-hero">
        <div className="search-input-wrapper">
          <input type="text" className="search-input" defaultValue="글라스 기브넨" autoFocus />
          <i className="fa-solid fa-circle-xmark clear-btn"></i>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="filter-bar">
        <div className="filter-item active">통합 검색</div>
        <div className="filter-item">공략</div>
        <div className="filter-item">아이템 (DB)</div>
        <div className="filter-item">유저</div>
        <div className="filter-item">Q&A</div>
      </div>

      {/* Search Results Grid */}
      <main className="result-grid">

        {/* 1. Top Hit (The "Wiki" Card) */}
        {/* 검색어와 가장 일치하는 결과가 DB처럼 최상단에 뜹니다 */}
        <div className="top-hit-card">
          <div className="top-hit-image" style={{backgroundImage: "url('https://picsum.photos/id/1025/800/600')"}}></div>
          <div className="top-hit-content">
            <span className="badge">BOSS INFO</span>
            <h1 className="top-hit-title">글라스 기브넨</h1>
            <p className="top-hit-desc">
              G1 여신강림의 최종 보스이자, 이세계의 마수입니다. 
              던바튼 북서쪽의 '저승' 지역, 바올 던전 마지막 층에서 등장합니다.
              주요 드랍 아이템으로는 '글라스 기브넨의 뼈'가 있습니다.
            </p>
            <div className="stat-row">
              <div className="stat-item">
                <h4>출현 지역</h4>
                <p>바올 던전</p>
              </div>
              <div className="stat-item">
                <h4>난이도</h4>
                <p>Hard</p>
              </div>
              <div className="stat-item">
                <h4>속성</h4>
                <p>무속성</p>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Strategy Section */}
        <div className="section-header">
          관련 공략
          <span className="see-all">더 보기 <i className="fa-solid fa-chevron-right"></i></span>
        </div>

        <article className="card col-span-4">
          <div className="result-meta">공략 • 전투</div>
          <div className="result-title">글기 솔플 5분 컷 영상 (전사)</div>
          <div className="result-snippet">스매시 타이밍만 잘 맞추면 쉽습니다. 패턴 분석해드림. 준비물은 물약 넉넉히...</div>
          <div className="user-row">
            <div className="user-avatar"></div>
            <span className="user-name">칼잡이</span>
          </div>
        </article>

        <article className="card col-span-4">
          <div className="result-meta">공략 • 파티</div>
          <div className="result-title">초보자용 4인 파티 추천 조합</div>
          <div className="result-snippet">탱커1, 힐러1, 딜러2 조합이 가장 안정적입니다. 특히 힐러의 마나 관리가 중요합니다.</div>
          <div className="user-row">
            <div className="user-avatar"></div>
            <span className="user-name">파티장</span>
          </div>
        </article>

        <article className="card col-span-4">
          <div className="result-meta">팁 • 버그</div>
          <div className="result-title">가끔 공중에 껴서 안 내려올 때 해결법</div>
          <div className="result-snippet">로그아웃 했다가 재접속 하거나, 펫을 소환해서 어그로를 끄세요.</div>
          <div className="user-row">
            <div className="user-avatar"></div>
            <span className="user-name">버그헌터</span>
          </div>
        </article>

        {/* 3. Item & Drop Section (User Generated DB) */}
        <div className="section-header">
          아이템 & 득템 제보 (#글라스기브넨)
        </div>

        <article className="card col-span-6">
          <div className="result-meta" style={{color:'#FF2D55'}}>🔥 득템인증</div>
          <div className="result-title">글라스 기브넨의 뼈 드랍 확률?</div>
          <div className="result-snippet">오늘 10릴 돌아서 딱 하나 먹었네요. 경매장 시세 50만 골드 정도 하는 듯.</div>
          {/* Item Image Preview */}
          <div style={{marginTop:'10px', height:'100px', background:'#f9f9f9', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc'}}>
            <i className="fa-solid fa-bone"></i> &nbsp; Item Image
          </div>
        </article>

        <article className="card col-span-6">
          <div className="result-meta">매입/매매</div>
          <div className="result-title">글기 뼈 삽니다 (류트 서버)</div>
          <div className="result-snippet">개당 45숲에 무한 매입합니다. 친추 주세요. 대량 우대해드립니다.</div>
        </article>

      </main>
    </>
  );
}
