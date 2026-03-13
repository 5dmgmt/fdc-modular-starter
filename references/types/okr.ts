/**
 * lib/types/okr.ts
 *
 * Phase 11: OKR（Objectives and Key Results）型定義
 *
 * 【責務】
 * - OKR レイヤーの型定義
 * - Objective（目標）と KeyResult（成果指標）の構造
 * - Action Map との N:M リレーション
 *
 * 【3層アーキテクチャ】
 * - 戦略層: OKR (Objective → KeyResult)
 * - 戦術層: Action Map → Action Item
 * - 実行層: Task (4象限) → SubTask
 *
 * 【KR ↔ ActionMap 連携】
 * - N:M 関係: 1つの ActionMap が複数の KR に貢献可能
 * - KR 側に linkedActionMapIds を保持
 * - 進捗の逆ロールアップ: Task → ActionItem → ActionMap → KR → Objective
 *
 * @see docs/PHASE12-OKR-DESIGN.md
 * @see lib/types/action-map.ts
 */

// ========================================
// ID 型定義（Brand型パターン）
// ========================================

export type ObjectiveId = string & { readonly __brand: 'ObjectiveId' };
export type KeyResultId = string & { readonly __brand: 'KeyResultId' };

// ========================================
// Enum / Union 型
// ========================================

/**
 * Objective のスコープ
 * - company: 会社全体の目標
 * - team: チーム/部門の目標
 * - individual: 個人の目標
 */
export type ObjectiveScope = 'company' | 'team' | 'individual';

/**
 * Objective のステータス
 * - on_track: 順調（進捗率が期待通り）
 * - at_risk: リスクあり（遅れ気味）
 * - off_track: 要対策（大幅遅延）
 */
export type ObjectiveStatus = 'on_track' | 'at_risk' | 'off_track';

/**
 * KR の進捗計算方法
 * - manual: 手動入力（currentValue / targetValue）
 * - fromActionMaps: リンクされた ActionMap の平均進捗率から自動計算
 */
export type KRCalcMethod = 'manual' | 'fromActionMaps';

// ========================================
// Objective（目標）
// ========================================

/**
 * Objective の振り返り（四半期末など）
 */
export interface ObjectiveRetrospective {
  /** 達成度の自己評価（1-5） */
  achievementScore?: number;
  /** 学び・気づき */
  learnings?: string;
  /** 次期への引き継ぎ事項 */
  carryOver?: string;
  /** 振り返り日時 */
  reviewedAt?: string;
}

/**
 * Objective（目標）
 *
 * OKR の "O" 部分。定性的なゴールを表す。
 * 1つの Objective に複数の KeyResult が紐づく。
 */
export interface Objective {
  /** 一意識別子 */
  id: ObjectiveId;

  /** 目標タイトル（例: "Q1で新規顧客10社を獲得する"） */
  title: string;

  /** 詳細説明（任意） */
  description?: string;

  /** スコープ（会社/チーム/個人） */
  scope: ObjectiveScope;

  /** オーナーユーザーID */
  ownerUserId: string;

  /** 期間開始日（ISO 8601） */
  periodStart?: string;

  /** 期間終了日（ISO 8601） */
  periodEnd?: string;

  /**
   * 進捗率（0-100）
   * 紐づく KeyResult の平均から自動計算
   */
  progressRate?: number;

  /**
   * ステータス（on_track / at_risk / off_track）
   * 進捗率と期間から自動判定、または手動オーバーライド
   */
  status?: ObjectiveStatus;

  /** 手動でリスクフラグを立てるか */
  manualRiskFlag?: boolean;

  /** 手動リスクの理由 */
  manualRiskReason?: string;

  /** 振り返り情報 */
  retrospective?: ObjectiveRetrospective;

  /** アーカイブ済みフラグ */
  isArchived?: boolean;

  /** 作成日時（ISO 8601） */
  createdAt: string;

  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

// ========================================
// KeyResult（成果指標）
// ========================================

/**
 * KeyResult（成果指標）
 *
 * OKR の "KR" 部分。定量的な指標を表す。
 * Action Map と N:M で連携し、進捗をロールアップ。
 */
export interface KeyResult {
  /** 一意識別子 */
  id: KeyResultId;

  /** 紐づく Objective の ID */
  objectiveId: ObjectiveId;

  /** KR タイトル（例: "商談数を50件に増やす"） */
  title: string;

  /** 目標値（定量 KR の場合） */
  targetValue?: number;

  /** 現在値（定量 KR の場合） */
  currentValue?: number;

  /** 単位（例: "件", "%", "円"） */
  unit?: string;

  /** 定性 KR フラグ（Yes/No 形式） */
  isQualitative?: boolean;

  /** 定性 KR の達成フラグ */
  isAchieved?: boolean;

  /**
   * 進捗計算方法
   * - manual: currentValue / targetValue で計算
   * - fromActionMaps: リンクされた ActionMap の平均進捗率
   */
  calcMethod: KRCalcMethod;

  /**
   * 進捗率（0-100）
   * calcMethod に応じて計算
   */
  progressRate?: number;

  /**
   * リンクされた ActionMap の ID 配列
   * N:M 関係を表現（1つの ActionMap が複数 KR に貢献可能）
   * 最大10件まで
   */
  linkedActionMapIds?: string[];

  /** オーナーユーザーID */
  ownerUserId: string;

  /** 作成日時（ISO 8601） */
  createdAt: string;

  /** 更新日時（ISO 8601） */
  updatedAt: string;
}

// ========================================
// ユーティリティ型
// ========================================

/**
 * Objective と紐づく KeyResults のセット
 */
export interface ObjectiveWithKeyResults {
  objective: Objective;
  keyResults: KeyResult[];
}

/**
 * KR の進捗サマリー
 */
export interface KRProgressSummary {
  krId: KeyResultId;
  title: string;
  progressRate: number;
  linkedActionMapCount: number;
}

// ========================================
// ID 生成ヘルパー
// ========================================

/**
 * Objective ID を生成
 */
export function generateObjectiveId(): ObjectiveId {
  return `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ObjectiveId;
}

/**
 * KeyResult ID を生成
 */
export function generateKeyResultId(): KeyResultId {
  return `kr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as KeyResultId;
}

// ========================================
// 進捗計算ヘルパー
// ========================================

/**
 * KeyResult の進捗率を計算
 *
 * @param kr - KeyResult
 * @param linkedActionMapProgressRates - リンクされた ActionMap の進捗率配列（fromActionMaps の場合）
 * @returns 進捗率（0-100）
 */
export function calculateKRProgress(
  kr: KeyResult,
  linkedActionMapProgressRates?: number[]
): number {
  // 定性 KR の場合
  if (kr.isQualitative) {
    return kr.isAchieved ? 100 : 0;
  }

  // fromActionMaps の場合
  if (kr.calcMethod === 'fromActionMaps' && linkedActionMapProgressRates) {
    if (linkedActionMapProgressRates.length === 0) return 0;
    const sum = linkedActionMapProgressRates.reduce((a, b) => a + b, 0);
    return Math.round(sum / linkedActionMapProgressRates.length);
  }

  // manual の場合
  if (kr.targetValue && kr.targetValue > 0) {
    const progress = ((kr.currentValue || 0) / kr.targetValue) * 100;
    return Math.min(100, Math.round(progress));
  }

  return 0;
}

/**
 * Objective の進捗率を計算（紐づく KR の平均）
 *
 * @param keyResults - 紐づく KeyResult 配列
 * @returns 進捗率（0-100）
 */
export function calculateObjectiveProgress(keyResults: KeyResult[]): number {
  if (keyResults.length === 0) return 0;

  const sum = keyResults.reduce((acc, kr) => acc + (kr.progressRate || 0), 0);
  return Math.round(sum / keyResults.length);
}

/**
 * Objective のステータスを自動判定
 *
 * @param progressRate - 現在の進捗率
 * @param periodStart - 期間開始日
 * @param periodEnd - 期間終了日
 * @returns ステータス
 */
export function determineObjectiveStatus(
  progressRate: number,
  periodStart?: string,
  periodEnd?: string
): ObjectiveStatus {
  // 期間が設定されていない場合は進捗率のみで判定
  if (!periodStart || !periodEnd) {
    if (progressRate >= 70) return 'on_track';
    if (progressRate >= 40) return 'at_risk';
    return 'off_track';
  }

  const now = new Date();
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // 期間の経過率を計算
  const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100);

  // 実際の進捗率と期待進捗率を比較
  const progressDiff = progressRate - expectedProgress;

  if (progressDiff >= -10) return 'on_track';
  if (progressDiff >= -30) return 'at_risk';
  return 'off_track';
}
