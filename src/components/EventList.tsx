"use client";

import { useEffect, useState } from "react";
import { getMabinogiEvents, MabinogiEvent } from "@/actions/nexon";
import Image from "next/image";
import styles from "./event-list.module.css";

export default function EventList() {
  const [events, setEvents] = useState<MabinogiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const data = await getMabinogiEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to load events", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>진행중인 이벤트</h2>
        </div>
        <div className={styles.carousel}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.card} style={{ height: "300px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>
              <div className={styles.thumbnailWrapper} style={{ background: "#eee" }} />
              <div className={styles.content}>
                <div style={{ height: "20px", width: "60px", background: "#eee", marginBottom: "10px", borderRadius: "4px" }} />
                <div style={{ height: "24px", width: "80%", background: "#eee", marginBottom: "10px", borderRadius: "4px" }} />
                <div style={{ height: "16px", width: "50%", background: "#eee", marginTop: "auto", borderRadius: "4px" }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>진행 중인 이벤트</h2>
        <a 
          href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.moreLink}
          aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
        >
          더보기 <i className="fa-solid fa-chevron-right"></i>
        </a>
      </div>
      <div className={styles.carousel}>
        {events.map((event) => (
          <a 
            key={event.id} 
            href={event.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.card}
          >
            <div className={styles.thumbnailWrapper}>
              {event.thumbnail ? (
                <Image 
                  src={event.thumbnail} 
                  alt={event.title} 
                  className={styles.thumbnail}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div className={styles.thumbnail} style={{ background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-image" style={{ color: '#ccc', fontSize: '2rem' }}></i>
                </div>
              )}
            </div>
            <div className={styles.content}>
              <span className={styles.status}>{event.status}</span>
              <h3 className={styles.cardTitle}>{event.title}</h3>
              <p className={styles.date}>{event.date}</p>
            </div>
          </a>
        ))}
        
        {/* View All Card */}
        <a 
          href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501" 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.viewAllCard}
          aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
        >
          <div className={styles.viewAllIconCircle}>
            <i className="fa-solid fa-arrow-right"></i>
          </div>
          <span className={styles.viewAllText}>전체 보기</span>
        </a>
      </div>
    </section>
  );
}
