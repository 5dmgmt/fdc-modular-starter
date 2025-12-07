# FDC-CORE.md（v1.0 - 2025-12-06）

## 0. 位置づけ

本ドキュメントは FDC Modular Starter の
**開発・拡張に関わるすべての人間開発者とAIエージェントの起点**となる規範書である。

- すべての開発セッションは本ガイドを前提として開始する。
- 技術詳細は `docs/guides/DEVELOPMENT.md` を正とし、本ガイドはその上位コンパスとする。
- 矛盾が生じた場合は、本ガイド → DEVELOPMENT の順で整合を取る。

**📊 現在の開発状況（2025-12-06）**:
- **バージョン**: v1.0.0
- **フロントエンド構成**: Next.js 16.0.7 + App Router + React 19.2.1
- **TypeScript**: 5.7.2（strict mode）
- **Node.js**: 22.x
- **データ永続化**: localStorage（学習用）
- **現在のPhase**: Phase 0 完了（スターター構築）
- **次フェーズ**: Phase 1（タスクページ追加）

---

## 1. アーキテクチャ概要

### 1.1 ディレクトリ構成

```
founders-direct-modular/
├── app/                    # Next.js App Router
│   ├── (app)/              # 認証済みユーザー用ルート
│   │   ├── dashboard/      # ダッシュボード
│   │   └── layout.tsx      # 認証レイアウト
│   ├── login/              # ログインページ
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # エントリー
├── lib/                    # 共通ライブラリ
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx # 認証コンテキスト
│   │   └── DataContext.tsx # データコンテキスト
│   ├── hooks/              # カスタムフック
│   └── types/              # 型定義
│       └── index.ts
├── docs/                   # ドキュメント
│   ├── FDC-MODULAR-GUIDE.md # インデックス
│   ├── FDC-CORE.md         # 本ファイル
│   ├── CHANGELOG.md        # 変更履歴
│   ├── guides/             # ガイド
│   └── runbooks/           # ランブック
├── package.json
├── tsconfig.json
└── next.config.ts
```

### 1.2 レイヤー構成

```
┌─────────────────────────────────────────┐
│ UI Layer: React Components              │
│  └─ app/(app)/ 配下のページコンポーネント │
├─────────────────────────────────────────┤
│ State Layer: React Context              │
│  ├─ AuthContext（認証状態）              │
│  └─ DataContext（アプリデータ）          │
├─────────────────────────────────────────┤
│ Storage Layer: localStorage             │
│  └─ fdc_app_data（JSON形式で永続化）     │
└─────────────────────────────────────────┘
```

---

## 2. 開発理念とAIチーム体制

本プロジェクトでは、Claude Code を**開発パートナー**として扱い、
ランブック単位のタスク実行 + ドキュメント更新を必須プロセスとする。

### 2.1 運用原則

- すべての開発セッションは `docs/FDC-CORE.md` の読み込みから開始
- 機能追加はランブック（`docs/runbooks/`）に従って実行
- 作業完了後は必ずドキュメントを更新

### 2.2 ドキュメント更新ルール

| タイミング | 更新対象 |
|-----------|---------|
| 機能追加時 | CHANGELOG.md, FDC-CORE.md |
| バグ修正時 | CHANGELOG.md |
| アーキテクチャ変更時 | DEVELOPMENT.md, FDC-CORE.md |

---

## 3. 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|-----------|
| フロントエンド | Next.js | 15.1.0 |
| UIライブラリ | React | 19.0.0 |
| 言語 | TypeScript | 5.7.2 |
| データ永続化 | localStorage | - |

---

## 4. フェーズ完了状況

| フェーズ | 状態 | 概要 |
|---------|------|------|
| Phase 0 | ✅ 完了 | スターター構築（ログイン、ダッシュボード） |
| Phase 1 | 🔜 予定 | タスクページ追加 |
| Phase 2 | 🔜 予定 | 設定ページ追加 |
| Phase 3 | 🔜 予定 | リード管理機能 |
| Phase 4 | 🔜 予定 | 顧客管理機能 |
| Phase 5 | 🔜 予定 | Supabase 統合 |

---

## 5. 開発フロー

```
1. ランブック確認: docs/runbooks/PHASEX-XXX.md を読む
2. 実装: ランブックに従ってコード実装
3. ビルド確認: npm run build が成功することを確認
4. ドキュメント更新:
   - CHANGELOG.md に変更内容を追記
   - FDC-CORE.md のフェーズ状況を更新
5. コミット: git add . && git commit
```

---

## 6. 用語集

| 用語 | 説明 |
|-----|------|
| FDC | Founders Direct Cockpit |
| Phase | 開発フェーズ（機能追加の単位） |
| Runbook | 実装手順書（コード付き） |
| Context | React Context（状態管理） |

---

**Last Updated**: 2025-12-06
**Version**: v1.0
**Status**: Phase 0 完了
**Maintained by**: FDC Development Team
