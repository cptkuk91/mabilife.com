import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo}>
            Mabi Life
          </div>
          <p className={styles.disclaimer}>
            &copy; {new Date().getFullYear()}. Mabi Life All rights reserved.
            <br />
            This site is not associated with Nexon & Mabinogi Mobile.
          </p>
          <div className={styles.links}>
            <a href="https://www.kakao.gg/terms" target="_blank" rel="noopener noreferrer" className={styles.link}>Terms of Service</a>
            <a href="https://www.kakao.gg/privacy" target="_blank" rel="noopener noreferrer" className={styles.link}>Privacy Policy</a>
            <a href="https://www.instagram.com/next.uri/" target="_blank" rel="noopener noreferrer" className={styles.link}>Instagram</a>
          </div>

        </div>
      </div>
    </footer>
  );
}
