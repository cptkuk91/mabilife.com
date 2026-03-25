"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
const fr = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const NAV = [
  { href: "/guide", label: "공략", icon: "fa-book" },
  { href: "/runes", label: "추천 룬", icon: "fa-gem" },
  { href: "/ranking", label: "랭킹", icon: "fa-trophy" },
  { href: "/homework", label: "숙제", icon: "fa-list-check" },
  { href: "/community", label: "커뮤니티", icon: "fa-comments" },
];
const MENU = [...NAV, { href: "/statistics", label: "통계", icon: "fa-chart-pie" }];

type SUser = { email?: string | null; id?: string; image?: string | null; name?: string | null };

export default function Navbar() {
  const path = usePathname();
  const { data: session } = useSession();
  const [dd, setDd] = useState(false);
  const [mdd, setMdd] = useState(false);
  const [menu, setMenu] = useState(false);
  const ddRef = useRef<HTMLDivElement>(null);
  const mddRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const u = session?.user as SUser | undefined;
  const isA = (h: string) => h === "/" ? path === "/" : path === h || path?.startsWith(`${h}/`);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDd(false);
      if (mddRef.current && !mddRef.current.contains(e.target as Node)) setMdd(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (path === "/login") return null;

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[1000] flex h-12 justify-center border-b border-[#E3E2DE] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-[1100px] items-center justify-between px-4 sm:px-5 md:px-6">
          <Link href="/" className={cn("flex items-center gap-2 text-[16px] font-bold tracking-[-0.02em] text-[#37352F] transition hover:opacity-70", fr)}>
            <i className="fa-solid fa-leaf text-[14px] text-[#2F80ED]" aria-hidden="true" />
            <span>Mabi Life</span>
          </Link>
          <div className="hidden items-center gap-5 text-[13px] text-[#787774] md:flex">
            {NAV.map((i) => (
              <Link key={i.href} href={i.href} className={cn("transition-colors hover:text-[#37352F]", isA(i.href) && "font-semibold text-[#37352F]", fr)}>{i.label}</Link>
            ))}
          </div>
          <div className="hidden items-center gap-1.5 md:flex">
            <a href="https://discord.gg/VTW26TaR" target="_blank" rel="noopener noreferrer" className={cn("flex size-8 items-center justify-center rounded-md text-[14px] text-[#B4B4B0] transition hover:bg-[#F7F6F3] hover:text-[#5865F2]", fr)} aria-label="디스코드"><i className="fa-brands fa-discord" aria-hidden="true" /></a>
            <a href="https://link.kakao.gg" target="_blank" rel="noopener noreferrer" className={cn("flex size-8 items-center justify-center rounded-md text-[14px] text-[#B4B4B0] transition hover:bg-[#F7F6F3] hover:text-[#37352F]", fr)} aria-label="퀵링크"><i className="fa-solid fa-link" aria-hidden="true" /></a>
            {session ? (
              <div className="relative flex items-center" ref={ddRef}>
                <button type="button" className={cn("rounded-full ring-2 ring-transparent transition hover:ring-[#2F80ED]/30", fr)} onClick={() => setDd(!dd)} aria-label="프로필 메뉴" aria-expanded={dd}>
                  <Image src={u?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" className="size-8 rounded-full object-cover" width={32} height={32} />
                </button>
                {dd && (
                  <div className="absolute right-0 top-11 z-[1001] w-[210px] rounded-xl border border-[#E3E2DE] bg-white p-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                    <div className="px-3 py-2.5">
                      <div className="text-[14px] font-semibold text-[#37352F]">{u?.name}</div>
                      <div className="mt-0.5 truncate text-[12px] text-[#9B9A97]">{u?.email}</div>
                    </div>
                    <div className="my-1 h-px bg-[#F1F1EF]" />
                    <Link href="/profile" className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#37352F] transition hover:bg-[#F7F6F3]", fr)} onClick={() => setDd(false)}>
                      <i className="fa-regular fa-user w-4 text-center text-[#9B9A97]" aria-hidden="true" />마이페이지
                    </Link>
                    <button type="button" className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-[#37352F] transition hover:bg-[#F7F6F3]", fr)} onClick={() => signOut()}>
                      <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-[#9B9A97]" aria-hidden="true" />로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={cn("rounded-lg bg-[#2F80ED] px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#1A66CC]", fr)}>로그인</Link>
            )}
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-[1000] flex h-[72px] items-center justify-around border-t border-[#E3E2DE] bg-white/95 px-2 pb-4 pt-1.5 backdrop-blur-xl md:hidden">
        <Link href="/" className={cn("flex min-w-[52px] flex-col items-center gap-0.5 px-2 py-1 text-[#9B9A97] active:scale-95", path === "/" && !menu && "text-[#37352F]", fr)}>
          <i className={cn("fa-solid fa-house text-[20px]", path === "/" && !menu && "scale-110")} aria-hidden="true" /><span className="text-[10px] font-medium">홈</span>
        </Link>
        <div className="relative" ref={menuRef}>
          <button type="button" className={cn("flex min-w-[52px] flex-col items-center gap-0.5 px-2 py-1 text-[#9B9A97] active:scale-95", menu && "text-[#37352F]", fr)} onClick={() => setMenu(!menu)} aria-label="메뉴">
            <i className={cn("fa-solid fa-bars text-[20px]", menu && "scale-110")} aria-hidden="true" /><span className="text-[10px] font-medium">메뉴</span>
          </button>
          {menu && (
            <div className="fixed bottom-[76px] left-1/2 z-[999] w-[calc(100%-16px)] max-w-[500px] -translate-x-1/2 rounded-2xl border border-[#E3E2DE] bg-white px-5 pb-7 pt-5 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
              <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                {MENU.map((i) => (
                  <Link key={i.href} href={i.href} className={cn("flex flex-col items-center gap-1.5", fr)} onClick={() => setMenu(false)}>
                    <div className="flex size-[46px] items-center justify-center rounded-xl bg-[#F7F6F3] text-[20px] text-[#37352F] active:scale-95 active:bg-[#EDECE9]"><i className={`fa-solid ${i.icon}`} aria-hidden="true" /></div>
                    <span className="text-[11px] font-medium text-[#787774]">{i.label}</span>
                  </Link>
                ))}
                <a href="https://discord.gg/VTW26TaR" target="_blank" rel="noopener noreferrer" className={cn("flex flex-col items-center gap-1.5", fr)} onClick={() => setMenu(false)}>
                  <div className="flex size-[46px] items-center justify-center rounded-xl bg-[#F7F6F3] text-[20px] text-[#5865F2] active:scale-95 active:bg-[#EDECE9]"><i className="fa-brands fa-discord" aria-hidden="true" /></div>
                  <span className="text-[11px] font-medium text-[#787774]">디스코드</span>
                </a>
                <a href="https://link.kakao.gg" target="_blank" rel="noopener noreferrer" className={cn("flex flex-col items-center gap-1.5", fr)} onClick={() => setMenu(false)}>
                  <div className="flex size-[46px] items-center justify-center rounded-xl bg-[#F7F6F3] text-[20px] text-[#37352F] active:scale-95 active:bg-[#EDECE9]"><i className="fa-solid fa-link" aria-hidden="true" /></div>
                  <span className="text-[11px] font-medium text-[#787774]">퀵링크</span>
                </a>
              </div>
            </div>
          )}
        </div>
        {session ? (
          <div className="relative" ref={mddRef}>
            <button type="button" className={cn("flex min-w-[52px] flex-col items-center gap-0.5 px-2 py-1 text-[#9B9A97] active:scale-95", fr)} onClick={() => setMdd(!mdd)} aria-label="프로필">
              <Image src={u?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u?.id || "user"}`} alt="P" className="size-6 rounded-full border border-[#E3E2DE] object-cover" width={24} height={24} />
              <span className="text-[10px] font-medium">MY</span>
            </button>
            {mdd && (
              <div className="absolute bottom-[60px] right-0 min-w-40 rounded-xl border border-[#E3E2DE] bg-white p-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
                <Link href="/profile" className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[14px] text-[#37352F] hover:bg-[#F7F6F3]", fr)} onClick={() => setMdd(false)}><i className="fa-regular fa-user w-4 text-center text-[#9B9A97]" aria-hidden="true" />마이페이지</Link>
                <button type="button" className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[14px] text-[#37352F] hover:bg-[#F7F6F3]", fr)} onClick={() => { setMdd(false); signOut(); }}><i className="fa-solid fa-arrow-right-from-bracket w-4 text-center text-[#9B9A97]" aria-hidden="true" />로그아웃</button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className={cn("flex min-w-[52px] flex-col items-center gap-0.5 px-2 py-1 text-[#9B9A97] active:scale-95", fr)}>
            <i className="fa-solid fa-right-to-bracket text-[20px]" aria-hidden="true" /><span className="text-[10px] font-medium">로그인</span>
          </Link>
        )}
      </nav>
    </>
  );
}
