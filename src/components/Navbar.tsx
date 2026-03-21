"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const NAV_ITEMS = [
  { href: "/guide", label: "공략", icon: "fa-book" },
  { href: "/runes", label: "추천 룬", icon: "fa-gem" },
  { href: "/ranking", label: "랭킹", icon: "fa-trophy" },
  { href: "/homework", label: "숙제", icon: "fa-list-check" },
  { href: "/community", label: "커뮤니티", icon: "fa-comments" },
];

const MENU_ITEMS = [
  ...NAV_ITEMS,
  { href: "/statistics", label: "통계", icon: "fa-chart-pie" },
];

type SessionUser = {
  email?: string | null;
  id?: string;
  image?: string | null;
  name?: string | null;
};

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = session?.user as SessionUser | undefined;

  const isActivePath = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Hide Navbar on login page
  if (pathname === "/login") return null;

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[1000] h-14 border-b border-black/8 bg-white/85 backdrop-blur-xl md:h-12">
        <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-4 md:px-5">
          <Link
            href="/"
            className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.03em] text-app-title transition hover:text-app-accent md:text-[19px]"
          >
            <i className="fa-solid fa-leaf text-[0.95em] text-app-accent"></i>
            <span>Mabi Life</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-app-body md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition hover:text-app-accent",
                  isActivePath(item.href) && "font-semibold text-app-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="https://discord.gg/VTW26TaR"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-full text-base text-app-body transition hover:bg-black/5 hover:text-[#5865F2]"
              title="디스코드"
            >
              <i className="fa-brands fa-discord"></i>
            </a>
            <a
              href="https://link.kakao.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-9 items-center justify-center rounded-full text-base text-app-body transition hover:bg-black/5 hover:text-app-accent"
              title="퀵링크"
            >
              <i className="fa-solid fa-link"></i>
            </a>

            {session ? (
              <div className="relative flex items-center" ref={dropdownRef}>
                <Image
                  src={user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                  alt="Profile"
                  className="size-[34px] cursor-pointer rounded-full border-2 border-transparent object-cover transition hover:border-app-accent"
                  width={34}
                  height={34}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />

                {isDropdownOpen && (
                  <div className="absolute right-0 top-12 z-[1001] w-[220px] rounded-[18px] border border-black/5 bg-white/95 p-2 shadow-elev-hover backdrop-blur-xl">
                    <div className="px-4 py-3">
                      <div className="text-[15px] font-bold text-app-title">{user?.name}</div>
                      <div className="mt-0.5 truncate text-xs text-app-body">{user?.email}</div>
                    </div>
                    <div className="my-1 h-px bg-app-border"></div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 rounded-[10px] px-4 py-2.5 text-sm text-app-title transition hover:bg-app-bg hover:text-app-accent"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <i className="fa-regular fa-user w-4 text-center"></i>
                      <span>마이페이지</span>
                    </Link>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-[10px] px-4 py-2.5 text-left text-sm text-app-title transition hover:bg-app-bg hover:text-app-accent"
                      onClick={() => signOut()}
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
                      <span>로그아웃</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="rounded-full bg-app-accent px-[18px] py-2 text-[13px] font-medium text-white transition hover:scale-[1.02] hover:bg-app-accent-hover"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </nav>

      <nav className="fixed inset-x-0 bottom-0 z-[1000] flex h-20 items-center justify-around border-t border-black/8 bg-white/92 px-2 pb-5 pt-2 backdrop-blur-xl md:hidden">
        <Link
          href="/"
          className={cn(
            "flex min-w-[60px] flex-col items-center justify-center gap-1 px-3 py-2 text-app-body transition active:scale-95",
            pathname === "/" && !isMenuOpen && "text-app-title"
          )}
        >
          <i className={cn("fa-solid fa-house text-[22px] transition", pathname === "/" && !isMenuOpen && "scale-110")}></i>
          <span className="text-[10px] font-medium">홈</span>
        </Link>
        
        <div className="relative" ref={menuRef}>
            <button
                type="button"
                className={cn(
                  "flex min-w-[60px] flex-col items-center justify-center gap-1 px-3 py-2 text-app-body transition active:scale-95",
                  isMenuOpen && "text-app-title"
                )}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <i className={cn("fa-solid fa-bars text-[22px] transition", isMenuOpen && "scale-110")}></i>
                <span className="text-[10px] font-medium">메뉴</span>
            </button>

            {isMenuOpen && (
                <div className="fixed bottom-20 left-1/2 z-[999] w-[calc(100%-16px)] max-w-[600px] -translate-x-1/2 rounded-[24px] border border-black/5 bg-white/95 px-5 pb-8 pt-6 shadow-[0_-4px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:bottom-[90px] sm:max-w-[500px]">
                    <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                        {MENU_ITEMS.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-2 text-app-title"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <div className="flex size-[50px] items-center justify-center rounded-[18px] bg-app-bg text-[22px] text-app-title transition active:scale-95 active:bg-black/[0.06]">
                              <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <span className="whitespace-nowrap text-[11px] font-medium text-app-body">{item.label}</span>
                          </Link>
                        ))}
                        <a
                          href="https://discord.gg/VTW26TaR"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 text-app-title"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex size-[50px] items-center justify-center rounded-[18px] bg-app-bg text-[22px] text-[#5865F2] transition active:scale-95 active:bg-black/[0.06]">
                            <i className="fa-brands fa-discord"></i>
                          </div>
                          <span className="whitespace-nowrap text-[11px] font-medium text-app-body">디스코드</span>
                        </a>
                        <a
                          href="https://link.kakao.gg"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-col items-center gap-2 text-app-title"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex size-[50px] items-center justify-center rounded-[18px] bg-app-bg text-[22px] text-app-title transition active:scale-95 active:bg-black/[0.06]">
                            <i className="fa-solid fa-link"></i>
                          </div>
                          <span className="whitespace-nowrap text-[11px] font-medium text-app-body">퀵링크</span>
                        </a>
                    </div>
                </div>
            )}
        </div>

        {session ? (
          <div className="relative" ref={mobileDropdownRef}>
            <button
              type="button"
              className={cn(
                "flex min-w-[60px] flex-col items-center justify-center gap-1 px-3 py-2 text-app-body transition active:scale-95",
                isActivePath("/profile") && "text-app-title"
              )}
              onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
            >
              <Image
                src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || "user"}`}
                alt="Profile"
                className={cn(
                  "size-[26px] rounded-full border-2 border-transparent object-cover transition",
                  isActivePath("/profile") && "border-app-title"
                )}
                width={28}
                height={28}
              />
              <span className="text-[10px] font-medium">MY</span>
            </button>

            {isMobileDropdownOpen && (
              <div className="absolute bottom-[70px] right-0 min-w-40 rounded-2xl border border-black/6 bg-white/95 p-2 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3.5 text-[15px] font-medium text-app-title transition hover:bg-app-bg active:bg-app-bg"
                  onClick={() => setIsMobileDropdownOpen(false)}
                >
                  <i className="fa-regular fa-user w-5 text-center text-app-body"></i>
                  <span>마이페이지</span>
                </Link>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-[10px] px-4 py-3.5 text-left text-[15px] font-medium text-app-title transition hover:bg-app-bg active:bg-app-bg"
                  onClick={() => {
                    setIsMobileDropdownOpen(false);
                    signOut();
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center text-app-body"></i>
                  <span>로그아웃</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="flex min-w-[60px] flex-col items-center justify-center gap-1 px-3 py-2 text-app-body transition active:scale-95"
          >
            <i className="fa-solid fa-right-to-bracket text-[22px]"></i>
            <span className="text-[10px] font-medium">로그인</span>
          </Link>
        )}
      </nav>
    </>
  );
}
