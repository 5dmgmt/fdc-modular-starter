/**
 * app/_components/admin/AdminTab.tsx
 *
 * Phase 9.92-12: 管理者設定タブの React 実装（※Workshop Phase 18: Admin設定）
 * Phase 14.35: コンポーネント分割（1792行 → 約200行）（※Workshop Phase 18: Admin設定）
 *
 * 【責務】
 * - 管理者情報の表示
 * - ワークスペースメンバー管理
 * - 監査ログの表示
 * - ロールベースアクセス制御
 *
 * 【権限マトリクス】
 * | ロール | アクセス |
 * |--------|----------|
 * | MEMBER | ❌ |
 * | ADMIN | 👁 閲覧・メンバー管理 |
 * | OWNER | ✏️ 全メンバー管理 |
 * | SA | ✏️ 全メンバー管理 |
 */

'use client';

import { lazy, Suspense } from 'react';
import { RefreshCw, XCircle, Settings } from 'lucide-react';
import { useAdminViewModel } from '@/lib/hooks/useAdminViewModel';

// サブコンポーネント
import {
  AccessDenied,
  AdminInfoSection,
  MembersSection,
  AuditLogsSection,
  InvitationsSection,
} from './admin-tab';
import { UnifiedCSVSection } from './admin-tab/UnifiedCSVSection';

// 組織管理コンポーネントを遅延読み込み
const OrgManagement = lazy(() => import('./OrgManagement'));

// ========================================
// メインコンポーネント
// ========================================

export function AdminTab() {
  const {
    // ユーザー情報
    user,
    loading,
    error,

    // ワークスペース
    workspaceId,

    // 権限
    hasAdminAccess,
    canManageMembers,

    // メンバー管理
    members,
    membersLoading,
    membersError,
    removeMember,
    refreshMembers,

    // 監査ログ
    auditLogs,
    auditLogsLoading,
    auditLogsError,
    refreshAuditLogs,
  } = useAdminViewModel();

  // ローディング中
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <RefreshCw
            size={48}
            style={{
              animation: 'spin 1s linear infinite',
              color: 'var(--primary)',
            }}
          />
          <p style={{ marginTop: '16px', color: 'var(--text-medium)' }}>
            読み込み中...
          </p>
        </div>
      </div>
    );
  }

  // エラー
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            maxWidth: '500px',
            padding: '48px',
          }}
        >
          <XCircle
            size={80}
            style={{
              margin: '0 auto 24px',
              color: '#F44336',
            }}
          />
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-dark)',
            }}
          >
            エラーが発生しました
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '16px',
              color: 'var(--text-medium)',
              lineHeight: 1.6,
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  // アクセス拒否
  if (!hasAdminAccess || !user) {
    return <AccessDenied />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* ページヘッダー */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={32} style={{ color: 'var(--primary)' }} />
          <h2
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'var(--text-dark)',
              margin: 0,
            }}
          >
            管理者設定
          </h2>
        </div>
        <p style={{ color: 'var(--text-light)', marginTop: '8px' }}>
          ワークスペースの管理と監査ログ
        </p>
      </div>

      {/* 管理者情報セクション */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <AdminInfoSection user={user} />
      </div>

      {/* CSV初期設定セクション（Phase 14.2） */}
      <UnifiedCSVSection />

      {/* 組織管理セクション */}
      {workspaceId && (
        <Suspense
          fallback={
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '48px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                textAlign: 'center',
                color: 'var(--text-medium)',
              }}
            >
              読み込み中...
            </div>
          }
        >
          <OrgManagement workspaceId={workspaceId} />
        </Suspense>
      )}

      {/* 招待リンクセクション */}
      <InvitationsSection
        workspaceId={workspaceId}
        canManageMembers={canManageMembers}
        members={members}
      />

      {/* メンバー管理セクション */}
      <MembersSection
        members={members}
        loading={membersLoading}
        error={membersError}
        canManageMembers={canManageMembers}
        onRemoveMember={removeMember}
        onRefresh={refreshMembers}
      />

      {/* 監査ログセクション */}
      <AuditLogsSection
        logs={auditLogs}
        loading={auditLogsLoading}
        error={auditLogsError}
        onRefresh={refreshAuditLogs}
      />
    </div>
  );
}

export default AdminTab;
