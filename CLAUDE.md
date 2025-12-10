# FDC Modular Starter - Claude Code 設定

このファイルは Claude Code がプロジェクトを理解するための設定ファイルです。
コーディングを開始する前に、このファイルと参照ドキュメントを確認してください。

---

## 必読ドキュメント（コーディング前に必ず確認）

### 1. 開発ガイド（最重要）

```
docs/guides/DEVELOPMENT.md
```

**必読セクション:**
- 技術スタック・バージョン
- コーディング規約
- デザイン一貫性ガイドライン（4色パレット）

### 2. コアドキュメント

```
docs/FDC-CORE.md
```

**把握すべき内容:**
- プロジェクト全体像
- 現在のPhase状況

---

## プロジェクト概要

- **名称**: FDC Modular Starter（学習用スターター）
- **技術スタック**: Next.js 15 / React 19 / TypeScript 5.x
- **Node.js**: 22.x 以上

---

## 重要な制約

### 禁止事項

1. **絵文字（Emoji）使用禁止** — SVGアイコン（Lucide React）を使用
2. **`any` 型の使用禁止** — 具体的な型を定義
3. **4色以外のブランドカラー追加禁止**

### カラーパレット（4色厳守）

> プロジェクト開始時に調和のとれた4色を選定してください。
> 参考: [Canva 配色アイデア](https://www.canva.com/ja_jp/learn/100-color-combinations/)

| 用途 | CSS変数 | 役割 |
|------|---------|------|
| プライマリ | `--ws-primary` | 警告・重要・削除系 |
| セカンダリ | `--ws-secondary` | メインアクション・リンク |
| アクセント | `--ws-accent` | 注目・ヒント・進行中 |
| 成功 | `--ws-success` | 完了・正常・承認 |

---

## npm スクリプト

```bash
# 開発
npm run dev              # 開発サーバー起動

# 品質チェック（コミット前に必須）
npm run type-check       # TypeScript 型チェック
npm run lint             # ESLint
npm run build            # 本番ビルド
```

---

## ディレクトリ構成

```
fdc-modular-starter/
├── app/                 # Next.js App Router
│   ├── page.tsx         # トップページ
│   └── layout.tsx       # ルートレイアウト
├── components/          # UIコンポーネント
├── lib/                 # 共通ライブラリ
│   └── types/           # 型定義
├── docs/                # ドキュメント
│   ├── FDC-CORE.md      # コアドキュメント
│   └── guides/          # 開発ガイド
├── references/          # 参照ファイル（実装サンプル）
└── public/              # 静的ファイル
```

---

## コーディング規約

### TypeScript

```typescript
// ✅ 良い例：型を明示
interface Task {
  id: string;
  title: string;
  completed: boolean;
}

// ❌ 悪い例：any 型
const data: any = fetchData();
```

### React コンポーネント

```typescript
// Client Component には 'use client' を明示
'use client';

import { useState } from 'react';

export function TaskCard({ task }: { task: Task }) {
  // ...
}
```

---

## Next.js 16 を使う場合（オプション）

Next.js 16 にアップグレードする場合は、以下のドキュメントを必読に追加してください：

```
docs/guides/NEXTJS16-QUICK-REFERENCE.md
```

**主な変更点:**
- `middleware.ts` → `proxy.ts`（ファイル名・関数名変更）
- `params` / `searchParams` → `await` 必須
- `next lint` → `eslint .`（コマンド変更）

---

## 参照ファイルの使い方

`references/` ディレクトリには実装サンプルがあります：

| ディレクトリ | 内容 |
|-------------|------|
| `references/ui/` | UIコンポーネント参照 |
| `references/types/` | 型定義参照 |
| `references/contexts/` | Context 参照 |

Claude に「references/ui/task/ を参考にして」と指示すると、
参照ファイルを読み込んで同様の実装を行います。

---

**Last Updated**: 2025-12-10
