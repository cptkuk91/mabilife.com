"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hide Navbar on search and login page
  if (pathname === "/search" || pathname === "/login") return null;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="global-nav">
      <div className="nav-content">
        <Link href="/" className="nav-logo">
          <i className="fa-solid fa-leaf"></i> Mabi Life
        </Link>
        <div className="nav-links">
          <Link href="#">한국어</Link>
          <Link href="#">일본어</Link>
        </div>
        <div className="nav-menu">
          <Link href="/guide" className={pathname === "/guide" ? "active" : ""}>공략</Link>
          <Link href="/community" className={pathname === "/community" ? "active" : ""}>커뮤니티</Link>
        </div>
        
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
            <button className="write-btn" style={{padding: '6px 16px', fontSize: '12px'}}>로그인</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
