# Next.js 16 クイックリファレンス

> **更新日**: 2025-12-10
> **適用バージョン**: Next.js 16.0.8
> **目的**: Claude Code / Cursor などの AI コーディングツールに読ませて、Next.js 16 の破壊的変更を正しく理解させる

---

## AI コーディングツールをお使いの方へ

**2025年12月時点で、Claude Code や Cursor などの AI は Next.js 16 の変更点を十分に学習していません。**

そのため、AI は以下のような**間違ったコード**を生成する可能性があります：

- ❌ `middleware.ts` を作成しようとする（正しくは `proxy.ts`）
- ❌ `params` を同期的にアクセスする（正しくは `await params`）
- ❌ `next lint` コマンドを使用する（正しくは `eslint .`）

**このドキュメントを AI に読ませることで、正しいコードを生成させることができます。**

### AI への指示例

```
このプロジェクトは Next.js 16 を使用しています。
docs/guides/NEXTJS16-QUICK-REFERENCE.md を読んで、
Next.js 16 の破壊的変更を理解してから作業してください。
```

---

## 移行必須チェックリスト

Next.js 15 → 16 へのアップグレードで**必ず対応が必要な項目**:

| # | 項目 | 必須度 | 備考 |
|---|------|--------|------|
| 1 | `middleware.ts` → `proxy.ts` | ⚠️ **必須** | ファイル名・関数名の変更 |
| 2 | `params` / `searchParams` の非同期化 | ⚠️ **必須** | Server Component で `await` 必須 |
| 3 | `cookies()` / `headers()` の await | ⚠️ **必須** | 既に await していれば OK |
| 4 | `next lint` → `eslint .` | ⚠️ **必須** | package.json 修正 |
| 5 | React 19.2.1 以上 | ⚠️ **必須** | CVE-2025-55182 対策 |
| 6 | **ファイル重複の解消** | ⚠️ **必須** | index.ts/tsx、Component.tsx/Component/ の重複を確認 |
| 7 | Parallel Routes の `default.js` | 条件付き | 使用している場合のみ |
| 8 | `revalidateTag` 新シグネチャ | 条件付き | 使用している場合のみ |

---

## 公式ドキュメント

| ドキュメント | URL |
|-------------|-----|
| **Next.js 16 公式ブログ** | https://nextjs.org/blog/next-16 |
| **アップグレードガイド** | https://nextjs.org/docs/app/guides/upgrading/version-16 |
| **CVE-2025-66478 セキュリティアドバイザリ** | https://nextjs.org/blog/CVE-2025-66478 |

---

## 日本語解説記事

| 記事 | URL |
|------|-----|
| **TECHSCORE: Next.js 16 移行ガイド** | https://blog.techscore.com/entry/2025/12/01/080000 |

---

## 主要な変更点

### 1. middleware.ts → proxy.ts（最重要）

**AI が最も間違えやすいポイントです。**

Next.js 16 で **Middleware は Proxy に名称変更**されました。`middleware.ts` は存在しません。

#### 変更手順

```bash
# 1. ファイル名変更
mv middleware.ts proxy.ts

# 2. 関数名変更（エディタで）
# export function middleware → export function proxy
```

#### コード変更

```typescript
// ❌ Before (Next.js 15) - middleware.ts
// このファイルは Next.js 16 では動作しません！
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// ✅ After (Next.js 16) - proxy.ts
// ファイル名も関数名も "proxy" です
export function proxy(request: NextRequest) {
  return NextResponse.next();
}
```

#### config の変更（該当する場合のみ）

```typescript
// ❌ Before (Next.js 15)
skipMiddlewareUrlNormalize: true,

// ✅ After (Next.js 16)
skipProxyUrlNormalize: true,
```

#### matcher 設定例

```typescript
// proxy.ts
export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)',
  ],
};
```

#### 注意点

1. **静的ファイルの除外**: matcher で静的ファイル（画像、CSS、JS）を除外しないとパフォーマンスが低下
2. **API Routes の除外**: `/api/*` は proxy から除外（各エンドポイントで認証処理）
3. **サブドメイン処理**: サブドメインは proxy 内でリライト処理

---

### 2. 非同期 API 必須化（重要）

**AI が古いコードを生成しやすいポイントです。**

Next.js 16 では、Server Component での `params`、`searchParams`、`cookies()`、`headers()` へのアクセスが**非同期必須**になりました。

#### 2.1 params の非同期化

```typescript
// ❌ Before (同期アクセス - Next.js 16 ではエラー)
// AI がこのコードを生成したら修正してください
export default function Page({ params }) {
  const { slug } = params;  // エラー！
}

// ✅ After (非同期 - Next.js 16 必須)
export default async function Page({ params }) {
  const { slug } = await params;  // OK
}

// ✅ または Promise 型を明示
export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
}
```

#### 2.2 searchParams の非同期化

```typescript
// ❌ Before - AI がこのコードを生成することがあります
export default function Page({ searchParams }) {
  const query = searchParams.q;  // エラー！
}

// ✅ After (Next.js 16)
export default async function Page({ searchParams }) {
  const { q } = await searchParams;
}
```

#### 2.3 cookies() / headers() の非同期化

```typescript
import { cookies, headers } from 'next/headers';

// ❌ Before (Next.js 15 では動作していた)
const cookieStore = cookies();
const value = cookieStore.get('name');

// ✅ After (Next.js 16 必須)
const cookieStore = await cookies();
const value = cookieStore.get('name');

// headers も同様
const headersList = await headers();
const userAgent = headersList.get('user-agent');
```

#### 2.4 Client Component では影響なし

```typescript
'use client';

// Client Component では useParams() を使用（変更なし）
import { useParams, useSearchParams } from 'next/navigation';

export default function ClientPage() {
  const params = useParams();        // ✅ 同期的に動作
  const searchParams = useSearchParams();  // ✅ 同期的に動作
  return <div>{params.slug}</div>;
}
```

---

### 3. Turbopack デフォルト化

```bash
# 開発サーバー（Turbopack がデフォルト）
npm run dev

# Webpack に戻す場合（互換性問題がある場合）
npm run dev -- --webpack
npm run build -- --webpack
```

**パフォーマンス改善**:
- ビルド: 2-5倍高速
- Fast Refresh: 最大10倍高速

---

### 4. ESLint（重要）

**`next lint` コマンドは廃止されました。**

#### 変更が必要な箇所

**package.json**:
```json
{
  "scripts": {
    // ❌ Before (Next.js 15) - 動作しません
    "lint": "next lint",

    // ✅ After (Next.js 16)
    "lint": "eslint ."
  }
}
```

#### ESLint 設定ファイル

Next.js 16 では **Flat Config (eslint.config.mjs)** を推奨:

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // カスタムルール
    },
  },
];
```

---

### 5. キャッシュコンポーネント

```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};

// 使用例
'use cache';

export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

---

### 6. revalidateTag 新シグネチャ

```typescript
// ❌ Before
revalidateTag('blog-posts');

// ✅ After (cacheLife プロファイル必須)
revalidateTag('blog-posts', 'max');
revalidateTag('news-feed', 'hours');
```

---

### 7. updateTag / refresh（新API）

```typescript
'use server';
import { updateTag, refresh } from 'next/cache';

// 即座に変更を反映（Server Actions 専用）
export async function updateProfile(userId: string) {
  await db.users.update(userId, ...);
  updateTag(`user-${userId}`);
}

// キャッシュされていないデータのみ更新
export async function markAsRead(id: string) {
  await db.notifications.markAsRead(id);
  refresh();
}
```

---

### 8. next/image 変更

| 設定 | v15 デフォルト | v16 デフォルト |
|------|---------------|---------------|
| `minimumCacheTTL` | 60秒 | 14400秒 (4時間) |
| `imageSizes` | [16, 32, ...] | [32, ...] (16削除) |
| `qualities` | [1-100] | [75] |
| `maximumRedirects` | 無制限 | 3 |

---

### 9. Parallel Routes

すべてのスロットに `default.js` が必須:

```tsx
// app/@modal/default.tsx
export default function Default() {
  return null;
}
```

---

## 環境要件

| 要件 | 最小バージョン |
|------|----------------|
| Node.js | 24.5.0 |
| TypeScript | 5.1.0+ |
| Chrome | 111+ |
| Edge | 111+ |
| Firefox | 111+ |
| Safari | 16.4+ |

---

## セキュリティ対応

### React CVE-2025-55182 (React2Shell)

- **影響**: React Server Components の unsafe deserialization
- **CVSS**: 10.0（最大）
- **対応**: React 19.2.1 で修正済み

### Next.js CVE-2025-66478

- **対応**: Next.js 16.0.7 で修正済み

---

## AI への指示テンプレート

以下をコピーして AI に伝えてください：

```
# Next.js 16 プロジェクトの注意事項

このプロジェクトは Next.js 16 を使用しています。以下の点に注意してください：

1. **middleware は proxy にリネームされています**
   - ファイル: middleware.ts → proxy.ts
   - 関数: middleware() → proxy()

2. **Server Component の params/searchParams は非同期です**
   - const { slug } = await params; // await 必須

3. **cookies()/headers() も非同期です**
   - const cookieStore = await cookies();

4. **ESLint は直接実行します**
   - npm run lint は "eslint ." を実行

詳細は docs/guides/NEXTJS16-QUICK-REFERENCE.md を参照してください。
```

---

## よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `middleware is not defined` | proxy.ts なのに middleware() を参照 | 関数名を proxy() に修正 |
| `params is a Promise` | 同期アクセスしている | await params に修正 |
| `next lint: command not found` | next lint 廃止 | eslint . を使用 |
| ビルドが遅い | Webpack にフォールバック | --webpack を削除してTurbopack使用 |
| **React Error #130** | コンポーネントが undefined | ファイル重複を確認（後述） |
| **export not found** | index.ts と index.tsx の重複 | どちらかを削除（後述） |

### ⚠️ 重要: ファイル重複問題（Next.js 16 特有）

**Next.js 16 (Turbopack) では、同じ名前のファイルとディレクトリが存在する場合、優先順位が Next.js 15 と異なります。**

#### 問題パターン 1: index.ts と index.tsx の両方が存在

```
components/landing/workshop/
├── index.ts        ← Next.js 15 ではこちらが優先
├── index.tsx       ← Next.js 16 ではこちらが優先（Turbopack）
└── WorkshopPage.tsx
```

**症状**:
- ビルドは成功するが、ランタイムで `export not found` エラー
- `Error: Minified React error #130` (undefined をレンダリング)

**解決策**: 重複ファイルを削除（通常は `.tsx` を残す）

#### 問題パターン 2: Component.tsx と Component/index.tsx の両方が存在

```
app/workshop/components/
├── WorkshopClient.tsx       ← Next.js 16 ではこちらが優先
└── WorkshopClient/
    └── index.tsx            ← 本来使いたいファイル
```

**症状**:
- `useXxx must be used within XxxProvider` エラー
- 古いファイルが読み込まれ、新しい機能（Context Provider 等）がない

**解決策**: 古い `.tsx` ファイルを削除

#### 確認コマンド

```bash
# 重複ファイルを検出
find app components -name "*.tsx" | while read f; do
  dir="${f%.tsx}"
  if [ -d "$dir" ] && [ -f "$dir/index.tsx" ]; then
    echo "重複: $f と $dir/index.tsx"
  fi
done

# index.ts と index.tsx の重複を検出
find app components -name "index.ts" | while read f; do
  tsx="${f%.ts}.tsx"
  if [ -f "$tsx" ]; then
    echo "重複: $f と $tsx"
  fi
done
```

---

## 変更履歴

| 日付 | 内容 |
|------|------|
| 2025-12-10 | **ファイル重複問題セクション追加** (Turbopack の優先順位問題) |
| 2025-12-10 | バージョンを 16.0.8 に更新 |
| 2025-12-08 | AI コーディングツール向けの説明を追加 |
| 2025-12-08 | AI への指示テンプレートを追加 |
| 2025-12-08 | よくある問題と解決策を追加 |
| 2025-12-07 | Phase 15.5 完了に伴う更新 |
| 2025-12-07 | middleware → proxy セクションを詳細化 |
| 2025-12-07 | 初版作成 |
