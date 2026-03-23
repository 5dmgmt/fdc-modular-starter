'use client';

/**
 * components/landing/default/ServicesSection.tsx
 *
 * Founders Direct の2つのサービスを横並びで紹介するセクション
 * - Founders Direct Cockpit (FDC): 目標達成プラットフォーム
 * - Claude Code Workshop: AI駆動開発ワークショップ
 */

import styles from './ServicesSection.module.css';

export default function ServicesSection() {
  return (
    <section id="services" className={styles.servicesSection}>
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTag}>SERVICES</div>
          <h2 className={styles.sectionTitle}>2つのサービスで<br className={styles.mobileBreak} />ビジネスを加速</h2>
          <p className={styles.sectionLead}>
            目標達成をサポートするSaaSと、AI駆動開発を学ぶワークショップ。<br className={styles.pcBreak} />
            あなたのビジネスに最適なサービスをお選びください。
          </p>
        </div>

        <div className={styles.servicesGrid}>
          {/* Founders Direct Cockpit */}
          <div className={styles.serviceCard}>
            <div className={styles.serviceHeader}>
              <div className={styles.serviceBadge}>SaaS</div>
              <h3 className={styles.serviceName}>Founders Direct Cockpit</h3>
              <p className={styles.serviceTagline}>OKRから現場タスクまで一気通貫</p>
            </div>

            <div className={styles.serviceBody}>
              <p className={styles.serviceDesc}>
                戦略・戦術・実行の三層構造で、チーム全員が同じゴールに向かって進める目標達成プラットフォーム。
              </p>

              <div className={styles.serviceFeatures}>
                <h4>主な機能</h4>
                <ul>
                  <li><strong>OKR管理</strong> - 目標と成果指標を設定・追跡</li>
                  <li><strong>Action Map</strong> - OKRを具体的アクションに分解</li>
                  <li><strong>TODO管理</strong> - 4象限マトリクスで優先順位整理</li>
                  <li><strong>進捗ロールアップ</strong> - 報告業務ゼロの自動化</li>
                  <li><strong>Google連携</strong> - カレンダー・タスク同期</li>
                </ul>
              </div>

              <div className={styles.pricingBox}>
                <div className={styles.trialBadge}>14日間無料トライアル</div>
                <div className={styles.priceRow}>
                  <div className={styles.planPrice}>
                    <span className={styles.planName}>Starter</span>
                    <span className={styles.price}>¥30,000<span className={styles.priceUnit}>/月〜</span></span>
                  </div>
                  <div className={styles.planPrice}>
                    <span className={styles.planName}>Team</span>
                    <span className={styles.price}>¥50,000<span className={styles.priceUnit}>/月〜</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.serviceFooter}>
              <a
                href="https://app.foundersdirect.jp/lp.html"
                className={`${styles.btn} ${styles.btnPrimary}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                詳細を見る
              </a>
              <a
                href="https://app.foundersdirect.jp/login"
                className={`${styles.btn} ${styles.btnSecondary}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                無料で試す
              </a>
            </div>
          </div>

          {/* Claude Code Workshop */}
          <div className={styles.serviceCard}>
            <div className={styles.serviceHeader}>
              <div className={styles.serviceBadge}>Workshop</div>
              <h3 className={styles.serviceName}>Claude Code Workshop</h3>
              <p className={styles.serviceTagline}>AIエージェントと作る本格SaaS開発</p>
            </div>

            <div className={styles.serviceBody}>
              <p className={styles.serviceDesc}>
                Next.js + Vercel + Supabase を使った本格的なSaaS開発を、Claude Code（AIエージェント）と一緒に学ぶハンズオンワークショップ。
              </p>

              <div className={styles.serviceFeatures}>
                <h4>学習内容</h4>
                <ul>
                  <li><strong>Claude Code活用</strong> - AIエージェントとの協働開発</li>
                  <li><strong>モダン技術スタック</strong> - Next.js, Supabase, TypeScript</li>
                  <li><strong>Gitワークフロー</strong> - ブランチ戦略・PR運用</li>
                  <li><strong>本番デプロイ</strong> - CI/CDパイプライン構築</li>
                  <li><strong>SaaS機能</strong> - 認証・権限・ワークスペース</li>
                </ul>
              </div>

              <div className={styles.pricingBox}>
                <div className={styles.trialBadge}>1週間無料トライアル（Viewモード）</div>
                <div className={styles.priceRow}>
                  <div className={styles.planPrice}>
                    <span className={styles.planName}>月額</span>
                    <span className={styles.price}>¥50,000<span className={styles.priceUnit}>/月〜</span></span>
                  </div>
                  <div className={styles.planPrice}>
                    <span className={styles.planName}>最低期間</span>
                    <span className={styles.priceMeta}>6ヶ月</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.serviceFooter}>
              <a
                href="https://workshop.foundersdirect.jp/"
                className={`${styles.btn} ${styles.btnPrimary}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                詳細を見る
              </a>
              <a
                href="https://workshop.foundersdirect.jp/login"
                className={`${styles.btn} ${styles.btnSecondary}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                無料で試す
              </a>
            </div>
          </div>
        </div>

        {/* 比較表 */}
        <div className={styles.comparisonSection}>
          <h3 className={styles.comparisonTitle}>どちらを選ぶべき？</h3>
          <div className={styles.comparisonGrid}>
            <div className={styles.comparisonCard}>
              <div className={styles.comparisonIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h4>FDCがおすすめの方</h4>
              <ul>
                <li>チームの目標管理を効率化したい</li>
                <li>戦略から実行まで一貫した仕組みが欲しい</li>
                <li>既存のツール（Googleカレンダー等）と連携したい</li>
                <li>すぐに使えるSaaSを探している</li>
              </ul>
            </div>
            <div className={styles.comparisonCard}>
              <div className={styles.comparisonIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h4>Workshopがおすすめの方</h4>
              <ul>
                <li>AIを使った開発スキルを身につけたい</li>
                <li>自社専用のSaaSを構築したい</li>
                <li>モダンな技術スタックを学びたい</li>
                <li>プログラミング未経験でも挑戦したい</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
