/**
 * lib/types/action-map.ts
 *
 * Phase 10: Action Map 型定義
 * - Action Map（戦術計画）
 * - Action Item（具体タスク）
 */

// ========================================
// ID 型定義
// ========================================

export type ActionMapId = string;
export type ActionItemId = string;

// ========================================
// Action Map（戦術計画）
// ========================================

/**
 * Action Map - 上司が作成する戦術計画
 * 例: 「Q1 新規リード 10件獲得プラン」
 */
export interface ActionMap {
  id: ActionMapId;
  title: string;                    // 最大100文字
  description?: string;             // 最大1000文字
  ownerUserId: string;              // 作成者（上司）
  targetPeriodStart?: string;       // 開始日（ISO日付）
  targetPeriodEnd?: string;         // 終了日（ISO日付）
  createdAt: string;                // 作成日時（ISO）
  updatedAt: string;                // 更新日時（ISO）
  isArchived?: boolean;             // アーカイブフラグ

  // 進捗集計（配下 Action Item から自動計算）
  progressRate?: number;            // 0〜100
}

// ========================================
// Action Item（具体タスク）
// ========================================

/**
 * Action Item のステータス
 */
export type ActionItemStatus = 'not_started' | 'in_progress' | 'blocked' | 'done';

/**
 * Action Item の優先度
 */
export type ActionItemPriority = 'low' | 'medium' | 'high';

/**
 * Action Item - Action Map 配下の具体的なタスク
 * 例: 「テレアポリスト作成」「毎日30分テレアポ」
 */
export interface ActionItem {
  id: ActionItemId;
  actionMapId: ActionMapId;         // 所属する Action Map

  parentItemId?: ActionItemId | null;  // ツリー構造用（親Item）
  title: string;                    // 最大100文字
  description?: string;             // 最大500文字

  assigneeUserId: string;           // 担当者（部下）
  dueDate?: string;                 // 期限（ISO日付）
  priority?: ActionItemPriority;    // 優先度

  status: ActionItemStatus;         // ステータス

  // TODO タスクとの連携
  linkedTaskIds?: string[];         // Task.id の配列（最大20件）
  progressRate?: number;            // 0〜100（linkedTask の完了率から自動更新）

  createdAt: string;
  updatedAt: string;
}

// ========================================
// 定数定義
// ========================================

/**
 * ステータス表示設定
 */
export const ACTION_ITEM_STATUS_CONFIG: Record<ActionItemStatus, {
  ja: string;
  en: string;
  icon: string;
  color: string;
}> = {
  not_started: {
    ja: '未着手',
    en: 'Not Started',
    icon: '⏸',
    color: '#9E9E9E',  // グレー
  },
  in_progress: {
    ja: '進行中',
    en: 'In Progress',
    icon: '🔄',
    color: '#2196F3',  // 青
  },
  blocked: {
    ja: 'ブロック',
    en: 'Blocked',
    icon: '🚫',
    color: '#F44336',  // 赤
  },
  done: {
    ja: '完了',
    en: 'Done',
    icon: '✅',
    color: '#4CAF50',  // 緑
  },
};

/**
 * 優先度表示設定
 */
export const ACTION_ITEM_PRIORITY_CONFIG: Record<ActionItemPriority, {
  ja: string;
  en: string;
  color: string;
}> = {
  low: {
    ja: '低',
    en: 'Low',
    color: '#9E9E9E',  // グレー
  },
  medium: {
    ja: '中',
    en: 'Medium',
    color: '#FF9800',  // オレンジ
  },
  high: {
    ja: '高',
    en: 'High',
    color: '#F44336',  // 赤
  },
};

/**
 * 残日数の警告レベル
 */
export type DueDateWarningLevel = 'safe' | 'caution' | 'warning' | 'overdue';

export const DUE_DATE_WARNING_CONFIG: Record<DueDateWarningLevel, {
  ja: string;
  icon: string;
  color: string;
  minDays: number;
  maxDays: number | null;
}> = {
  safe: {
    ja: '余裕あり',
    icon: '🟢',
    color: '#4CAF50',  // 緑
    minDays: 8,
    maxDays: null,
  },
  caution: {
    ja: '期限注意',
    icon: '🟡',
    color: '#FFEB3B',  // 黄
    minDays: 4,
    maxDays: 7,
  },
  warning: {
    ja: '要対応',
    icon: '🟠',
    color: '#FF9800',  // オレンジ
    minDays: 1,
    maxDays: 3,
  },
  overdue: {
    ja: '期限切れ',
    icon: '🔴',
    color: '#F44336',  // 赤
    minDays: -Infinity,
    maxDays: 0,
  },
};

// ========================================
// ユーティリティ関数
// ========================================

/**
 * ActionMap のデフォルト値を生成
 */
export function createDefaultActionMap(
  ownerUserId: string,
  partial: Partial<ActionMap> = {}
): ActionMap {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: '',
    ownerUserId,
    createdAt: now,
    updatedAt: now,
    isArchived: false,
    progressRate: 0,
    ...partial,
  };
}

/**
 * ActionItem のデフォルト値を生成
 */
export function createDefaultActionItem(
  actionMapId: ActionMapId,
  assigneeUserId: string,
  partial: Partial<ActionItem> = {}
): ActionItem {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    actionMapId,
    title: '',
    assigneeUserId,
    status: 'not_started',
    priority: 'medium',
    progressRate: 0,
    linkedTaskIds: [],
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/**
 * 残日数を計算
 * @param dueDate - 期限日（ISO日付）
 * @param today - 今日の日付（テスト用）
 * @returns 残日数（負の値は期限切れ）
 */
export function calculateRemainingDays(
  dueDate: string | undefined,
  today: Date = new Date()
): number | null {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffMs = dueStart.getTime() - todayStart.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 残日数から警告レベルを取得
 */
export function getDueDateWarningLevel(
  remainingDays: number | null
): DueDateWarningLevel {
  if (remainingDays === null) return 'safe';
  if (remainingDays <= 0) return 'overdue';
  if (remainingDays <= 3) return 'warning';
  if (remainingDays <= 7) return 'caution';
  return 'safe';
}

/**
 * ActionItem のツリー構造を構築
 * @param items - フラットな ActionItem 配列
 * @returns ルートレベルの ActionItem 配列（子は children プロパティに格納）
 */
export interface ActionItemWithChildren extends ActionItem {
  children: ActionItemWithChildren[];
}

export function buildActionItemTree(items: ActionItem[]): ActionItemWithChildren[] {
  const itemMap = new Map<string, ActionItemWithChildren>();

  // すべてのアイテムを Map に格納（children を空配列で初期化）
  items.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  const roots: ActionItemWithChildren[] = [];

  // 親子関係を構築
  items.forEach(item => {
    const node = itemMap.get(item.id)!;
    if (item.parentItemId && itemMap.has(item.parentItemId)) {
      itemMap.get(item.parentItemId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * ActionItem の進捗率を再計算
 */
export function recomputeActionItemProgress(
  actionItem: ActionItem,
  tasks: Array<{ id: string; status: string }>
): ActionItem {
  const linkedTasks = tasks.filter(t => actionItem.linkedTaskIds?.includes(t.id));

  if (linkedTasks.length === 0) {
    return { ...actionItem, progressRate: 0 };
  }

  const doneCount = linkedTasks.filter(t => t.status === 'done').length;
  const rate = Math.round((doneCount / linkedTasks.length) * 100);

  // ステータス自動判定
  let status: ActionItemStatus = actionItem.status;
  if (rate === 100) {
    status = 'done';
  } else if (rate > 0) {
    status = 'in_progress';
  } else if (actionItem.status !== 'blocked') {
    status = 'not_started';
  }

  return {
    ...actionItem,
    progressRate: rate,
    status,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * ActionMap の進捗率を再計算（ロールアップ）
 */
export function recomputeActionMapProgress(
  actionMap: ActionMap,
  actionItems: ActionItem[]
): ActionMap {
  const items = actionItems.filter(item => item.actionMapId === actionMap.id);

  if (items.length === 0) {
    return { ...actionMap, progressRate: 0 };
  }

  const totalProgress = items.reduce((sum, item) => sum + (item.progressRate || 0), 0);
  const rate = Math.round(totalProgress / items.length);

  return {
    ...actionMap,
    progressRate: rate,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 優先度から推奨 Suit を取得
 */
export function priorityToSuit(priority: ActionItemPriority | undefined): 'spade' | 'heart' | 'diamond' {
  switch (priority) {
    case 'high':
      return 'spade';
    case 'medium':
      return 'heart';
    case 'low':
    default:
      return 'diamond';
  }
}
