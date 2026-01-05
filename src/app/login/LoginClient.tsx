"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import styles from "./login.module.css";

export default function LoginClient() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div>
          <Link href="/" className={styles.logo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}>
            <i className="fa-solid fa-leaf"></i> MabiLife 
            <span style={{ fontSize: '0.8em', opacity: 0.5, margin: '0 4px' }}>X</span>
            <Image src="/assets/logo/kakao-logo.webp" alt="GG FACTORY" width={24} height={24} style={{ height: '24px', width: 'auto' }} />
            <span style={{ color: '#F7A51A' }}>GG FACTORY</span>
          </Link>
          <p className={styles.desc}>에린의 모험가들과 함께하세요.</p>
        </div>

        <button className={styles.googleBtn} onClick={() => signIn("google", { callbackUrl: "/" })}>
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google Logo" 
            className={styles.googleIcon} 
          />
          Google 계정으로 계속하기
        </button>

        <div style={{fontSize: '13px', color: '#888', marginTop: '10px'}}>
          계속 진행하면 <Link href="https://www.kakao.gg/terms" style={{textDecoration: 'underline'}}>이용약관</Link> 및 <Link href="https://www.kakao.gg/privacy" style={{textDecoration: 'underline'}}>개인정보처리방침</Link>에 동의하게 됩니다.
        </div>
      </div>
    </div>
  );
}
