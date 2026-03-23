'use client';

/**
 * components/landing/HeroSection.tsx
 * ランディングページのヒーローセクション
 */

import Image from 'next/image';
import styles from './LandingPage.module.css';

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <p className={styles.heroCatch}>みんなごきげん♪ そんな会社をあたり前に♪</p>
        <h1 className={styles.heroTitle}>従業員満足度の高い会社は、<br />なぜ企業価値も高いのか。</h1>
        <p className={styles.heroLead}>
          PEファンドで100社以上の投資先を見てきた結論——それは「戦略と現場が繋がっている会社」でした。<br className={styles.pcBreak} />
          FDCは戦略・戦術・実行を一気通貫で連携させ、組織全体の迷いと無駄を解消する、役職員をごきげんにするSaaSです。
        </p>
        <div className={styles.heroActions}>
          <a href="#cta" className={`${styles.btn} ${styles.btnPrimary}`}>14日間無料で試す</a>
          <a href="#features" className={`${styles.btn} ${styles.btnSecondary}`}>機能を見る</a>
        </div>
        <p className={styles.heroReassurance}>クレジットカード不要 · いつでも解約OK · 5分で開始</p>
        <div className={styles.heroImageContainer}>
          <Image
            src="/images/fdc-dashboard.png"
            alt="Founders Direct Cockpitのダッシュボード画面"
            className={styles.heroImage}
            width={1200}
            height={675}
            priority
          />
        </div>
      </div>
    </section>
  );
}
