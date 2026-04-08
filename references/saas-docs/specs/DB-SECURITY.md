# Postgres Row Level Security (RLS) 設定ガイド

**Version:** 1.6
**最終更新:** 2025-12-02（Phase 14.6 対応）

## 📋 概要

本ドキュメントは、Supabase PostgreSQL 17.6 における Row Level Security (RLS) の設定手順と、
Founders Direct Cockpit (FDC) における RLS ポリシーの詳細を記述します。

---

## ✅ RLS 必須化（Phase 30902 適用）

> **現在の状態:** 全テーブルで RLS が**有効**です。
> アクセス制御はサーバーサイド（Next.js API Routes）+ DB 層 RLS の多層防御で実装しています。

### RLS 必須化の方針

1. **全テーブルで ENABLE ROW LEVEL SECURITY**
   - 新テーブル作成時は必ず RLS を有効化
   - anon キーからの直接アクセスを DB 層でブロック

2. **SERVICE_ROLE_KEY でサーバーサイドアクセス**
   - service_role は RLS をバイパスして確実なデータ操作
   - サーバーサイドでのみ使用（クライアントに露出しない）

3. **認証チェックは Next.js で実装（多層防御）**
   ```typescript
   // lib/server/auth.ts
   const user = await getSession(request);
   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
   ```

### 現在のセキュリティ層

| レイヤー | 実装 | 説明 |
|---------|------|------|
| **認証** | `getSession()` | HTTPOnly Cookie でセッション検証 |
| **セッションキャッシュ** | Vercel KV | TTL 5分、DB負荷90%削減 |
| **セッション JOIN 最適化** | Phase 14.6 | 3クエリ → 1クエリ（users INNER JOIN） |
| **認可** | API Route 内チェック | ワークスペースメンバーシップ検証 |
| **権限** | `lib/utils/permissions.ts` | canEdit(), canManageMembers() |
| **レート制限** | `lib/server/rate-limit.ts` | Sliding Window Counter |
| **監査** | `audit_logs` テーブル | すべての操作を記録 |
| **ログ** | Pino 構造化ログ | 機密情報自動マスキング |
| **暗号化** | `workspace_data` | AES-256-GCM で暗号化 |
| **テナント分離** | Phase 14.6 | tenant_id + workspace_id による分離 |

---

## 📚 RLS 参考情報（将来の拡張用）

以下は RLS を再有効化する場合の参考情報です。

### RLS のメリット

1. **多層防御**: アプリケーションロジックのバグがあっても、DB レベルで保護
2. **監査可能性**: PostgreSQL の標準機能のため、監査・検証が容易
3. **パフォーマンス**: ポリシーは DB エンジンで実行されるため、効率的
4. **一貫性**: すべての DB アクセスに自動適用（API、管理ツール、SQL クライアント等）

### RLS が必要になるケース（将来）

- Realtime Subscriptions（クライアントから直接 Supabase にアクセス）
- モバイルアプリの追加
- Supabase Edge Functions での処理

---

## 🏢 Phase 14.4 マルチテナント対応における RLS 設計方針

> **設計決定:** マルチテナント対応においても RLS は**使用しない**。
> アプリケーション層で `tenant_id` + `workspace_id` による分離を担保する。

### マルチテナントで RLS を使用しない理由

1. **一貫性の維持**
   - 既存のサーバーサイドアクセス制御との整合性
   - 認可ロジックの分散を防止（DB層 vs アプリ層）

2. **開発速度の維持**
   - RLS ポリシーのデバッグは困難
   - アプリ層での制御はテストが容易

3. **柔軟性**
   - テナント単位の機能フラグ制御が容易
   - ワークスペース単位の設定オーバーライドに対応

### マルチテナントでのデータ分離実装

```typescript
// すべての業務テーブルに tenant_id + workspace_id を付与
// 例: todos テーブル
CREATE TABLE todos (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  -- ...
);

// アプリ層での分離
export async function listTodos({ tenantId, workspaceId, userId }: TenantAwareParams) {
  // 1. メンバーシップ検証
  await verifyMembership(workspaceId, userId);

  // 2. tenant_id + workspace_id でフィルタリング
  return db
    .selectFrom("todos")
    .where("tenant_id", "=", tenantId)
    .where("workspace_id", "=", workspaceId)
    .execute();
}
```

### セキュリティ担保

| レイヤー | 実装 | 説明 |
|---------|------|------|
| **テナント解決** | `lib/server/tenants.ts` | host ヘッダーから subdomain → tenant 特定 |
| **ワークスペース検証** | `lib/server/workspaces.ts` | tenant_id 一致検証（クロステナントアクセス防止） |
| **メンバーシップ検証** | `workspace_members` | ユーザーの所属確認 |
| **監査ログ** | `audit_logs` | すべての操作を記録（tenant_id 付き） |

**詳細:** `docs/runbooks/PHASE14.4-FDC-MULTITENANT-WORKSPACE-RUNBOOK.md` を参照

---

## RLS（Row Level Security）導入トリガー＆方針

### 1. 現状の前提と立ち位置

FoundersDirect は現時点では **RLS を有効化していない**。
これは「セキュリティを軽視している」わけではなく、以下のアーキテクチャ判断に基づく。

- すべての DB アクセスは **Next.js API 経由（BFF スタイル）**
  - ブラウザ → Next.js API → Supabase(Postgres)
- Supabase には **Service Role Key を用いたサーバーサイド接続のみ**
  - クライアントから Supabase への直接クエリ（anon key 利用）は行わない
- マルチテナント分離は、API レイヤーで `workspace_id`（または `tenant_id`）により厳格に制御する
  - 認証済みセッションに紐づいた workspace のみアクセス可能
  - 「テナントまたぎ」が起きないよう API 実装とテストで担保する

このため、現フェーズでは

> 「クライアント直クエリ前提の Supabase 標準構成」における
> 「RLSが唯一の防御線」という状況にはそもそも立っていない

という立ち位置を明示しておく。

### 2. RLS を「今すぐ」入れない理由

RLS は強力な仕組みだが、以下のコスト／複雑さを伴う。

- 設計・デバッグの複雑化
  - 「アプリ側の認可」と「DB側のRLSポリシー」の二重管理になる
  - エラー時に「どちらの設定ミスか」の切り分けが難しくなる
- 開発スピードへの影響
  - 新テーブル／新APIごとに RLS ポリシー設計・実装・テストが必要
  - スパイクや一時的な検証が少し重くなる
- 現行アーキテクチャとの相性
  - 現状は Service Role 前提で API が組まれており、
    中途半端に RLS を ON にしても、Service Role によりバイパスされて意味が薄くなりやすい

このため、

- 現状のトラフィック・機能要件・アーキテクチャであれば、
  **API レイヤーでの厳格なテナント分離＋テストで十分なセキュリティレベルを確保できる**
- そのうえで、将来 RLS が本質的に必要になるタイミングで、
  専用フェーズを切って腰を据えて導入する

という方針を採用する。

### 3. RLS 導入トリガー（いつ RLS を検討するか）

**リリースバージョン**: v3.0.0 以降（想定）

以下のいずれか、または複数が満たされる場合、**RLS 導入フェーズを発火させるトリガー**とする。

#### 定量トリガー（いずれか1つを満たした場合）

| メトリクス | 閾値 | 確認方法 |
|-----------|------|----------|
| テナント数 | **≥ 50** | `SELECT COUNT(*) FROM tenants` |
| 外部開発者数 | **≥ 5名** | GitHub コラボレーター数 |
| API エンドポイント数 | **≥ 100** | `find app/api -name "route.ts" \| wc -l` |
| テナント境界違反ログ件数 | **≥ 1件/月** | `SELECT COUNT(*) FROM audit_logs WHERE action = 'tenant_boundary_violation'` |

#### 定性トリガー（いずれか1つを満たした場合）

1. **クライアントからの Supabase Realtime 利用**
   - ブラウザから `supabase.channel()` などでテーブルの変更を直接 subscribe する構成に移行する場合
   - 条件
     - 同一テーブルを複数 workspace が共有しており、
       「他テナントの変更イベントが見えてはいけない」要件がある

2. **クライアントからの直接クエリ（anon key 利用）**
   - Next.js API を挟まず、ブラウザから直接 `supabase.from(...).select()` などを実行する機能を導入する場合
   - 条件
     - anon key をブラウザに配布する
     - 各クエリを常に正しく `workspace_id` でフィルタすることを、アプリ側だけで担保したくない

3. **多層防御（Defense in Depth）の必要性が高まったとき**
   - 要件上、API レイヤーだけでなく DB レイヤーにも「テナントまたぎ防止の最終防衛線」を設置したい場合
   - 例：
     - 外部チームの開発者が増え、アプリ側のフィルタ書き漏れリスクが上がる
     - セキュリティレビューや監査で「DBレベルのテナント制御」が求められる
     - ISMS / SOC2 認証取得において RLS が要件として明示される

4. **モバイルアプリの追加**
   - iOS / Android アプリから直接 Supabase にアクセスする構成を導入する場合

#### モニタリング方法

```sql
-- 月次で実行：RLS 導入必要性確認
SELECT
  (SELECT COUNT(*) FROM tenants) as tenant_count,
  (SELECT COUNT(*) FROM users WHERE account_type != 'SA') as user_count,
  (SELECT COUNT(*) FROM audit_logs
   WHERE action = 'tenant_boundary_violation'
   AND created_at > NOW() - INTERVAL '30 days') as violation_count;
```

#### 先延ばし可能な期間

- 上記トリガーを**いずれも満たさない限り**、RLS 導入は先延ばし可能
- 四半期ごとに上記メトリクスをチェックし、閾値に近づいたら計画を立てる
- 現行のアプリケーション層テナント分離（Phase 14.9-C: `checkTenantBoundary` / `checkUserTenantBoundary`）で十分なセキュリティを担保

上記のいずれかが具体的な機能要件として立ち上がったタイミングで、

> 「RLS 導入をメインテーマとするフェーズ（例：Phase 16.x）」を新設し、
>  アーキテクチャ変更とセットで実施する

ことを原則とする。

### 4. RLS 導入時のスコープと進め方（ハイレベル）

RLS 導入フェーズでは、以下の方針でスコープと進め方を決める。

1. スコープの最小化
   - いきなり全テーブルを対象にせず、**「workspace に紐づく中核テーブル」から開始**する
     - 例：`workspaces`, `workspace_members`, `todos`, `projects`, `okr_*` 等
   - 共通マスタ（国コードなど）は read-only ポリシー or RLS 対象外として扱う

2. 責務分担の明確化
   - API レイヤー
     - これまでどおり `workspace_id` 単位での認可を行う
     - 「誰がどの workspace に属しているか」のビジネスロジックを保持
   - RLS レイヤー
     - 「このユーザー（トークン）は、この workspace_id の行にしかアクセスできない」
       という**最終的な行レベル制約**を担う
   - 両者は **二重チェック（冗長）** になってよい（Defense in Depth）。

3. 導入ステップ（高レベル）
   1. 設計
      - RLS対象テーブルと操作（SELECT/INSERT/UPDATE/DELETE）を洗い出す
      - JWT クレーム or セッションから workspace_id をどう渡すかを設計
   2. Supabase での RLS ON + ポリシー定義
      - 開発環境 → ステージング → 本番の順で段階的に導入
   3. アプリ側の対応
      - Supabase クライアントを「ユーザー権限」「サービス権限」で使い分ける
      - RLS による permission denied / 0件 を前提にしたエラーハンドリングを実装
   4. データ整合性の確認＆移行
      - すべての行に正しい workspace_id / tenant_id が入っているかチェック
      - 必要に応じて Migration で補正
   5. E2E / 回帰テスト
      - 複数 workspace・複数ユーザーで「テナントまたぎが起きないこと」を確認

### 5. RLS 未導入期間中の原則

RLS を導入するまでの間は、以下の原則で運用する。

1. API レイヤーでのテナント分離を「単一の真実の源泉」として扱う
   - すべてのクエリで `workspace_id` / `tenant_id` によるフィルタを必須とする
   - Repository / Service 層のインターフェースで、workspace_id を必須パラメータとするなどの型設計を行う
2. 「テナントまたぎ」を検出するテストの強化
   - 代表的なテーブルについて、
     - workspace A のユーザーが workspace B のデータを取得できないこと
     を確認するテストケースを追加する
3. 将来の RLS 導入を妨げない設計
   - `workspace_id` / `tenant_id` を全テーブルできちんと持たせる
   - ビジネスロジック側で「テナント不明な行」を作らない（NULL禁止など）

---

この方針により、

- 「なぜ今は RLS を入れていないのか」
- 「どの条件になったら RLS を導入するのか」
- 「導入するときの進め方」

が FDC 全体のアーキテクチャガイドとして明文化される。

---

## 🏗️ アーキテクチャ設計

### 現行の認証フロー

```
1. クライアント → Google OAuth 認証
2. Google ID Token を Authorization ヘッダーに設定
3. API エンドポイント → verifyGoogleIdToken() で検証
4. ユーザー情報を DB から取得
5. ワークスペースアクセス権限をチェック
6. DB クエリ実行
```

### RLS 統合後のフロー

```
1. クライアント → Google OAuth 認証
2. Google ID Token を Authorization ヘッダーに設定
3. API エンドポイント → verifyGoogleIdToken() で検証
4. ユーザー情報を DB から取得
5. SET LOCAL app.current_user_id = '{user_id}' を実行 ← 追加
6. ワークスペースアクセス権限をチェック
7. DB クエリ実行（RLS ポリシーが自動適用）
```

---

## 📊 テーブル別 RLS ポリシー設計

### 1. `users` テーブル

**ポリシー名**: `users_self_access`

**目的**: ユーザーは自分自身のレコードのみ閲覧・更新可能

```sql
-- RLS を有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: 自分自身のレコードのみ閲覧可能
CREATE POLICY users_select_self ON users
  FOR SELECT
  USING (id::text = current_setting('app.current_user_id', true));

-- UPDATE ポリシー: 自分自身のレコードのみ更新可能
CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (id::text = current_setting('app.current_user_id', true));

-- INSERT/DELETE は制限（管理者のみ可能とする場合は別途ポリシー追加）
```

---

### 2. `workspaces` テーブル

**ポリシー名**: `workspaces_member_access`

**目的**: ワークスペースメンバーのみがワークスペース情報を閲覧可能

```sql
-- RLS を有効化
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: workspace_members に登録されているユーザーのみ閲覧可能
CREATE POLICY workspaces_select_member ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

-- UPDATE ポリシー: owner または admin のみ更新可能
CREATE POLICY workspaces_update_admin ON workspaces
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin')
    )
  );

-- INSERT ポリシー: すべての認証済みユーザーが作成可能
CREATE POLICY workspaces_insert_authenticated ON workspaces
  FOR INSERT
  WITH CHECK (
    created_by::text = current_setting('app.current_user_id', true)
  );
```

---

### 3. `workspace_members` テーブル

**ポリシー名**: `workspace_members_access`

**目的**: ワークスペースメンバーのみがメンバーリストを閲覧可能

```sql
-- RLS を有効化
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: 同じワークスペースのメンバーのみ閲覧可能
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

-- INSERT/UPDATE/DELETE ポリシー: owner または admin のみ
CREATE POLICY workspace_members_modify_admin ON workspace_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin')
    )
  );
```

---

### 4. `workspace_data` テーブル

**ポリシー名**: `workspace_data_member_access`

**目的**: ワークスペースメンバーのみがデータを閲覧・編集可能

```sql
-- RLS を有効化
ALTER TABLE workspace_data ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: ワークスペースメンバーのみ閲覧可能
CREATE POLICY workspace_data_select_member ON workspace_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_data.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

-- UPDATE/INSERT ポリシー: member 以上のロールで編集可能
CREATE POLICY workspace_data_modify_member ON workspace_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_data.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );
```

---

### 5. `audit_logs` テーブル

**ポリシー名**: `audit_logs_workspace_access`

**目的**: ワークスペース管理者のみが監査ログを閲覧可能

```sql
-- RLS を有効化
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: owner または admin のみ閲覧可能
CREATE POLICY audit_logs_select_admin ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = audit_logs.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin')
    )
  );

-- INSERT ポリシー: ワークスペースメンバー全員が書き込み可能
CREATE POLICY audit_logs_insert_member ON audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = audit_logs.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

-- UPDATE/DELETE は禁止（監査ログは immutable）
```

---

### 6. `sessions` テーブル（Phase 9 追加）

**ポリシー名**: `sessions_user_access`

**目的**: ユーザーは自分自身のセッションのみ管理可能

```sql
-- RLS を有効化
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー: 自分のセッションのみ閲覧可能
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));

-- INSERT ポリシー: 認証済みユーザーは自分のセッションを作成可能
CREATE POLICY sessions_insert_authenticated ON sessions
  FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

-- UPDATE ポリシー: 自分のセッションのみ更新可能（revoked_at など）
CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true));

-- DELETE ポリシー: 自分のセッションのみ削除可能
CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));
```

**Phase 9 での追加理由:**
- JWT認証から Cookie ベースのセッション管理に移行
- HttpOnly Cookie `fdc_session` によるセキュリティ強化
- セッション情報の DB 管理により、強制ログアウトやセッション監査が可能に

---

## 🛠️ 実装手順

### Step 1: マイグレーション SQL ファイルの作成

`migrations/rls-policies.sql` を作成：

```sql
-- ===================================================================
-- Founders Direct Modular - RLS Policies Migration
-- Phase 7-12 STEP4.8: Security Hardening
-- ===================================================================

BEGIN;

-- 1. users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_self ON users
  FOR SELECT
  USING (id::text = current_setting('app.current_user_id', true));

CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (id::text = current_setting('app.current_user_id', true));

-- 2. workspaces テーブル
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspaces_select_member ON workspaces
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY workspaces_update_admin ON workspaces
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY workspaces_insert_authenticated ON workspaces
  FOR INSERT
  WITH CHECK (
    created_by::text = current_setting('app.current_user_id', true)
  );

-- 3. workspace_members テーブル
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY workspace_members_modify_admin ON workspace_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin')
    )
  );

-- 4. workspace_data テーブル
ALTER TABLE workspace_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_data_select_member ON workspace_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_data.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY workspace_data_modify_member ON workspace_data
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = workspace_data.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin', 'member')
    )
  );

-- 5. audit_logs テーブル
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_admin ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = audit_logs.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
        AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY audit_logs_insert_member ON audit_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM workspace_members wm
      WHERE wm.workspace_id = audit_logs.workspace_id
        AND wm.user_id::text = current_setting('app.current_user_id', true)
    )
  );

-- 6. sessions テーブル（Phase 9 追加）
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY sessions_select_own ON sessions
  FOR SELECT
  USING (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY sessions_insert_authenticated ON sessions
  FOR INSERT
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE
  USING (user_id::text = current_setting('app.current_user_id', true));

CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE
  USING (user_id::text = current_setting('app.current_user_id', true));

COMMIT;
```

### Step 2: Supabase PostgreSQL でマイグレーション実行

**Phase 9 完了: Supabase PostgreSQL 17.6 への移行完了**

```bash
# 環境変数取得
npx vercel env pull .env.local
source .env.local

# ⚠️ 重要: Direct Connection を使用（Transaction Pooler では実行不可）
# PostgreSQL クライアントで接続
psql $DIRECT_DATABASE_URL -f migrations/rls-policies.sql

# または Supabase Dashboard の SQL Editor で実行
# https://supabase.com/dashboard/project/PROJECT_REF/sql
```

**注意事項:**
- RLS ポリシー適用には `DIRECT_DATABASE_URL` を使用してください
- `DATABASE_URL`（Transaction Pooler）では prepared statements が制限されるため失敗します
- 詳細は `DOCS/PHASE9.8-RUNBOOK.md` の「7.2 DB接続の二重化」セクションを参照

### Step 3: API 層で `SET LOCAL` を実行

`api/_lib/db.ts` に以下のヘルパー関数を追加：

```typescript
/**
 * RLS のためにユーザー ID をセッション変数に設定
 *
 * @param userId - ユーザーID
 */
export async function setRLSUserId(userId: string): Promise<void> {
  try {
    await sql`SET LOCAL app.current_user_id = ${userId}`;
  } catch (error) {
    console.error('[db.ts] setRLSUserId error:', error);
    throw error;
  }
}
```

各 API エンドポイントでユーザー認証後に呼び出し：

```typescript
// ユーザー認証
const user = await getUserByGoogleSub(payload.sub);

// RLS 用のユーザー ID を設定
await setRLSUserId(user.id);

// この後の DB クエリには RLS ポリシーが自動適用される
```

---

## 🧪 テスト手順

### 1. RLS が有効か確認

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'workspaces', 'workspace_members', 'workspace_data', 'audit_logs');
```

期待結果: すべてのテーブルで `rowsecurity = true`

### 2. ポリシー一覧の確認

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 3. ユーザー隔離のテスト

```sql
-- ユーザー A としてログイン
SET LOCAL app.current_user_id = '1';

-- ユーザー A のワークスペースのみ表示されるはず
SELECT * FROM workspaces;

-- ユーザー B に切り替え
SET LOCAL app.current_user_id = '2';

-- ユーザー B のワークスペースのみ表示されるはず（A のデータは見えない）
SELECT * FROM workspaces;
```

### 4. E2E テストでの RLS 検証

アプリケーションレベルで RLS が正しく動作していることを確認するため、E2E テストを実施します。

#### テスト項目

1. **ワークスペース隔離テスト**
   - ユーザー A がワークスペース 1 のデータのみ閲覧できることを確認
   - ユーザー A がワークスペース 2 のデータにアクセスできないことを確認

2. **ロール別アクセステスト**
   - `viewer` ロールがデータを閲覧できるが編集できないことを確認
   - `member` ロールがデータを編集できることを確認
   - `admin` ロールがメンバー管理できることを確認
   - `owner` ロールがワークスペースを削除できることを確認

3. **監査ログアクセステスト**
   - `owner`/`admin` のみが監査ログを閲覧できることを確認
   - `member`/`viewer` が監査ログにアクセスできないことを確認

#### テスト実装例

`tests/e2e/rls.spec.ts` を作成:

```typescript
import { test, expect } from '@playwright/test';

test.describe('RLS Policy Tests', () => {
  test('ユーザーは自分のワークスペースのデータのみ閲覧可能', async ({ page }) => {
    // ユーザー A としてログイン
    await page.goto('/');
    await loginAsUser(page, 'userA@example.com');

    // ワークスペース 1 のデータが表示されることを確認
    await expect(page.locator('[data-workspace-id="1"]')).toBeVisible();

    // ワークスペース 2 のデータが表示されないことを確認
    await expect(page.locator('[data-workspace-id="2"]')).not.toBeVisible();
  });

  test('viewer ロールはデータを編集できない', async ({ page }) => {
    await page.goto('/');
    await loginAsUser(page, 'viewer@example.com');

    // 編集ボタンが表示されないことを確認
    await expect(page.locator('button:has-text("編集")')).not.toBeVisible();
  });

  test('admin のみが監査ログを閲覧可能', async ({ page }) => {
    // admin としてログイン
    await page.goto('/');
    await loginAsUser(page, 'admin@example.com');

    // 監査ログタブが表示されることを確認
    await page.click('text=管理');
    await expect(page.locator('text=監査ログ')).toBeVisible();

    // member としてログイン
    await loginAsUser(page, 'member@example.com');

    // 管理タブが表示されないことを確認
    await expect(page.locator('text=管理')).not.toBeVisible();
  });
});
```

#### テスト実行

```bash
# E2E テストの実行
npm run test:e2e

# RLS テストのみ実行
npx playwright test tests/e2e/rls.spec.ts
```

---

## 🚨 トラブルシューティング

### ポリシー適用後にデータが見えない

**原因**: `app.current_user_id` が設定されていない

**解決策**:
```sql
-- 現在の設定を確認
SHOW app.current_user_id;

-- 設定
SET LOCAL app.current_user_id = 'your_user_id';
```

### 管理ツールからアクセスできない

**原因**: RLS はすべての接続に適用される（管理者アカウントも含む）

**解決策**:
```sql
-- RLS をバイパス（スーパーユーザーのみ）
SET ROLE postgres;

-- または service_role でバイパス（RLS は無効化しない）
SET ROLE service_role;
```

### パフォーマンス低下

**原因**: ポリシー内のサブクエリが複雑

**解決策**:
- `workspace_members` テーブルにインデックスを追加
- ポリシーを簡略化
- 必要に応じてマテリアライズドビューを使用

---

## 📝 緊急時対応

> **重要**: RLS の無効化は禁止です。問題が発生した場合は service_role でバイパスして調査してください。

```sql
-- 緊急時: service_role でバイパスして調査
SET ROLE service_role;

-- ポリシーの一時的な緩和（調査目的のみ、調査後に元に戻す）
-- 例: 特定テーブルのポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'users';
```

---

## 🔐 セキュリティベストプラクティス

1. **多層防御**: RLS に頼りすぎず、アプリケーション層でも認可チェックを実施
2. **最小権限の原則**: 必要最小限のアクセス権限のみを付与
3. **監査ログ**: すべての重要な操作をログに記録
4. **定期的なレビュー**: ポリシーを定期的に見直し、必要に応じて更新
5. **テスト**: 本番適用前に必ずテスト環境で動作確認

---

## 📚 参考資料

- [PostgreSQL Row Level Security Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [OWASP Top 10 - Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

## 📝 改訂履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| v1.0 | 2025-11-13 | 初版作成（Phase 7-12 STEP4.8）- 5テーブル 11ポリシー |
| v1.1 | 2025-01-24 | Phase 9 完了対応（sessions テーブル追加、6テーブル 15ポリシー、Supabase移行、DB接続二重化） |
| v1.2 | 2025-11-27 | Phase 9.97 対応（サーバーサイドアクセス制御に移行） |
| v1.3 | 2025-12-02 | Phase 14.4 マルチテナント準備（tenant_id分離方式追記） |
| v1.4 | 2025-12-02 | Phase 14.4 完了（セッションキャッシュ、レート制限、構造化ログ追加） |
| v1.5 | 2025-12-02 | RLS導入トリガー＆方針セクション追加（アーキテクチャ方針の明文化） |
| v1.6 | 2025-12-02 | Phase 14.6 対応（セッション JOIN 最適化、テナント分離レイヤー追加） |
| v1.7 | 2025-12-04 | Phase 15 対応（RLS導入トリガーを定量/定性で詳細化、モニタリングクエリ追加） |

---

**作成日**: 2025-11-13
**最終更新日**: 2025-12-04
**作成者**: Claude Code (Phase 7-12 STEP4.8 → Phase 15)
**バージョン**: 1.7
