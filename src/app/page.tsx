"use client";



import styles from "./home.module.css";
import EventList from "@/components/EventList";

export default function Home() {
  return (
    <>


      {/* 2. Hero Section */}
      <header className={styles.hero}>
        <h1>나만의 판타지 라이프.</h1>
        <p>에린의 모든 모험가들과 함께 이야기를 만들어가세요.<br />오늘 알게 된 꿀팁은 무엇인가요?</p>
        
        {/* Premium Write Bar */}
        <div className={styles.writeWrapper}>
          <i className="fa-solid fa-pen" style={{color:'#aaa', marginLeft:'5px'}}></i>
          <a href="/search" style={{flex: 1, display: 'block'}}>
            <input type="text" className={styles.writeInput} placeholder="새로운 모험 공유하기..." style={{width: '100%', cursor: 'pointer'}} readOnly />
          </a>
          <button className={styles.writeBtn}><i className="fa-solid fa-arrow-up"></i></button>
        </div>
      </header>

      {/* 3. Tags Filter */}
      <div className={styles.tagsBar}>
        <div className={`${styles.tagPill} ${styles.active}`}>전체</div>
        <div className={styles.tagPill}>#초보자가이드</div>
        <div className={styles.tagPill}>#전투공략</div>
        <div className={styles.tagPill}>#생활스킬</div>
        <div className={styles.tagPill}>#득템인증</div>
        <div className={styles.tagPill}>#코디자랑</div>
      </div>

      {/* 4. Main Feed (Bento Grid Layout) */}
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

      {/* 5. Event List */}
      <EventList />
    </>
  );
}
