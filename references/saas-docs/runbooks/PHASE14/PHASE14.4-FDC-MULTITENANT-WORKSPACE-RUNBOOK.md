> **事前必読**: 作業を開始する前に、以下のドキュメントを順番にお読みください。
>
> 1. **[FDC-CORE.md](../FDC-CORE.md)** - 開発全体の指針・技術スタック・AIチーム運用（起点）
> 2. **[guides/DEVELOPMENT.md](../guides/DEVELOPMENT.md)** - 開発者・AI向け技術詳細ガイド
> 3. **[specs/DB-SECURITY.md](../specs/DB-SECURITY.md)** - DBセキュリティ設計（RLS必須化の方針と多層防御の設計根拠）
> 4. **[guides/SECURITY.md](../guides/SECURITY.md)** - セキュリティガイド（マルチテナント分離の設計根拠）

# FDC マルチテナント＆ワークスペース ランブック v1.4

| 項目 | 内容 |
|------|------|
| **Status** | Ready |
| **Phase** | 14.4（マルチテナント対応） |
| **対象** | FoundersDirect (`app.foundersdirect.jp`, `*.foundersdirect.jp`) |
| **想定読者** | 実装・運用エンジニア |
| **前提技術** | Next.js 15 (App Router), Postgres (Supabase), Vercel |
| **設計方針** | RLS 有効。service_role でサーバーサイドアクセス + アプリ層で分離を担保 |
| **最終更新** | 2025-01 |

---

## クイックリファレンス

### よく使う手順へのジャンプ

| やりたいこと | セクション |
|-------------|-----------|
| 新規テナント追加 | [6.1 新規テナント追加](#61-新規テナント追加例-tomfoundersdirectjp) |
| 新規ワークスペース追加 | [6.2 ワークスペース追加](#62-既存テナントに新規ワークスペースを追加) |
| トラブル発生時 | [9. トラブルシューティング](#9-トラブルシューティング) |
| 本番デプロイ前確認 | [8. DOD チェックリスト](#8-doddefinition-of-done) |
| 並列実行計画 | [5. 並列実行サマリー](#5-並列実行サマリー) |

### フェーズ全体像

```
Phase 1: 前提確認
    └─ 環境チェック

Phase 2: インフラ & DB コアテーブル
    ├─ 2-A: DNS/Vercel 設定        ─┐
    └─ 2-B: DB コアテーブル作成    ─┴─ 並列実行可能

Phase 3: DB 拡張
    ├─ 3-A: users テーブル拡張
    └─ 3-B: 業務テーブル拡張（各テーブル並列可能）

Phase 4: アプリケーション層
    ├─ 4-A: テナント解決レイヤー   ─┐
    ├─ 4-B: ワークスペース解決     ─┼─ 並列実行可能
    └─ 4-C: 設定マージ             ─┘

Phase 5: 統合
    └─ 業務リポジトリ tenant-aware 化（各リポジトリ並列可能）

Phase 6: 検証
    └─ DOD チェック & E2E テスト
```

---

## 1. 概要

### 1.1 目的

FoundersDirect(FDC) を以下の要件で運用可能にする。

1. `app.foundersdirect.jp` を本体として、`tom.foundersdirect.jp` のようなサブドメイン単位で顧客別環境を提供
2. 単一リポジトリ・単一 DB で SaaS としての開発速度を維持
3. アプリケーション層でテナント／ワークスペース間のデータ分離を担保
4. テナント単位・ワークスペース単位で仕様・UI を切り替え可能

### 1.2 スコープ

- 用語定義と責務
- アーキテクチャ方針
- DB スキーマ設計・マイグレーション
- アプリケーション層実装
- 運用手順（テナント・ワークスペース追加）
- トラブルシューティング

---

## 2. 用語定義

| 用語 | 説明 | 例 |
|------|------|-----|
| **ドメイン** | サブドメイン単位のアクセスポイント。1ドメイン=1テナント | `app.foundersdirect.jp`, `tom.foundersdirect.jp` |
| **テナント** | 1社・1クライアント単位。請求・ブランド・機能フラグを管理 | TOM株式会社 |
| **ワークスペース** | テナント内の部門/チーム単位。レイアウト・機能オーバーライドを管理 | 経営チーム、全社 |
| **ユーザー** | 1テナントに属し、複数ワークスペースに参加可能 | bob@example.com |

```
┌─────────────────────────────────────────────────┐
│  Domain: tom.foundersdirect.jp                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Tenant: TOM株式会社                       │  │
│  │  ┌─────────────┐  ┌─────────────────────┐ │  │
│  │  │ Workspace:  │  │ Workspace:          │ │  │
│  │  │ 経営チーム   │  │ 全社               │ │  │
│  │  │  ├─ User A  │  │  ├─ User A          │ │  │
│  │  │  └─ User B  │  │  ├─ User B          │ │  │
│  │  │             │  │  └─ User C          │ │  │
│  │  └─────────────┘  └─────────────────────┘ │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

## 3. アーキテクチャ方針

### 3.1 設計原則

| 原則 | 内容 |
|------|------|
| **単一リポジトリ** | `foundersdirect` で全テナント・ワークスペースを管理 |
| **単一 Vercel プロジェクト** | `app.foundersdirect.jp` + `*.foundersdirect.jp` を同一プロジェクトに |
| **単一 DB (マルチテナント)** | 全業務テーブルに `tenant_id` + `workspace_id` を付与 |
| **RLS 有効** | ENABLE RLS + service_role ポリシー + アプリ層 + テストでデータ分離を担保 |

> **設計意図**: VIP テナント向け別プロジェクトの例外を最小化し、将来的なリポジトリ分割コストを抑制

### 3.2 解決フロー

```
Request → host header から subdomain 抽出
                ↓
        tenants テーブル検索 → Tenant 特定
                ↓
        URL / 選択 UI から Workspace 特定
                ↓
        tenant_config + workspace_config → effectiveConfig 生成
                ↓
        DB アクセス（tenant_id / workspace_id 必須）
```

---

## 4. 実装フェーズ

---

### Phase 1: 前提確認

> ⚠️ **実装開始前に必ず確認**

| 項目 | 確認方法 | 完了 |
|------|---------|------|
| Next.js 15 / App Router 稼働 | `npm run dev` で起動確認 | [ ] |
| DB 接続安定 | `npx prisma db pull` 成功 | [ ] |
| GRAND-GUIDE 更新済み | `docs/FDC-GRAND-GUIDE.md` 確認 | [ ] |
| RLS 有効 | Supabase Dashboard で全テーブル ENABLE RLS を確認 | [ ] |

---

### Phase 2: インフラ & DB コアテーブル

> 💡 **2-A と 2-B は並列実行可能**

---

#### Phase 2-A: DNS / Vercel 設定

**所要時間**: 約30分（DNS 反映待ち含む）

##### 2-A-1. DNS 設定

```bash
# ワイルドカード CNAME を追加
*.foundersdirect.jp → cname.vercel-dns.com
```

##### 2-A-2. Vercel ドメイン追加

```bash
vercel domains add foundersdirect.jp
vercel domains add app.foundersdirect.jp
vercel domains add "*.foundersdirect.jp"
```

##### 2-A-3. ステージング用（任意）

```bash
vercel domains add stg.foundersdirect.jp
vercel domains add "*.stg.foundersdirect.jp"
```

**完了確認**:
```bash
dig +short tom.foundersdirect.jp  # CNAME が返れば OK
```

---

#### Phase 2-B: DB コアテーブル作成

> ⚠️ **本番実行前に必ずバックアップを取得**
>
> ```bash
> pg_dump -h <host> -U <user> -d <db> > backup_$(date +%Y%m%d_%H%M%S).sql
> ```

##### 2-B-1. tenants テーブル

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'standard',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tenants (subdomain, name, plan, theme, features)
VALUES ('app', 'FoundersDirect 本体', 'standard', '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (subdomain) DO NOTHING;
```

##### 2-B-2. workspaces テーブル

```sql
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspaces_tenant_idx ON workspaces(tenant_id);
```

##### 2-B-3. workspace_members テーブル

```sql
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON workspace_members(user_id);
```

**完了確認**:
```sql
SELECT subdomain, name, plan FROM tenants;
SELECT COUNT(*) FROM workspaces;
SELECT COUNT(*) FROM workspace_members;
```

**config の例**:
```json
{
  "layout": "management-dashboard-v1",
  "featureOverrides": { "enableEnergyLog": true },
  "tabs": ["dashboard", "okr", "todo"]
}
```

---

### Phase 3: DB 拡張

> ⚠️ **Phase 2-B 完了後に実行**

---

#### Phase 3-A: users テーブル拡張

> ⚠️ **破壊的変更**: 本番実行前にユーザー数を確認

```sql
-- Step 1: カラム追加
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Step 2: 既存ユーザーにデフォルトテナント付与
UPDATE users
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'app')
WHERE tenant_id IS NULL;

-- Step 3: NOT NULL 制約追加
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: FK 制約追加
ALTER TABLE users
  ADD CONSTRAINT users_tenant_fk
  FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Step 5: 複合ユニーク制約
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_key
  ON users(tenant_id, email);
```

> 💡 **設計**: 同一メールでもテナントごとに別ユーザー。クロステナント共有は `tenant_members` で対応

---

#### Phase 3-B: 業務テーブル拡張

> 💡 **各テーブルは並列実行可能**: `todos`, `projects`, `okr`, `energy_logs` 等

**todos テーブルの例**:

```sql
-- Step 1: Default ワークスペースを先に作成
INSERT INTO workspaces (tenant_id, name, config)
SELECT id, 'Default', '{}'::jsonb FROM tenants WHERE subdomain = 'app'
ON CONFLICT DO NOTHING;

-- Step 2: カラム追加
ALTER TABLE todos
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Step 3: 既存レコードにデフォルト値設定
UPDATE todos
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'app')
WHERE tenant_id IS NULL;

UPDATE todos t
SET workspace_id = (
  SELECT w.id FROM workspaces w
  WHERE w.tenant_id = t.tenant_id AND w.name = 'Default'
  LIMIT 1
)
WHERE t.workspace_id IS NULL;

-- Step 4: NOT NULL 制約追加
ALTER TABLE todos
  ALTER COLUMN tenant_id SET NOT NULL,
  ALTER COLUMN workspace_id SET NOT NULL;

-- Step 5: FK 制約追加
ALTER TABLE todos
  ADD CONSTRAINT todos_tenant_fk FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  ADD CONSTRAINT todos_workspace_fk FOREIGN KEY (workspace_id) REFERENCES workspaces(id);

-- Step 6: インデックス追加
CREATE INDEX IF NOT EXISTS todos_tenant_workspace_idx ON todos(tenant_id, workspace_id);
```

**完了確認**:
```sql
SELECT COUNT(*) as total,
       COUNT(tenant_id) as with_tenant,
       COUNT(workspace_id) as with_workspace
FROM todos;
```

| テーブル | 完了 |
|---------|------|
| todos | [ ] |
| projects | [ ] |
| okr | [ ] |
| energy_logs | [ ] |

---

### Phase 4: アプリケーション層

> 💡 **4-A, 4-B, 4-C は並列実行可能**
> **依存**: Phase 3 完了後

---

#### Phase 4-A: テナント解決レイヤー

##### 4-A-1. サーバー側テナント解決

**ファイル**: `lib/server/tenants.ts`

```ts
import { cache } from "react";
import { db } from "@/lib/server/db";

export const getTenantBySubdomain = cache(async (subdomain: string) => {
  const tenant = await db
    .selectFrom("tenants")
    .selectAll()
    .where("subdomain", "=", subdomain)
    .executeTakeFirst();
  return tenant ?? null;
});
```

##### 4-A-2. RootLayout でのテナント注入

**ファイル**: `app/layout.tsx`

```ts
import { headers } from "next/headers";
import { getTenantBySubdomain } from "@/lib/server/tenants";
import { TenantProvider } from "@/lib/client/tenant-context";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const defaultHost = process.env.NEXT_PUBLIC_APP_HOST ?? "app.foundersdirect.jp";
  const host = headersList.get("host") ?? defaultHost;
  const subdomain = host.includes("localhost") ? "app" : host.split(".")[0];

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) throw new Error(`Unknown tenant: ${subdomain}`);

  return (
    <html>
      <body>
        <TenantProvider tenant={tenant}>{children}</TenantProvider>
      </body>
    </html>
  );
}
```

**環境変数**:
```env
NEXT_PUBLIC_APP_HOST=app.foundersdirect.jp
NEXT_PUBLIC_ROOT_DOMAIN=foundersdirect.jp
```

##### 4-A-3. クライアント側 TenantContext

**ファイル**: `lib/client/tenant-context.tsx`

```ts
"use client";
import { createContext, useContext } from "react";

export type Tenant = {
  id: string;
  subdomain: string;
  name: string;
  plan: string;
  theme: Record<string, unknown>;
  features: Record<string, boolean>;
};

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({ tenant, children }: { tenant: Tenant; children: React.ReactNode }) {
  return <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("TenantContext not found");
  return ctx;
}
```

**完了確認**:
- [ ] `npm run dev` で localhost アクセス時に 'app' テナントが解決される
- [ ] `useTenant()` でテナント情報が取得できる

---

#### Phase 4-B: ワークスペース解決レイヤー

##### 4-B-1. ワークスペースリポジトリ

**ファイル**: `lib/server/workspaces.ts`

```ts
import { db } from "@/lib/server/db";

export async function listWorkspacesByTenant(tenantId: string) {
  return db.selectFrom("workspaces").selectAll().where("tenant_id", "=", tenantId).execute();
}

export async function getTenantWorkspace(workspaceId: string, tenantId: string) {
  const workspace = await db
    .selectFrom("workspaces")
    .selectAll()
    .where("id", "=", workspaceId)
    .executeTakeFirst();

  if (!workspace) return null;

  if (workspace.tenant_id !== tenantId) {
    console.error(`[SECURITY] Tenant mismatch: req=${tenantId}, ws=${workspace.tenant_id}`);
    throw new Error("Forbidden: Workspace does not belong to this tenant");
  }

  return workspace;
}
```

##### 4-B-2. URL パターン & Route

**方針**: 業務画面は `/w/[workspaceId]/...` に統一

| URL | 説明 |
|-----|------|
| `/w/123/dashboard` | ダッシュボード |
| `/w/123/todo` | TODO 一覧 |
| `/w/123/okr` | OKR 管理 |

**Route 例**: `app/w/[workspaceId]/dashboard/page.tsx`

```ts
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTenantBySubdomain } from "@/lib/server/tenants";
import { getTenantWorkspace } from "@/lib/server/workspaces";
import { buildEffectiveConfig } from "@/lib/server/config";

export default async function DashboardPage({ params }: { params: { workspaceId: string } }) {
  const headersList = await headers();
  const host = headersList.get("host")!;
  const subdomain = host.includes("localhost") ? "app" : host.split(".")[0];

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) throw new Error("Unknown tenant");

  const workspace = await getTenantWorkspace(params.workspaceId, tenant.id);
  if (!workspace) notFound();

  const config = buildEffectiveConfig(tenant, workspace);
  return <DashboardView config={config} workspaceId={workspace.id} />;
}
```

**完了確認**:
- [ ] `/w/<workspace_id>/dashboard` でワークスペースが解決される
- [ ] 他テナントの workspaceId で 403 エラーになる

---

#### Phase 4-C: 設定マージ (effectiveConfig)

**ファイル**: `lib/server/config.ts`

```
優先順位: Workspace > Tenant > Default
```

```ts
import { z } from "zod";
import type { Tenant } from "@/lib/server/tenants";
import type { Workspace } from "@/lib/server/workspaces";

const WorkspaceConfigSchema = z.object({
  layout: z.string().default("standard-dashboard-v1"),
  featureOverrides: z.record(z.boolean()).default({}),
});

type EffectiveConfig = {
  theme: Record<string, string>;
  features: Record<string, boolean>;
  layout: string;
};

const DEFAULT_CONFIG = {
  theme: { primaryColor: "#111827", accentColor: "#6366F1" },
  features: { enableOKR: true, enableEnergyLog: true, enableOrgChart: false },
  layout: "standard-dashboard-v1",
};

export function buildEffectiveConfig(tenant: Tenant, workspace: Workspace): EffectiveConfig {
  const wsConfig = WorkspaceConfigSchema.safeParse(workspace.config ?? {});
  const workspaceConfig = wsConfig.success ? wsConfig.data : WorkspaceConfigSchema.parse({});

  return {
    theme: { ...DEFAULT_CONFIG.theme, ...tenant.theme },
    features: { ...DEFAULT_CONFIG.features, ...tenant.features, ...workspaceConfig.featureOverrides },
    layout: workspaceConfig.layout ?? DEFAULT_CONFIG.layout,
  };
}
```

**完了確認**:
- [ ] テナント設定がデフォルトを上書きする
- [ ] ワークスペース設定がテナント設定を上書きする

---

### Phase 5: 統合

> ⚠️ **Phase 4 全完了後に実行**
> 💡 **各リポジトリは並列実装可能**

#### 業務リポジトリの tenant-aware 化

##### 原則

| ルール | 説明 |
|--------|------|
| **必須パラメータ** | 全 DB 操作は `tenant_id` + `workspace_id` を引数に含める |
| **直接アクセス禁止** | 生 SQL/ORM 直接呼び出しは禁止。共通レイヤー経由のみ |
| **メンバーシップ検証** | データアクセス前に `workspace_members` でユーザー権限を検証 |

##### TODO リポジトリ例

**ファイル**: `lib/server/repos/todos.ts`

```ts
import { db } from "@/lib/server/db";

type TenantAwareParams = { tenantId: string; workspaceId: string; userId: string };

async function verifyMembership(workspaceId: string, userId: string) {
  const member = await db
    .selectFrom("workspace_members")
    .select("id")
    .where("workspace_id", "=", workspaceId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!member) throw new Error("Forbidden: user is not a member of this workspace");
}

export async function listTodos({ tenantId, workspaceId, userId }: TenantAwareParams) {
  return db
    .selectFrom("todos")
    .innerJoin("workspace_members", "workspace_members.workspace_id", "todos.workspace_id")
    .selectAll("todos")
    .where("todos.tenant_id", "=", tenantId)
    .where("todos.workspace_id", "=", workspaceId)
    .where("workspace_members.user_id", "=", userId)
    .orderBy("created_at", "desc")
    .execute();
}

export async function createTodo(params: TenantAwareParams & { title: string }) {
  const { tenantId, workspaceId, userId, title } = params;
  await verifyMembership(workspaceId, userId);

  const [todo] = await db
    .insertInto("todos")
    .values({ tenant_id: tenantId, workspace_id: workspaceId, user_id: userId, title })
    .returningAll()
    .execute();

  return todo;
}
```

**呼び出し例**:
```ts
await listTodos({
  tenantId: tenant.id,
  workspaceId: workspace.id,
  userId: session.user.id,
});
```

##### 業務リポジトリ進捗

| リポジトリ | 完了 |
|-----------|------|
| `lib/server/repos/todos.ts` | [ ] |
| `lib/server/repos/projects.ts` | [ ] |
| `lib/server/repos/okr.ts` | [ ] |
| `lib/server/repos/energy-logs.ts` | [ ] |

---

### Phase 6: 検証

> ⚠️ **Phase 5 完了後に実行**

セクション [8. DOD（Definition of Done）](#8-doddefinition-of-done) のチェックリストを全て確認

---

## 5. 並列実行サマリー

### フェーズ別並列可否

| Phase | 並列可否 | 内容 |
|-------|---------|------|
| 1 | 単独 | 前提確認 |
| 2-A / 2-B | **並列可能** | DNS 設定 / DB コアテーブル |
| 3-A | 順次 | users 拡張（2-B 完了後） |
| 3-B | **並列可能** | 業務テーブル拡張（各テーブル並列） |
| 4-A / 4-B / 4-C | **並列可能** | テナント解決 / WS解決 / 設定マージ |
| 5 | **並列可能** | 業務リポジトリ（各リポジトリ並列） |
| 6 | 単独 | 検証 |

### 担当アサイン例（3人チーム）

| Phase | タスク | 担当 A | 担当 B | 担当 C |
|-------|--------|--------|--------|--------|
| 2 | 2-A: DNS/Vercel | ✅ | - | - |
| 2 | 2-B: DB コアテーブル | - | ✅ | - |
| 3 | 3-A: users 拡張 | - | ✅ | - |
| 3 | 3-B: todos 拡張 | ✅ | - | - |
| 3 | 3-B: projects 拡張 | - | - | ✅ |
| 4 | 4-A: テナント解決 | ✅ | - | - |
| 4 | 4-B: ワークスペース解決 | - | ✅ | - |
| 4 | 4-C: effectiveConfig | - | - | ✅ |
| 5 | repos/todos.ts | ✅ | - | - |
| 5 | repos/projects.ts | - | ✅ | - |
| 5 | repos/okr.ts | - | - | ✅ |

### 同期ポイント

```
Phase 1 完了 ──→ Phase 2 開始（2-A / 2-B 並列）
                      ↓
Phase 2-B 完了 ──→ Phase 3 開始
                      ↓
Phase 3 完了 ──→ Phase 4 開始（4-A / 4-B / 4-C 並列）
                      ↓
Phase 4 完了 ──→ Phase 5 開始（各リポジトリ並列）
                      ↓
Phase 5 完了 ──→ Phase 6 開始
```

---

## 6. 運用手順

### 6.1 新規テナント追加（例: `tom.foundersdirect.jp`）

#### チェックリスト

- [ ] 要件定義完了（テーマ/機能/ワークスペース構成）
- [ ] DNS 設定（ワイルドカードなら不要）
- [ ] DB レコード作成
- [ ] 管理者ユーザー作成
- [ ] 動作確認

#### 手順（1トランザクションで実行可能）

```sql
BEGIN;

-- Step 1: テナントレコード作成
INSERT INTO tenants (subdomain, name, plan, theme, features)
VALUES (
  'tom',
  'TOM株式会社',
  'custom',
  '{"primaryColor": "#123456", "logoUrl": "https://example.com/tom-logo.svg"}',
  '{"enableOKR": true, "enableEnergyLog": false}'
);

-- Step 2: 初期ワークスペース作成
INSERT INTO workspaces (tenant_id, name, config)
VALUES (
  (SELECT id FROM tenants WHERE subdomain = 'tom'),
  '経営チーム',
  '{"layout": "management-dashboard-v1", "tabs": ["dashboard", "okr", "todo"]}'
);

-- Step 3: 管理者ユーザー作成（認証プロバイダー経由の場合はスキップ）
INSERT INTO users (email, name, tenant_id)
VALUES (
  'admin@tom.example.com',
  '管理者',
  (SELECT id FROM tenants WHERE subdomain = 'tom')
);

-- Step 4: ワークスペースメンバー追加
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES (
  (SELECT id FROM workspaces WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'tom') LIMIT 1),
  (SELECT id FROM users WHERE email = 'admin@tom.example.com'),
  'owner'
);

COMMIT;
```

**動作確認**:
```bash
open https://tom.foundersdirect.jp
```

---

### 6.2 既存テナントに新規ワークスペースを追加

```sql
-- ワークスペース作成
INSERT INTO workspaces (tenant_id, name, config)
VALUES (
  (SELECT id FROM tenants WHERE subdomain = 'tom'),
  '全社',
  '{"layout": "standard-dashboard-v1", "tabs": ["dashboard", "todo"]}'
)
RETURNING id;

-- メンバー追加（上記で返った id を使用）
INSERT INTO workspace_members (workspace_id, user_id, role)
VALUES ('<workspace_id>', '<user_id>', 'member');
```

---

## 7. セキュリティ・品質ガイドライン

### 7.1 セキュリティチェックリスト

| チェック項目 | 必須 | 確認方法 |
|-------------|------|---------|
| 全業務テーブルに `tenant_id`/`workspace_id` あり | ✅ | スキーマ確認 |
| ユニーク制約に `tenant_id` 含む | ✅ | `\d+ <table>` |
| 全 DB アクセスが tenant-aware repository 経由 | ✅ | コードレビュー |
| `getTenantWorkspace` 経由でテナント検証 | ✅ | コードレビュー |
| 他テナントの workspaceId で 403 | ✅ | E2E テスト |

### 7.2 必須 E2E テストシナリオ

```ts
describe("マルチテナント分離", () => {
  it("テナント A のデータがテナント B から見えない", async () => {
    // tenant A でデータ作成 → tenant B でアクセス → 空配列
  });

  it("Workspace 1 のデータが Workspace 2 から見えない", async () => {
    // ws1 でデータ作成 → ws2 でアクセス → 空配列
  });

  it("別ドメインで他テナントの workspaceId を叩くと 403", async () => {
    // tom.foundersdirect.jp から app テナントの wsId → 403
  });
});
```

### 7.3 パフォーマンス基準

| 指標 | 基準値 |
|------|--------|
| ダッシュボード API P95 | < 400ms |
| インデックスヒット率 | > 99% |

---

## 8. DOD（Definition of Done）

> ✅ 全項目チェック完了で本番リリース可能

### DB

- [ ] `tenants` / `workspaces` / `workspace_members` テーブル存在
- [ ] 主要業務テーブルに `tenant_id` / `workspace_id` 追加済み（NOT NULL / FK 制約有効）

### アプリケーション

- [ ] RootLayout で `host` → `tenant` 解決・`TenantProvider` 動作
- [ ] `/w/[workspaceId]/...` で `workspace.tenant_id === tenant.id` 検証実装
- [ ] 全業務 DB アクセスが tenant-aware repository 経由

### テスト・検証

- [ ] `tom.foundersdirect.jp` 等のサブドメインで実動作確認済
- [ ] E2E テストでテナント/ワークスペース間データ混線なし確認

### ドキュメント

- [ ] `docs/FDC-GRAND-GUIDE.md` に本ランブックへのリンク追記

---

## 9. トラブルシューティング

### 9.1 よくある問題

| 症状 | 原因 | 解決策 |
|------|------|--------|
| `Unknown tenant` エラー | DB に subdomain が存在しない | `SELECT * FROM tenants WHERE subdomain = 'xxx'` で確認 |
| 403 Forbidden | テナント不一致 | ログの `[SECURITY]` を確認。正しいドメインでアクセスしているか確認 |
| データが見えない | workspace_members に未登録 | メンバーシップを追加 |
| localhost でエラー | subdomain 解決失敗 | `host.includes("localhost")` 条件を確認 |

### 9.2 デバッグクエリ

```sql
-- テナント一覧
SELECT id, subdomain, name, plan FROM tenants;

-- ワークスペースとメンバー数
SELECT w.id, w.name, t.subdomain, COUNT(wm.id) as member_count
FROM workspaces w
JOIN tenants t ON t.id = w.tenant_id
LEFT JOIN workspace_members wm ON wm.workspace_id = w.id
GROUP BY w.id, w.name, t.subdomain;

-- 特定ユーザーの所属ワークスペース
SELECT w.name, t.subdomain, wm.role
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
JOIN tenants t ON t.id = w.tenant_id
WHERE wm.user_id = '<user_id>';
```

### 9.3 ログ確認ポイント

```bash
# セキュリティアラート検索
grep "\[SECURITY\]" /var/log/app.log

# テナント解決エラー
grep "Unknown tenant" /var/log/app.log
```

---

## 10. 関連ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| `docs/FDC-GRAND-GUIDE.md` | FDC 全体設計ガイド |
| `docs/database/SCHEMA.md` | DB スキーマ詳細 |
| `docs/api/AUTHENTICATION.md` | 認証・認可設計 |
