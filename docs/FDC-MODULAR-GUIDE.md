# FDC-MODULAR-GUIDE.md（v1.0 - 2025-12-06）

> **Founders Direct Cockpit - Modular Starter ガイド**
>
> このドキュメントは、FDC Modular Starter の開発ガイドのインデックスです。

---

## 概要

FDC Modular Starter は、SaaS版 Founders Direct Cockpit（foundersdirect）の
学習用ミニマル版です。同じアーキテクチャ・パターンを使用しているため、
学習後にスムーズにSaaS版の開発に移行できます。

### プロジェクト情報

| 項目 | 値 |
|------|-----|
| **バージョン** | v1.0.0 |
| **対応Node.js** | 22.x |
| **フレームワーク** | Next.js 16 + React 19 |
| **言語** | TypeScript 5.x (strict mode) |

### SaaS版との関係

```
┌─────────────────────────────────────────┐
│  FDC Modular Starter (本プロジェクト)    │
│  - ミニマル構成                          │
│  - localStorage ベース                   │
│  - 学習・プロトタイプ用                  │
└─────────────────┬───────────────────────┘
                  │ 学習後に拡張
                  ▼
┌─────────────────────────────────────────┐
│  FDC SaaS (/foundersdirect)             │
│  - フル機能（OKR / ActionMap / Task）    │
│  - Supabase PostgreSQL                  │
│  - マルチテナント対応                    │
└─────────────────────────────────────────┘
```

---

## ドキュメント構造

```
docs/
├── FDC-MODULAR-GUIDE.md ......... 本ファイル（インデックス）
├── FDC-CORE.md .................. 開発コアガイド ⭐ 開発時はこちら
├── CHANGELOG.md ................. 変更履歴
│
├── guides/ ...................... ガイドドキュメント
│   └── DEVELOPMENT.md ........... 開発者・AI向け技術ガイド
│
└── runbooks/ .................... Phase別ランブック
    ├── README.md ................ ランブック一覧
    ├── PHASE0-STARTER-SETUP.md .. プロジェクト新規作成
    ├── PHASE1-TASKS-PAGE.md ..... タスクページ追加
    ├── PHASE2-SETTINGS-PAGE.md .. 設定ページ追加
    ├── PHASE3-LEADS.md .......... リード管理機能
    └── ...
```

---

## クイックスタート

### 1. プロジェクトを開始

```bash
cd /Users/5dmgmt/プラグイン/founders-direct-modular
npm install
npm run dev
# http://localhost:3000 → パスワード: fdc
```

### 2. 開発ガイドを読む

```bash
# コアガイド（開発の起点）
cat docs/FDC-CORE.md

# 技術詳細ガイド
cat docs/guides/DEVELOPMENT.md
```

### 3. ランブックで機能追加

```bash
# Phase 1: タスクページ追加
cat docs/runbooks/PHASE1-TASKS-PAGE.md
```

---

## 学習の進め方

1. **Phase 0**（新規の場合）→ プロジェクト構築
2. **スターター起動** → ログイン → ダッシュボード確認
3. **FDC-CORE.md** を読んで全体像を理解
4. **Phase 1** → タスクページ追加
5. **Phase 2** → 設定ページ追加
6. **Phase 3** → リード管理追加
7. **以降** → SaaS版と同じ機能を段階的に追加

---

## Claude Code 運用プロンプト

### セッション開始時

```
このプロジェクトの開発を行います。

以下のファイルを読み込んでください:
- docs/FDC-CORE.md（開発コアガイド）
- docs/guides/DEVELOPMENT.md（技術詳細）

プロジェクトパス: /Users/5dmgmt/プラグイン/founders-direct-modular
```

### 機能追加時

```
Phase N を実行してください。
ランブック: docs/runbooks/PHASEN-XXX.md

完了後、以下を更新してください:
1. docs/CHANGELOG.md に変更内容を追記
2. docs/FDC-CORE.md のフェーズ状況を更新
3. package.json のバージョンを更新
```

### ドキュメント更新プロンプト

```
作業完了後、以下のドキュメントを更新してください:

1. CHANGELOG.md
   - 今回の変更内容を [Unreleased] セクションに追記
   - Added/Changed/Fixed の形式で記載

2. FDC-CORE.md
   - フェーズ完了状況を更新
   - 技術スタック変更があれば更新

3. guides/DEVELOPMENT.md（必要に応じて）
   - ディレクトリ構成変更があれば更新
   - 新規パターン追加があれば記載
```

---

## 現在の状態（2025-12-06）

- **バージョン**: v1.0.0
- **Phase 0 完了**: スターター構築済み
- **次のステップ**: Phase 1（タスクページ追加）

---

**Last Updated**: 2025-12-06
**Version**: v1.0
**Maintained by**: FDC Development Team (Human + Claude Code)
