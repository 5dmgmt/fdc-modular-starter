# FDC Modular Starter - Claude Code 設定

> 共通ルールは `~/.claude/CLAUDE.md` 参照。以下はプロジェクト固有のみ。

## 必読ドキュメント

- **`docs/guides/DEVELOPMENT.md`** — 技術スタック・コーディング規約・デザインガイドライン（最重要）
- **`docs/FDC-CORE.md`** — プロジェクト全体像・現在のPhase状況

## プロジェクト概要

- **名称**: FDC Modular Starter（学習用スターター）
- **技術スタック**: Next.js 16.0.10 / React 19 / TypeScript 5.x
- **Node.js**: 22.x 以上
- **コミット前必須**: `npm run type-check && npm run lint && npm run build`

## 禁止事項

1. **絵文字（Emoji）使用禁止** — SVGアイコン（Lucide React）を使用
2. **`any` 型の使用禁止** — 具体的な型を定義
3. **4色以外のブランドカラー追加禁止**

## カラーパレット（4色厳守）

> プロジェクト開始時に調和のとれた4色を選定してください。
> 参考: [Canva 配色アイデア](https://www.canva.com/ja_jp/learn/100-color-combinations/)

| 用途 | CSS変数 | 役割 |
|------|---------|------|
| プライマリ | `--ws-primary` | 警告・重要・削除系 |
| セカンダリ | `--ws-secondary` | メインアクション・リンク |
| アクセント | `--ws-accent` | 注目・ヒント・進行中 |
| 成功 | `--ws-success` | 完了・正常・承認 |

## Next.js 16 の注意点

必読: **`docs/guides/NEXTJS16-QUICK-REFERENCE.md`**

**重要な変更点（AIが間違えやすい）:**
- `proxy.ts` を使用（`middleware.ts` ではない）
- `params` / `searchParams` → `await` 必須（Server Component）
- `lint` スクリプトは `eslint .`（`next lint` ではない）

## 参照ファイルの使い方

`references/` ディレクトリには実装サンプルがあります：

| ディレクトリ | 内容 |
|-------------|------|
| `references/ui/` | UIコンポーネント参照 |
| `references/types/` | 型定義参照 |
| `references/contexts/` | Context 参照 |

「references/ui/task/ を参考にして」と指示すると、参照ファイルを読み込んで同様の実装を行います。

## Security（プロジェクト固有）

- **RLS必須** — 新テーブル作成時は必ず ENABLE ROW LEVEL SECURITY + service_role ポリシーを付与
