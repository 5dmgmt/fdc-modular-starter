/**
 * app/_components/mvv/UnifiedMVVTab.tsx
 *
 * Phase 14.35: 統合MVVタブコンポーネント（※Workshop Phase 17: MVV統合タブ）
 * 979行 → 約75行 (92%削減)
 *
 * 【機能】
 * 以下の3つのセクションを1つのタブに統合:
 * 1. MVV（Mission, Vision, Value）
 * 2. リーンキャンバス（9要素 + 顧客の本質 + 商品構造 + カスタマージャーニー）
 * 3. ブランド指針（プロフィール + ブランドガイドライン + トンマナチェッカー）
 */

'use client';

import { Target, Layers, Gem } from 'lucide-react';
import { useMVVViewModel } from '@/lib/hooks/useMVVViewModel';
import { useLeanCanvasViewModel } from '@/lib/hooks/useLeanCanvasViewModel';
import { useBrandViewModel } from '@/lib/hooks/useBrandViewModel';
import {
  CollapsibleSection,
  MVVSection,
  LeanCanvasSectionContent,
  BrandSectionContent,
} from './unified-mvv';

// スケルトンUI用のプレースホルダー（コンポーネント外で定義）
function SkeletonBlock({ height = '80px' }: { height?: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '8px',
        height,
      }}
    />
  );
}

function SkeletonSection({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        marginBottom: '16px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 20px',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          borderBottom: `2px solid ${color}30`,
        }}
      >
        <span style={{ color }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: '18px' }}>{title}</span>
      </div>
      <div style={{ padding: '20px' }}>
        <SkeletonBlock height="60px" />
        <div style={{ marginTop: '12px' }}>
          <SkeletonBlock height="40px" />
        </div>
      </div>
    </div>
  );
}

export function UnifiedMVVTab() {
  const mvvVm = useMVVViewModel();
  const leanCanvasVm = useLeanCanvasViewModel();
  const brandVm = useBrandViewModel();

  const loading = mvvVm.loading || leanCanvasVm.loading || brandVm.loading;

  if (loading) {
    return (
      <div className="section">
        {/* ページタイトル */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '28px' }}>
            <Target size={32} /> MVV
          </h1>
          <p style={{ margin: '8px 0 0 0', color: 'var(--text-light)' }}>
            ビジョン・ミッション・バリューから事業設計まで、すべてを一元管理します。
          </p>
        </div>

        {/* スケルトンセクション */}
        <SkeletonSection title="MVV（Mission, Vision, Value）" icon={<Target size={24} />} color="var(--primary)" />
        <SkeletonSection title="リーンキャンバス" icon={<Layers size={24} />} color="var(--primary)" />
        <SkeletonSection title="ブランド指針" icon={<Gem size={24} />} color="var(--primary)" />

        {/* アニメーション定義 */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="section">
      {/* ページタイトル */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0, fontSize: '28px' }}>
          <Target size={32} /> MVV
        </h1>
        <p style={{ margin: '8px 0 0 0', color: 'var(--text-light)' }}>
          ビジョン・ミッション・バリューから事業設計まで、すべてを一元管理します。
        </p>
      </div>

      {/* 1. MVV セクション */}
      <CollapsibleSection
        title="MVV（Mission, Vision, Value）"
        icon={<Target size={24} />}
        color="var(--primary)"
        defaultOpen={true}
      >
        <MVVSection
          mvv={mvvVm.mvv}
          editMVV={mvvVm.editMVV}
          editMode={mvvVm.editMode}
          saving={mvvVm.saving}
          onToggleMode={mvvVm.toggleEditMode}
          onUpdateField={mvvVm.updateEditMVV}
          onSave={mvvVm.saveMVV}
        />
      </CollapsibleSection>

      {/* 2. リーンキャンバス セクション */}
      <CollapsibleSection
        title="リーンキャンバス"
        icon={<Layers size={24} />}
        color="var(--primary)"
        defaultOpen={false}
      >
        <LeanCanvasSectionContent vm={leanCanvasVm} />
      </CollapsibleSection>

      {/* 3. ブランド指針 セクション */}
      <CollapsibleSection
        title="ブランド指針"
        icon={<Gem size={24} />}
        color="var(--primary)"
        defaultOpen={false}
      >
        <BrandSectionContent vm={brandVm} />
      </CollapsibleSection>
    </div>
  );
}

export default UnifiedMVVTab;
