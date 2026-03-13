# FDC-CORE.md（v1.1 - 2025-12-08）

## 0. 位置づけ

本ドキュメントは FDC Modular Starter の
**開発・拡張に関わるすべての人間開発者とAIエージェントの起点**となる規範書である。

- すべての開発セッションは本ガイドを前提として開始する。
- 技術詳細は `docs/guides/DEVELOPMENT.md` を正とし、本ガイドはその上位コンパスとする。
- 矛盾が生じた場合は、本ガイド → DEVELOPMENT の順で整合を取る。

**📊 現在の開発状況（2025-12-08）**:
- **バージョン**: v1.1.0
- **フロントエンド構成**: Next.js 16.0.10 + App Router + React 19.2.1
- **TypeScript**: 5.7.2（strict mode）
- **Node.js**: 22.x
- **データ永続化**: localStorage（学習用）
- **現在のPhase**: Phase 0 完了（スターター構築）+ LP追加
- **次フェーズ**: Phase 1（タスクページ追加）
- **LP**: ランディングページテンプレート同梱（Phase 24対応）

---

## 1. アーキテクチャ概要

### 1.1 ディレクトリ構成

```
founders-direct-modular/
├── app/                    # Next.js App Router
│   ├── (app)/              # 認証済みユーザー用ルート
│   │   ├── dashboard/      # ダッシュボード
│   │   └── layout.tsx      # 認証レイアウト（未ログイン時LP表示）
│   ├── login/              # ログインページ
│   ├── globals.css         # グローバルスタイル
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # エントリー（LP表示）
├── components/             # UIコンポーネント
│   └── landing/            # ランディングページ ⭐NEW
│       ├── default/        # デフォルトLP（FDCデザイン）
│       │   ├── LandingPage.tsx
│       │   ├── LandingPage.module.css
│       │   ├── HeroSection.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── PricingSection.tsx
│       │   └── FAQSection.tsx
│       └── shared/         # 共通コンポーネント
│           ├── LandingHeader.tsx
│           ├── LandingFooter.tsx
│           └── ContactForm.tsx
├── lib/                    # 共通ライブラリ
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx # 認証コンテキスト
│   │   └── DataContext.tsx # データコンテキスト
│   ├── hooks/              # カスタムフック
│   └── types/              # 型定義
│       └── index.ts
├── public/                 # 静的ファイル
│   └── images/             # LP用画像
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
| フロントエンド | Next.js | 16.0.10 |
| UIライブラリ | React | 19.2.1 |
| 言語 | TypeScript | 5.7.2 |
| データ永続化 | localStorage | - |

---

## 4. フェーズ完了状況

| フェーズ | 状態 | 概要 |
|---------|------|------|
| Phase 0 | ✅ 完了 | スターター構築（ログイン、ダッシュボード） |
| Phase 1 | 🔜 予定 | タスクページ追加 |
| Phase 2 | 🔜 予定 | 設定ページ追加 |
| Phase 3 | 🔜 予定 | Supabase セットアップ |
| Phase 4 | 🔜 予定 | Supabase Auth（認証フロー） |
| Phase 5 | 🔜 予定 | ワークスペース + ロール |
| Phase 6 | 🔜 予定 | リード管理（CRM） |
| Phase 7 | 🔜 予定 | クライアント管理 |
| Phase 8 | 🔜 予定 | アプローチ履歴 |
| Phase 9 | 🔜 予定 | Task 4象限（3-Layer） |
| Phase 10 | 🔜 予定 | Action Map |
| Phase 11 | 🔜 予定 | OKR |
| Phase 12 | 🔜 予定 | Google Calendar/Tasks 連携 |
| Phase 13 | 🔜 予定 | Calendar 同期 |

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

**Last Updated**: 2026-02-22
**Version**: v2.0
**Status**: Phase 0 完了 + LP追加
**Maintained by**: FDC Development Team
