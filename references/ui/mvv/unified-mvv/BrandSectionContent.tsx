/**
 * app/_components/mvv/unified-mvv/BrandSectionContent.tsx
 *
 * Phase 14.35: ブランド指針セクションコンポーネント（※Workshop Phase 15: Brand設定）
 * 10要素版ブランドガイドライン対応
 */

'use client';

import { memo, useState } from 'react';
import {
  Eye,
  Edit3,
  Save,
  Trash2,
  User,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Heart,
  Shield,
  Zap,
  Fingerprint,
  Users,
  Trophy,
  Palette,
  Megaphone,
  Brain,
} from 'lucide-react';
import { Gem } from 'lucide-react';
import { useBrandViewModel, TonmanaCheckResult } from '@/lib/hooks/useBrandViewModel';
import type { Brand } from '@/lib/types/app-data';

interface BrandSectionContentProps {
  vm: ReturnType<typeof useBrandViewModel>;
}

// 10要素の定義
const BRAND_SECTIONS = [
  {
    id: 'clarity',
    title: '1. Clarity（明確性）',
    description: 'ブランドが何を表しているか、価値観・ポジショニング・提案が明確か',
    icon: Lightbulb,
    fields: [
      { key: 'brandRepresents' as keyof Brand, label: 'ブランドが表すもの' },
      { key: 'values' as keyof Brand, label: '価値観' },
      { key: 'positioning' as keyof Brand, label: 'ポジショニング' },
      { key: 'valueProposition' as keyof Brand, label: '提供価値（バリュープロポジション）' },
    ],
  },
  {
    id: 'commitment',
    title: '2. Commitment（コミットメント）',
    description: 'ブランドの重要性に対する組織の信念と投資',
    icon: Heart,
    fields: [
      { key: 'investmentPolicy' as keyof Brand, label: 'ブランドへの投資方針' },
      { key: 'managementInvolvement' as keyof Brand, label: '経営者の関与' },
    ],
  },
  {
    id: 'protection',
    title: '3. Protection（保護）',
    description: 'ブランド資産の法的・戦略的保護',
    icon: Shield,
    fields: [
      { key: 'intellectualProperty' as keyof Brand, label: '商標・知的財産' },
      { key: 'usageRules' as keyof Brand, label: '使用許諾ルール' },
      { key: 'prohibitions' as keyof Brand, label: '禁止事項' },
    ],
  },
  {
    id: 'responsiveness',
    title: '4. Responsiveness（応答性）',
    description: '市場変化や顧客ニーズへの対応力',
    icon: Zap,
    fields: [
      { key: 'customerResponsePolicy' as keyof Brand, label: '顧客対応方針' },
      { key: 'marketChangePolicy' as keyof Brand, label: '市場変化への対応方針' },
    ],
  },
  {
    id: 'authenticity',
    title: '5. Authenticity（真正性）',
    description: 'ブランドの物語と体験が本物であること',
    icon: Fingerprint,
    fields: [
      { key: 'brandPersonality' as keyof Brand, label: 'ブランドの人格・性格' },
      { key: 'brandBehavior' as keyof Brand, label: 'ブランドらしい振る舞い' },
      { key: 'nonBrandBehavior' as keyof Brand, label: 'ブランドらしくない振る舞い' },
    ],
  },
  {
    id: 'relevance',
    title: '6. Relevance（関連性）',
    description: '顧客のニーズ・欲求に合致しているか',
    icon: Users,
    fields: [
      { key: 'primaryTarget' as keyof Brand, label: '主要ターゲット' },
      { key: 'targetInsights' as keyof Brand, label: 'ターゲットのニーズ・インサイト' },
      { key: 'excludedTarget' as keyof Brand, label: '除外ターゲット' },
    ],
  },
  {
    id: 'differentiation',
    title: '7. Differentiation（差別化）',
    description: '競合と明確に異なると顧客が認識しているか',
    icon: Trophy,
    fields: [
      { key: 'competitiveDifference' as keyof Brand, label: '競合との違い' },
      { key: 'usp' as keyof Brand, label: '独自の価値（USP）' },
    ],
  },
  {
    id: 'consistency',
    title: '8. Consistency（一貫性）',
    description: '全接点で一貫した体験を提供しているか',
    icon: Palette,
    fields: [
      { key: 'tone' as keyof Brand, label: 'トーン＆マナー' },
      { key: 'visualGuidelines' as keyof Brand, label: 'ビジュアル規定' },
      { key: 'wordsUse' as keyof Brand, label: '使うキーワード' },
      { key: 'wordsAvoid' as keyof Brand, label: '避けるキーワード' },
    ],
  },
  {
    id: 'presence',
    title: '9. Presence（存在感）',
    description: '顧客の心の中に存在し、想起されるか',
    icon: Megaphone,
    fields: [
      { key: 'coreMessage' as keyof Brand, label: 'コアメッセージ' },
      { key: 'tagline' as keyof Brand, label: 'タグライン' },
      { key: 'channels' as keyof Brand, label: '発信チャネル' },
    ],
  },
  {
    id: 'understanding',
    title: '10. Understanding（理解）',
    description: '顧客がブランドの独自性を理解しているか',
    icon: Brain,
    fields: [
      { key: 'wantToBeUnderstood' as keyof Brand, label: '顧客に理解してほしいこと' },
      { key: 'commonMisunderstandings' as keyof Brand, label: '誤解されやすいこと' },
    ],
  },
];

export const BrandSectionContent = memo(function BrandSectionContent({ vm }: BrandSectionContentProps) {
  const {
    profiles,
    brand,
    editProfiles,
    editBrand,
    editMode,
    saving,
    tonmanaText,
    tonmanaResults,
    toggleEditMode,
    saveAll,
    updateEditProfile,
    updateEditBrand,
    setTonmanaText,
    checkTonmana,
    clearTonmanaResults,
  } = vm;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button onClick={toggleEditMode} className="btn btn-secondary" style={{ marginRight: '10px' }}>
          {editMode ? <Eye size={16} style={{ marginRight: '4px' }} /> : <Edit3 size={16} style={{ marginRight: '4px' }} />}
          {editMode ? '表示モード' : '編集モード'}
        </button>
        {editMode && (
          <button onClick={saveAll} disabled={saving} className="btn btn-primary">
            <Save size={16} style={{ marginRight: '4px' }} />
            {saving ? '保存中...' : '保存'}
          </button>
        )}
      </div>

      {/* プロフィール */}
      <ProfileSubSection
        profiles={profiles}
        editProfiles={editProfiles}
        editMode={editMode}
        updateEditProfile={updateEditProfile}
      />

      {/* ブランドガイドライン（10要素版） */}
      <BrandGuidelinesSubSection
        brand={brand}
        editBrand={editBrand}
        editMode={editMode}
        updateEditBrand={updateEditBrand}
      />

      {/* トンマナチェッカー */}
      <TonmanaCheckerSubSection
        tonmanaText={tonmanaText}
        tonmanaResults={tonmanaResults}
        setTonmanaText={setTonmanaText}
        checkTonmana={checkTonmana}
        clearTonmanaResults={clearTonmanaResults}
      />
    </div>
  );
});

// プロフィールサブセクション
function ProfileSubSection({
  profiles,
  editProfiles,
  editMode,
  updateEditProfile,
}: {
  profiles: ReturnType<typeof useBrandViewModel>['profiles'];
  editProfiles: ReturnType<typeof useBrandViewModel>['editProfiles'];
  editMode: boolean;
  updateEditProfile: ReturnType<typeof useBrandViewModel>['updateEditProfile'];
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <User size={18} /> プロフィール
      </h3>
      <div style={{ display: 'grid', gap: '12px' }}>
        {(['bio', 'x', 'facebook', 'note', 'instagram'] as const).map((key) => {
          const labels: Record<string, string> = {
            bio: '自己紹介',
            x: 'X (Twitter)',
            facebook: 'Facebook',
            note: 'Note',
            instagram: 'Instagram'
          };
          return (
            <div key={key} style={{ padding: '12px', background: 'var(--bg-gray)', borderRadius: '6px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '4px' }}>{labels[key]}</div>
              {editMode ? (
                key === 'bio' ? (
                  <textarea
                    value={editProfiles[key]}
                    onChange={(e) => updateEditProfile(key, e.target.value)}
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                ) : (
                  <input
                    type="text"
                    value={editProfiles[key]}
                    onChange={(e) => updateEditProfile(key, e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                )
              ) : (
                <div style={{
                  color: profiles[key] ? 'var(--text-dark)' : 'var(--text-light)',
                  fontSize: '14px',
                  whiteSpace: key === 'bio' ? 'pre-wrap' : 'normal'
                }}>
                  {profiles[key] || '未設定'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ブランドガイドラインサブセクション（10要素版）
function BrandGuidelinesSubSection({
  brand,
  editBrand,
  editMode,
  updateEditBrand,
}: {
  brand: ReturnType<typeof useBrandViewModel>['brand'];
  editBrand: ReturnType<typeof useBrandViewModel>['editBrand'];
  editMode: boolean;
  updateEditBrand: ReturnType<typeof useBrandViewModel>['updateEditBrand'];
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['clarity', 'presence', 'consistency']));

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Gem size={18} /> ブランドガイドライン（10要素版）
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {BRAND_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isExpanded = expandedSections.has(section.id);
          const hasContent = section.fields.some(f => brand[f.key]);

          return (
            <div
              key={section.id}
              style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                overflow: 'hidden',
              }}
            >
              {/* セクションヘッダー */}
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  background: isExpanded ? 'var(--primary-alpha-08)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {isExpanded ? <ChevronDown size={16} color="var(--primary)" /> : <ChevronRight size={16} color="var(--primary)" />}
                <Icon size={18} style={{ color: 'var(--primary)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-dark)' }}>
                    {section.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    {section.description}
                  </div>
                </div>
                {hasContent && (
                  <span style={{
                    padding: '2px 8px',
                    background: 'var(--primary-alpha-20)',
                    borderRadius: '10px',
                    fontSize: '11px',
                    color: 'var(--primary-dark)',
                  }}>
                    入力済
                  </span>
                )}
              </button>

              {/* セクションコンテンツ */}
              {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 500,
                          color: 'var(--primary)',
                          marginBottom: '4px',
                        }}>
                          {field.label}
                        </label>
                        {editMode ? (
                          <textarea
                            value={editBrand[field.key]}
                            onChange={(e) => updateEditBrand(field.key, e.target.value)}
                            rows={2}
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              padding: '8px',
                              border: '1px solid var(--border)',
                              borderRadius: '4px',
                              fontSize: '14px',
                            }}
                          />
                        ) : (
                          <div style={{
                            padding: '8px',
                            background: 'var(--bg-gray)',
                            borderRadius: '4px',
                            color: brand[field.key] ? 'var(--text-dark)' : 'var(--text-light)',
                            fontSize: '14px',
                            minHeight: '36px',
                            whiteSpace: 'pre-wrap',
                          }}>
                            {brand[field.key] || '未設定'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// トンマナチェッカーサブセクション
function TonmanaCheckerSubSection({
  tonmanaText,
  tonmanaResults,
  setTonmanaText,
  checkTonmana,
  clearTonmanaResults,
}: {
  tonmanaText: string;
  tonmanaResults: TonmanaCheckResult[];
  setTonmanaText: (text: string) => void;
  checkTonmana: () => void;
  clearTonmanaResults: () => void;
}) {
  return (
    <div>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <MessageCircle size={18} /> トンマナチェッカー
      </h3>
      <textarea
        value={tonmanaText}
        onChange={(e) => setTonmanaText(e.target.value)}
        placeholder="チェックしたいテキストを入力..."
        style={{ width: '100%', minHeight: '100px', marginBottom: '12px', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button onClick={checkTonmana} className="btn btn-primary">
          <Search size={16} style={{ marginRight: '4px' }} /> チェック実行
        </button>
        {tonmanaResults.length > 0 && (
          <button onClick={clearTonmanaResults} className="btn btn-secondary">
            <Trash2 size={16} style={{ marginRight: '4px' }} /> クリア
          </button>
        )}
      </div>
      {tonmanaResults.length > 0 && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {tonmanaResults.map((result, index) => {
            const colors = { success: 'var(--primary)', error: '#f44336', warning: '#FF9800', info: 'var(--primary-alpha-60)' };
            const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, info: Info };
            const Icon = icons[result.type];
            return (
              <div key={index} style={{
                padding: '12px',
                background: 'var(--bg-gray)',
                borderRadius: '6px',
                borderLeft: `4px solid ${colors[result.type]}`
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                  fontWeight: 600,
                  color: colors[result.type]
                }}>
                  <Icon size={16} /> {result.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-medium)' }}>
                  {result.items.join(', ')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
