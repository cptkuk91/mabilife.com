"use client";

import styles from './homework.module.css';

export default function HomeworkClient() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>오늘의 숙제</h1>
        <p className={styles.description}>매일매일 챙겨야 할 할 일들을 관리해보세요.</p>
      </div>
      
      <div className={styles.emptyState}>
        <i className={`fa-solid fa-list-check ${styles.icon}`}></i>
        <h2>서비스 준비중</h2>
        <p>
          숙제 관리 기능을 열심히 개발하고 있습니다.<br/>
          곧 만나보실 수 있습니다!
        </p>
      </div>
    </div>
  );
}
