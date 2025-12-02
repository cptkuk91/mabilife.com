"use client";

import { useRouter } from "next/navigation";

export default function QnAPage() {
  const router = useRouter();

  return (
    <>
      {/* Nav */}
      <nav className="global-nav">
        <div className="nav-content">
          <a href="/" className="nav-logo"><i className="fa-solid fa-leaf"></i> Mabi Life</a>
          <div className="nav-menu">
            <a href="/">홈</a>
            <a href="/guide">공략</a>
            <a href="/qna" className="active">Q&A</a>
            <a href="#">광장</a>
          </div>
          <div style={{width:'24px'}}></div>
        </div>
      </nav>

      <div className="layout-wrapper">
        
        {/* LEFT: Feed Section */}
        <main className="feed-section">
          
          {/* 1. HEADER (Moved Above Writing) */}
          {/* 사용자는 들어오자마자 검색과 필터를 먼저 보게 됩니다. */}
          <div className="feed-header-card">
            <div className="header-top">
              <div className="header-title">Q&A 게시판</div>
              {/* 글쓰기 기능은 버튼으로 최소화 */}
              <button className="ask-btn-main">
                <i className="fa-solid fa-pen"></i> 질문하기
              </button>
            </div>

            <div className="header-search">
              <i className="fa-solid fa-magnifying-glass" style={{color:'#888'}}></i>
              <input type="text" placeholder="궁금한 내용을 먼저 검색해보세요 (예: 글라스 기브넨, 시세)" />
            </div>

            <div className="filter-tabs">
              <div className="tab-item active">추천</div>
              <div className="tab-item">최신</div>
              <div className="tab-item">해결됨</div>
              <div className="tab-item">미해결</div>
            </div>
          </div>

          {/* 2. Feed Items */}
          
          {/* Feed Item 1 */}
          <article className="thread-card">
            <div className="post-part">
              <div className="avatar-col">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Q1" className="user-avatar" alt="User Avatar" />
                <div className="thread-line"></div>
              </div>
              <div className="content-col">
                <div className="header-row">
                  <div><span className="user-name">초보밀레시안</span> <span className="user-id">@newbie · 15분</span></div>
                  <i className="fa-solid fa-ellipsis" style={{color:'#aaa'}}></i>
                </div>
                <span className="q-badge">#육성질문</span>
                <div className="post-text">
                  정령 무기 사회 레벨 20 찍는데 보석 말고 다른 효율 좋은 아이템 있나요? <br />
                  다이아몬드는 너무 비싸서 부담돼요 ㅠㅠ
                </div>
                <div className="action-row">
                  <span><i className="fa-regular fa-comment"></i> 3</span>
                  <span><i className="fa-regular fa-heart"></i> 5</span>
                </div>
              </div>
            </div>
            <div className="answer-part">
              <div className="avatar-col">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A1" className="answer-avatar" alt="Answer Avatar" />
              </div>
              <div className="content-col">
                <div className="best-answer-box">
                  <div className="solved-badge"><i className="fa-solid fa-check"></i> 채택</div>
                  <div className="header-row"><span className="user-name">마비박사</span></div>
                  <div className="post-text" style={{fontSize:'15px', marginBottom:0}}>
                    '고스트의 체액' 추천드립니다! 경매장에서 개당 2천골드 정도로 매우 저렴합니다.
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Feed Item 2 */}
          <article className="thread-card">
            <div className="post-part">
              <div className="avatar-col">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Q2" className="user-avatar" alt="User Avatar" />
                {/* Unsolved: No line */}
              </div>
              <div className="content-col">
                <div className="header-row">
                  <div><span className="user-name">던전길치</span> <span className="user-id">@lost · 1시간</span></div>
                </div>
                <span className="q-badge" style={{background:'#FFF4E5', color:'#FF9500'}}>#G3공략</span>
                <div className="post-text">
                  바올 던전 잠입 퀘스트에서 구슬 치고 나서 인식을 못 푸는데 팁 좀 주세요.
                </div>
                <div className="action-row">
                  <span><i className="fa-regular fa-comment"></i> 0</span>
                  <span><i className="fa-regular fa-heart"></i> 2</span>
                </div>
              </div>
            </div>
            <div className="answer-part">
              <div style={{fontSize:'13px', color:'#aaa', paddingLeft:'60px'}}>
                <i className="fa-solid fa-spinner"></i> 답변을 기다리고 있습니다...
              </div>
            </div>
          </article>

        </main>

        {/* RIGHT: Sticky Sidebar */}
        <aside className="sidebar-section">
          <div className="widget-card">
            <div className="widget-title">이번 주 지식인 🏆</div>
            <div className="rank-item">
              <div className="rank-badge gold">1</div>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Master" style={{width:'40px', borderRadius:'50%'}} alt="Rank 1" />
              <div style={{flex:1, marginLeft:'10px'}}>
                <span className="rank-name">마비박사</span>
                <div className="rank-score">채택 45회</div>
              </div>
            </div>
            <div className="rank-item">
              <div className="rank-badge" style={{background:'#C0C0C0', color:'#555'}}>2</div>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Help" style={{width:'40px', borderRadius:'50%'}} alt="Rank 2" />
              <div style={{flex:1, marginLeft:'10px'}}>
                <span className="rank-name">친절한시민</span>
                <div className="rank-score">채택 32회</div>
              </div>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-title">실시간 인기 태그</div>
            <div className="tag-cloud">
              <span className="tag-pill-qa">#초보자가이드</span>
              <span className="tag-pill-qa">#돈벌기</span>
              <span className="tag-pill-qa">#G1공략</span>
              <span className="tag-pill-qa">#정령무기</span>
            </div>
          </div>
        </aside>

      </div>
    </>
  );
}
