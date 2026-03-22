"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getMabinogiEvents, MabinogiEvent } from "@/actions/nexon";

const sectionShellClass = "flex w-full justify-center px-4 pb-4 pt-10 sm:px-5 md:px-6 md:pt-12";
const sectionInnerClass = "mx-auto w-full max-w-[1140px]";
const frameClass =
  "relative overflow-hidden rounded-[30px] border border-[#D8C6AF] bg-[linear-gradient(180deg,#FFFDFC_0%,#F8F2E8_100%)] shadow-[0_18px_46px_rgba(30,24,18,0.08)]";
const frameInnerClass = "relative z-10 px-5 py-6 md:px-7 md:py-7";
const badgeClass =
  "inline-flex items-center gap-2 rounded-full border border-[#D6C09A]/55 bg-white/88 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A6630] backdrop-blur";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A977]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF6EF]";
const titleClass = "mt-4 text-balance font-display text-[26px] leading-[1.04] tracking-[-0.05em] text-[#171311] md:text-[36px]";
const moreLinkClass =
  `inline-flex items-center gap-1.5 text-sm font-semibold text-[#7E5E32] transition-colors hover:text-[#59411E] ${focusRingClass}`;
const carouselClass =
  "mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const cardClass =
  `group flex h-full w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-[#E6DDD2] bg-white/92 text-left shadow-[0_12px_32px_rgba(25,21,18,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-[#C8A977]/55 hover:shadow-[0_18px_36px_rgba(25,21,18,0.08)] ${focusRingClass}`;

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
      <section className={sectionShellClass}>
        <div className={`${sectionInnerClass} ${frameClass}`}>
          <div className={frameInnerClass}>
            <div className={badgeClass}>Campaign Watch</div>
            <h2 className={titleClass}>진행 중인 이벤트</h2>
            <div className={carouselClass}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${cardClass} animate-pulse`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-black/6" />
                  <div className="flex min-h-[170px] flex-1 flex-col px-5 py-5">
                    <div className="mb-3 h-4 w-16 rounded bg-black/6" />
                    <div className="mb-3 h-6 w-4/5 rounded bg-black/6" />
                    <div className="mt-auto h-4 w-1/2 rounded bg-black/6" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section className={sectionShellClass}>
      <div className={`${sectionInnerClass} ${frameClass}`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,178,109,0.18),transparent_28%)]" />
        <div className={frameInnerClass}>
          <div className="flex flex-col gap-4 border-b border-black/8 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className={badgeClass}>Campaign Watch</div>
              <h2 className={titleClass}>진행 중인 이벤트</h2>
            </div>
            <a
              href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501"
              target="_blank"
              rel="noopener noreferrer"
              className={moreLinkClass}
              aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
            >
              전체 보기
              <i className="fa-solid fa-chevron-right text-[11px]" aria-hidden="true"></i>
            </a>
          </div>

          <div className={carouselClass}>
            {events.map((event) => (
              <a key={event.id} href={event.link} target="_blank" rel="noopener noreferrer" className={cardClass}>
                <div className="relative aspect-video w-full overflow-hidden bg-[#F5EEE2]">
                  {event.thumbnail ? (
                    <Image
                      src={event.thumbnail}
                      alt={event.title}
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#F5EEE2] text-3xl text-[#CDBA99]">
                      <i className="fa-solid fa-image" aria-hidden="true"></i>
                    </div>
                  )}
                  <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(17,14,12,0.35),transparent)]" />
                </div>
                <div className="flex min-h-[170px] flex-1 flex-col px-5 py-5">
                  <span className="mb-2 inline-flex w-fit rounded-full border border-[#D8C5A6]/80 bg-[#FAF4EA] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A6630]">
                    {event.status}
                  </span>
                  <h3 className="overflow-hidden text-[20px] font-semibold leading-[1.28] tracking-[-0.02em] text-[#171311] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {event.title}
                  </h3>
                  <p className="mt-auto pt-4 text-[13px] font-medium text-[#6D645C]">{event.date}</p>
                </div>
              </a>
            ))}

            <a
              href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex w-[180px] shrink-0 snap-start flex-col items-center justify-center rounded-[26px] border border-[#D8C5A6]/80 bg-[#FAF4EA] px-5 text-[#6B625B] transition duration-200 hover:-translate-y-1 hover:bg-white hover:text-[#171311]"
              aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-[#D8C5A6]/80 bg-white text-[1.2rem] text-[#8A6630] shadow-[0_6px_18px_rgba(25,21,18,0.06)] transition duration-200 group-hover:scale-110">
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </div>
              <span className="text-sm font-semibold">공식 페이지로</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
