# Founders Direct Cockpit - API 仕様書

**バージョン:** v4.2 (Phase 14.6 対応)
**最終更新:** 2025-12-02
**総エンドポイント数:** 37 Route Handlers

---

## 📋 概要

Founders Direct Cockpit (FDC) のサーバー連携API仕様を定義します。

**技術スタック:**
- Next.js 15.5.6 Route Handlers (`app/api/**/route.ts`)
- Supabase PostgreSQL 17.6
- Supabase Auth (Google OAuth PKCE)
- Vercel AI SDK 5.0.100 + OpenAI (@ai-sdk/openai)
- Pino 構造化ログ
- Vercel KV (Upstash Redis)

**実装完了項目:**
- ✅ Next.js Route Handlers 実装
- ✅ Supabase PostgreSQL 17.6 統合
- ✅ Google OAuth 認証 (Supabase Auth PKCE)
- ✅ Cookie ベース認証 (HttpOnly, SameSite=Lax)
- ✅ ワークスペース管理・メンバー管理
- ✅ 監査ログ・レポート生成
- ✅ AI チャット機能 (レート制限 5req/min)
- ✅ 楽観的排他制御 (version カラム)
- ✅ データ圧縮 (Gzip)
- ✅ Google連携 (Calendar, Tasks)
- ✅ 組織図機能 (Phase 14.4)
- ✅ セッションキャッシュ (Vercel KV)
- ✅ 非同期Google同期 (ジョブキュー)
- ✅ 構造化ログシステム (Pino)

**本番デプロイ:** https://app.foundersdirect.jp/

---

## 🎉 Phase 14.6 対応 (2025-12-02)

### Phase 14.6 新機能
- ✅ テナント管理API - マルチテナント基盤
- ✅ AI使用量追跡API - コスト管理
- ✅ セッション JOIN 最適化 - 3クエリ → 1クエリ

### Phase 14.4 完了機能
- ✅ 組織図機能（OrgChart）- 部門・レポートライン・可視化ポリシー
- ✅ セッションキャッシュ（Vercel KV）- DB負荷90%削減
- ✅ 非同期Google同期 - ジョブキューによるノンブロッキング処理
- ✅ 構造化ログシステム - Pino による JSON ログ出力

### パフォーマンス改善
- セッション認証: 5-10ms → 1-2ms（80%改善）
- 同時ユーザー数: 20人 → 100人対応
- ESLint Warnings: 283件 → 20件（93%削減）

### アーキテクチャ
- ✅ 全API を `app/api/**/route.ts` 形式に統一
- ✅ ESLint でレガシーインポート禁止
- ✅ SERVICE_ROLE_KEY によるサーバーサイドアクセス制御
- ✅ ハンドラー分割パターン（admin/sa-workspace-members）

---

## 🔐 認証方式

### 認証フロー

1. フロントエンドで Google OAuth 認証 (Google Identity Services)
2. Credential を Supabase Auth に送信
3. Supabase Auth が Google tokeninfo API で検証
4. サーバー側でセッション作成 (`sessions` テーブル)
5. HttpOnly Cookie `fdc_session` を発行
6. **セッションキャッシュ** (Vercel KV, TTL 5分)
7. 以降のリクエストは自動的に Cookie が送信される

### Cookie ベース認証

- **Cookie設定:**
  - `HttpOnly` (XSS 攻撃対策)
  - `SameSite=Lax` (CSRF 対策)
  - `Secure` (本番環境のみ、HTTPS 必須)
  - `Max-Age=604800` (7日間)
  - Domain属性なし (ブラウザ自動設定)
- **セッション管理:** `sessions` テーブルで管理
- **キャッシュ:** Vercel KV (本番) / メモリ (開発)

### CORS 設定

- `Access-Control-Allow-Origin`: 本番 = `https://app.foundersdirect.jp`, 開発 = 動的
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

---

## 📊 エンドポイント数サマリー

| カテゴリ | ファイル数 | 実装Phase |
|---------|-----------|----------|
| **認証API** | 3 (callback, session, logout) | Phase 9.97 |
| **Google連携API** | 8 (auth, callback, sync, disconnect, calendars, calendars/today, calendars/events, tasks, tasks/sync) | Phase 10-14 |
| **ワークスペースAPI** | 2 (data, members) | Phase 9.97 |
| **組織図API** | 7 (org-chart, departments, departments/[id], members/[id]/assignment, report-lines, report-lines/[id], visibility-policy) | Phase 14.4 |
| **管理者API** | 7 (users, sa-workspaces, sa-workspace-members, system-stats, system-metrics, tenants, tenants/[tenantId]) | Phase 9.97-14.6 |
| **AI API** | 2 (chat, usage) | Phase 9.8-14.6 |
| **招待API** | 2 (invitations, verify) | Phase 10 |
| **監査ログAPI** | 1 (audit-logs) | Phase 9.97 |
| **ユーティリティAPI** | 3 (health, contact, cron/sync-worker) | Phase 14.2-14.4 |
| **テストAPI** | 1 (test/session) | Phase 9.97 |
| **合計** | **37 Route Handlers** | Phase 14.6 |

---

## 📡 レート制限

| エンドポイント | ウィンドウ | 最大リクエスト数 | 理由 |
|---------------|-----------|----------------|------|
| `/api/auth/*` | 1分 | 10回 | ブルートフォース対策 |
| `/api/workspaces/:id/data` (GET) | 1分 | 120回 | 頻繁なアクセス許容 |
| `/api/workspaces/:id/data` (PUT) | 1分 | 30回 | データ整合性保護 |
| `/api/google/sync` | 1分 | 5回 | 外部API依存 |
| `/api/ai/chat` | 1分 | 5回 | コスト管理 |
| `/api/admin/*` | 1分 | 20-30回 | セキュリティ重視 |
| その他の API | 1分 | 60回 | デフォルト |

レート制限超過時は `429 Too Many Requests` を返却します。

**実装:** `lib/server/rate-limit.ts` (Sliding Window Counter アルゴリズム)

---

## 🔒 アクセス制御

すべての API で以下の順序で認証・認可を実施:

1. **キャッシュチェック**: Vercel KV でセッションキャッシュ確認
2. **セッション検証**: Cookie `fdc_session` からセッションIDを取得
3. **セッション確認**: `sessions` テーブルでセッションの有効性を検証
4. **ユーザー取得**: DB からユーザー情報を取得
5. **キャッシュ保存**: 検証成功時にキャッシュに保存 (TTL 5分)
6. **メンバーシップ検証**: `workspace_members` テーブルでアクセス権を確認
7. **ロール別権限チェック**: `canEdit()`, `canManageMembers()` 等
8. **データアクセス**: SERVICE_ROLE_KEY で Supabase にアクセス

**アーキテクチャ:**
- すべてのDB操作がサーバーサイド（Next.js API Routes）経由
- SERVICE_ROLE_KEY を使用（RLS をバイパス）
- 認証・認可はアプリケーション層で実装

---

## 📡 API エンドポイント詳細

### 1. 認証API (3エンドポイント)

#### 1.1 GET /api/auth/callback

**責務:** Google OAuth2 コールバック処理（PKCE フロー）

**認証:** 不要（OAuth フロー）

**処理内容:**
1. Google からの code を受け取り
2. Supabase Auth でトークン交換
3. users テーブルに upsert
4. sessions テーブルにセッション作成
5. Cookie `fdc_session` を発行
6. セッションキャッシュに保存

---

#### 1.2 GET /api/auth/session

**責務:** セッション検証 & 現在ユーザー情報を返却

**認証:** 必須 (Cookie `fdc_session`)

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "id": "user_12345",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "accountType": "USER"
  },
  "workspaceId": "ws_123",
  "workspaceRole": "OWNER"
}
```

---

#### 1.3 POST /api/auth/logout

**責務:** セッション無効化 + Cookie削除 + キャッシュ無効化

**認証:** 必須 (Cookie `fdc_session`)

**処理内容:**
1. `sessions` テーブルのセッションを無効化 (revoked_at更新)
2. セッションキャッシュを無効化
3. Cookie `fdc_session` を削除

---

### 2. Google連携API (9エンドポイント)

#### 2.1 GET /api/google/auth

**責務:** Google OAuth2 認証開始

---

#### 2.2 GET /api/google/callback

**責務:** Google OAuth2 コールバック、トークン保存

---

#### 2.3 POST /api/google/sync

**責務:** Google データ同期

**モード:**
- **同期モード** (デフォルト): 即座に同期実行
- **非同期モード** (`SYNC_ASYNC_MODE=true`): ジョブキューに登録

---

#### 2.4 POST /api/google/disconnect

**責務:** Google 連携解除、トークン削除

---

#### 2.5 GET /api/google/calendars

**責務:** Google Calendar 一覧取得

---

#### 2.6 GET /api/google/calendars/today

**責務:** 本日のカレンダーイベント取得

---

#### 2.7 GET /api/google/calendars/events

**責務:** カレンダーイベント取得

---

#### 2.8 GET /api/google/tasks

**責務:** Google Tasks 取得

---

#### 2.9 POST /api/google/tasks/sync

**責務:** Google Tasks 双方向同期

---

### 3. ワークスペースAPI (2エンドポイント)

#### 3.1 GET/PUT /api/workspaces/[workspaceId]/data

**責務:** ワークスペースデータの取得・更新

**認証:** 必須 + Workspace メンバーシップ確認

**キャッシュ:** ワークスペースデータキャッシュ (60秒)

**GET レスポンス:**
```json
{
  "success": true,
  "data": {
    "workspaceData": { ... },
    "version": 42,
    "updatedAt": "2025-12-02T00:00:00Z"
  }
}
```

**PUT リクエスト:**
```json
{
  "workspaceData": { ... },
  "version": 42
}
```

**楽観的排他制御:**
- `version` カラムで競合検出
- 更新成功時は `version` を自動インクリメント
- 更新失敗時は `409 Conflict` を返却

---

#### 3.2 GET/POST /api/workspaces/[workspaceId]/members

**責務:** ワークスペースメンバー管理

**認証:** 必須 + OWNER/ADMIN 権限確認（POST）

---

### 4. 組織図API (7エンドポイント) - Phase 14.4

#### 4.1 GET /api/org-chart

**責務:** 組織図全体取得

---

#### 4.2 GET/POST /api/org-chart/departments

**責務:** 部門一覧取得・作成

---

#### 4.3 GET/PUT/DELETE /api/org-chart/departments/[id]

**責務:** 部門詳細取得・更新・削除

---

#### 4.4 PUT /api/org-chart/members/[id]/assignment

**責務:** メンバー配置管理

---

#### 4.5 GET/POST /api/org-chart/report-lines

**責務:** レポートライン一覧取得・作成

---

#### 4.6 GET/PUT/DELETE /api/org-chart/report-lines/[id]

**責務:** レポートライン詳細取得・更新・削除

---

#### 4.7 GET/PUT /api/org-chart/visibility-policy

**責務:** 可視化ポリシー管理

---

### 5. 管理者API (7エンドポイント)

#### 5.1 GET/PATCH /api/admin/users

**責務:** ユーザー管理（SA専用）

---

#### 5.2 GET/POST /api/admin/sa-workspaces

**責務:** SA用ワークスペース管理

---

#### 5.3 GET/POST/PATCH/DELETE /api/admin/sa-workspace-members

**責務:** SA用ワークスペースメンバー管理

**実装:** ハンドラー分割パターン
- `handlers/get.ts` - 取得処理
- `handlers/post.ts` - 作成処理
- `handlers/patch.ts` - 更新処理
- `handlers/delete.ts` - 削除処理
- `handlers/utils.ts` - ユーティリティ
- `handlers/types.ts` - 型定義

---

#### 5.4 GET /api/admin/system-stats

**責務:** システム統計（SA専用）

---

#### 5.5 GET /api/admin/system-metrics

**責務:** システムメトリクス（SA専用）

---

#### 5.6 GET/POST/PATCH/DELETE /api/admin/tenants

**責務:** テナント管理（SA専用）- Phase 14.6 追加

**機能:**
- テナント一覧取得
- テナント作成
- テナント設定更新
- テナント削除

---

#### 5.7 GET/PATCH /api/admin/tenants/[tenantId]

**責務:** 個別テナント管理（SA専用）- Phase 14.6 追加

---

### 6. AI API (2エンドポイント)

#### 6.1 GET/POST /api/ai/chat

**責務:** AI チャットリクエスト処理

**認証:** 必須 + Workspace メンバーシップ確認

**レート制限:** 5req/min (厳格)

**セキュリティ:**
- AI有効化フラグ: `AI_ENABLED` 環境変数
- 監査ログ: 全リクエストを記録
- PII保護: サニタイズ済みコンテキストのみ受信

**POST リクエスト:**
```json
{
  "message": "ユーザーのメッセージ",
  "context": "サニタイズ済みコンテキスト (Markdown形式)",
  "workspaceId": "ws_123"
}
```

**GET レスポンス:**
```json
{
  "enabled": true,
  "model": "gpt-4o-mini",
  "rateLimit": {
    "requests": 5,
    "window": "60s"
  }
}
```

---

#### 6.2 GET /api/ai/usage

**責務:** AI使用量追跡（Phase 14.6 追加）

**認証:** 必須 + Workspace メンバーシップ確認

**レスポンス:**
```json
{
  "success": true,
  "usage": {
    "currentMonth": {
      "requests": 150,
      "inputTokens": 50000,
      "outputTokens": 25000,
      "estimatedCost": 0.15
    },
    "limits": {
      "monthlyRequests": 1000,
      "dailyRequests": 100
    }
  }
}
```

---

### 7. 招待API (2エンドポイント)

#### 7.1 GET/POST /api/invitations

**責務:** 招待状管理

---

#### 7.2 GET /api/invitations/verify

**責務:** 招待状検証

---

### 8. 監査ログAPI (1エンドポイント)

#### 8.1 GET /api/audit-logs

**責務:** 監査ログ一覧を返す

**認証:** 必須 + admin 以上の権限確認

---

### 9. ユーティリティAPI (3エンドポイント)

#### 9.1 GET /api/health

**責務:** ヘルスチェック

**レスポンス:**
```json
{
  "status": "healthy",
  "database": "connected",
  "cache": {
    "hits": 1234,
    "misses": 56
  },
  "timestamp": "2025-12-02T00:00:00Z"
}
```

---

#### 9.2 POST /api/contact

**責務:** お問い合わせ送信

---

#### 9.3 GET /api/cron/sync-worker

**責務:** Vercel Cron ワーカー

**実行間隔:** 2分

**処理内容:**
- ジョブキューからタスクを取得
- Google同期などのバックグラウンドタスクを実行

---

### 10. テストAPI (1エンドポイント)

#### 10.1 GET /api/test/session

**責務:** テスト用セッション取得（開発環境のみ）

---

## 🗄️ データベース構造

### テーブル: users

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID PRIMARY KEY | ユーザーID |
| google_sub | TEXT UNIQUE NOT NULL | GoogleのユーザーID |
| email | TEXT NOT NULL | メールアドレス |
| name | TEXT | 表示名 |
| picture | TEXT | プロフィール画像URL |
| system_role | TEXT DEFAULT 'TEST' | システムロール (SA/USER/TEST) |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

### テーブル: workspaces

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID PRIMARY KEY | workspace ID |
| name | TEXT NOT NULL | workspace名 |
| owner_user_id | UUID NOT NULL | オーナーのユーザーID |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

---

### テーブル: workspace_members

| カラム | 型 | 説明 |
|--------|-----|------|
| workspace_id | UUID NOT NULL | workspace ID |
| user_id | UUID NOT NULL | ユーザーID |
| role | TEXT DEFAULT 'MEMBER' | ロール (OWNER/ADMIN/MEMBER) |
| joined_at | TIMESTAMPTZ | 参加日時 |

**Primary Key:** (workspace_id, user_id)

---

### テーブル: workspace_data

| カラム | 型 | 説明 |
|--------|-----|------|
| workspace_id | UUID PRIMARY KEY | workspace ID |
| data | JSONB NOT NULL | AppData全体 |
| version | INTEGER DEFAULT 1 | 楽観的ロック用 |
| last_modified | TIMESTAMPTZ | 最終更新日時 |

---

### テーブル: sessions

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID PRIMARY KEY | セッションID |
| user_id | UUID NOT NULL | ユーザーID |
| expires_at | TIMESTAMPTZ NOT NULL | 有効期限 |
| created_at | TIMESTAMPTZ | 作成日時 |
| revoked_at | TIMESTAMPTZ | 無効化日時 |

---

## 🛡️ セキュリティ考慮事項

### 認証・認可

1. **認証:**
   - Google OAuth IDトークン検証 (必須)
   - Supabase Auth によるトークン管理
   - Cookie ベースセッション管理 (有効期限: 7日間)
   - セッションキャッシュ (Vercel KV, TTL: 5分)

2. **認可:**
   - workspace_membersテーブルでメンバーシップ確認
   - SA（システム管理者）は全workspaceアクセス可能
   - 詳細なロール制御 (OWNER/ADMIN/MEMBER)

3. **データ保護:**
   - HTTPS必須 (Vercel 自動対応)
   - CORS設定でフロントエンドドメインのみ許可
   - SQL Injection対策 (プレースホルダー使用)
   - 環境変数で秘密情報管理
   - データ暗号化 (workspace_data, Leads, Clients)

4. **セキュリティハーデニング:**
   - APIレート制限 (Sliding Window Counter)
   - 監査ログ記録
   - XSS/CSRF 対策
   - サーバーサイドアクセス制御（SERVICE_ROLE_KEY）
   - 機密情報マスキング（Pino ログ）

---

## 🧪 エラーレスポンス統一フォーマット

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

**HTTPステータスコード:**
- `200 OK` - 成功
- `400 Bad Request` - リクエストが不正
- `401 Unauthorized` - 未認証
- `403 Forbidden` - 権限なし
- `404 Not Found` - リソースが存在しない
- `409 Conflict` - 競合 (楽観的ロック失敗)
- `429 Too Many Requests` - レート制限超過
- `500 Internal Server Error` - サーバーエラー

---

## 📚 変更履歴

### v4.2 (2025-12-02)
- Phase 14.6 対応
- エンドポイント数を 37 に修正（正確なカウント）
- テナント管理API追加（tenants, tenants/[tenantId]）
- AI使用量追跡API追加（ai/usage）
- セッション JOIN 最適化対応

### v4.1 (2025-12-02)
- Phase 14.4 完了対応
- 組織図API (7エンドポイント) 追加
- セッションキャッシュ記載
- 非同期Google同期記載
- 構造化ログ (Pino) 記載
- レート制限設定を詳細化

### v4.0 (2025-11-29)
- Phase 12 完了対応
- 3層アーキテクチャ完成

### v3.2 (2025-11-27)
- Phase 9.97 対応
- 権限システム更新（2層モデル、RLS有効+service_roleアクセス）

---

**作成日:** 2025-11-18
**最終更新:** 2025-12-02
**バージョン:** v4.2
**デプロイ先:** https://app.foundersdirect.jp/
