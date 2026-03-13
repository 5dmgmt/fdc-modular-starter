# Phase 1: タスク機能の追加

**目標**: タスク管理機能を実装（型定義、DataContext、タスクページ、localStorage永続化）

**所要時間目安**: 30-45分
**難易度**: ★★☆（中級）

---

## 前提条件

- [ ] Phase 0 が完了していること
- [ ] `npm run dev` でアプリが起動すること
- [ ] `/dashboard` にアクセスできること

---

## 実装概要

| ステップ | 内容 | ファイル |
|---------|------|---------|
| 1 | Task型定義 | `lib/types/index.ts`（更新） |
| 2 | DataContext作成 | `lib/contexts/DataContext.tsx`（新規） |
| 3 | レイアウト更新 | `app/(app)/layout.tsx`（更新） |
| 4 | タスクページ作成 | `app/(app)/tasks/page.tsx`（新規） |
| 5 | ナビゲーション更新 | `app/(app)/layout.tsx`（更新） |
| 6 | ビルド確認 | `npm run build` |
| 7 | ドキュメント更新 | 各種ドキュメント |

---

## Step 1: Task型定義

### 1.1 lib/types/index.ts を更新

現在の `lib/types/index.ts` を以下のように**完全に置き換え**:

```typescript
/**
 * lib/types/index.ts
 *
 * 型定義（Phase 1: Task追加）
 */

// ========================================
// ユーザー情報
// ========================================

export interface User {
  id: string;
  email: string;
  name: string;
}

// ========================================
// タスク（Phase 1 で追加）
// ========================================

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

// ========================================
// アプリケーションデータ（Phase 1 で追加）
// ========================================

export interface AppData {
  tasks: Task[];
}

export const DEFAULT_APP_DATA: AppData = {
  tasks: [],
};

// ========================================
// DataContext アクション型（Phase 1 で追加）
// ========================================

export type DataAction =
  | { type: 'SET_DATA'; payload: AppData }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string };
```

---

## Step 2: DataContext作成

### 2.1 lib/contexts/DataContext.tsx を新規作成

```typescript
'use client';

/**
 * lib/contexts/DataContext.tsx
 *
 * データ管理Context（Phase 1 で追加）
 * - useReducer によるステート管理
 * - localStorage による永続化
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from 'react';
import type { AppData, DataAction, Task } from '@/lib/types';
import { DEFAULT_APP_DATA } from '@/lib/types';

// ========================================
// LocalStorage キー
// ========================================

const STORAGE_KEY = 'fdc_app_data';

// ========================================
// Reducer
// ========================================

function dataReducer(state: AppData, action: DataAction): AppData {
  switch (action.type) {
    case 'SET_DATA':
      return action.payload;

    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, completed: !task.completed }
            : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };

    default:
      return state;
  }
}

// ========================================
// Context
// ========================================

interface DataContextType {
  data: AppData;
  dispatch: Dispatch<DataAction>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ========================================
// Provider
// ========================================

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [data, dispatch] = useReducer(dataReducer, DEFAULT_APP_DATA);

  // 初期読み込み（localStorage から）
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppData;
        dispatch({ type: 'SET_DATA', payload: parsed });
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
    }
  }, []);

  // 変更時に保存（localStorage へ）
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
    }
  }, [data]);

  return (
    <DataContext.Provider value={{ data, dispatch }}>
      {children}
    </DataContext.Provider>
  );
}

// ========================================
// Hook
// ========================================

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
```

---

## Step 3: レイアウト更新（DataProvider追加）

### 3.1 app/(app)/layout.tsx を更新

ファイルの先頭部分に `DataProvider` のimportを追加:

```typescript
import { DataProvider } from '@/lib/contexts/DataContext';
```

`AuthProvider` の内側に `DataProvider` を追加:

**変更前:**
```typescript
<AuthProvider user={user} loading={false}>
  <div className="app-layout">
    ...
  </div>
</AuthProvider>
```

**変更後:**
```typescript
<AuthProvider user={user} loading={false}>
  <DataProvider>
    <div className="app-layout">
      ...
    </div>
  </DataProvider>
</AuthProvider>
```

---

## Step 4: タスクページ作成

### 4.1 ディレクトリ作成

```bash
mkdir -p app/\(app\)/tasks
```

### 4.2 app/(app)/tasks/page.tsx を新規作成

```typescript
'use client';

/**
 * app/(app)/tasks/page.tsx
 *
 * タスク管理ページ（Phase 1 で追加）
 * - フィルター機能（すべて/未完了/完了）
 * - タスクの追加・完了トグル・削除
 * - 統計表示
 * - localStorage 永続化
 */

import { useState } from 'react';
import { useData } from '@/lib/contexts/DataContext';
import type { Task } from '@/lib/types';

type FilterType = 'all' | 'active' | 'completed';

export default function TasksPage() {
  const { data, dispatch } = useData();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  // ========================================
  // フィルタリング処理
  // ========================================

  const filteredTasks = data.tasks.filter((task) => {
    switch (filter) {
      case 'active':
        return !task.completed;
      case 'completed':
        return task.completed;
      default:
        return true;
    }
  });

  // 統計計算
  const stats = {
    total: data.tasks.length,
    completed: data.tasks.filter((t) => t.completed).length,
    active: data.tasks.filter((t) => !t.completed).length,
  };

  // ========================================
  // イベントハンドラー
  // ========================================

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    const newTask: Task = {
      id: `task_${Date.now()}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    setNewTaskTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleToggle = (id: string) => {
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  };

  const handleDelete = (id: string) => {
    if (confirm('このタスクを削除しますか？')) {
      dispatch({ type: 'DELETE_TASK', payload: id });
    }
  };

  // ========================================
  // レンダリング
  // ========================================

  return (
    <div>
      <h2 style={{ marginBottom: '24px' }}>タスク管理</h2>

      {/* タスク追加フォーム */}
      <div className="card">
        <h3 className="card-title">新しいタスク</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="タスクを入力してEnterまたは追加ボタン..."
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '16px',
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim()}
          >
            追加
          </button>
        </div>
      </div>

      {/* フィルタータブ */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { key: 'all', label: 'すべて', count: stats.total },
          { key: 'active', label: '未完了', count: stats.active },
          { key: 'completed', label: '完了', count: stats.completed },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            className={`btn ${filter === key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(key as FilterType)}
          >
            {label}（{count}）
          </button>
        ))}
      </div>

      {/* タスク一覧 */}
      <div className="card">
        <h3 className="card-title">
          {filter === 'all' && 'すべてのタスク'}
          {filter === 'active' && '未完了のタスク'}
          {filter === 'completed' && '完了したタスク'}
        </h3>

        {filteredTasks.length > 0 ? (
          <ul className="task-list">
            {filteredTasks.map((task) => (
              <li key={task.id} className="task-item">
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={task.completed}
                  onChange={() => handleToggle(task.id)}
                />
                <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                  {task.title}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(task.createdAt).toLocaleDateString('ja-JP')}
                </span>
                <button className="task-delete" onClick={() => handleDelete(task.id)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            {filter === 'all' && 'タスクがありません。上のフォームから追加してください。'}
            {filter === 'active' && '未完了のタスクはありません。'}
            {filter === 'completed' && '完了したタスクはありません。'}
          </div>
        )}
      </div>

      {/* 統計サマリー */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          color: 'var(--text-muted)',
          display: 'flex',
          gap: '24px',
        }}
      >
        <span>全 {stats.total} 件</span>
        <span>完了 {stats.completed} 件</span>
        <span>
          進捗率 {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
        </span>
      </div>
    </div>
  );
}
```

---

## Step 5: ナビゲーション更新

### 5.1 app/(app)/layout.tsx の NAV_ITEMS を更新

lucide-react の import に `CheckSquare` を追加:

```typescript
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
```

NAV_ITEMS にタスクを追加:

```typescript
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/tasks', label: 'タスク', icon: CheckSquare },
  // Phase 2 で追加: { href: '/settings', label: '設定', icon: Settings },
];
```

---

## Step 6: ビルド確認

### 6.1 型チェック

```bash
npm run type-check
```

### 6.2 プロダクションビルド

```bash
npm run build
```

成功すると `/tasks` ルートが追加されていることを確認。

---

## Step 7: ドキュメント更新

### 7.1 CHANGELOG.md 更新

```markdown
## [1.1.0] - 2025-XX-XX - Phase 1: タスク機能追加

### 概要

タスク管理機能を実装。型定義、DataContext、タスクページ、localStorage永続化。

### Added

| ファイル | 内容 |
|---------|------|
| `lib/contexts/DataContext.tsx` | データ管理Context（useReducer + localStorage） |
| `app/(app)/tasks/page.tsx` | タスク管理ページ |

### Changed

| ファイル | 内容 |
|---------|------|
| `lib/types/index.ts` | Task, AppData, DataAction 型追加 |
| `app/(app)/layout.tsx` | DataProvider追加、ナビゲーション更新 |

### 機能詳細

- Task型定義（id, title, completed, createdAt）
- DataContext（useReducer + localStorage永続化）
- タスクの追加・完了トグル・削除
- フィルター機能（すべて/未完了/完了）
- 統計表示（件数・進捗率）
```

### 7.2 package.json のバージョンを `1.1.0` に更新

---

## 完了条件（DoD）チェックリスト

- [ ] `lib/types/index.ts` に Task, AppData, DataAction 型が定義されている
- [ ] `lib/contexts/DataContext.tsx` が存在し、useData フックが使える
- [ ] `/tasks` でタスク一覧が表示される
- [ ] タスクの追加が動作する（Enterキー対応）
- [ ] タスクの完了トグルが動作する
- [ ] タスクの削除が動作する（確認ダイアログ付き）
- [ ] フィルター機能が動作する
- [ ] データがリロード後も永続化される（localStorage）
- [ ] `npm run type-check` が成功
- [ ] `npm run build` が成功

---

## 次のフェーズ

→ [Phase 2: 設定ページの追加](PHASE2-SETTINGS-PAGE.md)
