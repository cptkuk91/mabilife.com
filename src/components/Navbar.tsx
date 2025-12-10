"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const linkDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false);
      }
      if (linkDropdownRef.current && !linkDropdownRef.current.contains(event.target as Node)) {
        setIsLinkDropdownOpen(false);
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
      {/* Desktop Navigation */}
      <nav className="global-nav">
        <div className="nav-content">
          <Link href="/" className="nav-logo">
            <i className="fa-solid fa-leaf"></i> Mabi Life
          </Link>

          <div className="nav-menu">
            <Link href="/guide" className={pathname === "/guide" || pathname?.startsWith("/guide/") ? "active" : ""}>공략</Link>
            <Link href="/runes" className={pathname === "/runes" || pathname?.startsWith("/runes/") ? "active" : ""}>추천 룬</Link>
            <Link href="/ranking" className={pathname === "/ranking" || pathname?.startsWith("/ranking/") ? "active" : ""}>랭킹</Link>
            <Link href="/homework" className={pathname === "/homework" || pathname?.startsWith("/homework/") ? "active" : ""}>숙제</Link>
            <Link href="/community" className={pathname === "/community" || pathname?.startsWith("/community/") ? "active" : ""}>커뮤니티</Link>
          </div>

          <div className="nav-actions">
            <a
              href="https://discord.gg/yYrxEhUw"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-icon-btn"
              title="디스코드"
            >
              <i className="fa-brands fa-discord"></i>
            </a>
            <a
              href="https://link.kakao.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-icon-btn"
              title="퀵링크"
            >
              <i className="fa-solid fa-link"></i>
            </a>

            {session ? (
              <div className="nav-profile-container" ref={dropdownRef}>
                <img
                  src={session.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"}
                  alt="Profile"
                  className="nav-profile-img"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />

                {isDropdownOpen && (
                  <div className="nav-dropdown">
                    <div className="dropdown-user-info">
                      <div className="dropdown-name">{session.user?.name}</div>
                      <div className="dropdown-email">{session.user?.email}</div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link href="/profile" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                      <i className="fa-regular fa-user"></i> 마이페이지
                    </Link>
                    <div className="dropdown-item" onClick={() => signOut()}>
                      <i className="fa-solid fa-arrow-right-from-bracket"></i> 로그아웃
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <button className="nav-login-btn">로그인</button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Dock Navigation */}
      <nav className="mobile-dock">
        {/* 1. 홈 */}
        <Link href="/" className={`dock-item ${pathname === "/" && !isMenuOpen ? "active" : ""}`}>
          <i className="fa-solid fa-house"></i>
          <span>홈</span>
        </Link>
        
        {/* 2. 메뉴 (Toggle) */}
        <div className="dock-item-wrapper" ref={menuRef}>
            <div 
                className={`dock-item ${isMenuOpen ? "active" : ""}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <i className="fa-solid fa-bars"></i>
                <span>메뉴</span>
            </div>

            {/* 그리드 메뉴 패널 */}
            {isMenuOpen && (
                <div className="mobile-menu-panel">
                    <div className="menu-grid">
                        <Link href="/guide" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-book"></i></div>
                            <span>공략</span>
                        </Link>
                        <Link href="/runes" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-gem"></i></div>
                            <span>추천 룬</span>
                        </Link>
                        <Link href="/ranking" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-trophy"></i></div>
                            <span>랭킹</span>
                        </Link>
                        <Link href="/homework" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-list-check"></i></div>
                            <span>숙제</span>
                        </Link>
                        <Link href="/community" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-comments"></i></div>
                            <span>커뮤니티</span>
                        </Link>
                        <Link href="/statistics" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-chart-pie"></i></div>
                            <span>통계</span>
                        </Link>
                        <a href="https://discord.gg/yYrxEhUw" target="_blank" rel="noopener noreferrer" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-brands fa-discord"></i></div>
                            <span>디스코드</span>
                        </a>
                         <a href="https://link.kakao.gg" target="_blank" rel="noopener noreferrer" className="menu-grid-item" onClick={() => setIsMenuOpen(false)}>
                            <div className="menu-icon"><i className="fa-solid fa-link"></i></div>
                            <span>퀵링크</span>
                        </a>
                    </div>
                </div>
            )}
        </div>

        {/* 3. MY / 로그인 */}
        {session ? (
          <div className="dock-item-wrapper" ref={mobileDropdownRef}>
            <div
              className={`dock-item dock-profile ${pathname === "/profile" ? "active" : ""}`}
              onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
            >
              <img
                src={session.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${(session.user as any)?.id || 'user'}`}
                alt="Profile"
                className="dock-profile-img"
              />
              <span>MY</span>
            </div>

            {isMobileDropdownOpen && (
              <div className="mobile-dropdown mobile-dropdown-right">
                <Link
                  href="/profile"
                  className="mobile-dropdown-item"
                  onClick={() => setIsMobileDropdownOpen(false)}
                >
                  <i className="fa-regular fa-user"></i>
                  <span>마이페이지</span>
                </Link>
                <div
                  className="mobile-dropdown-item"
                  onClick={() => {
                    setIsMobileDropdownOpen(false);
                    signOut();
                  }}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket"></i>
                  <span>로그아웃</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="dock-item">
            <i className="fa-solid fa-right-to-bracket"></i>
            <span>로그인</span>
          </Link>
        )}
      </nav>
    </>
  );
}
