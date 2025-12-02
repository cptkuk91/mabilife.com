"use client";

import { useRouter } from "next/navigation";

export default function CommunityPage() {
  const router = useRouter();

  return (
    <>


      <div className="layout-wrapper">
        
        {/* Feed Column */}
        <main className="feed-section">
          
          {/* 1. Universal Write Box */}
          <div className="write-card">
            <div className="write-top">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Me" className="my-avatar" alt="My Avatar" />
              <textarea className="write-input" rows={2} placeholder="무슨 생각을 하고 계신가요?"></textarea>
            </div>
            <div className="write-tools">
              <div className="type-selector">
                {/* 토글로 게시물 성격 결정 */}
                <button className="type-btn active">💬 잡담</button>
                <button className="type-btn q-mode">❓ 질문</button>
                <button className="type-btn">💡 정보/팁</button>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                <i className="fa-regular fa-image" style={{color:'var(--accent)', cursor:'pointer'}}></i>
                <button className="post-btn">게시</button>
              </div>
            </div>
          </div>

          {/* 2. Filter Tabs (필수!) */}
          <div className="feed-tabs">
            <div className="tab active">전체</div>
            <div className="tab">💬 잡담</div>
            <div className="tab">❓ Q&A</div>
            <div className="tab">💡 정보</div>
          </div>

          {/* Feed Item 1: Q&A (Solved) */}
          <article className="feed-card">
            <div className="card-header">
              <div className="user-meta">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Q1" className="u-avatar" alt="User Avatar" />
                <div className="u-info">
                  <span className="u-name">뉴비입니다</span>
                  <span className="u-time">10분 전</span>
                </div>
              </div>
              {/* Status Badge */}
              <div className="badge solved"><i className="fa-solid fa-check"></i> 해결됨</div>
            </div>
            <div className="post-content">
              <span style={{color:'var(--warning)', fontWeight:700}}>[질문]</span>
              정령 무기 사회 레벨 효율적으로 올리는 법 질문드립니다. 다이아몬드 말고 가성비 좋은 거 뭐 있나요?
            </div>
            {/* Best Answer Preview (Q&A Only) */}
            <div className="best-answer-preview">
              <div className="ba-header"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=A1" style={{width:'16px', height:'16px', borderRadius:'50%'}} alt="Answerer" /> 마비박사님의 답변:</div>
              <div className="ba-text">'고스트의 체액' 추천합니다. 페카 던전에서 잘 나오고 경매장에서 쌉니다. 토요일에 먹이면 추가 경험치도 있으니 참고하세요!</div>
            </div>
            <div className="card-footer">
              <div className="icon-item"><i className="fa-regular fa-comment"></i> 3</div>
              <div className="icon-item"><i className="fa-regular fa-heart"></i> 1</div>
            </div>
          </article>

          {/* Feed Item 2: Free Talk (Image) */}
          <article className="feed-card">
            <div className="card-header">
              <div className="user-meta">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Free" className="u-avatar" alt="User Avatar" />
                <div className="u-info">
                  <span className="u-name">득템기원</span>
                  <span className="u-time">30분 전</span>
                </div>
              </div>
              <div className="badge free">잡담</div>
            </div>
            <div className="post-content">
              와 드디어 1랭크 찍었다... 블랙스미스 수련 다시는 안 한다 진짜 ㅠㅠ<br />
              도와주신 길드원분들 감사합니다!
            </div>
            <div style={{width:'100%', height:'200px', background:'#eee', borderRadius:'12px', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>
              <i className="fa-solid fa-image"></i> &nbsp; Screenshot
            </div>
            <div className="card-footer">
              <div className="icon-item"><i className="fa-regular fa-comment"></i> 15</div>
              <div className="icon-item"><i className="fa-regular fa-heart"></i> 42</div>
            </div>
          </article>

          {/* Feed Item 3: Q&A (Unsolved) */}
          <article className="feed-card">
            <div className="card-header">
              <div className="user-meta">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Q2" className="u-avatar" alt="User Avatar" />
                <div className="u-info">
                  <span className="u-name">길치</span>
                  <span className="u-time">1시간 전</span>
                </div>
              </div>
              <div className="badge question">답변 대기중</div>
            </div>
            <div className="post-content">
              <span style={{color:'var(--warning)', fontWeight:700}}>[질문]</span>
              바올 던전 잠입 퀘스트 팁 좀 주세요. 구슬 치고 나서 인식을 못 풀겠어요 ㅠㅠ
            </div>
            <div className="card-footer">
              <div className="icon-item"><i className="fa-regular fa-comment"></i> 0</div>
              <div className="icon-item"><i className="fa-regular fa-heart"></i> 0</div>
            </div>
          </article>
          
        </main>

        {/* Sidebar (Trending) */}
        <aside className="sidebar">
          <div className="widget">
            <div className="widget-h">실시간 인기글 🔥</div>
            
            <div className="trend-row">
              <div>
                <span className="t-title">류트 서버 1채널 마비됐나요?</span>
                <span className="t-meta">조회 1.2k · 댓글 45</span>
              </div>
              <span className="t-badge">잡담</span>
            </div>
            
            <div className="trend-row">
              <div>
                <span className="t-title">이번 키트 의상 염색 코드 공유 (리블)</span>
                <span className="t-meta">조회 800 · 좋아요 120</span>
              </div>
              <span className="t-badge" style={{background:'#E8F5FD', color:'var(--accent)'}}>정보</span>
            </div>

            <div className="trend-row">
              <div>
                <span className="t-title">정령 밥 줄 때 주의사항 (필독)</span>
                <span className="t-meta">조회 500 · 답변 12</span>
              </div>
              <span className="t-badge" style={{background:'#FFF4E5', color:'var(--warning)'}}>질문</span>
            </div>
          </div>

          <div className="widget">
            <div className="widget-h">이번 주 지식인 🏆</div>
            <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
              <span style={{fontWeight:700, color:'#FFD700'}}>1</span>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Master" style={{width:'30px', borderRadius:'50%'}} alt="Rank 1" />
              <span style={{fontSize:'14px', fontWeight:600}}>마비박사</span>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
              <span style={{fontWeight:700, color:'#C0C0C0'}}>2</span>
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Help" style={{width:'30px', borderRadius:'50%'}} alt="Rank 2" />
              <span style={{fontSize:'14px', fontWeight:600}}>친절한시민</span>
            </div>
          </div>
        </aside>

      </div>
    </>
  );
}
