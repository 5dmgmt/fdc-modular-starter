# Phase 14.2 スケーラビリティ改善ランブック

## 概要

| 項目 | 内容 |
|------|------|
| **目的** | 同時利用可能人数を20人→100人に向上 |
| **対象** | Phase 1 (必須) + Phase 2 (推奨) |
| **Phase 3** | 次期対応として保留 |

---

## 現状分析

### 技術スタック
- **DB**: Supabase (PostgreSQL/Neon) - RLS有効（service_role でアクセス）
- **認証**: Cookie Session + DB (sessions テーブル)
- **キャッシュ**: Vercel KV (Upstash Redis) - レート制限のみ
- **Google同期**: 同期処理（ブロッキング）

### 現在のボトルネック

| 優先度 | ボトルネック | 影響度 | 現状 |
|--------|------------|--------|------|
| P0 | セッション認証の毎回DBクエリ | 高 | 5-10ms/リクエスト追加 |
| P0 | Supabase接続数制限 | 高 | 最大10接続（無料プラン） |
| P1 | Google API同期のブロッキング | 中 | 5-30秒占有 |
| P1 | workspace_data (JSONB) キャッシュなし | 中 | 毎回DBアクセス |
| P2 | audit_logs無限増加 | 低 | 長期運用で影響 |

---

## Phase 1: クイックウィン（1-2週間）

### 1.1 セッションキャッシュの導入

**目的**: 認証チェックのDB負荷を90%削減

**現状** (`lib/server/auth.ts:64-106`):
```typescript
// 毎リクエストでDBクエリ
const { data: sessionData } = await supabase
  .from('sessions')
  .select('user_id, expires_at')
  .eq('token', sessionToken)
  .gt('expires_at', new Date().toISOString())
  .single();
```

**実装タスク**:

#### Task 1.1.1: Vercel KVセッションキャッシュ層の追加

```typescript
// lib/server/session-cache.ts (新規作成)

const SESSION_CACHE_TTL = 300; // 5分

interface CachedSession {
  userId: string;
  workspaceId: string | null;
  workspaceRole: string | null;
  expiresAt: string;
}

/**
 * セッションをキャッシュから取得（なければDBから取得してキャッシュ）
 */
export async function getCachedSession(
  sessionToken: string
): Promise<CachedSession | null> {
  const cacheKey = `session:${sessionToken}`;

  // Vercel KVから取得を試行
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const cached = await fetchFromKV(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('[SessionCache] KV read failed:', e);
    }
  }

  // DBから取得
  const session = await fetchSessionFromDB(sessionToken);
  if (!session) return null;

  // キャッシュに保存
  if (kvUrl && kvToken) {
    try {
      await saveToKV(cacheKey, JSON.stringify(session), SESSION_CACHE_TTL);
    } catch (e) {
      console.warn('[SessionCache] KV write failed:', e);
    }
  }

  return session;
}

/**
 * セッションキャッシュを無効化（ログアウト時）
 */
export async function invalidateSessionCache(sessionToken: string): Promise<void> {
  const cacheKey = `session:${sessionToken}`;
  // KVから削除
}
```

#### Task 1.1.2: auth.tsの更新

```typescript
// lib/server/auth.ts の getSession を更新

import { getCachedSession } from './session-cache';

export async function getSession(_request: NextRequest): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  // キャッシュ付きセッション取得
  const cached = await getCachedSession(sessionToken);
  if (!cached) return null;

  // ユーザー情報を返す（cached.userIdからユーザーデータを構築）
  // ...
}
```

#### Task 1.1.3: ログアウト時のキャッシュ無効化

```typescript
// app/api/auth/logout/route.ts を更新

import { invalidateSessionCache } from '@/lib/server/session-cache';

export async function POST(request: NextRequest) {
  const sessionToken = cookieStore.get('fdc_session')?.value;

  if (sessionToken) {
    // キャッシュを無効化
    await invalidateSessionCache(sessionToken);
    // DBからも削除
    await deleteSession(sessionToken);
  }
  // ...
}
```

**期待効果**:
- セッション認証: 5-10ms → 1-2ms（80%削減）
- DB負荷: 90%削減

---

### 1.2 Supabase接続プール設定の最適化

**目的**: 接続数制限による同時リクエスト制限を緩和

**現状** (`lib/server/db.ts`):
- globalThisパターンでシングルトン化済み
- 接続オプション未設定

**実装タスク**:

#### Task 1.2.1: Supabase接続オプションの追加

```typescript
// lib/server/db.ts を更新

globalThis.supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  // 接続プール設定
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-connection-timeout': '10000', // 10秒タイムアウト
    },
  },
});
```

#### Task 1.2.2: Supabaseプランのアップグレード検討

| プラン | 接続数 | 月額 |
|--------|--------|------|
| Free | 10 | $0 |
| Pro | 60 | $25 |
| Team | 200 | $599 |

**推奨**: 50人以上を想定する場合は Pro プランへ

---

### 1.3 レート制限の調整

**目的**: 不正アクセス防止とシステム保護のバランス

**現状** (`lib/server/rate-limit.ts`):
- Vercel KV実装済み
- デフォルト: 60req/分
- AI Chat: 5req/分

**実装タスク**:

#### Task 1.3.1: エンドポイント別レート制限の設定

```typescript
// lib/server/rate-limit-config.ts (新規作成)

export const RATE_LIMITS = {
  // 認証系（厳しめ）
  'auth/login': { limit: 10, windowMs: 60000 },
  'auth/callback': { limit: 10, windowMs: 60000 },

  // データ取得（緩め）
  'workspaces/data': { limit: 120, windowMs: 60000 },
  'org-chart': { limit: 60, windowMs: 60000 },

  // 書き込み（標準）
  'workspaces/data:write': { limit: 30, windowMs: 60000 },

  // Google同期（厳しめ - 外部API依存）
  'google/sync': { limit: 5, windowMs: 60000 },

  // AI Chat（厳しめ - コスト）
  'ai/chat': { limit: 5, windowMs: 60000 },

  // デフォルト
  default: { limit: 60, windowMs: 60000 },
} as const;
```

---

## Phase 2: 中期最適化（3-4週間）

### 2.1 Google API同期の非同期化

**目的**: 同期処理のブロッキングを解消

**現状** (`app/api/google/sync/route.ts`):
- POST: 同期処理で全タスクを処理
- 5-30秒のブロッキング

**実装タスク**:

#### Task 2.1.1: 同期ジョブキューの導入

```typescript
// lib/server/sync-queue.ts (新規作成)

interface SyncJob {
  id: string;
  userId: string;
  type: 'tasks' | 'calendar' | 'full';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  result?: SyncResult;
  error?: string;
}

/**
 * 同期ジョブをキューに追加
 */
export async function enqueueSyncJob(
  userId: string,
  type: SyncJob['type']
): Promise<string> {
  const jobId = crypto.randomUUID();
  const job: SyncJob = {
    id: jobId,
    userId,
    type,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  // Vercel KVにジョブを保存
  await saveToKV(`sync_job:${jobId}`, JSON.stringify(job), 3600);

  // ジョブキューに追加
  await addToKVList('sync_queue', jobId);

  return jobId;
}

/**
 * 同期ジョブのステータスを取得
 */
export async function getSyncJobStatus(jobId: string): Promise<SyncJob | null> {
  const job = await fetchFromKV(`sync_job:${jobId}`);
  return job ? JSON.parse(job) : null;
}
```

#### Task 2.1.2: 同期APIの非同期化

```typescript
// app/api/google/sync/route.ts を更新

export async function POST(request: NextRequest) {
  // 1. セッション確認（既存）
  // ...

  // 2. 同期ジョブをキューに追加
  const jobId = await enqueueSyncJob(session.user_id, 'full');

  // 3. 即座にレスポンス
  return NextResponse.json({
    status: 'queued',
    jobId,
    message: 'Sync job has been queued',
  });
}

// 新規: ジョブステータス確認エンドポイント
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (jobId) {
    const job = await getSyncJobStatus(jobId);
    return NextResponse.json(job || { error: 'Job not found' });
  }

  // 既存の同期状態取得
  // ...
}
```

#### Task 2.1.3: バックグラウンドワーカーの実装

**選択肢A: Vercel Cron Functions**

```typescript
// app/api/cron/sync-worker/route.ts (新規作成)

export const runtime = 'nodejs';
export const maxDuration = 60; // 60秒

export async function GET(request: NextRequest) {
  // Vercel Cron認証チェック
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // キューからジョブを取得して処理
  const jobIds = await getFromKVList('sync_queue', 0, 5);

  for (const jobId of jobIds) {
    await processSyncJob(jobId);
  }

  return NextResponse.json({ processed: jobIds.length });
}
```

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/sync-worker",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

**選択肢B: クライアント側ポーリング（簡易実装）**

```typescript
// lib/hooks/useGoogleTasksSync.ts を更新

export function useGoogleTasksSync() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle');

  const startSync = async () => {
    const response = await fetch('/api/google/sync', { method: 'POST' });
    const { jobId } = await response.json();
    setJobId(jobId);
    setSyncStatus('queued');
  };

  // ポーリングでステータス確認
  useEffect(() => {
    if (!jobId || syncStatus === 'completed' || syncStatus === 'failed') return;

    const interval = setInterval(async () => {
      const response = await fetch(`/api/google/sync?jobId=${jobId}`);
      const job = await response.json();
      setSyncStatus(job.status);

      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, syncStatus]);

  return { startSync, syncStatus, jobId };
}
```

**期待効果**:
- UIレスポンス: 5-30秒 → 即座（100%改善）
- ユーザー体験: 大幅向上

---

### 2.2 workspace_data キャッシュの導入

**目的**: 頻繁にアクセスされるワークスペースデータのDB負荷削減

**実装タスク**:

#### Task 2.2.1: ワークスペースデータキャッシュ

```typescript
// lib/server/workspace-cache.ts (新規作成)

const WORKSPACE_DATA_TTL = 60; // 1分

/**
 * ワークスペースデータをキャッシュ付きで取得
 */
export async function getCachedWorkspaceData(
  workspaceId: string
): Promise<WorkspaceData | null> {
  const cacheKey = `workspace_data:${workspaceId}`;

  // Vercel KVから取得を試行
  const cached = await fetchFromKV(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // DBから取得
  const { data } = await supabase
    .from('workspace_data')
    .select('data')
    .eq('workspace_id', workspaceId)
    .single();

  if (!data) return null;

  // キャッシュに保存
  await saveToKV(cacheKey, JSON.stringify(data.data), WORKSPACE_DATA_TTL);

  return data.data;
}

/**
 * ワークスペースデータを更新（キャッシュも更新）
 */
export async function updateWorkspaceData(
  workspaceId: string,
  data: WorkspaceData
): Promise<void> {
  // DBを更新
  await supabase
    .from('workspace_data')
    .upsert({ workspace_id: workspaceId, data });

  // キャッシュを更新
  const cacheKey = `workspace_data:${workspaceId}`;
  await saveToKV(cacheKey, JSON.stringify(data), WORKSPACE_DATA_TTL);
}

/**
 * キャッシュを無効化
 */
export async function invalidateWorkspaceCache(workspaceId: string): Promise<void> {
  const cacheKey = `workspace_data:${workspaceId}`;
  await deleteFromKV(cacheKey);
}
```

#### Task 2.2.2: データAPI更新

```typescript
// app/api/workspaces/[workspaceId]/data/route.ts を更新

import { getCachedWorkspaceData, updateWorkspaceData } from '@/lib/server/workspace-cache';

export async function GET(request: NextRequest, { params }) {
  const { workspaceId } = params;

  // キャッシュ付きで取得
  const data = await getCachedWorkspaceData(workspaceId);

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest, { params }) {
  const { workspaceId } = params;
  const body = await request.json();

  // キャッシュも同時に更新
  await updateWorkspaceData(workspaceId, body.data);

  return NextResponse.json({ success: true });
}
```

**期待効果**:
- 読み取りDB負荷: 80%削減
- レスポンス時間: 50%改善

---

### 2.3 接続プール強化（Supabase Pro前提）

**目的**: 同時接続数の増加

**実装タスク**:

#### Task 2.3.1: Supabase Proへのアップグレード

1. Supabaseダッシュボードでプランをアップグレード
2. 接続数設定を確認（60接続）
3. 接続プーリング設定を有効化

#### Task 2.3.2: 接続設定の最適化

```typescript
// lib/server/db.ts を更新

globalThis.supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  // Supabase Pro設定
  realtime: {
    params: {
      eventsPerSecond: 10, // リアルタイム制限（使用する場合）
    },
  },
});
```

---

## Phase 3: 長期スケーラビリティ（次期対応）

**目的**: サービス成長に合わせたインフラ・アプリケーションの拡張性確保

### 3.1 データベーススケーリング戦略

#### Task 3.1.1: audit_logsのパーティショニング

- **目的**: 大量データによるDBパフォーマンス劣化防止、クエリ高速化
- **アクション**:
  - 月次または年次パーティションの導入
  - 古いログのアーカイブ戦略（S3などへのオフロード）
  - `audit_logs` テーブルのインデックス最適化
- **ステータス**: 検討中。データ量が増加次第着手。

#### Task 3.1.2: 読み取りレプリカの検討

- **目的**: 読み取り負荷分散、DBの可用性向上
- **アクション**:
  - Supabaseの読み取りレプリカ機能の調査と導入検討
  - アプリケーション側での読み取りレプリカへのルーティング実装
- **ステータス**: 検討中。Supabase Proへのアップグレード後に詳細調査。

### 3.2 Google Calendar Incremental Syncの導入

#### Task 3.2.1: 差分同期の実装

- **目的**: 同期処理の効率化、APIコール数削減
- **アクション**:
  - Google Calendar APIの`changeToken` / `syncToken`ベースの差分同期ロジック実装
  - フル同期の頻度を大幅に削減（例: 週に1回、または手動トリガーのみ）
  - 差分同期失敗時のフォールバックとしてフル同期をトリガーする仕組み
- **ステータス**: 検討中。Phase 2の非同期同期が安定稼働後に着手。

### 3.3 AI Chatキャッシングと最適化

#### Task 3.3.1: プロンプトと応答のキャッシング

- **目的**: AI APIコスト削減、応答速度向上
- **アクション**:
  - よくある質問や定型的なプロンプトに対する応答をKVストアにキャッシュ
  - ユーザー固有のコンテキストに基づく応答も、一定期間キャッシュする仕組み
  - キャッシュヒット率のモニタリングとTTL調整
- **ステータス**: 検討中。AI機能の利用状況をモニタリングし、必要に応じて着手。

#### Task 3.3.2: AIモデルの最適化

- **目的**: コストとパフォーマンスのバランス最適化
- **アクション**:
  - ユースケースに応じて、より軽量なAIモデルの利用検討
  - プロンプトエンジニアリングによるトークン数削減
- **ステータス**: 検討中。AI機能の利用状況をモニタリングし、必要に応じて着手。

### 3.4 CDN最適化と画像配信

#### Task 3.4.1: 静的アセットのキャッシュ戦略強化

- **目的**: UIの高速化、オリジンサーバー負荷軽減
- **アクション**:
  - Vercel Edge NetworkやCloudflare CDNを活用したキャッシュヘッダーの最適化
  - アセットのフィンガープリンティングによるキャッシュ無効化の効率化
- **ステータス**: 検討中。UI改善の優先度に応じて着手。

#### Task 3.4.2: 画像最適化とWebP/AVIF対応

- **目的**: ページロード時間の短縮
- **アクション**:
  - Next.js Imageコンポーネントの導入と最適化
  - 画像の自動フォーマット変換（WebP/AVIF）とサイズ調整

### 3.5 インフラの自動スケーリング

#### Task 3.5.1: Vercel Serverless Functionsの最適化

- **目的**: トラフィック変動への柔軟な対応
- **アクション**:
  - メモリ・CPU設定の最適化
  - コールドスタート対策（プロビジョニングされた同時実行数の検討）

#### Task 3.5.2: Supabaseの自動スケーリング設定

- **目的**: DB負荷増大時のパフォーマンス維持
- **アクション**:
  - Supabaseのプランに応じた自動スケーリングオプションの確認と設定

### 3.6 高度なモニタリングとアラート

#### Task 3.6.1: 分散トレーシングの導入

- **目的**: リクエストのボトルネック特定、エラー原因の深掘り
- **アクション**:
  - OpenTelemetryやDatadogなどのAPMツール導入検討
  - サービス間のリクエストフロー可視化

#### Task 3.6.2: ログの一元管理と分析

- **目的**: 問題発生時の迅速な調査
- **アクション**:
  - Vercel Logs、Datadog Logs、またはELKスタックなどでのログ集約
  - 異常検知のためのログパターン分析

---

## 実装チェックリスト

### Phase 1 チェックリスト

- [x] **1.1 セッションキャッシュ** ✅ 2024-11-30 完了
  - [x] `lib/server/session-cache.ts` 新規作成
  - [x] `lib/server/auth.ts` 更新
  - [x] `app/api/auth/logout/route.ts` 更新
  - [ ] 単体テスト追加（後続タスク）
  - [ ] E2Eテストで動作確認（後続タスク）

- [x] **1.2 Supabase接続最適化** ✅ 2024-11-30 完了
  - [x] `lib/server/db.ts` 接続オプション追加
  - [x] タイムアウト設定確認（10秒ヘッダー、30秒フェッチ）
  - [ ] （オプション）プランアップグレード検討

- [x] **1.3 レート制限調整** ✅ 2024-11-30 完了
  - [x] `lib/server/rate-limit-config.ts` 新規作成
  - [x] `lib/server/rate-limit.ts` に `checkRateLimitByEndpoint` 追加
  - [ ] ログ・モニタリング追加（後続タスク）

### Phase 2 チェックリスト

- [x] **2.1 Google同期非同期化** ✅ 2024-11-30 完了
  - [x] `lib/server/sync-queue.ts` 新規作成
  - [x] `app/api/google/sync/route.ts` 更新（非同期モード対応）
  - [x] `app/api/cron/sync-worker/route.ts` ワーカー実装（Vercel Cron）
  - [x] `vercel.json` Cron設定追加
  - [ ] `lib/hooks/useGoogleTasksSync.ts` 更新（後続タスク）
  - [ ] UIにステータス表示追加（後続タスク）

- [x] **2.2 workspace_dataキャッシュ** ✅ 2024-11-30 完了
  - [x] `lib/server/workspace-cache.ts` 新規作成
  - [x] `app/api/workspaces/[workspaceId]/data/route.ts` 更新
  - [x] 書き込み時のキャッシュ無効化確認

- [ ] **2.3 接続プール強化**（後続タスク）
  - [ ] Supabase Proアップグレード（必要に応じて）
  - [ ] 接続設定の最適化

---

## 期待される効果

| 指標 | 現状 | Phase 1後 | Phase 2後 |
|------|------|-----------|-----------|
| 同時ユーザー数 | 20人 | 50人 | 100人 |
| セッション認証 | 5-10ms | 1-2ms | 1-2ms |
| Google同期UIブロック | 5-30秒 | 5-30秒 | 即座 |
| データ読み取りDB負荷 | 100% | 100% | 20% |
| P95レスポンス | 500-1000ms | 200-400ms | 100-200ms |

---

## モニタリング

### 追加すべきメトリクス

```typescript
// lib/server/metrics.ts (新規作成)

export async function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  // Vercel Analytics or カスタムログ
  console.log(JSON.stringify({
    type: 'metric',
    name,
    value,
    tags,
    timestamp: new Date().toISOString(),
  }));
}

// 使用例
await recordMetric('session_cache_hit', 1, { cacheType: 'session' });
await recordMetric('db_query_duration_ms', 45, { query: 'workspace_data' });
await recordMetric('sync_job_duration_ms', 15000, { type: 'full' });
```

### アラート設定（推奨）

| メトリクス | 閾値 | アクション |
|-----------|------|-----------|
| API P95レスポンス | > 2000ms | 調査開始 |
| DB接続エラー率 | > 1% | 即座に対応 |
| キャッシュヒット率 | < 50% | TTL調整 |
| 同期ジョブ失敗率 | > 5% | ログ確認 |

---

## ロールバック手順

### Phase 1 ロールバック

1. **セッションキャッシュ無効化**
   ```typescript
   // lib/server/session-cache.ts
   export async function getCachedSession(token: string) {
     // キャッシュをスキップしてDBから直接取得
     return fetchSessionFromDB(token);
   }
   ```

2. **環境変数で制御**
   ```bash
   # .env
   DISABLE_SESSION_CACHE=true
   ```

### Phase 2 ロールバック

1. **同期の同期処理復帰**
   - `app/api/google/sync/route.ts` を以前のバージョンに戻す
   - Cronジョブを無効化

2. **データキャッシュ無効化**
   ```bash
   DISABLE_WORKSPACE_CACHE=true
   ```

---

## 参考リンク

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pool)
- [Next.js Cron Jobs](https://vercel.com/docs/cron-jobs)

---

*Last Updated: 2024-11-30*
*Phase: 14.2*
