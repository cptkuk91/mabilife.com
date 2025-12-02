"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";

function TipsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "전체";

  // Dummy data for tips
  const tips = [
    {
      id: 1,
      title: "오늘의 요일 효과 확인하세요 (화요일)",
      desc: "던전 아이템 드랍률 증가 효과가 있으니 오늘은 룬상하 달리세요.",
      time: "5분 전",
      icon: "fa-lightbulb",
      bg: "#EAF4FF",
      color: "#0071E3"
    },
    {
      id: 2,
      title: "지향색 코드 공유합니다 (리블/리화)",
      desc: "RGB 값 정확하게 찍어왔습니다. 염색 앰플 참고하세요.",
      time: "20분 전",
      icon: "fa-palette",
      bg: "#FFF0F5",
      color: "#FF2D55"
    },
    {
      id: 3,
      title: "간헐적으로 펫 소환 안되는 버그 해결법",
      desc: "채널 이동하면 풀리긴 하는데, 임시 방편으로 재접속 추천합니다.",
      time: "1시간 전",
      icon: "fa-bug",
      bg: "#F0F8FF",
      color: "#4682B4"
    },
    {
      id: 4,
      title: "교역 시즌 초기화 전 필수 체크리스트",
      desc: "두카트 미리 정산하시고, 보증서 남은거 확인하세요.",
      time: "2시간 전",
      icon: "fa-sack-dollar",
      bg: "#FFF8E1",
      color: "#FF9500"
    },
    {
      id: 5,
      title: "이번주 프리시즌 혜택 정리",
      desc: "수리비 무료, 전투 경험치 2배입니다. 레벨업 달릴 기회!",
      time: "3시간 전",
      icon: "fa-calendar-check",
      bg: "#E8FAEB",
      color: "#00BA7C"
    },
    {
      id: 6,
      title: "신규 의장 '스페셜 윈터 니트' 염색 파트",
      desc: "A, B, C 파트 구분해서 올립니다. 큰팟이 A팟이에요.",
      time: "4시간 전",
      icon: "fa-shirt",
      bg: "#F3E5F5",
      color: "#9C27B0"
    },
    {
      id: 7,
      title: "몽환의 라비 던전 퀸즈 룸 공략 팁",
      desc: "팬텀 포효 타이밍에 맞춰서 앵커 러시 쓰면 피할 수 있습니다.",
      time: "5시간 전",
      icon: "fa-dungeon",
      bg: "#ECEFF1",
      color: "#455A64"
    },
    {
      id: 8,
      title: "정령 무기 육성 효율표 (최신)",
      desc: "보석 종류별 경험치 효율 정리했습니다. 다이아몬드가 최고네요.",
      time: "6시간 전",
      icon: "fa-gem",
      bg: "#E0F7FA",
      color: "#00BCD4"
    },
    {
      id: 9,
      title: "블로니의 성장지원 4권 퀘스트 막히는 분들",
      desc: "이멘 마하 공연장 퀘스트는 저녁 시간에만 가능합니다.",
      time: "7시간 전",
      icon: "fa-book-open",
      bg: "#FFF3E0",
      color: "#FF9800"
    },
    {
      id: 10,
      title: "길드전 참가 신청 마감 임박",
      desc: "이번 주 길드전 참여하실 분들 오늘 자정까지 신청하세요.",
      time: "8시간 전",
      icon: "fa-flag",
      bg: "#FFEBEE",
      color: "#F44336"
    }
  ];

  const [activeTab, setActiveTab] = useState(initialCategory);

  useEffect(() => {
    setActiveTab(initialCategory);
  }, [initialCategory]);

  const categories = ["전체", "초보 가이드", "전투/던전", "메인스트림", "생활/알바", "패션/뷰티", "돈벌기"];

  return (
    <div className="page-container">
      <header className="hub-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="hub-title">실시간 유저 팁</div>
          <div className="hub-subtitle">유저들이 공유하는 따끈따끈한 에린 소식</div>
        </div>
        <button className="write-btn" onClick={() => router.push('/guide/write')}>
          <i className="fa-solid fa-pen-to-square" style={{marginRight: '6px'}}></i>
          팁 작성
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="filter-bar" style={{ marginBottom: '30px' }}>
        {categories.map((cat) => (
          <div 
            key={cat} 
            className={`filter-item ${activeTab === cat ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(cat);
              const newUrl = cat === "전체" ? "/guide/tips" : `/guide/tips?category=${cat}`;
              window.history.pushState({}, "", newUrl);
            }}
          >
            {cat}
          </div>
        ))}
      </div>

      <div className="list-group">
        {tips.map((tip) => (
          <Link href={`/guide/tips/${tip.id}`} key={tip.id} className="list-item">
            <div className="list-icon" style={{background: tip.bg, color: tip.color}}>
              <i className={`fa-solid ${tip.icon}`}></i>
            </div>
            <div className="list-content">
              <div className="list-title">{tip.title}</div>
              <div className="list-desc">{tip.desc}</div>
            </div>
            <div className="list-meta">{tip.time}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function TipsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TipsContent />
    </Suspense>
  );
}
