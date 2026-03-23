"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getMabinogiEvents, MabinogiEvent } from "@/actions/nexon";

const sectionShellClass = "w-full px-4 pb-4 pt-10 sm:px-6 md:pt-12 lg:px-8";
const sectionInnerClass = "mx-auto w-full max-w-[1240px]";
const frameClass =
  "relative overflow-hidden rounded-[32px] border border-[#D7DCE2] bg-white/76 shadow-[0_20px_54px_rgba(11,18,28,0.08)] backdrop-blur-md";
const frameInnerClass = "relative z-10 px-5 py-6 md:px-7 md:py-7";
const badgeClass =
  "inline-flex items-center gap-2 rounded-full border border-[#CCD4DD] bg-white/84 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#23486D]";
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E72C6]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ECE9E1]";
const titleClass = "mt-4 text-balance font-display text-[28px] leading-[0.96] tracking-[-0.05em] text-[#132238] md:text-[40px]";
const moreLinkClass =
  `inline-flex items-center gap-1.5 text-sm font-semibold text-[#23486D] transition-colors hover:text-[#132238] ${focusRingClass}`;
const carouselClass =
  "mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";
const cardClass =
  `group flex h-full w-[308px] shrink-0 snap-start flex-col overflow-hidden rounded-[26px] border border-[#D8DDE2] bg-[#FDFBF8]/92 text-left shadow-[0_16px_44px_rgba(10,18,28,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#B8C1CB] hover:shadow-[0_24px_52px_rgba(10,18,28,0.1)] max-md:hover:translate-y-0 ${focusRingClass}`;

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
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(39,83,128,0.08),transparent_30%)]" />
          <div className={frameInnerClass}>
            <div className={badgeClass}>Campaign Watch</div>
            <h2 className={titleClass}>진행 중인 이벤트</h2>
            <div className={carouselClass}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${cardClass} animate-pulse`}>
                  <div className="relative aspect-video w-full overflow-hidden bg-[#E9EEF3]" />
                  <div className="flex min-h-[170px] flex-1 flex-col px-5 py-5">
                    <div className="mb-3 h-4 w-16 rounded bg-black/8" />
                    <div className="mb-3 h-6 w-4/5 rounded bg-black/8" />
                    <div className="mt-auto h-4 w-1/2 rounded bg-black/8" />
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(39,83,128,0.08),transparent_30%)]" />
        <div className={frameInnerClass}>
          <div className="flex flex-col gap-4 border-b border-[#D7DCE2] pb-5 md:flex-row md:items-end md:justify-between">
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
                <div className="relative aspect-video w-full overflow-hidden bg-[#E9EEF3]">
                  {event.thumbnail ? (
                    <Image
                      src={event.thumbnail}
                      alt={event.title}
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-[#E9EEF3] text-3xl text-[#7D8B9B]">
                      <i className="fa-solid fa-image" aria-hidden="true"></i>
                    </div>
                  )}
                  <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(7,13,20,0.2),transparent)]" />
                </div>
                <div className="flex min-h-[170px] flex-1 flex-col px-5 py-5">
                  <span className="mb-2 inline-flex w-fit rounded-full border border-[#CCD4DD] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#23486D]">
                    {event.status}
                  </span>
                  <h3 className="overflow-hidden text-[20px] font-semibold leading-[1.28] tracking-[-0.02em] text-[#132238] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {event.title}
                  </h3>
                  <p className="mt-auto pt-4 text-[13px] font-medium text-[#66707D]">{event.date}</p>
                </div>
              </a>
            ))}

            <a
              href="https://mabinogimobile.nexon.com/News/Events?headlineId=2501"
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex w-[188px] shrink-0 snap-start flex-col items-center justify-center rounded-[26px] border border-[#1C3B59]/45 bg-[linear-gradient(135deg,#10263C_0%,#143352_100%)] px-5 text-white shadow-[0_20px_48px_rgba(10,20,34,0.18)] transition duration-300 hover:-translate-y-1 max-md:hover:translate-y-0 ${focusRingClass}`}
              aria-label="마비노기 모바일 공식 홈페이지에서 진행 중인 이벤트 전체 보기"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-white/12 bg-white/10 text-[1.2rem] text-[#E9D09E] shadow-[0_6px_18px_rgba(10,20,34,0.18)] transition duration-200 group-hover:scale-110">
                <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </div>
              <span className="text-sm font-semibold">공식 페이지로</span>
              <span className="mt-2 text-center text-[12px] leading-5 text-white/65">이벤트 전체 목록 확인</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
