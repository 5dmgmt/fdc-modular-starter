# Next.js 16 クイックリファレンス

> **更新日**: 2025-12-10
> **目的**: Claude Code などの AI コーディングツールに読ませて、Next.js 16 の破壊的変更を正しく理解させる

---

## AI コーディングツールをお使いの方へ

**2025年12月時点で、Claude Code や Cursor などの AI は Next.js 16 の変更点を十分に学習していません。**

そのため、AI は以下のような**間違ったコード**を生成する可能性があります：

- ❌ `middleware.ts` を作成しようとする（正しくは `proxy.ts`）
- ❌ `params` を同期的にアクセスする（正しくは `await params`）
- ❌ `next lint` コマンドを使用する（正しくは `eslint .`）

**このドキュメントを AI に読ませることで、正しいコードを生成させることができます。**

---

## 移行必須チェックリスト

Next.js 15 → 16 へのアップグレードで**必ず対応が必要な項目**:

| # | 項目 | 必須度 | 備考 |
|---|------|--------|------|
| 1 | `middleware.ts` → `proxy.ts` | ⚠️ **必須** | ファイル名・関数名の変更 |
| 2 | `params` / `searchParams` の非同期化 | ⚠️ **必須** | Server Component で `await` 必須 |
| 3 | `cookies()` / `headers()` の await | ⚠️ **必須** | 既に await していれば OK |
| 4 | `next lint` → `eslint .` | ⚠️ **必須** | package.json 修正 |

---

## 主要な変更点

### 1. middleware.ts → proxy.ts（最重要）

**AI が最も間違えやすいポイントです。**

Next.js 16 で **Middleware は Proxy に名称変更**されました。

```bash
# ファイル名変更
mv middleware.ts proxy.ts
```

```typescript
// ❌ Before (Next.js 15) - middleware.ts
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// ✅ After (Next.js 16) - proxy.ts
export function proxy(request: NextRequest) {
  return NextResponse.next();
}
```

---

### 2. 非同期 API 必須化（重要）

Next.js 16 では、Server Component での `params`、`searchParams`、`cookies()`、`headers()` へのアクセスが**非同期必須**になりました。

#### params の非同期化

```typescript
// ❌ Before (同期アクセス - Next.js 16 ではエラー)
export default function Page({ params }) {
  const { slug } = params;  // エラー！
}

// ✅ After (非同期 - Next.js 16 必須)
export default async function Page({ params }) {
  const { slug } = await params;  // OK
}

// ✅ 型を明示する場合
export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
}
```

#### searchParams の非同期化

```typescript
// ❌ Before
export default function Page({ searchParams }) {
  const query = searchParams.q;  // エラー！
}

// ✅ After (Next.js 16)
export default async function Page({ searchParams }) {
  const { q } = await searchParams;
}
```

#### cookies() / headers() の非同期化

```typescript
import { cookies, headers } from 'next/headers';

// ❌ Before
const cookieStore = cookies();

// ✅ After (Next.js 16 必須)
const cookieStore = await cookies();
const headersList = await headers();
```

#### Client Component では影響なし

```typescript
'use client';

import { useParams, useSearchParams } from 'next/navigation';

export default function ClientPage() {
  const params = useParams();        // ✅ 同期的に動作
  const searchParams = useSearchParams();  // ✅ 同期的に動作
}
```

---

### 3. ESLint（重要）

**`next lint` コマンドは廃止されました。**

```json
// package.json
{
  "scripts": {
    // ❌ Before (Next.js 15)
    "lint": "next lint",

    // ✅ After (Next.js 16)
    "lint": "eslint ."
  }
}
```

---

### 4. Turbopack デフォルト化

```bash
# 開発サーバー（Turbopack がデフォルト）
npm run dev

# Webpack に戻す場合（互換性問題がある場合）
npm run dev -- --webpack
```

---

## 環境要件

| 要件 | 最小バージョン |
|------|----------------|
| Node.js | 22.x 以上 |
| TypeScript | 5.1.0+ |

---

## よくある問題と解決策

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `middleware is not defined` | proxy.ts なのに middleware() を参照 | 関数名を proxy() に修正 |
| `params is a Promise` | 同期アクセスしている | await params に修正 |
| `next lint: command not found` | next lint 廃止 | eslint . を使用 |

---

## AI への指示テンプレート

以下をコピーして AI に伝えてください：

```
このプロジェクトは Next.js 16 を使用しています。以下の点に注意してください：

1. middleware は proxy にリネームされています
   - ファイル: middleware.ts → proxy.ts
   - 関数: middleware() → proxy()

2. Server Component の params/searchParams は非同期です
   - const { slug } = await params;

3. cookies()/headers() も非同期です
   - const cookieStore = await cookies();

4. ESLint は直接実行します
   - npm run lint は "eslint ." を実行
```

---

**Last Updated**: 2025-12-10
