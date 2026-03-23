'use client';

/**
 * components/landing/default/LandingPage.tsx
 *
 * Founders Direct Cockpit ランディングページ（デフォルトテナント用）
 * Phase 14.6.3: 各セクションをコンポーネントに分割し、ここで統合
 *
 * テナント別LP構造:
 * - components/landing/default/  - デフォルトLP（app テナント）
 * - components/landing/shared/   - 共通コンポーネント
 * - components/landing/{tenant}/ - テナント別LP
 */

import styles from './LandingPage.module.css';
import LandingHeader from '../shared/LandingHeader';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import PricingSection from './PricingSection';
import FAQSection from './FAQSection';
import ContactForm from '../shared/ContactForm';
import LandingFooter from '../shared/LandingFooter';

export default function LandingPage() {
  return (
    <div className={styles.landingPage}>
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <FAQSection />
        <ContactForm />
      </main>
      <LandingFooter />
    </div>
  );
}
