# Changelog

All notable changes to FDC Modular Starter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### 予定

| Phase | 内容 |
|-------|------|
| Phase 1 | タスクページ追加（フィルター機能付き） |
| Phase 2 | 設定ページ追加（データエクスポート/リセット） |
| Phase 3 | リード管理機能（CRUD + ステータス管理） |
| Phase 4 | 顧客管理機能 |
| Phase 5 | Supabase 統合 |

---

## [1.0.0] - 2025-12-06 - Phase 0: スターター構築

### 概要

foundersdirect をベースにしたミニマルスターターの初期リリース。
Next.js 16 + React 19 + TypeScript 構成で、SaaS版と同じアーキテクチャパターンを使用。

### Added

| ファイル | 内容 |
|---------|------|
| `app/layout.tsx` | ルートレイアウト |
| `app/page.tsx` | エントリーポイント（/login へリダイレクト） |
| `app/login/page.tsx` | ログインページ（デモ認証） |
| `app/(app)/layout.tsx` | 認証済みレイアウト（ヘッダー + ナビ） |
| `app/(app)/dashboard/page.tsx` | ダッシュボード（統計 + タスク管理） |
| `app/globals.css` | グローバルスタイル（SaaS版互換） |
| `lib/types/index.ts` | 型定義（User, Task, AppData） |
| `lib/contexts/AuthContext.tsx` | 認証コンテキスト |
| `lib/contexts/DataContext.tsx` | データコンテキスト（localStorage 永続化） |

### ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/FDC-MODULAR-GUIDE.md` | メインガイド（インデックス） |
| `docs/FDC-CORE.md` | 開発コアガイド |
| `docs/CHANGELOG.md` | 本ファイル |
| `docs/guides/DEVELOPMENT.md` | 開発者・AI向け技術ガイド |
| `docs/runbooks/README.md` | ランブック一覧 |
| `docs/runbooks/PHASE1-TASKS-PAGE.md` | Phase 1 ランブック |
| `docs/runbooks/PHASE2-SETTINGS-PAGE.md` | Phase 2 ランブック |
| `docs/runbooks/PHASE3-LEADS.md` | Phase 3 ランブック |

### 技術スタック

| 技術 | バージョン |
|------|-----------|
| Next.js | 15.1.0 |
| React | 19.0.0 |
| TypeScript | 5.7.2 |
| Node.js | 22.x |

---

## 更新ルール

### 新しいエントリの追加方法

1. `[Unreleased]` セクションに変更内容を追記
2. リリース時に日付とバージョンを確定
3. 新しい `[Unreleased]` セクションを作成

### フォーマット

```markdown
## [X.Y.Z] - YYYY-MM-DD - Phase N: タイトル

### 概要
簡潔な説明

### Added
- 追加した機能/ファイル

### Changed
- 変更した機能/ファイル

### Fixed
- 修正したバグ

### Removed
- 削除した機能/ファイル
```

---

**Last Updated**: 2025-12-06
**Maintained by**: FDC Development Team
