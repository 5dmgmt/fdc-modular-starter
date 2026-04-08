# FDC-CORE.md（v6.11 - 2025-12-05更新）

## 0. 位置づけ

本ドキュメントは Founders Direct Cockpit（以下、FDC）の
**開発・運用・拡張に関わるすべての人間開発者とAIエージェントの起点**となる規範書である。

- すべての開発セッションは本ガイドを前提として開始する。
- 技術詳細は `docs/guides/DEVELOPMENT.md` を正とし、本ガイドはその上位コンパスとする。
- 矛盾が生じた場合は、本ガイド → DEVELOPMENT の順で整合を取る。

**📊 現在の開発状況（2025-12-05 更新）**:
- **バージョン**: v2.9.2
- **本番URL**: https://app.foundersdirect.jp/
- **データベース**: Supabase PostgreSQL 17.6
- **認証方式**: Supabase Auth（Google OAuth Provider）+ カスタムセッション管理
- **フロントエンド構成**: Next.js 15.5.6 + App Router + React 19.2.0
- **TypeScript**: 5.9.3（strict mode）
- **Node.js**: 22.x
- **CI/CD**: GitHub Actions（Quality Gate）
- **E2Eテスト**: 94テスト全パス（Playwright）- `tests/e2e/comprehensive-features.spec.ts`
- **ユニットテスト**: 147テスト全パス（Vitest）
- **アーキテクチャ**: 3層構造（OKR戦略層 → ActionMap戦術層 → Task実行層）
- **コンポーネント分割**: Phase 14.35完了（28ファイル分割）
- **ファイル分割**: Phase 14.6.3-5完了（61ファイル分割、hooks/csv/landing）
- **マルチテナント対応**: Phase 14.4完了（tenants テーブル、TenantProvider）
- **パフォーマンス最適化**: Phase 14.5 完了（next/Image・SWRキャッシュ・PWA/Service Worker）
- **AI導入準備**: Phase 14.6 完了（監査ログ・データ品質・コンテキスト基盤・UIコンポーネント）
- **AI利用設計**: Phase 14.6.5 完了（UC/プロンプト/UI/UX設計）
- **命名・概念統一**: Phase 14.62 完了（Single Source of Truth、欠損値ポリシー統一）
- **セキュリティ強化**: Phase 14.6-I 完了（CSP Nonce・セッションJOIN最適化・分散ロック）
- **セキュリティ監視**: Phase 14.9-D 完了（CSRF・セッション乗っ取り検知・リアルタイム脅威検知）
- **Phase 14完了**: ✅ 2025-12-05（AI基盤整備完了、pg_cron設定済み）
- **Phase 15完了**: ✅ 2025-12-05（セキュリティ・監査強化 全サブフェーズ完了）
- **技術負債**: 0件（Lint/ビルド警告ゼロ、`as any` ゼロ達成）
- **セキュリティスコア**: 100/100（CSRF保護・セッション乗っ取り検知・全API監視）
- **現在のPhase**: Phase 16 設計中 / Phase 19 AI実装予定
- **次フェーズ**: Phase 19（AI機能実装: チャットパネル、UC-01〜04 MVP）

---

## 1. 3層アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│ 戦略層: OKR (lib/types/okr.ts)                             │
│  ├─ Objective（定性目標: 会社/チーム/個人）                 │
│  └─ KeyResult（定量成果指標）N:M連携                       │
├─────────────────────────────────────────────────────────────┤
│ 戦術層: Action Map (lib/types/action-map.ts)               │
│  ├─ ActionMap（上司作成の計画）                            │
│  └─ ActionItem（部下実行タスク）ツリー構造                 │
│      └─ Status: not_started | in_progress | blocked | done │
│      └─ Priority: low | medium | high                      │
├─────────────────────────────────────────────────────────────┤
│ 実行層: Task (lib/types/task.ts)                           │
│  ├─ Task（4象限: ♠♥♦♣）                                   │
│  │   └─ ♠ Spade: 緊急かつ重要（#000000）                   │
│  │   └─ ♥ Heart: 重要（#DC143C）→ Elastic Habits対象       │
│  │   └─ ♦ Diamond: 緊急なだけ（#FFC107）                   │
│  │   └─ ♣ Club: 未来創造20%タイム（#1976D2）               │
│  ├─ SubTask（サブステップ）                                │
│  ├─ ElasticHabit（松竹梅習慣）                             │
│  └─ UmeHabit（梅習慣: 5分単位）                            │
└─────────────────────────────────────────────────────────────┘
```

**進捗ロールアップフロー:**
```
Task完了 → ActionItem進捗更新 → ActionMap進捗更新 → KR進捗更新 → Objective進捗更新
```

---

## 2. 開発理念とAIチーム体制

本プロジェクトでは、Claude Code / ChatGPT 等の複数AIエージェントを
**「役割分担された開発チーム」**として扱い、
フェーズ単位の DOD（完了定義）＋自動レビュー＋本番ビルドを必須プロセスとする。

これにより、**開発速度・再現性・安全性を最大化**する。

### 2.1 チーム構成（三位一体モデル）

| 担当 | 役割 | 主な責任 |
|------|------|----------|
| 🧠 ChatGPT | 設計・仕様統合・統合レビュー | アーキテクチャ定義・仕様判断・DOD確認 |
| ⚙️ Claude Code | 実装・フェーズ進行 | コード生成・整合性検証・自動テスト連携 |
| 👤 人間開発者 | 意思決定・承認・デプロイ | DOD承認・Git統合・本番リリース判断 |

### 2.2 運用原則

- すべてのAIは開始前に `guides/DEVELOPMENT.md` を読込。
- Claude Codeは「実装責任者」、ChatGPTは「構造監督」として動く。
- 人間開発者は最終承認者として責務を持つ。
- mainブランチ反映は、統合レビューを経たPull Requestに限定。

---

## 3. サブエージェント運用ルール（分散並列）

サブエージェントの役割分担および出力フォーマットは、**`guides/DEVELOPMENT.md` の「🤖 サブエージェント運用ルール（正式正本）」** を正本とする。

### 3.1 基本原則

- すべてのサブエージェント（Claude Code / ChatGPT / Copilot 等）は、作業開始前に `guides/DEVELOPMENT.md` を読み込み、このルールに従うこと。
- 各エージェントは担当ファイルを明示し、他担当領域を勝手に書き換えてはならない。
- すべてのサブエージェント出力は「統合エージェント（ChatGPTまたは人間）」がレビュー・統合する。
- 統合前に main ブランチへ直接反映してはならない。

---

## 4. 技術スタック（Phase 14完了時点）

| レイヤー | 技術 | バージョン | 説明 |
|---------|------|-----------|------|
| **フロントエンド** | **Next.js** | **15.5.6** | App Router、React Server Components |
| **UIライブラリ** | **React** | **19.2.0** | React 19 安定版 |
| **言語** | **TypeScript** | **5.9.3** | strict mode 有効 |
| **バックエンド** | **Next.js Route Handlers** | - | `app/api/**/route.ts` 形式 |
| **データベース** | **Supabase PostgreSQL** | **17.6** | SERVICE_ROLE_KEY使用（RLSバイパス） |
| **認証** | **Supabase Auth** | - | Google OAuth Provider、PKCE フロー |
| **セッション** | **Cookie ベース** | - | `fdc_session`（HttpOnly, Secure, SameSite=Lax） |
| **暗号化** | **AES-256-GCM** | - | 2層暗号化（マスター鍵＋Workspace鍵） |
| **AI** | **Vercel AI SDK** | 5.0.100 | OpenAI GPT-4o-mini 統合 |
| **バリデーション** | **Zod** | 4.1.12 | ランタイム型検証 |
| **テスト** | **Playwright** | 1.56.1 | E2Eテスト |
| **ユニットテスト** | **Vitest** | 2.1.0 | React Testing Library 連携 |
| **アイコン** | **Lucide React** | 0.554.0 | SVGアイコン（emoji廃止） |
| **デプロイ** | **Vercel** | - | GitHub 連携、自動デプロイ |
| **Node.js** | - | **22.x** | 最新LTS |

---

## 5. フェーズ完了状況

| フェーズ | 状態 | 概要 |
|---------|------|------|
| Phase 7 | ✅ 完了 | 認証・RBAC・監査ログ・レポート機能 |
| Phase 8 | ✅ 完了 | Workspace管理・暗号化基盤・E2Eテスト |
| Phase 9 | ✅ 完了 | DB移行（Neon → Supabase）・認証レイヤー移行 |
| Phase 9.5 | ✅ 完了 | 基盤整備・Cookie設定・環境変数整備 |
| Phase 9.7 | ✅ 完了 | 技術負債ゼロ化・旧API完全撤去 |
| Phase 9.8 | ✅ 完了 | AI基盤・データ基盤・楽観的排他制御 |
| Phase 9.9 | ✅ 完了 | 緊急バグ修正・ガバナンス強化 |
| Phase 9.92 | ✅ 完了 | 全13タブ React/ViewModel 完全移行 |
| Phase 9.93-A | ✅ 完了 | レガシー隔離・CI自動化 |
| Phase 9.93-B | ✅ 完了 | パフォーマンス最適化（バンドル18%削減） |
| Phase 9.94-A | ✅ 完了 | パフォーマンス（RSC導入・Lighthouse 85+） |
| Phase 9.94-B | ✅ 完了 | UX向上（WCAG 2.1 AA準拠） |
| Phase 9.94-C | ✅ 完了 | 拡張準備（型定義・オフライン戦略） |
| Phase 9.94-D | ✅ 完了 | CI/CD基盤 |
| Phase 9.98 | ✅ 完了 | Web公開前チェックリスト対応 |
| Phase 9.99 | ✅ 完了 | Phase 10開始前最終整備 |
| **Phase 10** | ✅ 完了 | **TODO機能拡張: 4象限×カレンダー連携×松竹梅習慣** |
| **Phase 11** | ✅ 完了 | **Action Map: 戦術レイヤー・カンバン・フォーカスモード** |
| **Phase 12** | ✅ 完了 | **OKR: 戦略レイヤー・O→KR→ActionMap連携** |
| **Phase 13** | ✅ 完了 | **AI機能・CSVインポート・セキュリティ強化** |
| **Phase 13.5** | ✅ 完了 | **レポートラインタブ・可視性/権限システム** |
| **Phase 14.1** | ✅ 完了 | **CSVインポート・エクスポート機能（管理者設定タブ集約）** |
| **Phase 14.2** | ✅ 完了 | **スケーラビリティ改善（同時20人→100人対応）** |
| **Phase 14.4** | ✅ 完了 | **運用監視強化・技術的負債解消** |
| **Phase 14.35** | ✅ 完了 | **巨大コンポーネント分割（28ファイル、500行以上0件）** |
| **Phase 14.4 MT** | ✅ 完了 | **マルチテナント対応（tenants テーブル、TenantProvider）** |
| **Phase 14.5** | ✅ 完了 | **パフォーマンス最適化（next/Image・SWRキャッシュ・PWA/Service Worker）** |
| **Phase 14.6** | ✅ 完了 | **AI導入準備（監査ログ・データ品質・コンテキスト基盤・UIコンポーネント）** |
| **Phase 14.6-H** | ✅ 完了 | **技術負債ゼロ達成（Lint/ビルド警告0、TODO整理）** |
| **Phase 14.6-I** | ✅ 完了 | **セキュリティ・スケーラビリティ強化（CSP Nonce・セッションJOIN最適化）** |
| **Phase 14.6.3-5** | ✅ 完了 | **大規模ファイル分割（61ファイル、hooks/csv/landing）** |
| **Phase 14.62** | ✅ 完了 | **命名・概念一貫性統一（Single Source of Truth、欠損値ポリシー）** |
| **Phase 14.6.5** | ✅ 完了 | **AI利用設計（ユースケース・プロンプト・UI/UX設計）** |
| **Phase 14.7** | ✅ 完了 | **テナント別AI基盤（DBマイグレーション・型定義・サーバーサービス）** |
| **Phase 15** | ✅ 完了 | **セキュリティ・監査強化（トークン暗号化・監査ログ・セキュリティ監視）** |
| **Phase 15.1** | ✅ 完了 | **マルチテナント開発環境（Supabase/Vercel dev）** |
| **Phase 15.2** | ✅ 完了 | **テナントカスタマイズ機能** |
| **Phase 15.3** | ✅ 完了 | **セキュリティ監視機能** |
| **Phase 15.4** | ✅ 完了 | **ダッシュボードパフォーマンス最適化** |
| **Phase 19** | 🔜 予定 | **AI機能実装（チャットパネル・UC-01〜04 MVP・E2E）** |

- **Phase 14 完了**: ✅ 2025-12-05（AI基盤整備完了、pg_cron設定済み）
- **Phase 15 完了**: ✅ 2025-12-05（セキュリティ・監査強化）
- **現在のPhase**: Phase 16 設計中（タスク＆習慣システム v4）
- **次フェーズ**: Phase 19（AI機能実装: チャットパネル、UC-01〜04 MVP）
- **技術負債**: 0件（型チェック・ESLint・ビルド警告・`as any` すべて0）

詳細なPhase履歴は `docs/legacy/PHASE-HISTORY.md` を参照。

---

## 6. 主要ドキュメントインデックス

| ドキュメント | 内容 | 対象読者 |
|-----------|------|---------|
| **コア文書** |
| `docs/FDC-CORE.md` | **開発全体の指針・AIチーム運用ガイド（本ファイル）** | **全員** |
| **ガイド（guides/）** |
| `guides/DEVELOPMENT.md` | 開発者・AI向け技術ガイド | 開発者・AI |
| `guides/FDC-ARCHITECTURE-OVERVIEW.md` | アーキテクチャ概要 | 開発者・AI |
| `guides/HOW-TO-USE.md` | ユーザー向け利用マニュアル | エンドユーザー |
| `guides/Performance-Specification-v1.0.md` | パフォーマンス要件定義 | 開発者・AI・PM |
| `guides/SECURITY.md` | セキュリティガイド | 開発者・セキュリティ担当 |
| `guides/TESTING.md` | テストマニュアル | 開発者・QA |
| **技術仕様（specs/）** |
| `specs/API-SPEC.md` | API仕様書 | 開発者・AI |
| `specs/DB-SECURITY.md` | DB セキュリティ | 開発者・DB管理者 |
| `specs/ENCRYPTION-TABLE.md` | 暗号化割当表 | 開発者・セキュリティ担当 |
| **Runbook（runbooks/）** |
| `runbooks/PHASE14-1-CSV-RUNBOOK.md` | Phase 14.1 CSV機能 | 開発者・AI |
| `runbooks/PHASE14.2-SCALABILITY-RUNBOOK.md` | Phase 14.2 スケーラビリティ | 開発者・AI |
| `runbooks/PHASE14.4-OPS-MONITORING-RUNBOOK.md` | Phase 14.4 運用監視 | 開発者・AI |
| `runbooks/PHASE14.4-FDC-MULTITENANT-WORKSPACE-RUNBOOK.md` | **マルチテナント設計** | 開発者・AI |
| `runbooks/PHASE14.5-PERFORMANCE-RUNBOOK.md` | **パフォーマンス最適化計画** | 開発者・AI |
| `runbooks/PHASE14.6-AI-READINESS-RUNBOOK.md` | **AI導入準備** | 開発者・AI |
| `runbooks/PHASE14.6-I-SECURITY-HARDENING-RUNBOOK.md` | **セキュリティ・スケーラビリティ強化** | 開発者・AI |
| `runbooks/PHASE14.6.5-AI-USAGE-DESIGN-RUNBOOK.md` | **AI利用設計** | 開発者・AI |
| `runbooks/PHASE14.7-TENANT-AI-RUNBOOK.md` | **テナント別AI基盤** | 開発者・AI |
| `runbooks/PHASE19-AI-IMPLEMENTATION-RUNBOOK.md` | **AI機能実装（Phase 19）** ⭐ | 開発者・AI |
| **Legacy（legacy/）** - 分割ドキュメント |
| `legacy/PHASE-HISTORY.md` | 全Phaseの詳細履歴（分割） | 参照用 |
| `legacy/ARCHITECTURE-DETAIL.md` | 詳細アーキテクチャ（分割） | 参照用 |
| `legacy/SECURITY-DB-DETAIL.md` | セキュリティ・DB詳細（分割） | 参照用 |
| `legacy/OPS-LESSONS.md` | 運用教訓・Lessons Learned（分割） | 参照用 |
| **Legacy（legacy/）** - Phase別詳細 |
| `legacy/phase9/` | Phase 9.x 各サブフェーズ詳細 | 参照用 |
| `legacy/phase10-13/` | Phase 10-13 ランブック・設計書 | 参照用 |
| `legacy/other/` | その他レガシードキュメント | 参照用 |

---

## 7. 開発フロー

1. **フェーズ計画**: `FDC-CORE.md` でフェーズ確認
2. **技術仕様確認**: `guides/DEVELOPMENT.md` で実装詳細確認
3. **実装**: Claude Code / ChatGPT で実装
4. **テスト**: E2E / ユニット / 型チェック実施
5. **レビュー**: ChatGPT で統合レビュー
6. **承認**: 人間開発者が最終承認
7. **デプロイ**: Vercel へデプロイ

---

## 8. 本番環境

- **URL**: https://app.foundersdirect.jp/
- **ホスティング**: Vercel
- **データベース**: Supabase PostgreSQL 17.6
- **認証**: Supabase Auth（Google OAuth Provider）
- **デプロイ**: GitHub連携、自動デプロイ

---

## 9. 用語集

| 用語 | 説明 |
|-----|------|
| FDC | Founders Direct Cockpit（本アプリケーション） |
| Tenant | テナント（1社・1クライアント単位。サブドメインで識別） |
| WS | Workspace（ワークスペース。テナント内の部門/チーム単位） |
| RBAC | Role-Based Access Control（ロールベースアクセス制御） |
| RLS | Row Level Security（行レベルセキュリティ）※全テーブルで ENABLE ROW LEVEL SECURITY + service_role ポリシーを適用 |
| AES-256-GCM | Advanced Encryption Standard 256-bit Galois/Counter Mode（暗号化方式） |
| DOD | Definition of Done（完了定義） |
| E2E | End-to-End（エンドツーエンドテスト） |
| OKR | Objectives and Key Results（目標と主要な成果） |

---

**Last Updated**: 2025-12-05
**Version**: v6.12
**Status**: Phase 14, 15 完了（AI基盤・セキュリティ強化）、Phase 19 AI実装予定
**Product Version**: v2.9.2
**Tech Debt**: 0件（Lint/ビルド警告・`as any` ゼロ）
**Maintained by**: FDC Development Team (Human + AI Agents)

---

**📚 関連ドキュメント（分割元）:**
- `docs/legacy/PHASE-HISTORY.md` - 全Phaseの詳細履歴
- `docs/legacy/ARCHITECTURE-DETAIL.md` - 詳細アーキテクチャ（ディレクトリ構造、データフロー等）
- `docs/legacy/SECURITY-DB-DETAIL.md` - セキュリティ・DB設計詳細
- `docs/legacy/OPS-LESSONS.md` - 運用教訓・Lessons Learned
