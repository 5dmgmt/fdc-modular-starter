# テナント管理ガイド

**Version:** 1.0
**最終更新:** 2025-12-02（Phase 14.4）

---

## 📋 概要

このガイドでは、FoundersDirect のマルチテナント機能について説明します。
テナントの作成・編集・削除、およびユーザー・ワークスペースとの紐付けについて解説します。

---

## 🏗️ テナント構造

### データモデル

```
tenants (テナント)
├── id (UUID) - テナントID（自動生成、変更不可）
├── subdomain (TEXT) - サブドメイン（例: "app", "company1"）
├── name (TEXT) - テナント名
├── plan (TEXT) - プラン（standard / custom）
├── theme (JSONB) - テーマ設定
├── features (JSONB) - 機能フラグ
└── created_at (TIMESTAMPTZ) - 作成日時

workspaces (ワークスペース)
└── tenant_id (UUID) → tenants.id

users (ユーザー)
└── tenant_id (UUID) → tenants.id

workspace_invitations (招待リンク)
└── workspace_id → workspaces.id → tenants.id
```

### テナント境界

- **ユーザー**: 必ず1つのテナントに所属
- **ワークスペース**: 必ず1つのテナントに所属
- **招待リンク**: ワークスペース経由でテナントに紐付く
- **データ分離**: テナント間でデータは完全に分離

---

## 🌐 サブドメイン設定（インフラ側）

新しいテナントを作成する前に、インフラ側でサブドメインが動作するよう設定が必要です。

### 前提条件

FoundersDirect はワイルドカードサブドメイン（`*.foundersdirect.jp`）を使用します。
これにより、SAダッシュボードでテナントを作成するだけで、新しいサブドメインが即座に動作します。

### 1. DNS設定（Cloudflare）

Cloudflare ダッシュボードで以下を設定：

```
タイプ: CNAME
名前: *
ターゲット: cname.vercel-dns.com
プロキシ状態: DNS のみ（グレー雲）
```

**設定手順:**
1. Cloudflare にログイン
2. `foundersdirect.jp` ドメインを選択
3. DNS → レコードを追加
4. 上記の CNAME レコードを作成

**注意:**
- ワイルドカード（`*`）は全てのサブドメインにマッチ
- 個別のサブドメイン（`app`, `www` など）が既にある場合、そちらが優先される
- プロキシ状態は「DNS のみ」にしないと Vercel で SSL 証明書が発行できない

### 2. Vercel ドメイン設定

Vercel ダッシュボードでワイルドカードドメインを追加：

**設定手順:**
1. Vercel にログイン
2. プロジェクト → Settings → Domains
3. 「Add」をクリック
4. `*.foundersdirect.jp` を入力して追加

**確認事項:**
- SSL 証明書が自動発行される（数分かかる場合あり）
- ステータスが「Valid Configuration」になっていることを確認

### 3. 環境変数の確認

`.env.local` または Vercel 環境変数に以下が設定されていることを確認：

```bash
# 本番環境
NEXT_PUBLIC_APP_URL=https://app.foundersdirect.jp

# ドメイン（テナント解決に使用）
NEXT_PUBLIC_BASE_DOMAIN=foundersdirect.jp
```

### 4. 新規サブドメインの動作確認

1. SAダッシュボードでテナント作成（例: サブドメイン `company1`）
2. ブラウザで `https://company1.foundersdirect.jp` にアクセス
3. ログインページが表示されれば成功

**トラブルシューティング:**
- 「このサイトにアクセスできません」→ DNS 設定を確認
- 「SSL エラー」→ Vercel でドメインのステータスを確認
- ログイン後に `app` テナントになる → `extractSubdomain()` のロジックを確認

---

## 🔧 SAダッシュボードからのテナント管理

### アクセス方法

1. SA権限を持つアカウントでログイン
2. ダッシュボード右下の「SA」ボタンをクリック
3. 「テナント」タブを選択

### 1. テナント一覧の確認

| 列 | 説明 |
|----|------|
| サブドメイン | URLのサブドメイン部分（例: company1.foundersdirect.jp） |
| 名前 | テナントの表示名 |
| プラン | standard / custom |
| WS数 | 所属するワークスペース数 |
| ユーザー数 | 所属するユーザー数 |
| 作成日 | テナント作成日 |

### 2. テナントの作成

「+ テナント作成」ボタンをクリックして、以下を入力：

| 項目 | 必須 | 説明 | 制約 |
|------|------|------|------|
| サブドメイン | ✅ | URLの一部になる | 2-63文字、小文字英数字とハイフンのみ |
| テナント名 | ✅ | 表示名 | 1-100文字 |
| プラン | - | 課金プラン | standard（デフォルト）/ custom |
| 機能フラグ | - | 有効にする機能 | OKR, EnergyLog, OrgChart, Todo, Leads, AI |
| テーマ | - | カラー設定 | primaryColor, accentColor |

**作成後の動作:**
- 新しいテナントIDが自動生成（UUID）
- `https://{subdomain}.foundersdirect.jp` でアクセス可能に
- そのサブドメインからの新規登録ユーザーは自動的にこのテナントに所属

### 3. テナントの編集

テーブルの「編集」ボタンをクリック：

| 項目 | 編集可否 | 備考 |
|------|----------|------|
| サブドメイン | ❌ 変更不可 | URLに影響するため変更できません |
| テナント名 | ✅ 可能 | 表示名のみ変更 |
| プラン | ✅ 可能 | standard ↔ custom |
| 機能フラグ | ✅ 可能 | 各機能のON/OFF |
| テーマ | ✅ 可能 | カラー設定 |

### 4. テナントの削除

テーブルの「削除」ボタンをクリック：

**注意事項:**
- `app` テナントは削除不可（デフォルトテナント）
- 削除すると関連する全てのデータが削除されます
  - 所属するワークスペース
  - 所属するユーザー
  - 関連する招待リンク

### 5. テナント詳細の確認

テーブルの「詳細」ボタンをクリック：

**表示される情報:**
- テナント基本情報
- ワークスペース一覧（ID、名前、メンバー数、作成日）
- ユーザー一覧（名前、メール、ロール、所属WS数、登録日）

---

## 🔄 テナントID変更時の影響範囲

### テナントIDは変更不可

設計上、テナントIDは変更できません。理由：

1. **FK制約**: users, workspaces がテナントIDを参照
2. **データ整合性**: 変更すると全ての紐付けが破壊される
3. **セキュリティ**: 不正なデータアクセスの可能性

### 変更可能な項目と影響

| 項目 | 変更時の影響 |
|------|-------------|
| テナント名 | 表示のみ変更。URLやデータに影響なし |
| プラン | 課金プランの変更。機能制限に影響する可能性 |
| 機能フラグ | 該当テナント内の機能有効/無効が即座に反映 |
| テーマ | 該当テナントのUIカラーが変更 |

---

## 👥 ユーザーとテナントの紐付け

### 新規ユーザー登録時の動作

#### 招待コードなしの場合

```
1. ユーザーが {subdomain}.foundersdirect.jp からログイン
2. システムがホスト名からサブドメインを抽出
3. サブドメインに対応するテナントを検索
4. ユーザーに tenant_id を設定
5. デフォルトワークスペースを作成（同じ tenant_id）
```

**サブドメインからテナントが見つからない場合:**
- デフォルトテナント `app` が設定される
- `app` テナントは必ず存在（マイグレーションで作成）

#### 招待コード経由の場合

```
1. ユーザーが招待リンクをクリック
2. ログイン完了後、招待リンクのワークスペースに参加
3. ユーザーの tenant_id は登録時のサブドメインから決定
4. 招待リンクのテナントと現在のテナントが一致するか検証
5. 不一致の場合は 403 エラー
```

### テナント境界チェック

招待リンク使用時に以下の検証が行われます：

```typescript
// 現在アクセス中のテナント
const currentTenant = await getTenantBySubdomain(subdomain);

// 招待リンクのワークスペースのテナント
const invitationTenant = invitation.workspaces.tenant_id;

// 不一致の場合は拒否
if (currentTenant.id !== invitationTenant) {
  return { error: 'この招待リンクは現在のテナントでは使用できません' };
}
```

---

## 📝 招待リンクとテナント

### 招待リンクの構造

```
workspace_invitations
├── token (TEXT) - 招待トークン
├── workspace_id → workspaces.id → workspaces.tenant_id
├── role (TEXT) - 付与するロール
└── expires_at (TIMESTAMPTZ) - 有効期限
```

### 招待リンクのテナント紐付け

- 招待リンクは直接 tenant_id を持たない
- **ワークスペース経由**でテナントに紐付く
- ワークスペースのテナントが変われば、自動的に招待リンクのテナントも変わる

### テナント間での招待

**異なるテナントのユーザーを招待する場合:**

1. 招待リンクを発行（company1 テナントのワークスペース）
2. ユーザーが company2.foundersdirect.jp からリンクをクリック
3. テナント不一致でエラー
4. ユーザーは company1.foundersdirect.jp からアクセスする必要がある

---

## 🛠️ Claude Code からの操作

### テナント情報の確認

```bash
# テナント一覧
SELECT id, subdomain, name, plan FROM tenants;

# 特定テナントのワークスペース
SELECT w.id, w.name, t.subdomain
FROM workspaces w
JOIN tenants t ON w.tenant_id = t.id
WHERE t.subdomain = 'company1';

# 特定テナントのユーザー
SELECT u.id, u.email, u.name, t.subdomain
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE t.subdomain = 'company1';
```

### テナント作成（推奨: SAダッシュボードから）

```sql
INSERT INTO tenants (subdomain, name, plan, theme, features)
VALUES (
  'newcompany',
  '新規テナント',
  'standard',
  '{"primaryColor": "#111827", "accentColor": "#6366F1"}'::jsonb,
  '{"enableOKR": true, "enableTodo": true, "enableLeads": true}'::jsonb
);
```

### ユーザーのテナント移動（非推奨）

**警告**: 通常は行わない操作です。

```sql
-- ユーザーのテナントを変更
UPDATE users
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'newcompany')
WHERE id = 123;

-- ユーザーのワークスペースも移動する必要がある場合
UPDATE workspaces
SET tenant_id = (SELECT id FROM tenants WHERE subdomain = 'newcompany')
WHERE id IN (
  SELECT workspace_id FROM workspace_members WHERE user_id = 123
);
```

---

## ⚠️ 注意事項

### デフォルトテナント `app`

- 全ての既存データは `app` テナントに所属
- 削除不可
- サブドメインが見つからない場合のフォールバック先

### テナントID の不変性

- テナントID（UUID）は作成時に自動生成
- 一度作成されると変更不可
- サブドメインも変更不可（URLに影響するため）

### データ分離の原則

- 異なるテナント間でデータは完全に分離
- API レイヤーでテナント境界チェックを実施
- RLS は全テーブルで有効（service_role でサーバーサイドアクセス + anon キーからの直接アクセスをブロック）

---

## 📊 トラブルシューティング

### 招待リンクが使えない

**原因**: テナント不一致

**確認方法**:
```sql
-- 招待リンクのテナント
SELECT t.subdomain, t.name
FROM workspace_invitations i
JOIN workspaces w ON i.workspace_id = w.id
JOIN tenants t ON w.tenant_id = t.id
WHERE i.token = 'xxx';
```

**解決策**: 正しいサブドメインからアクセスするよう案内

### ユーザーが見つからない

**原因**: 別テナントに登録されている

**確認方法**:
```sql
SELECT u.email, t.subdomain
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'user@example.com';
```

### ワークスペースが表示されない

**原因**: 現在のテナントと異なるテナントのワークスペース

**確認方法**:
```sql
SELECT w.name, t.subdomain
FROM workspaces w
JOIN tenants t ON w.tenant_id = t.id
JOIN workspace_members wm ON w.id = wm.workspace_id
WHERE wm.user_id = 123;
```

---

## 🎨 テナント別ランディングページ

### ディレクトリ構造

テナントごとに異なるLPを提供するため、以下の構造でコンポーネントを管理します：

```
components/
└── landing/
    ├── default/       ← デフォルトLP（app テナント）
    │   ├── LandingPage.tsx
    │   ├── LandingPage.module.css
    │   ├── HeroSection.tsx
    │   ├── FeaturesSection.tsx
    │   ├── PricingSection.tsx
    │   └── FAQSection.tsx
    ├── shared/        ← 共通コンポーネント（全テナント共通）
    │   ├── ContactForm.tsx
    │   ├── LandingHeader.tsx
    │   └── LandingFooter.tsx
    └── {tenant}/      ← テナント別LP（例: company1/）
        ├── LandingPage.tsx
        └── ...
```

### 新規テナントLPの作成手順

1. **ディレクトリ作成**
   ```bash
   mkdir -p components/landing/{tenant-subdomain}
   ```

2. **LPコンポーネント作成**
   - `default/` からコピーしてカスタマイズ
   - 共通コンポーネントは `shared/` からインポート

3. **app/page.tsx でテナント判定**（将来的な拡張）
   ```tsx
   // 現在はデフォルトLPのみ
   import LandingPage from '@/components/landing/default/LandingPage';

   // 将来的にはテナント判定を追加
   // const tenant = await getTenantFromHost();
   // const LandingPage = await import(`@/components/landing/${tenant}/LandingPage`);
   ```

### テナント別LPの用途

| テナント | LP | 用途 |
|----------|------|------|
| app（デフォルト） | default/ | 一般向けLP |
| company1 | company1/ | 企業A向けカスタムLP |
| partner | partner/ | パートナー向けLP |

---

## 🎨 テナント別テーマカラー

### テーマ設定の仕組み

各テナントは独自のテーマカラーを設定できます。テーマは `tenants.theme` JSONB カラムに保存されます。

```json
{
  "primaryColor": "#111827",
  "accentColor": "#6366F1"
}
```

### SAダッシュボードからの設定

1. SAダッシュボード → テナントタブ
2. テナントの「編集」をクリック
3. テーマカラーを変更
   - **Primary Color**: メインカラー（ヘッダー、ボタンなど）
   - **Accent Color**: アクセントカラー（リンク、アイコンなど）

### テーマの適用

テーマカラーは以下のCSS変数として適用されます：

```css
:root {
  --primary: {primaryColor};
  --primary-dark: {primaryColor の暗いバージョン};
  --accent: {accentColor};
}
```

### テナント別カラー例

| テナント | Primary | Accent | 用途 |
|----------|---------|--------|------|
| app（デフォルト） | #111827 | #6366F1 | 標準的なビジネス向け |
| company1 | #1E40AF | #60A5FA | 青系ブランド企業向け |
| partner | #059669 | #34D399 | 緑系エコ企業向け |

### コード内でのテーマ参照

```tsx
// CSS変数を使用（推奨）
<div style={{ color: 'var(--primary)' }}>...</div>

// Tailwindクラスを使用
<button className="bg-primary text-white">...</button>
```

---

## 📚 関連ドキュメント

- `docs/specs/DB-SECURITY.md` - RLS設定ガイド
- `docs/runbooks/PHASE14.4-FDC-MULTITENANT-WORKSPACE-RUNBOOK.md` - マルチテナント詳細
- `docs/specs/PERMISSION-SYSTEM.md` - 権限システム

---

## 📝 改訂履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| v1.0 | 2025-12-02 | 初版作成（Phase 14.4） |
| v1.1 | 2025-12-02 | サブドメイン設定（DNS/Vercel）セクション追加 |
| v1.2 | 2025-12-03 | テナント別LP構造・テーマカラーセクション追加 |

---

**作成日**: 2025-12-02
**作成者**: Claude Code (Phase 14.4)
**バージョン**: 1.2
