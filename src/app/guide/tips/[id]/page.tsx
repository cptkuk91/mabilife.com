"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TipDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(12);

  // Dummy data (In a real app, fetch data based on params.id)
  const tip = {
    id: params.id,
    title: "오늘의 요일 효과 확인하세요 (화요일)",
    category: "전투/던전",
    author: "류트 · 굇수",
    authorImg: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    date: "2023. 10. 24. 14:30",
    content: `
      <p>안녕하세요, 에린의 모험가 여러분!</p>
      <p>오늘은 화요일입니다. 화요일에는 던전 아이템 드랍률 증가 효과가 적용되는 날인거 다들 아시죠?</p>
      <p>특히 룬다 상급 하드모드 던전(룬상하)에서 붕괴된 마력의 정수(붕마정) 드랍을 노리시는 분들은 오늘이 기회입니다.</p>
      <p>저는 오늘 3릴 돌아서 붕마정 하나 먹었네요 ㅎㅎ 다들 득템하세요!</p>
      <img src="https://picsum.photos/id/1015/800/400" alt="Dungeon Image" />
      <p>추가로, 오늘 저녁 8시에 길드 사냥 있으니 참여하실 분들은 길드 채팅방 확인 부탁드립니다.</p>
    `,
    comments: [
      { id: 1, author: "만돌린 · 뉴비", text: "축하드려요! 저도 오늘 달려봐야겠네요.", date: "10분 전" },
      { id: 2, author: "하프 · 고인물", text: "룬상하 통행증 가격 좀 오르겠네요 ㅠㅠ", date: "5분 전" }
    ]
  };

  const toggleLike = () => {
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="tip-detail-container">
      {/* Header */}
      <div className="tip-header">
        <div className="tip-category-badge">{tip.category}</div>
        <h1 className="tip-title">{tip.title}</h1>
        
        <div className="tip-meta">
          <div className="author-info">
            <img src={tip.authorImg} alt="Author" className="author-img" />
            <div className="author-text">
              <span className="author-name">{tip.author}</span>
              <span className="post-date">{tip.date}</span>
            </div>
          </div>
          
          <div className="tip-actions">
            <button className={`action-btn like ${isLiked ? 'active' : ''}`} onClick={toggleLike}>
              <i className={`fa-${isLiked ? 'solid' : 'regular'} fa-heart`}></i>
              {likeCount}
            </button>
            <button className="action-btn">
              <i className="fa-regular fa-share-from-square"></i>
              공유
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tip-content" dangerouslySetInnerHTML={{ __html: tip.content }}></div>

      {/* Comments */}
      <div className="comments-section">
        <div className="comments-header">댓글 {tip.comments.length}</div>
        
        <div className="comment-input-area">
          <input type="text" className="comment-input" placeholder="댓글을 남겨보세요..." />
          <button className="comment-submit">등록</button>
        </div>

        <div className="comment-list">
          {tip.comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`} alt="User" className="author-img" style={{width: '32px', height: '32px'}} />
              <div className="comment-bubble">
                <div className="comment-author">{comment.author}</div>
                <div className="comment-text">{comment.text}</div>
                <div className="comment-date">{comment.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
