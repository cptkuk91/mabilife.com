"use client";

import { useEffect, useState } from "react";
import { getMabinogiEvents, MabinogiEvent } from "@/actions/nexon";
import Image from "next/image";

const sectionShellClass = "mx-auto max-w-[var(--max-width)] px-4 md:px-5";
const headerClass = "mb-5 flex items-center justify-between gap-4";
const titleClass = "text-[20px] font-bold tracking-[-0.03em] text-app-title md:text-[22px]";
const moreLinkClass =
  "inline-flex items-center gap-1.5 text-sm font-semibold text-app-accent transition hover:text-app-accent-hover";
const carouselClass =
  "flex snap-x snap-mandatory gap-5 overflow-x-auto pb-6 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const cardClass =
  "group flex h-full w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] border border-black/5 bg-white text-left shadow-elev-soft transition duration-300 hover:-translate-y-1 hover:shadow-elev-card";
const thumbnailWrapperClass = "relative aspect-video w-full overflow-hidden bg-app-bg";
const contentClass = "flex min-h-[140px] flex-1 flex-col px-5 py-5";
const statusClass = "mb-1 inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-[#BF4800]";
const cardTitleClass =
  "overflow-hidden text-[17px] font-semibold leading-[1.35] text-app-title [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]";
const dateClass = "mt-auto pt-3 text-[13px] font-medium text-app-body";

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
      <section className={`${sectionShellClass} pb-4 pt-10 md:pt-12`}>
        <div className={headerClass}>
          <h2 className={titleClass}>진행 중인 이벤트</h2>
        </div>
        <div className={carouselClass}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${cardClass} animate-pulse`}>
              <div className={thumbnailWrapperClass} />
              <div className={contentClass}>
                <div className="mb-3 h-4 w-16 rounded bg-black/6" />
                <div className="mb-3 h-6 w-4/5 rounded bg-black/6" />
                <div className="mt-auto h-4 w-1/2 rounded bg-black/6" />
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
    <section className={`${sectionShellClass} pb-4 pt-10 md:pt-12`}>
      <div className={headerClass}>
        <h2 className={titleClass}>진행 중인 이벤트</h2>
        <a 
          href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501" 
          target="_blank" 
          rel="noopener noreferrer"
          className={moreLinkClass}
          aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
        >
          더보기 <i className="fa-solid fa-chevron-right"></i>
        </a>
      </div>
      <div className={carouselClass}>
        {events.map((event) => (
          <a 
            key={event.id} 
            href={event.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={cardClass}
          >
            <div className={thumbnailWrapperClass}>
              {event.thumbnail ? (
                <Image 
                  src={event.thumbnail} 
                  alt={event.title} 
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-app-bg text-3xl text-black/20">
                  <i className="fa-solid fa-image"></i>
                </div>
              )}
            </div>
            <div className={contentClass}>
              <span className={statusClass}>{event.status}</span>
              <h3 className={cardTitleClass}>{event.title}</h3>
              <p className={dateClass}>{event.date}</p>
            </div>
          </a>
        ))}
        
        {/* View All Card */}
        <a 
          href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="group flex w-[160px] shrink-0 snap-start flex-col items-center justify-center rounded-[22px] border border-black/5 bg-app-bg text-app-body transition duration-200 hover:bg-black/[0.06] hover:text-app-title"
          aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
        >
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-white text-[1.15rem] text-app-accent shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition duration-200 group-hover:scale-110">
            <i className="fa-solid fa-arrow-right"></i>
          </div>
          <span className="text-sm font-semibold">전체 보기</span>
        </a>
      </div>
    </section>
  );
}
