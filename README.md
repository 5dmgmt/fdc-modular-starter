# FDC Modular Starter

Founders Direct Cockpit の学習用ミニマルスターターキットです。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 + App Router |
| UI | React 19 |
| 言語 | TypeScript 5.x (strict mode) |
| Node.js | 22.x 以上 |

## クイックスタート

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# http://localhost:3000 でアクセス
```

## フォルダ構造

```
fdc-modular-starter/
├── app/ .................... Next.js App Router
├── components/ ............. UIコンポーネント
│   └── landing/ ............ ランディングページ
│       ├── default/ ........ デフォルトLP（カスタマイズベース）
│       └── shared/ ......... 共通コンポーネント
├── lib/ .................... 共通ライブラリ
├── public/ ................. 静的ファイル
├── docs/ ................... ドキュメント
│   ├── FDC-MODULAR-GUIDE.md  メインガイド
│   ├── FDC-CORE.md ......... 開発コアガイド
│   ├── guides/ ............. 技術ガイド
│   └── runbooks/ ........... ランブック
├── references/ ............. 参照ファイル（実装時コピー用）
│   ├── ui/ ................. UIコンポーネント
│   ├── types/ .............. 型定義
│   ├── contexts/ ........... Context
│   └── api/ ................ APIルート
└── proxy.ts ............... 認証プロキシ（Next.js 16）
```

## 学習の進め方

1. このスターターを起動
2. `docs/FDC-CORE.md` を読んで全体像を理解
3. `docs/runbooks/` のランブックを順番に実行
4. 各機能を自分で実装しながら学習
5. **ドキュメントを更新**（重要）

## ランブック一覧

### PART 1: Foundation（基礎）Phase 0-2

| Phase | 内容 | 状態 |
|-------|------|------|
| 0 | スターター構築 | ✅ 完了 |
| 1 | タスク機能（CRUD, useReducer, localStorage） | 🔜 予定 |
| 2 | 設定ページ（フォーム, Export/Import） | 🔜 予定 |

### PART 2: Database Integration（DB統合）Phase 3-5

| Phase | 内容 | 状態 |
|-------|------|------|
| 3 | Supabase セットアップ | 📝 予定 |
| 4 | Supabase Auth（Google OAuth） | 📝 予定 |
| 5 | ワークスペース + ロール | 📝 予定 |

### PART 3: CRM（顧客管理）Phase 6-8

| Phase | 内容 | 状態 |
|-------|------|------|
| 6 | リード管理（ファネル） | 📝 予定 |
| 7 | クライアント管理 | 📝 予定 |
| 8 | アプローチ履歴 | 📝 予定 |

### PART 4: 3-Layer Architecture（3層構造）Phase 9-11

| Phase | 内容 | 状態 |
|-------|------|------|
| 9 | Task 4象限（Eisenhower Matrix） | 📝 予定 |
| 10 | Action Map（戦術層） | 📝 予定 |
| 11 | OKR（戦略層） | 📝 予定 |

> 詳細は `docs/runbooks/README.md` を参照

## ランディングページ（LP）

このスターターには、LPテンプレートが同梱されています。

### LP構成

```
components/landing/
├── default/                    # デフォルトLP
│   ├── LandingPage.tsx         # メインコンポーネント
│   ├── LandingPage.module.css  # スタイル
│   ├── HeroSection.tsx         # ヒーローセクション
│   ├── FeaturesSection.tsx     # 機能紹介
│   ├── PricingSection.tsx      # 料金プラン
│   └── FAQSection.tsx          # よくある質問
└── shared/                     # 共通コンポーネント
    ├── LandingHeader.tsx       # ヘッダー
    ├── LandingFooter.tsx       # フッター
    └── ContactForm.tsx         # お問い合わせフォーム
```

## Claude Code 運用

### セッション開始時

```
このプロジェクトの開発を行います。

以下のファイルを読み込んでください:
- docs/FDC-CORE.md
- docs/guides/DEVELOPMENT.md

プロジェクトパス: /path/to/fdc-modular-starter
```

### Phase 実行時

```
Phase N を実行してください。
ランブック: docs/runbooks/PHASEN-XXX.md

完了後、以下を更新してください:
1. docs/CHANGELOG.md
2. docs/FDC-CORE.md
3. package.json
```

## Next.js 16 の特徴（Workshop で使用）

### Proxy（認証処理）

```typescript
// proxy.ts（Next.js 15 までは middleware.ts だった）
export function proxy(request: NextRequest) {
  const session = request.cookies.get('fdc_session');
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
```

### params / searchParams のアクセス

```typescript
// Server Component での params アクセス（Next.js 16 - await 必須）
export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  return <div>{slug}</div>;
}

// searchParams も同様
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ q: string }>
}) {
  const { q } = await searchParams;
  return <div>{q}</div>;
}
```

### cookies / headers

```typescript
import { cookies, headers } from 'next/headers';

// cookies() と headers() は await が必要
export default async function Page() {
  const cookieStore = await cookies();
  const headersList = await headers();
}
```

## コマンド

```bash
npm run dev        # 開発サーバー
npm run build      # プロダクションビルド
npm run start      # プロダクション実行
npm run type-check # 型チェック
npm run lint       # Lint実行（eslint .）
```

## SaaS版との関係

```
┌─────────────────────────────────────────┐
│  FDC Modular Starter (本プロジェクト)    │
│  - ミニマル構成                          │
│  - localStorage ベース                   │
│  - 学習・プロトタイプ用                  │
│  - Next.js 16                            │
└─────────────────┬───────────────────────┘
                  │ 学習後に拡張
                  ▼
┌─────────────────────────────────────────┐
│  FDC SaaS (/foundersdirect)             │
│  - フル機能（OKR / ActionMap / Task）    │
│  - Supabase PostgreSQL                  │
│  - マルチテナント対応                    │
│  - Next.js 16（フル機能）                │
└─────────────────────────────────────────┘
```
