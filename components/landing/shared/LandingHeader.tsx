'use client';

/**
 * components/landing/shared/LandingHeader.tsx
 * ランディングページのヘッダー・ナビゲーション
 * 共通コンポーネント：全テナントで使用
 */

import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import styles from '../default/LandingPage.module.css';

export default function LandingHeader() {
  useEffect(() => {
    // ヘッダーのスクロール時シャドウ効果
    const header = document.querySelector(`.${styles.mainHeader}`);
    const handleScroll = () => {
      if (header) {
        if (window.scrollY > 10) {
          header.classList.add(styles.isScrolled);
        } else {
          header.classList.remove(styles.isScrolled);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={styles.mainHeader}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/apple-touch-icon.png"
            alt="FDC"
            width={32}
            height={32}
            priority
            className={styles.logoIcon}
          />
          Founders Direct <span className={styles.logoAccent}>Cockpit</span>
        </Link>
        <nav className={styles.mainNav}>
          <a href="#features">機能</a>
          <a href="#architecture">思想</a>
          <a href="#testimonials">お客様の声</a>
          <a href="#pricing">料金プラン</a>
          <a href="#security">セキュリティ</a>
          <a href="#faq">FAQ</a>
          <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>ログイン</Link>
        </nav>
      </div>
    </header>
  );
}
