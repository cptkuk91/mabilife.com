"use client";

import styles from './ranking.module.css';

export default function RankingClient() {
  return (
    <div className={styles.container}>
      <i className={`fa-solid fa-trophy ${styles.icon}`}></i>
      <h1 className={styles.title}>랭킹 서비스 준비중</h1>
      <p className={styles.description}>
        더 나은 서비스를 위해 랭킹 시스템을 개발하고 있습니다.<br/>
        조금만 기다려주세요!
      </p>
    </div>
  );
}
