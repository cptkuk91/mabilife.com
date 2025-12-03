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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false);
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
            <Link href="/community" className={pathname === "/community" || pathname?.startsWith("/community/") ? "active" : ""}>커뮤니티</Link>
          </div>

          <div className="nav-actions">
            <a
              href="https://discord.gg/VRqwWzfq"
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
        <Link href="/" className={`dock-item ${pathname === "/" ? "active" : ""}`}>
          <i className="fa-solid fa-house"></i>
          <span>홈</span>
        </Link>
        <Link href="/guide" className={`dock-item ${pathname === "/guide" || pathname?.startsWith("/guide/") ? "active" : ""}`}>
          <i className="fa-solid fa-book"></i>
          <span>공략</span>
        </Link>
        <Link href="/community" className={`dock-item ${pathname === "/community" || pathname?.startsWith("/community/") ? "active" : ""}`}>
          <i className="fa-solid fa-comments"></i>
          <span>커뮤니티</span>
        </Link>
        <a
          href="https://discord.gg/VRqwWzfq"
          target="_blank"
          rel="noopener noreferrer"
          className="dock-item"
        >
          <i className="fa-brands fa-discord"></i>
          <span>디스코드</span>
        </a>
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
              <div className="mobile-dropdown">
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
