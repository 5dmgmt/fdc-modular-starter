# 権限体系仕様書（Phase 14.6）

**Version:** 1.2
**最終更新:** 2025-12-02

## 概要

FDCは2レイヤーの権限体系を採用しています。

```
┌─────────────────────────────────────────────────┐
│              システムロール (users.system_role)    │
│                  SA / USER / TEST               │
├─────────────────────────────────────────────────┤
│         ワークスペースロール                        │
│     (workspace_members.role)                    │
│         OWNER / ADMIN / MEMBER                  │
└─────────────────────────────────────────────────┘
```

---

## 1. システムロール

### DBカラム: `users.system_role`

| 値 | 名称 | 説明 |
|----|------|------|
| `SA` | システム管理者 | 全ワークスペースにアクセス可能、ユーザー管理権限 |
| `USER` | 正式ユーザー | 所属WSのみアクセス可能 |
| `TEST` | 試用ユーザー | 14日間の試用期間（新規登録ユーザーはここからスタート） |

### 新規ユーザーフロー

```
1. Google OAuth でログイン
   ↓
2. users テーブルに登録
   system_role = 'TEST' (DBデフォルト)
   ↓
3. 14日間の試用期間
   ↓
4. 管理者が system_role を変更
   - USER: 正式ユーザーへ昇格
   - SA: システム管理者へ昇格
```

---

## 2. ワークスペースロール

### DBカラム: `workspace_members.role`

| 値 | 名称 | 権限 |
|----|------|------|
| `OWNER` | オーナー | WS設定変更、メンバー管理（全権限） |
| `ADMIN` | 管理者 | メンバー管理（OWNERは変更不可） |
| `MEMBER` | メンバー | データ閲覧・編集のみ |

---

## 3. 権限マトリクス

### 3.1 タブ/機能アクセス

| タブ | MEMBER | ADMIN | OWNER | SA |
|------|--------|-------|-------|-----|
| ダッシュボード | ✅ | ✅ | ✅ | ✅ 全WS |
| リード管理 | ✅ | ✅ | ✅ | ✅ 全WS |
| クライアント管理 | ✅ | ✅ | ✅ | ✅ 全WS |
| テンプレート | ✅ | ✅ | ✅ | ✅ 全WS |
| ToDo | ✅ | ✅ | ✅ | ✅ 全WS |
| **OKR** | ✅ | ✅ | ✅ | ✅ 全WS |
| **Action Map** | ✅ | ✅ | ✅ | ✅ 全WS |
| **組織図** | ✅ | ✅ | ✅ | ✅ 全WS |
| レポート | ❌ | ✅ | ✅ | ✅ クロスWS |
| 管理者設定 | ❌ | ✅ | ✅ | ✅ 全WS |
| SAダッシュボード | ❌ | ❌ | ❌ | ✅ |

### 3.2 メンバー管理権限

| 操作 | MEMBER | ADMIN | OWNER | SA |
|------|--------|-------|-------|-----|
| メンバー一覧表示 | ❌ | ✅ | ✅ | ✅ |
| MEMBERのロール変更 | ❌ | ✅ | ✅ | ✅ |
| ADMINのロール変更 | ❌ | ❌ | ✅ | ✅ |
| OWNERのロール変更 | ❌ | ❌ | ❌ | ✅ |
| メンバー招待 | ❌ | ✅ | ✅ | ✅ |
| メンバー削除 | ❌ | ✅ | ✅ | ✅ |

### 3.3 ユーザー管理（SAのみ）

| 操作 | USER/TEST | SA |
|------|-----------|-----|
| 全ユーザー一覧 | ❌ | ✅ |
| system_role変更 | ❌ | ✅ |
| 全WS統計表示 | ❌ | ✅ |
| システムメトリクス | ❌ | ✅ |

### 3.4 組織図権限 (Phase 14.4 追加)

| 操作 | MEMBER | ADMIN | OWNER | SA |
|------|--------|-------|-------|-----|
| 組織図閲覧 | ✅ | ✅ | ✅ | ✅ |
| 部門作成・編集 | ❌ | ✅ | ✅ | ✅ |
| 部門削除 | ❌ | ❌ | ✅ | ✅ |
| レポートライン編集 | ❌ | ✅ | ✅ | ✅ |
| 可視化ポリシー変更 | ❌ | ❌ | ✅ | ✅ |

---

## 4. コードでの使用箇所

### 4.1 型定義

```typescript
// lib/types/app-data.ts
export type AccountType = 'SA' | 'USER' | 'TEST';
export type WorkspaceRoleType = 'OWNER' | 'ADMIN' | 'MEMBER';

// lib/types/database.ts
export interface User {
  id: string;
  googleSub: string;
  email: string;
  name: string | null;
  picture: string | null;
  accountType: 'SA' | 'USER' | 'TEST';  // フロントエンド変数名
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: Date;
}
```

### 4.2 権限チェックユーティリティ

```typescript
// lib/utils/permissions.ts

// SA判定
export function isSA(accountType: string | null | undefined): boolean

// 編集権限
export function canEdit(role: string | null | undefined): boolean

// メンバー管理権限
export function canManageMembers(role: string | null | undefined): boolean

// 管理者アクセス
export function canAccessAdmin(
  role: string | null | undefined,
  accountType: string | null | undefined
): boolean

// レポート閲覧権限
export function canViewReports(
  workspaceRole: string | null | undefined,
  accountType: string | null | undefined
): boolean

// クロスWS権限
export function canViewCrossWorkspaceReports(
  workspaceRole: string | null | undefined,
  accountType: string | null | undefined
): boolean

// ロールラベル取得
export function getRoleLabel(
  role: string | null | undefined,
  accountType: string | null | undefined
): string
```

### 4.3 API エンドポイント

| エンドポイント | 権限チェック |
|---------------|-------------|
| `GET /api/auth/session` | セッション有効性 |
| `GET /api/workspaces` | system_role + メンバーシップ |
| `GET /api/admin/users` | SA のみ |
| `GET /api/admin/sa-workspaces` | SA のみ |
| `GET /api/admin/system-stats` | SA のみ |
| `GET /api/admin/system-metrics` | SA のみ |
| `PATCH /api/admin/users/:id` | SA のみ |
| `GET/POST/PATCH/DELETE /api/admin/tenants` | SA のみ（Phase 14.6） |
| `GET /api/org-chart/*` | メンバーシップ |
| `POST/PUT/DELETE /api/org-chart/*` | ADMIN 以上 |
| `GET/POST /api/ai/chat` | メンバーシップ |
| `GET /api/ai/usage` | メンバーシップ（Phase 14.6） |

---

## 5. DB スキーマ

### users テーブル

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  system_role TEXT NOT NULL DEFAULT 'TEST',  -- SA/USER/TEST
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### workspace_members テーブル

```sql
CREATE TABLE workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',  -- OWNER/ADMIN/MEMBER
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);
```

---

## 6. 旧体系からの移行

### 削除されたカラム/概念

| 旧 | 新 | 備考 |
|----|-----|------|
| `users.global_role` | `users.system_role` | カラム名変更 |
| `users.account_type` | 削除 | system_roleに統合 |
| `fdc_admin` | `SA` | 値変更 |
| `normal` | `USER` | 値変更 |
| `owner` (小文字) | `OWNER` | 大文字に統一 |
| `admin` (小文字) | `ADMIN` | 大文字に統一 |
| `member` (小文字) | `MEMBER` | 大文字に統一 |
| `viewer` | `MEMBER` | MEMBERに統合 |
| `EXEC` | `OWNER` | 旧ロール名 |
| `MANAGER` | `ADMIN` | 旧ロール名 |

### 変数名マッピング

| DB カラム | フロントエンド変数 |
|----------|-------------------|
| `system_role` | `systemRole` / `accountType` |
| `role` | `workspaceRole` |

---

## 7. セキュリティ

### アクセス制御方式

- **RLS**: 有効（全テーブルで ENABLE ROW LEVEL SECURITY + service_role ポリシー）
- **API**: SERVICE_ROLE_KEY でDBアクセス
- **認証**: サーバーサイドでセッション検証
- **認可**: API Route 内でロールチェック
- **キャッシュ**: Vercel KV によるセッションキャッシュ (TTL 5分)
- **レート制限**: Sliding Window Counter (lib/server/rate-limit.ts)

### セッション管理

```
1. Google OAuth → Supabase Auth
2. users テーブルに upsert
3. sessions テーブルにトークン保存
4. fdc_session Cookie でセッション管理
5. Vercel KV でセッションキャッシュ
6. 7日間有効（自動延長なし）
7. Phase 14.6: セッション JOIN 最適化（3クエリ → 1クエリ）
```

### ロギング

- Pino 構造化ログによる監査
- 機密情報の自動マスキング
- 全 API でリクエスト/レスポンスをログ記録

---

## 8. Phase 14.4 新機能

### 8.1 組織図権限

```typescript
// 組織図の可視化ポリシー
interface VisibilityPolicy {
  departmentId: string;
  visibleToRoles: ('OWNER' | 'ADMIN' | 'MEMBER')[];
  showSalary: boolean;
  showDirectReports: boolean;
}
```

### 8.2 セッションキャッシュ

```typescript
// lib/server/session-cache.ts
interface CachedSession {
  user: User;
  workspaceId: string | null;
  workspaceRole: string | null;
}

// キャッシュ操作
getCachedSession(token: string): Promise<CachedSession | null>
setCachedSession(token: string, session: CachedSession): Promise<void>
invalidateSessionCache(token: string): Promise<void>
```

---

## 更新履歴

| Phase | 日付 | 変更内容 |
|-------|------|---------|
| 14.6 | 2025-12 | テナント管理API追加、AI使用量追跡追加、セッション JOIN 最適化 |
| 14.4 | 2025-12 | 組織図権限追加、セッションキャッシュ追加 |
| 9.97 | 2025-11 | 3レイヤー → 2レイヤーに簡素化 |
| 9.92 | 2025-11 | SA権限体系追加 |
| 8.x | 2025-10 | RLS実装（Phase 30902 で必須化） |

---

**作成日:** 2025-11-26
**最終更新:** 2025-12-02
**バージョン:** 1.2
