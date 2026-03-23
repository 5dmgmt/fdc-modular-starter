'use client';

/**
 * components/landing/shared/ContactForm.tsx
 * ランディングページのお問い合わせフォーム（CTAセクション）
 * 共通コンポーネント：全テナントで使用
 */

import { useState } from 'react';
import styles from '../default/LandingPage.module.css';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    googleEmail: '',
    companyName: '',
    name: '',
    position: '',
    phone: '',
    birthDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('送信に失敗しました');
      }

      setSubmitStatus('success');
      setFormData({
        googleEmail: '',
        companyName: '',
        name: '',
        position: '',
        phone: '',
        birthDate: '',
      });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cta" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.ctaSection}>
          {submitStatus === 'success' ? (
            /* サンキューフォーム */
            <div className={styles.thankYouSection}>
              <div className={styles.thankYouIcon}>✓</div>
              <h2 className={styles.ctaTitle}>お申し込みありがとうございます！</h2>
              <p className={styles.thankYouMessage}>
                無料トライアルへのお申し込みを受け付けました。<br />
                <strong>1営業日以内</strong>に、ご入力いただいた<br />
                <strong>Gmail / Google Workspace</strong> 宛に登録完了メールをお送りいたします。
              </p>
              <div className={styles.thankYouDetails}>
                <p>
                  メールが届きましたら、<strong>そのGmail / Google Workspaceアドレスでログイン</strong>して<br />
                  すぐにFounders Direct Cockpitをご利用いただけます。
                </p>
                <p className={styles.thankYouNote}>
                  ※ メールが届かない場合は、迷惑メールフォルダをご確認いただくか、<br />
                  <a href="mailto:mochizuki@5dmgmt.com">mochizuki@5dmgmt.com</a> までお問い合わせください。
                </p>
              </div>
              <button
                onClick={() => setSubmitStatus('idle')}
                className={styles.ctaBtn}
              >
                フォームに戻る
              </button>
            </div>
          ) : (
            /* 申し込みフォーム */
            <>
              <h2 className={styles.ctaTitle}>次の四半期、目標達成率を劇的に変えませんか？</h2>
              <p className={styles.ctaLead}>
                もう、戦略が「絵に描いた餅」で終わることはありません。<br />
                FDCで、チーム一丸となってゴールを目指す体験を。まずは無料でお試しください。
              </p>

              <form onSubmit={handleSubmit} className={styles.ctaForm}>
                {/* 必須項目（3つ） */}
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="googleEmail" className={styles.formLabel}>
                      Gmail / Google Workspace <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      id="googleEmail"
                      name="googleEmail"
                      value={formData.googleEmail}
                      onChange={handleInputChange}
                      required
                      placeholder="example@gmail.com"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="companyName" className={styles.formLabel}>
                      会社名 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                      placeholder="株式会社〇〇"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>
                      お名前 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="山田 太郎"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="position" className={styles.formLabel}>
                      役職名 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="position"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      placeholder="代表取締役 / マネージャー など"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.formLabel}>
                      携帯番号
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="090-1234-5678"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="birthDate" className={styles.formLabel}>
                      生年月日
                    </label>
                    <input
                      type="date"
                      id="birthDate"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.ctaBtn}
                >
                  {isSubmitting ? '送信中...' : '14日間無料で試す'}
                </button>
                <p className={styles.ctaReassurance}>
                  クレジットカード不要 · いつでも解約OK · 1営業日以内にご案内
                </p>

                {submitStatus === 'error' && (
                  <p className={styles.formError}>
                    エラーが発生しました。お手数ですが、直接 mochizuki@5dmgmt.com までご連絡ください。
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
