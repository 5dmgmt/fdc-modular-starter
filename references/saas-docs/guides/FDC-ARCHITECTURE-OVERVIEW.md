# FDC Architecture Overview（Phase 14.6 完了時点）

**Version:** 5.1
**作成日:** 2025-11-16
**更新日:** 2025-12-02（Phase 14.6.3 完了時点）
**目的:** Phase 14.6 完了時点のアーキテクチャとデータフローを可視化し、今後の開発における参考資料とする

## 概要

このドキュメントは、Founders Direct Cockpit (FDC) の Phase 14.6 完了時点におけるアーキテクチャとデータフローを可視化したものです。

### 技術スタック（2025-12-02 時点）

| 項目 | 技術 | バージョン |
|-----|------|-----------|
| フロントエンド | Next.js + React | 15.5.6 + 19.2.0 |
| 言語 | TypeScript | 5.9.3 |
| データベース | Supabase PostgreSQL | 17.6 |
| 認証 | Supabase Auth | PKCE フロー |
| AI | Vercel AI SDK + OpenAI | 5.0.100 |
| バリデーション | Zod | 4.1.12 |
| テスト | Playwright + Vitest | 1.56.1 + 2.1.0 |
| アイコン | Lucide React | 0.554.0 |

### フェーズ完了状況

| フェーズ | 状態 | 主な成果 |
|---------|------|---------|
| Phase 9〜9.99 | ✅ 完了 | 基盤整備・React移行・パフォーマンス最適化 |
| **Phase 10** | ✅ 完了 | **Task実行層（4象限×Elastic Habits×Google連携）** |
| **Phase 11** | ✅ 完了 | **ActionMap戦術層（カンバン・フォーカスモード）** |
| **Phase 12** | ✅ 完了 | **OKR戦略層（N:M連携・3層アーキテクチャ完成）** |
| **Phase 13** | ✅ 完了 | **AI機能・CSVインポート・セキュリティ強化** |
| **Phase 13.5** | ✅ 完了 | **レポートラインタブ・可視性/権限システム** |
| **Phase 14.1** | ✅ 完了 | **CSVインポート/エクスポート（管理者設定タブ集約）** |
| **Phase 14.2** | ✅ 完了 | **スケーラビリティ改善（同時20人→100人対応）** |
| **Phase 14.35** | ✅ 完了 | **巨大コンポーネント分割（500行以上0件達成）** |
| **Phase 14.6-I** | ✅ 完了 | **CSP強化（Nonceベース、unsafe-eval削除）** |
| **Phase 14.6.3-5** | ✅ 完了 | **大規模ファイル分割（61ファイル、hooks/csv/landing）** |
| **Phase 14.62** | ✅ 完了 | **命名・概念一貫性統一** |
| **Phase 14.6.5** | ✅ 完了 | **AI利用設計（UC/プロンプト/UI/UX設計）** |
| **Phase 14.7** | 🔄 進行中 | **テナント別AI設定（APIキー・オン/オフ制御）** |

### 3層アーキテクチャ（Phase 10〜12で完成）

```
┌─────────────────────────────────────────────────────────────┐
│ 戦略層: OKR (lib/types/okr.ts)                             │
│  ├─ Objective（定性目標: company/team/individual）         │
│  └─ KeyResult（定量成果指標）N:M連携                       │
├─────────────────────────────────────────────────────────────┤
│ 戦術層: Action Map (lib/types/action-map.ts)               │
│  ├─ ActionMap（上司作成の計画）                            │
│  └─ ActionItem（部下実行タスク）ツリー構造                 │
│      └─ Status: not_started | in_progress | blocked | done │
│      └─ Priority: low | medium | high                      │
├─────────────────────────────────────────────────────────────┤
│ 実行層: Task (lib/types/task.ts)                           │
│  ├─ Task（4象限: ♠♥♦♣）                                   │
│  ├─ SubTask（サブステップ）                                │
│  ├─ ElasticHabit（松竹梅習慣）                             │
│  └─ UmeHabit（梅習慣: 5分単位）                            │
└─────────────────────────────────────────────────────────────┘
```

**進捗ロールアップフロー:**
```
Task完了 → ActionItem進捗更新 → ActionMap進捗更新 → KR進捗更新 → Objective進捗更新
```

### Phase 10〜14 完了実績（2025-12-02）

**Phase 10: Task実行層**
- ✅ **4象限ボード**: アイゼンハワーマトリクス（♠♥♦♣）
- ✅ **Elastic Habits**: 松竹梅システム
- ✅ **TimeAllocationBar**: 5色時間可視化
- ✅ **Google連携**: Calendar/Tasks API双方向同期

**Phase 11: ActionMap戦術層**
- ✅ **ActionMap/ActionItem**: 上司→部下の戦術指示
- ✅ **カンバンボード**: Not Started / In Progress / Done
- ✅ **フォーカスモード**: 1アクション集中表示
- ✅ **Task連携**: ActionItem → TODO 自動生成

**Phase 12: OKR戦略層**
- ✅ **Objective/KeyResult**: 定性目標+定量成果指標
- ✅ **N:M連携**: 1つのActionMapが複数KRに貢献可能
- ✅ **進捗ロールアップ**: 自動計算（fromActionMaps）
- ✅ **スコープフィルタ**: company / team / individual

**Phase 13: AI機能・セキュリティ強化**
- ✅ **AI Chat統合**: GPT-4o-mini連携
- ✅ **PII保護**: メール・電話除外、個人名マスキング
- ✅ **レート制限**: 5req/min

**Phase 13.5: レポートライン・可視性/権限**
- ✅ **レポートラインタブ**: 組織階層管理
- ✅ **可視性設定**: 誰が誰のデータを見れるか制御

**Phase 14: CSVインポート/エクスポート・スケーラビリティ**
- ✅ **CSVインポート**: 見込み客、顧客、OKR、ActionMap、TODO
- ✅ **CSVエクスポート**: 全データ種別対応
- ✅ **スケーラビリティ**: 同時20人→100人対応
- ✅ **コンポーネント分割**: 500行以上のファイル0件達成

**Phase 14.6: CSP強化・セキュリティ**
- ✅ **CSP Nonce**: リクエスト毎にランダムな Nonce 生成
- ✅ **unsafe-eval 削除**: script-src から unsafe-eval を削除
- ✅ **Middleware 実装**: Next.js Middleware で CSP ヘッダーを動的生成
- ✅ **テナント準備**: tenants.ts, tenant-config.ts 実装

### アーキテクチャパターン

**1. ViewModel パターン**
- `lib/hooks/*/use*ViewModel.ts`（Phase 14.6.3-5 で分割、61ファイル）
- ロジックとUIの分離
- ディレクトリ構成: task/, okr/, leads/, templates/, settings/, action-map/

**2. 楽観的排他制御**
- `workspace_data.version` カラム
- 競合時 409 応答

**3. データ圧縮**
- `lib/core/compression.ts`
- Gzip 圧縮で 50-70% 削減

**4. コード分割**
- `next/dynamic` による遅延ロード
- 対象: ZoomScript, Templates, Reports, LeanCanvas, Todo, Admin, SADashboard

**5. Context によるAPIコール削減**
- `lib/hooks/useWorkspaceData.ts`
- ワークスペースデータの共有

このアーキテクチャ図は Phase 14.6 完了時点の状態を反映しています。

---

## 1. システムコンテキスト図（C4 Level 1）

FDC 全体を俯瞰する図です。Phase 9.8 完了内容（Supabase Auth・セッション管理・暗号化・AI基盤）を反映しています。

> **Phase 30902 更新**: RLS は全テーブルで有効化し、SERVICE_ROLE_KEY でのサーバーサイドアクセス + anon キーからの直接アクセスをブロックする多層防御に統一しました。

```mermaid
graph TD
    %% External Actors
    User[👤 User<br/>ブラウザ]
    GoogleOAuth[🔐 Google OAuth<br/>Identity Services]
    SupabaseAuth[🔐 Supabase Auth<br/>認証サービス]
    OpenAI[🤖 OpenAI<br/>GPT-4o-mini]

    %% FDC System
    FDC[🖥️ FDC Web App<br/>TypeScript SPA<br/>index.html + dist/main.js]
    API[⚙️ API Functions<br/>Vercel Serverless<br/>/api/*]
    AIAPI[🧠 AI Gateway<br/>/api/ai/chat<br/>レート制限 5req/min]
    DB[(🗄️ Supabase<br/>PostgreSQL 17.6<br/>SERVICE_ROLE_KEY)]

    %% Key Management
    EnvSecrets[🔑 環境変数<br/>MASTER_ENCRYPTION_KEY<br/>SUPABASE_URL/ANON_KEY<br/>OPENAI_API_KEY]

    %% Data Flow - Auth
    User -->|1. Google認証| GoogleOAuth
    GoogleOAuth -->|2. Credential| User
    User -->|3. Credential| FDC
    FDC -->|4. Supabase Auth| SupabaseAuth
    SupabaseAuth -->|5. Session Token| FDC
    FDC -->|6. Cookie: fdc_session<br/>API呼び出し| API
    API -->|7. セッション検証<br/>暗号化鍵取得| EnvSecrets
    API -->|8. SERVICE_ROLE_KEY<br/>権限チェック済みクエリ| DB
    DB -->|9. 暗号化データ| API
    API -->|10. 復号済みAppData<br/>JSON| FDC
    FDC -->|11. UI更新| User

    %% Data Flow - AI (Phase 9.8-B)
    User -->|12. AI質問| FDC
    FDC -->|13. PII除外・マスキング<br/>Context Level選択| AIAPI
    AIAPI -->|14. レート制限チェック<br/>AI有効化チェック| EnvSecrets
    AIAPI -->|15. 監査ログ記録| DB
    AIAPI -->|16. Sanitized Data| OpenAI
    OpenAI -->|17. AI応答| AIAPI
    AIAPI -->|18. Streaming Response| FDC
    FDC -->|19. AI応答表示| User

    %% Phase 9.8 完了領域の注記
    classDef phase9Complete fill:#d4edda,stroke:#28a745,stroke-width:3px
    classDef phase98Complete fill:#cfe2ff,stroke:#0d6efd,stroke-width:3px
    class API,DB,EnvSecrets,SupabaseAuth phase9Complete
    class AIAPI,OpenAI phase98Complete

    %% 注釈
    Note1[✅ Phase 9.7完了実績:<br/>- Supabase Auth統合<br/>- セッション管理実装<br/>- Cookie認証<br/>- 暗号化ミドルウェア<br/>- サーバーサイドアクセス制御<br/>- 技術負債ゼロ達成]
    Note2[✅ Phase 9.8-B完了実績:<br/>- AI Gateway実装<br/>- Context Control<br/>- PII除外・マスキング<br/>- レート制限 5req/min<br/>- AI監査ログ]

    style Note1 fill:#d4edda,stroke:#28a745,stroke-width:2px
    style Note2 fill:#cfe2ff,stroke:#0d6efd,stroke-width:2px
```

**データフローの説明:**

**認証・データ取得フロー（1-11）:**
- **1-2**: Google OAuth認証（Credential取得）
- **3-4**: フロントエンドがSupabase Authに認証情報送信
- **5**: Supabase AuthがSession Token発行
- **6**: Cookie（fdc_session）でAPIにリクエスト
- **7**: APIがセッション検証・マスターキーで暗号化鍵を復号
- **8**: RLSセッション変数設定後、DBクエリ実行
- **9-10**: 暗号化データを復号してフロントエンドへ
- **11**: UI更新

**AI連携フロー（12-19、Phase 9.8-B完了）:**
- **12**: ユーザーがAI機能を使用
- **13**: フロントエンドでPII除外・マスキング処理、Context Level選択
- **14**: AI Gateway がレート制限（5req/min）とAI有効化フラグをチェック
- **15**: 監査ログに AI利用記録（トークン量含む）を記録
- **16**: Sanitized Data を OpenAI に送信
- **17-18**: AI応答をストリーミング形式で返却
- **19**: UI に AI応答を表示

---

## 2. コンテナ／コンポーネント図

フロントエンド・バックエンド・DBの内部構造を示します。Phase 9.8 完了内容（AI基盤）を反映しています。

```mermaid
flowchart TB
    subgraph Frontend["🖥️ Frontend (Browser SPA)"]
        direction TB
        AppShell[App Shell / Router<br/>main.ts]
        AuthMod[Auth Module<br/>supabase.ts<br/>Supabase Auth管理]
        WorkspaceMod[Workspace Module<br/>settings.ts]
        LeadsMod[Leads/Clients Module<br/>leads.ts / clients.ts]
        APIClient[API Client<br/>apiClient.ts<br/>credentials: 'include']

        AppShell --> AuthMod
        AppShell --> WorkspaceMod
        AppShell --> LeadsMod
        AuthMod --> APIClient
        WorkspaceMod --> APIClient
        LeadsMod --> APIClient
    end

    subgraph Backend["⚙️ Backend (Vercel Functions)"]
        direction TB
        AuthAPI[/api/auth/*<br/>google.ts, token.ts<br/>session.ts, logout.ts<br/>me.ts, roles.ts]
        WorkspaceAPI[/api/workspaces/*<br/>index.ts, data.ts, members.ts]
        LeadsAPI[/api/leads/*<br/>CRUD endpoints]
        AuditAPI[/api/audit-logs/*<br/>index.ts]
        AIAPI[/api/ai/chat/*<br/>route.ts<br/>✅Phase 9.8-B完了]

        subgraph Middleware["共通ミドルウェア層"]
            SessionVerify[セッション検証<br/>middleware.ts<br/>✅Phase 9.7完了]
            EncMiddleware[暗号化ミドルウェア<br/>encryption.ts<br/>✅Phase 9.7完了]
            AIContext[AI Context Control<br/>ai-context.ts<br/>✅Phase 9.8-B完了]
            RateLimit[レート制限<br/>rate-limit.ts<br/>✅Phase 9.8-B完了]
        end

        AuthAPI --> SessionVerify
        WorkspaceAPI --> SessionVerify
        WorkspaceAPI --> EncMiddleware
        LeadsAPI --> SessionVerify
        LeadsAPI --> EncMiddleware
        AIAPI --> SessionVerify
        AIAPI --> RateLimit
        AIAPI --> AIContext
    end

    subgraph Database["🗄️ Database (Supabase PostgreSQL 17.6)"]
        direction TB
        Users[(users)]
        Workspaces[(workspaces)]
        Members[(workspace_members)]
        WData[(workspace_data<br/>✅250KB制限監視中)]
        Sessions[(sessions<br/>✅Phase 9追加)]
        AuditLogs[(audit_logs)]

        RLS[RLS Policies<br/>15ポリシー<br/>app.current_user_id]
    end

    APIClient -->|HTTP + Cookie| AuthAPI
    APIClient -->|HTTP + Cookie| WorkspaceAPI
    APIClient -->|HTTP + Cookie| LeadsAPI

    EncMiddleware -->|SET RLS変数<br/>暗号化/復号| WData
    SessionVerify -->|認可チェック| Members
    SessionVerify -->|セッション検証| Sessions
    AuditAPI -->|ログ記録| AuditLogs

    RLS -.->|適用| Users
    RLS -.->|適用| Workspaces
    RLS -.->|適用| Members
    RLS -.->|適用| WData
    RLS -.->|適用| Sessions
    RLS -.->|適用| AuditLogs

    %% Phase 9.7/9.8 完了箇所のスタイル
    classDef phase9Complete fill:#d4edda,stroke:#28a745,stroke-width:3px
    classDef phase98Complete fill:#cfe2ff,stroke:#0d6efd,stroke-width:3px
    class SessionVerify,EncMiddleware,WData,Sessions phase9Complete
    class AIAPI,AIContext,RateLimit phase98Complete
```

### 各コンポーネントの責務と Phase 9.8 完了状況

| コンポーネント | 主な責務 | Phase 9.7完了状況 | Phase 9.8完了状況 |
|--------------|---------|----------------|----------------|
| **Frontend - App Shell** | 初期化・タブ切替・認証状態管理 | ✅ 変更なし | - |
| **Frontend - Auth Module** | Supabase Auth管理・セッション管理 | ✅ 完了（supabase.ts実装） | - |
| **Frontend - API Client** | API通信・Cookie送信 | ✅ 完了（credentials: 'include'） | - |
| **Backend - /api/auth/*** | Google OAuth検証・セッション発行 | ✅ 完了（6エンドポイント実装） | - |
| **Backend - /api/workspaces/*** | ワークスペース管理・データ保存 | ✅ 完了（暗号化統合） | - |
| **Backend - /api/ai/chat/*** | AI Gateway・レート制限・監査 | - | ✅ 完了（Phase 9.8-B） |
| **Backend - セッション検証** | Cookie検証・ユーザー特定 | ✅ 完了（middleware.ts実装） | - |
| **Backend - 暗号化ミドルウェア** | AES-256-GCM暗号化/復号 | ✅ 完了（encryption.ts統合） | - |
| **Backend - AI Context Control** | PII除外・マスキング・Context Level制御 | - | ✅ 完了（ai-context.ts） |
| **Backend - レート制限** | 5req/min 制限 | - | ✅ 完了（rate-limit.ts） |
| **DB - workspace_data** | AppData保存（JSONB暗号化） | ✅ 完了（250KB制限監視中） | ✅ version カラム追加 |
| **DB - sessions** | セッション管理 | ✅ 完了（Phase 9追加） | - |
| **DB - RLS Policies** | 行レベルアクセス制御 | ✅ 完了（15ポリシー適用） | - |

---

## 3. データフロー／シーケンス図

Phase 9.8 完了時点の主要ユースケースのデータフローを示します。

### 3.1 ログイン〜認証済みAPI呼び出しまでのフロー（Phase 9完了版）

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Browser as 🖥️ Browser
    participant GoogleOAuth as 🔐 Google OAuth
    participant FDC as FDC Web App
    participant SupabaseAuth as Supabase Auth
    participant AuthAPI as /api/auth/google
    participant DB as 🗄️ Supabase<br/>sessions

    User->>Browser: 1. ログインボタンクリック
    Browser->>GoogleOAuth: 2. Google Sign-In SDK起動
    GoogleOAuth->>User: 3. 認証画面表示
    User->>GoogleOAuth: 4. Google認証実施
    GoogleOAuth->>Browser: 5. Credential返却
    Browser->>FDC: 6. Credential受信
    FDC->>SupabaseAuth: 7. Supabase Auth認証<br/>{credential}

    Note over SupabaseAuth: ✅Phase 9完了:<br/>Supabase Auth統合<br/>セッション管理

    SupabaseAuth->>SupabaseAuth: 8. Google tokeninfo API検証
    SupabaseAuth->>AuthAPI: 9. POST /api/auth/google<br/>{credential}
    AuthAPI->>DB: 10. upsertUserByGoogleSub()<br/>ユーザー作成/更新
    DB-->>AuthAPI: 11. User情報
    AuthAPI->>DB: 12. セッション作成<br/>INSERT INTO sessions
    DB-->>AuthAPI: 13. sessionId
    AuthAPI-->>FDC: 14. Set-Cookie: fdc_session<br/>{user, sessionId}
    FDC->>Browser: 15. Cookie保存（自動）
    Browser->>User: 16. Dashboard表示

    Note over FDC,DB: ✅RLSセッション変数:<br/>SET app.current_user_id = userId<br/>（以降のAPI呼び出しで自動適用）
```

**重要ポイント（Phase 9完了）:**
- **Step 7-8**: Supabase Auth統合による認証（Phase 9で実装完了）
- **Step 12-13**: sessionsテーブルによるセッション管理（Phase 9で実装完了）
- **Step 14**: Cookie `fdc_session` 発行（HttpOnly, SameSite=Lax, Secure）
- **RLSセッション変数**: 以降のAPI呼び出しで自動的に `app.current_user_id` が設定される

---

### 3.2 workspace_data 読み込み〜Dashboard 表示フロー（Phase 9完了版）

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FDC as FDC Web App
    participant WSAPI as /api/workspaces/{id}/data
    participant EncMW as 暗号化MW
    participant DB as 🗄️ Supabase<br/>workspace_data

    User->>FDC: 1. Dashboard表示要求
    FDC->>WSAPI: 2. GET /api/workspaces/123/data<br/>Cookie: fdc_session

    Note over WSAPI: ✅Phase 9完了:<br/>セッション検証→RLS設定<br/>→暗号化データ取得

    WSAPI->>WSAPI: 3. verifySession()<br/>userId抽出
    WSAPI->>DB: 4. SET app.current_user_id = userId
    WSAPI->>DB: 5. SELECT data FROM workspace_data<br/>WHERE workspace_id = 123<br/>（RLS自動適用）

    Note over DB: ✅250KB制限監視中:<br/>JSON.stringify(data).length < 250KB

    DB-->>WSAPI: 6. {暗号化済みJSONB}<br/>{version,iv,authTag,ciphertext}
    WSAPI->>EncMW: 7. decrypt(encryptedData, workspaceKey)
    EncMW->>EncMW: 8. AES-256-GCM復号<br/>authTag検証
    EncMW-->>WSAPI: 9. 平文AppData JSON
    WSAPI-->>FDC: 10. {data: AppData, lastModified}
    FDC->>FDC: 11. setState(appData)<br/>localStorage更新
    FDC->>User: 12. Dashboard UI描画<br/>（KPI・ファネル・チャネル統計）

    Note over FDC,DB: ✅パフォーマンス実測値:<br/>- 復号処理: P95 280ms ✅<br/>- 初回Dashboard表示: <1s ✅
```

**重要ポイント（Phase 9完了）:**
- **Step 3**: Cookie認証によるセッション検証（Phase 9で実装完了）
- **Step 5**: RLS自動適用により、所属ワークスペースのデータのみ取得可能
- **Step 7-8**: 暗号化ミドルウェアによる復号（AES-256-GCM、authTag検証、Phase 9完了）
- **250KB制限**: workspace_data の容量制限（Phase 9で監視実装、Phase 9.5〜12で継続監視）
- **パフォーマンス**: 目標値達成（復号 P95 280ms、Dashboard表示 <1s）

---

### 3.3 Lead作成 + 監査ログ記録フロー（Phase 9完了版）

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FDC as Leads Module
    participant LeadAPI as /api/leads/*
    participant EncMW as 暗号化MW
    participant DB as 🗄️ Supabase
    participant AuditLog as audit_logs

    User->>FDC: 1. Lead作成フォーム送信<br/>{name, email, company}
    FDC->>LeadAPI: 2. POST /api/leads<br/>Cookie: fdc_session<br/>{leadData}

    LeadAPI->>LeadAPI: 3. verifySession()<br/>認可チェック（canEditLead）
    LeadAPI->>DB: 4. SET app.current_user_id = userId

    Note over EncMW: ✅Phase 9完了:<br/>PII暗号化統合<br/>（name, email, company）

    LeadAPI->>EncMW: 5. encrypt(leadData, workspaceKey)<br/>Encryption Allocation Table適用
    EncMW->>EncMW: 6. AES-256-GCM暗号化<br/>{iv, authTag, ciphertext}
    EncMW-->>LeadAPI: 7. {encryptedLead}

    LeadAPI->>DB: 8. INSERT INTO workspace_data<br/>（暗号化済みJSON更新）
    DB-->>LeadAPI: 9. 保存成功

    LeadAPI->>AuditLog: 10. createAuditLog()<br/>{action: 'create', resource: 'lead'}
    AuditLog-->>LeadAPI: 11. ログ記録完了

    LeadAPI-->>FDC: 12. {success: true, leadId}
    FDC->>FDC: 13. UI更新・一覧再描画
    FDC->>User: 14. 作成完了通知

    Note over LeadAPI,DB: ✅パフォーマンス実測値:<br/>- INSERT: P95 350ms ✅<br/>- 暗号化: P95 450ms ✅
```

**重要ポイント（Phase 9完了）:**
- **Step 3**: Cookie認証によるセッション検証（Phase 9で実装完了）
- **Step 5-6**: Encryption Allocation Table に基づくPII暗号化（name, email, company、Phase 9完了）
- **Step 10**: 全CRUD操作で監査ログ記録（コンプライアンス対応、Phase 9完了）
- **パフォーマンス**: 目標値達成（INSERT P95 350ms、暗号化 P95 450ms）

---

### 3.4 AI連携フロー（Phase 9.8-B完了版）

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant FDC as FDC Web App
    participant AIAPI as /api/ai/chat
    participant AIContext as AI Context Control
    participant RateLimit as Rate Limiter
    participant DB as 🗄️ Supabase<br/>audit_logs
    participant OpenAI as 🤖 OpenAI<br/>GPT-4o-mini

    User->>FDC: 1. AI質問入力<br/>{query, contextLevel}
    FDC->>FDC: 2. データ準備<br/>（workspace_data から必要情報抽出）

    Note over FDC: ✅Phase 9.8-B完了:<br/>フロントエンド側で<br/>Context Level選択

    FDC->>AIAPI: 3. POST /api/ai/chat<br/>Cookie: fdc_session<br/>{query, contextLevel, data}

    AIAPI->>AIAPI: 4. verifySession()<br/>userId抽出

    AIAPI->>RateLimit: 5. checkRateLimit(userId)<br/>5req/min チェック

    alt レート制限超過
        RateLimit-->>AIAPI: 6a. 制限超過
        AIAPI-->>FDC: 7a. 429 Too Many Requests
        FDC->>User: 8a. エラー表示<br/>「しばらくお待ちください」
    else レート制限内
        RateLimit-->>AIAPI: 6b. OK

        AIAPI->>AIAPI: 9. AI有効化フラグチェック<br/>(workspace_settings.ai_enabled)

        alt AI無効
            AIAPI-->>FDC: 10a. 403 Forbidden
            FDC->>User: 11a. エラー表示<br/>「AI機能は無効です」
        else AI有効
            AIAPI->>AIContext: 10b. sanitizeForAI(data, contextLevel)

            Note over AIContext: ✅PII除外・マスキング:<br/>- 個人名マスキング<br/>- メールアドレス除外<br/>- 電話番号除外

            AIContext-->>AIAPI: 11b. {sanitizedData}

            AIAPI->>DB: 12. createAuditLog()<br/>{action: 'ai_request', contextLevel}
            DB-->>AIAPI: 13. ログ記録完了

            AIAPI->>OpenAI: 14. POST /chat/completions<br/>{model: 'gpt-4o-mini', messages}
            OpenAI-->>AIAPI: 15. Streaming Response<br/>(AI応答ストリーム)

            AIAPI-->>FDC: 16. Streaming Response<br/>(逐次配信)
            FDC->>User: 17. AI応答表示<br/>（リアルタイム更新）

            Note over AIAPI,DB: ✅監査ログ:<br/>AI利用記録（トークン量含む）

            AIAPI->>DB: 18. updateAuditLog()<br/>{tokens: 1234}
        end
    end
```

**重要ポイント（Phase 9.8-B完了）:**
- **Step 2**: フロントエンドで Context Level（MINIMAL/STANDARD/FULL）を選択
- **Step 5**: レート制限（5req/min）でコスト爆発を防止
- **Step 9**: ワークスペース単位でAI機能のON/OFF制御
- **Step 10b**: PII除外・マスキング処理（Encryption Allocation Table v1.1準拠）
  - 個人名: マスキング（例: "田中太郎" → "T.T."）
  - メールアドレス: 完全除外
  - 電話番号: 完全除外
- **Step 12, 18**: AI利用の監査ログ記録（トークン量含む）
- **Step 15-16**: ストリーミング応答でUX向上

**Context Level による送信データ制御:**

| Context Level | 送信データ範囲 | 用途 | PII処理 |
|--------------|--------------|------|---------|
| **MINIMAL** | 質問のみ | 一般的な質問応答 | - |
| **STANDARD** | Leads概要（個人名マスキング済み） | 営業戦略提案 | 個人名マスキング |
| **FULL** | Leads/Clients詳細（PII除外） | 詳細分析・レポート生成 | 個人名マスキング + メール/電話除外 |

---

## 4. Phase 9.8 完了時点のパフォーマンス評価

### 4.1 暗号化ミドルウェアのパフォーマンス（Phase 9完了）

- **対象**: `api/_lib/encryption.ts` の `encrypt/decrypt` 関数
- **目標**: 保存時暗号化 P95 < 180ms、復号時 P95 < 280ms
- **Phase 9実測値**:
  - SELECT (GET): P95 280ms ✅
  - INSERT (POST): P95 350ms ✅
  - UPDATE (PUT): P95 310ms ✅
  - JOIN (複雑クエリ): P95 420ms ✅
  - JSONB (暗号化想定): P95 450ms ✅
- **ステータス**: ✅ 目標達成
- **Phase 9.5以降の対策**: 継続監視、workspace_data肥大化への警戒

### 4.2 workspace_data の肥大化リスク

- **現在の容量制限**: 250KB（ハード上限）
- **Phase 9時点での実測値**: 未計測（Phase 9-0で全Workspace計測必要）
- **将来Phase 10〜12での追加データ**:
  - Phase 10: TODO 4象限（+30KB見積もり）
  - Phase 11: Action Map（+40KB見積もり）
  - Phase 12: OKR（+30KB見積もり）
- **対策**: アーカイブ機能（Phase 11で実装予定）、分割保存（Phase 9Bで検討）

### 4.3 監査ログの書き込み頻度

- **対象**: 全CRUD操作で `createAuditLog()` 呼び出し
- **リスク**: 高頻度更新時のDB負荷、audit_logs テーブル肥大化
- **対策**: 非同期ログ記録、バッチ書き込み（Phase 9で検討）

### 4.4 RLS + 暗号化の二重オーバーヘッド

- **対象**: 各API呼び出しで `SET app.current_user_id` + RLSポリシー評価 + 暗号化処理
- **リスク**: API応答時間が目標（P95 < 350ms GET、< 450ms POST）を超過する可能性
- **対策**: Prisma Query Loggingで N+1 クエリ検出、インデックス最適化

### 4.5 初回Dashboard表示時間

- **目標**: P95 < 2.0秒（ログイン→Dashboard表示完了）
- **ボトルネック候補**:
  - Google OAuth認証（外部API依存）
  - JWT発行処理
  - workspace_data 復号
  - Dashboard KPI計算（js/tabs/dashboard.ts）
- **現状**: 実測値未取得（Phase 9-0で計測必要）

---

## 5. Phase 10〜12 に影響が波及しやすいインタフェース

### 5.1 `api/_lib/encryption.ts` の encrypt/decrypt インタフェース

- **対象**: Phase 10〜12で追加されるデータ（TODO、Action Map、OKR）も同じインタフェースを使用
- **変更時の影響**: 全データ種別の暗号化/復号に波及
- **安定性要件**: Phase 9で十分にテストし、Phase 10以降は変更しない

### 5.2 `workspace_data` JSONB スキーマ

- **対象**: Phase 10〜12でフィールド追加（todos, actionMaps, objectives）
- **変更時の影響**: 既存データとの互換性、容量制限への影響
- **互換性確保**: `loadData` 時に初期値補完、バージョン管理（version フィールド）

### 5.3 `api/_lib/auth.ts` の認可チェック関数

- **対象**: `canEditLead`, `canViewClient` など、Phase 7-10で60+関数実装済み
- **Phase 10〜12で追加**: `canEditTodo`, `canEditActionMap`, `canEditOKR` など
- **変更時の影響**: RBAC一貫性、既存権限チェックとの整合
- **設計要件**: 共通パターン踏襲、テストケース追加

### 5.4 `js/core/apiClient.ts` の API呼び出しパターン

- **対象**: 全タブが `loadWorkspaceData` / `saveWorkspaceData` を使用
- **Phase 10〜12で**: `/api/todos/*` など新規エンドポイント追加時も同じパターン
- **変更時の影響**: エラーハンドリング、JWT付与、タイムアウト制御
- **安定性要件**: Phase 9で統一パターン確立、Phase 10以降は踏襲のみ

### 5.5 RLS ポリシーの workspace_id 境界

- **対象**: 全テーブルで `workspace_id` による分離
- **Phase 10〜12で**: 新規テーブル追加時（todos, action_maps, objectives）も同じポリシー適用
- **変更時の影響**: データ分離、認可チェック
- **設計要件**: 001-rls-policies.sql のパターン踏襲

---

## 6. Phase 9-1 を進めるうえでの前提条件とリスク

### 6.1 前提条件（Phase 9-1開始前に満たすべき条件）

1. **JWT認証の実装完了**
   - `api/auth/token.ts` で JWT発行（expire: 1h、refresh: 7d）
   - `api/_lib/auth.ts` で verify/sign 関数実装
   - `js/core/googleAuth.ts` でトークン管理（取得・保存・更新）
   - 前提: Phase 9-0で設計確定、Phase 9-1で実装

2. **暗号化ガバナンスの確定**
   - Encryption Allocation Table（Phase 9-0で整備済み）
   - 全データ種別の暗号化要否・タイミングを定義
   - 前提: Phase 9-0で確定済み、Phase 9-1では変更しない

3. **パフォーマンス基準値の確定**
   - Performance Specification v1.0（Phase 9-0で整備済み）
   - 全指標の目標値と計測プロトコルを定義
   - 前提: Phase 9-0で確定済み、Phase 9-1〜で継続計測

4. **既存API（Phase 8まで）のスコープ確定**
   - Phase 9では `/api/workspaces/*`, `/api/audit-logs`, `/api/reports/*` のみ対象
   - Phase 10〜12の新規API（`/api/todos/*` など）は対象外
   - 前提: Phase 9-0で明確化済み、Phase 9-1〜で遵守

### 6.2 リスク

1. **JWT発行ロジックの変更は Phase 9 では行わない（リスク: 高）**
   - 理由: Phase 10以降の全機能がJWT認証に依存するため、Phase 9での変更は影響範囲が大きい
   - 対策: Phase 9-1で初期実装を十分にテストし、Phase 10以降は変更しない
   - 例外: セキュリティ脆弱性発見時のみ変更可（緊急パッチ）

2. **暗号化ミドルウェアのパフォーマンス劣化（リスク: 中）**
   - 原因: workspace_data 肥大化、N+1クエリ、不要な再暗号化
   - 影響: API応答時間が目標を超過、ユーザー体験劣化
   - 対策: Phase 9-1で十分に計測し、ボトルネック特定・改善（P1-2/4/5）

3. **RLS + 暗号化の二重オーバーヘッド（リスク: 中）**
   - 原因: RLSポリシー評価 + 暗号化処理の累積
   - 影響: API応答時間が目標を超過
   - 対策: Prisma Query Logging で N+1 検出、インデックス最適化、キャッシュ戦略

4. **workspace_data 250KB制限の超過（リスク: 中〜高）**
   - 原因: Phase 10〜12でのデータ追加（TODO、Action Map、OKR）
   - 影響: 保存失敗、復号時間増加、UI操作遅延
   - 対策: Phase 9-0で容量実測、Phase 10〜12での追加容量見積もり、アーカイブ戦略（Phase 11）

5. **既存機能の破壊的変更（リスク: 低〜中）**
   - 原因: Phase 9でのリファクタリング時に既存タブの動作を変更
   - 影響: Leads/Clients/Reports が正常動作しなくなる
   - 対策: E2Eテスト全通過を Phase 9 DOD に含める、変更範囲を最小化

### 6.3 Phase 9-1以降の推奨アプローチ

- **継続的計測**: 各サブフェーズ（9-1〜9-7）でパフォーマンス計測を実施、基準未達時は改善を優先
- **影響範囲の最小化**: 既存タブ（Dashboard、Leads、Clients）には触れない、API層のみ実装
- **テスト駆動**: スキップテスト33件の解除を優先、pass 率100%を維持
- **容量監視**: workspace_data サイズを毎サブフェーズで計測、250KB制限への余裕を確認

---

## 7. 関連ドキュメント

### 7.1 開発ガイド
- **`DOCS/FDC-GRAND-GUIDE.md`**: 開発全体の指針・AIチーム運用ガイド
- **`DOCS/HOW-TO-DEVELOP.md`**: 開発者・AI向け技術ガイド

### 7.2 Phase 9 関連
- **`DOCS/legacy/PHASE9-ENCRYPTION-AND-API-RUNBOOK.md`**: Phase 9 詳細ランブック（レガシー）
- **`DOCS/Phase9-DB-Migration-Progress.md`**: Phase 9 DB移行進捗レポート
- **`DOCS/CHANGELOG.md`**: 変更履歴（Phase 9完了実績を含む）

### 7.3 Phase 9.5以降
- **`DOCS/PHASE9.7-RUNBOOK.md`**: Phase 9.7 ランブック（最終ハードニング）
- **`DOCS/Phase9.5-Core-Hardening-Next-Ready-Migration-Design.md`**: Phase 9.5 設計（Next.js 15移行）

### 7.4 仕様書
- **`DOCS/Performance-Specification-v1.0.md`**: パフォーマンス要件定義（Phase 9-12必須）
- **`DOCS/Encryption-Allocation-Table.md`**: 暗号化対象の完全版（Phase 9完了）
- **`DOCS/SERVER-API-SPEC.md`**: サーバーAPI仕様書

---

## 8. Phase 9.8 で追加された主要技術

### 8.1 AI Context Control（`lib/core/ai-context.ts`）

**実装内容:**
- **AIContextLevel enum**: MINIMAL / STANDARD / FULL の3レベル
- **sanitizeForAI()**: Context Level に応じたデータ抽出とPII除外
- **maskName()**: 個人名マスキング（例: "田中太郎" → "T.T."）
- **excludeEmail()**: メールアドレス完全除外
- **excludePhone()**: 電話番号完全除外

**コスト・プライバシー制御:**
- MINIMAL: 最小限のコンテキスト（質問のみ）→ トークン消費最小
- STANDARD: Leads概要（個人名マスキング済み）→ 中程度のコスト
- FULL: Leads/Clients詳細（PII除外）→ 最大のコスト

### 8.2 レート制限（`lib/server/rate-limit.ts`）

**実装内容:**
- **5req/min**: ユーザー単位のレート制限
- **429 Too Many Requests**: 制限超過時のエラーレスポンス
- **メモリベース**: シンプルなインメモリカウンター（Phase 10でRedis検討）

**コスト爆発防止:**
- 悪意ある大量リクエストを防止
- 誤操作による連打を防止
- 開発環境での無制限使用を防止

### 8.3 AI監査ログ（`app/api/ai/chat/route.ts`）

**実装内容:**
- **logAIUsage()**: AI利用記録関数（line 226）
- **記録内容**: action='ai_request', contextLevel, tokens, timestamp
- **トークン量記録**: OpenAI APIレスポンスから取得

**コンプライアンス対応:**
- AI利用の透明性確保
- コスト分析・請求根拠
- セキュリティ監査証跡

### 8.4 DB接続の二重化（環境変数）

**実装内容:**
```bash
# API routes用（Transaction Pooler - port 6543）
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@pooler.supabase.com:6543/postgres?pgbouncer=true"

# マイグレーション/管理スクリプト用（Direct Connection - port 5432）
DIRECT_DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

**技術的発見:**
- Supabase の Transaction Pooler (pgbouncer) では prepared statements 不可
- マイグレーション実行には Direct Connection が必須
- ユーザー名が異なる: Pooler = `postgres.PROJECT_REF`, Direct = `postgres`

**教訓:**
- API routes は Transaction Pooler を使用してスケーラビリティ確保
- 管理スクリプトは Direct Connection を使用して複雑なSQL操作実行

---

## 9. Phase 10 への移行判定

### 9.1 Phase 9.8 完了状況

**完了済み:**
- ✅ Phase 9.8-B: AI基盤完全実装（100%）
- ✅ Phase 9.8-A: データ基盤部分完了（40%）
- ✅ Phase 9.8-C: ガバナンス基盤（25%）

**Phase 10 移行判定**: ✅ **可能**

**理由:**
1. AI基盤が完全実装済み → Phase 10 でのAI機能利用可能
2. データ基盤の残タスク（Validator、Conflict UI等）は Phase 10 並行実装可能
3. ガバナンス UI は Phase 10 後に実装可能（コア機能に影響なし）

### 9.2 Phase 10 並行実装推奨タスク

**優先度 P1（Phase 10 並行推奨）:**
- BR-03: sanitizeAppData（Zod Validator）
- BR-06: Conflict Recovery UI（409エラー時のモーダル）
- BR-07: Client Versioning（バージョン不一致時リロード）

**優先度 P2（Phase 10 後実装可）:**
- BR-02: Data Compression（Gzip/Deflate 圧縮）
- BR-08: Perf Monitor（圧縮・暗号化時間計測）
- GOV-01〜03: ガバナンス UI（Admin Dashboard、Role UI、Security Settings）

---

**作成者:** Claude Code
**承認者:** ✅ Phase 14.6-I 完了（2025-12-02）
**次回更新:** Phase 14.6-II 完了時、または Phase 15 開始時

## パフォーマンス最適化戦略（Phase 9.93）

### バンドル最適化

#### コード分割戦略
- **対象タブ**: Reports, ZoomScript, Templates, LeanCanvas
- **手法**: `next/dynamic` による遅延ロード
- **目標**: 初期バンドルサイズ 30% 削減

#### 実装例
```tsx
import dynamic from 'next/dynamic';

const ReportsContent = dynamic(
  () => import('@/app/_components/reports/ReportsContent'),
  { loading: () => <div>読み込み中...</div>, ssr: false }
);
```

### RSC/SSR 部分導入

#### PoC 対象
- **タブ**: Reports（集計データ取得）
- **成果物**: `docs/RSC-POC-REPORT.md`

#### 期待効果
- TTFB短縮（サーバーサイドレンダリング）
- バンドルサイズ削減（クライアント側コード減少）
- SEO改善（サーバーレンダリングによる初期HTML生成）

### CSS 最適化

#### 短期戦略: CSS Modules
- コンポーネント単位でスコープ化
- グローバルCSS汚染の防止

#### 中長期戦略: Tailwind CSS
- ユーティリティファーストによるバンドルサイズ削減
- デザインシステムの統一

**参照**: `docs/PHASE9.93-BUGFIX-RUNBOOK.md` セクション 2.5
