/**
 * app/_components/brand/BrandTab.tsx
 *
 * Phase 9.92-D: ブランド指針タブの React 実装（※Workshop Phase 15: Brand設定）
 *
 * 【責務】
 * - プロフィール（bio, x, facebook, note, instagram）の表示・編集
 * - ブランド指針（coreMessage, tone, wordsUse, wordsAvoid）の表示・編集
 * - トンマナチェック機能
 *
 * 【Legacy関数マッピング】
 * | Legacy 関数名 | 新 ViewModel 関数名 | 備考 |
 * |---------------|---------------------|------|
 * | renderBrandProfile() | ProfileSection | UI は JSX で表現 |
 * | renderBrandGuidelines() | GuidelinesSection | UI は JSX で表現 |
 * | toggleBrandProfileEditMode() | toggleProfileEditMode() | 編集モード切り替え |
 * | toggleBrandGuidelinesEditMode() | toggleBrandEditMode() | 編集モード切り替え |
 * | saveBrandProfile() | saveProfile() | プロフィール保存 |
 * | saveBrandGuidelines() | saveBrand() | ブランド指針保存 |
 * | checkTonmana() | checkTonmana() | トンマナチェック |
 */

'use client';

import { Gem, User, MessageCircle, Edit3, Save, Eye } from 'lucide-react';
import { useBrandViewModel } from '@/lib/hooks/useBrandViewModel';
import {
  SectionCard,
  ProfileDisplaySection,
  ProfileEditSection,
  GuidelinesDisplaySection,
  GuidelinesEditSection,
  TonmanaCheckSection,
} from './components';

// ========================================
// メインコンポーネント
// ========================================

export function BrandTab() {
  const {
    profiles,
    brand,
    editProfiles,
    editBrand,
    editMode,
    loading,
    saving,
    error,
    tonmanaText,
    tonmanaResults,
    toggleEditMode,
    saveAll,
    updateEditProfile,
    updateEditBrand,
    setTonmanaText,
    checkTonmana,
    clearTonmanaResults,
  } = useBrandViewModel();

  if (loading) {
    return (
      <div className="section">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gem size={24} /> ブランド指針
        </h2>
        <div className="card">
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '40px' }}>
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gem size={24} /> ブランド指針
        </h2>
        <div className="card">
          <div className="alert alert-error">
            エラー: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      {/* メインヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Gem size={24} /> ブランド指針
          </h2>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-light)' }}>
            プロフィールとブランドガイドラインを設定します。
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={toggleEditMode}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {editMode ? <Eye size={16} /> : <Edit3 size={16} />}
            {editMode ? '表示モード' : '編集モード'}
          </button>
          {editMode && (
            <button
              onClick={saveAll}
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Save size={16} />
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>

      {/* プロフィールセクション */}
      <SectionCard
        title="プロフィール"
        icon={<User size={18} />}
      >
        {editMode ? (
          <ProfileEditSection
            editProfiles={editProfiles}
            onUpdate={updateEditProfile}
          />
        ) : (
          <ProfileDisplaySection profiles={profiles} />
        )}
      </SectionCard>

      {/* ブランド指針セクション */}
      <SectionCard
        title="ブランドガイドライン"
        icon={<Gem size={18} />}
      >
        {editMode ? (
          <GuidelinesEditSection
            editBrand={editBrand}
            onUpdate={updateEditBrand}
          />
        ) : (
          <GuidelinesDisplaySection brand={brand} />
        )}
      </SectionCard>

      {/* トンマナチェックセクション */}
      <SectionCard
        title="トンマナチェッカー"
        icon={<MessageCircle size={18} />}
      >
        <TonmanaCheckSection
          text={tonmanaText}
          results={tonmanaResults}
          onTextChange={setTonmanaText}
          onCheck={checkTonmana}
          onClear={clearTonmanaResults}
        />
      </SectionCard>
    </div>
  );
}
