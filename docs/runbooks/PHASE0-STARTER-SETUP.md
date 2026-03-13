# Phase 0: スターター構築

**目標**: FDC Modular Starter プロジェクトを新規作成し、Next.js 16 + React 19 環境を構築する

**所要時間目安**: 30-45分
**難易度**: ★☆☆（入門）

---

## 前提条件

### 必要な環境

- [ ] Node.js 22.x がインストールされていること
- [ ] Git がインストールされていること
- [ ] VSCode または任意のエディタ

### 確認コマンド

```bash
# Node.js バージョン確認（22.x であること）
node -v

# npm バージョン確認
npm -v

# Git バージョン確認
git --version
```

---

## 実装概要

| ステップ | 内容 |
|---------|------|
| 1 | プロジェクトフォルダ作成 |
| 2 | Git 初期化 |
| 3 | package.json 作成 |
| 4 | TypeScript 設定 |
| 5 | Next.js 設定 |
| 6 | 環境変数ファイル作成 |
| 7 | ソースコード作成 |
| 8 | ドキュメント作成 |
| 9 | 依存関係インストール |
| 10 | 動作確認 |

---

## Step 1: プロジェクトフォルダ作成

### 1.1 フォルダ作成

```bash
# 任意の場所にプロジェクトフォルダを作成
mkdir -p ~/プラグイン/fdc-modular-starter
cd ~/プラグイン/fdc-modular-starter
```

### 1.2 ディレクトリ構造を作成

```bash
# 必要なディレクトリを作成
mkdir -p app/\(app\)/dashboard
mkdir -p app/login
mkdir -p lib/contexts
mkdir -p lib/types
mkdir -p lib/hooks
mkdir -p docs/guides
mkdir -p docs/runbooks
mkdir -p .github/workflows
```

---

## Step 2: Git 初期化

### 2.1 Git リポジトリを初期化

```bash
git init
```

### 2.2 .gitignore を作成

`.gitignore` を作成:

```
# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

---

## Step 3: package.json 作成

`package.json` を作成:

```json
{
  "name": "fdc-modular-starter",
  "version": "1.0.0",
  "description": "FDC Modular Starter - 学習用ミニマルスターターキット",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.0.10",
    "react": "^19.2.1",
    "react-dom": "^19.2.1"
  },
  "devDependencies": {
    "@types/node": "^22.10.1",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "typescript": "^5.7.2"
  },
  "engines": {
    "node": "22.x"
  }
}
```

---

## Step 4: TypeScript 設定

`tsconfig.json` を作成:

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "references"]
}
```

> **注意**: `references/` ディレクトリには SaaS版の参照コードが含まれており、未インストールのパッケージを import しています。`exclude` に含めないと `npm run type-check` で大量のエラーが出ます。

---

## Step 5: Next.js 設定

`next.config.ts` を作成:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 設定オプション
};

export default nextConfig;
```

---

## Step 6: 環境変数ファイル作成

### 6.1 .env.example を作成

`.env.example` を作成（テンプレートファイル）:

```bash
# ========================================
# FDC Modular Starter 環境変数
# ========================================

# アプリ設定
NEXT_PUBLIC_APP_NAME=FDC Modular
NEXT_PUBLIC_APP_VERSION=1.0.0

# 認証設定（将来の拡張用）
# NEXT_PUBLIC_AUTH_PASSWORD=fdc

# Supabase 設定（Phase 5 以降で使用）
# NEXT_PUBLIC_SUPABASE_URL=
# NEXT_PUBLIC_SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=

# 開発設定
NODE_ENV=development
```

### 6.2 .env.local を作成

`.env.local` を作成（実際の値を設定）:

```bash
# アプリ設定
NEXT_PUBLIC_APP_NAME=FDC Modular
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 6.3 環境変数の説明

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `NEXT_PUBLIC_APP_NAME` | アプリ名（UI表示用） | 任意 |
| `NEXT_PUBLIC_APP_VERSION` | アプリバージョン | 任意 |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL（Phase 5） | Phase 5 以降 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー（Phase 5） | Phase 5 以降 |

**注意**:
- `NEXT_PUBLIC_` 接頭辞のある変数はクライアントサイドで利用可能
- シークレット情報は `NEXT_PUBLIC_` を付けない

---

## Step 7: ソースコード作成

### 7.1 型定義

`lib/types/index.ts` を作成:

```typescript
/**
 * lib/types/index.ts
 *
 * 型定義（Phase 0: 最小限）
 * Phase 1 で Task, AppData を追加します
 */

// ユーザー情報
export interface User {
  id: string;
  email: string;
  name: string;
}

// Phase 1 で追加:
// export interface Task { ... }
// export interface AppData { ... }
// export const DEFAULT_APP_DATA: AppData = { ... }
```

### 7.2 認証コンテキスト

`lib/contexts/AuthContext.tsx` を作成:

```typescript
'use client';

/**
 * lib/contexts/AuthContext.tsx
 *
 * 認証コンテキスト（ミニマルスターター版）
 * SaaS版と同じ構造を使用
 */

import { createContext, useContext, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  user,
  loading,
}: {
  children: ReactNode;
  user: AuthUser | null;
  loading: boolean;
}) {
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 7.3 データコンテキスト（Phase 1 で作成）

> **注意**: DataContext は Phase 0 では作成しません。Phase 1 でタスク機能と合わせて作成します。
> `lib/contexts/DataContext.tsx` → Phase 1 のランブックを参照してください。

### 7.4 グローバルスタイル

`app/globals.css` を作成:

```css
/**
 * app/globals.css
 *
 * グローバルスタイル（ミニマルスターター版）
 * SaaS版と同じ変数・スタイルを使用
 */

:root {
  --primary: #667eea;
  --primary-dark: #5a67d8;
  --secondary: #64748b;
  --success: #22c55e;
  --danger: #ef4444;
  --warning: #f59e0b;
  --background: #f8fafc;
  --surface: #ffffff;
  --text: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --radius: 8px;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
}

/* Header */
.header {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: white;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.header h1 {
  font-size: 20px;
  font-weight: 600;
}

/* Navigation */
.nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
}

.nav-list {
  display: flex;
  gap: 8px;
  list-style: none;
}

.nav-link {
  display: block;
  padding: 12px 16px;
  color: var(--text-muted);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Main */
.main {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Cards */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 14px;
  color: var(--text-muted);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.btn-small {
  padding: 6px 12px;
  font-size: 13px;
}

/* Forms */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 14px;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Task List */
.task-list {
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.task-item:last-child {
  border-bottom: none;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.task-title {
  flex: 1;
}

.task-title.completed {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-delete {
  color: var(--danger);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

/* Login */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 48px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.login-card h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.login-card p {
  color: var(--text-muted);
  margin-bottom: 24px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}
```

### 7.5 ルートレイアウト

`app/layout.tsx` を作成:

```typescript
/**
 * app/layout.tsx
 *
 * ルートレイアウト
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FDC Modular',
  description: 'Founders Direct Cockpit - Modular Starter',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
```

### 7.6 エントリーページ

`app/page.tsx` を作成:

```typescript
/**
 * app/page.tsx
 *
 * エントリーポイント（/login へリダイレクト）
 */

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
}
```

### 7.7 ログインページ

`app/login/page.tsx` を作成:

```typescript
'use client';

/**
 * app/login/page.tsx
 *
 * ログインページ（ミニマルスターター版）
 * SaaS版と同じUI・デザインを使用
 * デモ用: パスワード = "fdc"
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogIn, Rocket } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    // デモ用認証
    if (password === 'fdc') {
      // セッションをlocalStorageに保存
      localStorage.setItem('fdc_session', JSON.stringify({
        user: { id: '1', email: 'demo@example.com', name: 'Demo User' },
        loggedInAt: new Date().toISOString(),
      }));
      // 少し遅延を入れてUIを見せる
      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/dashboard');
    } else {
      setError('パスワードが違います');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ marginBottom: '24px' }}>
          <Rocket
            size={48}
            style={{
              color: 'var(--primary)',
              marginBottom: '16px',
            }}
          />
        </div>

        <h1>FDC Modular</h1>
        <p>Founders Direct Cockpit - 学習用スターター</p>

        <div className="form-group" style={{ textAlign: 'left' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={14} />
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="パスワードを入力"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div
            className="alert alert-error"
            style={{ marginBottom: '16px', textAlign: 'left' }}
          >
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleLogin}
          disabled={isLoading}
        >
          <LogIn size={18} />
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>

        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          background: 'var(--bg-gray)',
          padding: '12px',
          borderRadius: '8px',
        }}>
          デモ用パスワード: <code style={{ fontWeight: 600 }}>fdc</code>
        </p>
      </div>
    </div>
  );
}
```

### 7.8 認証済みレイアウト

`app/(app)/layout.tsx` を作成:

```typescript
'use client';

/**
 * app/(app)/layout.tsx
 *
 * 認証済みユーザー用レイアウト（Phase 0: 認証のみ）
 * Phase 1 で DataProvider を追加します
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider, type AuthUser } from '@/lib/contexts/AuthContext';
// Phase 1 で追加: import { DataProvider } from '@/lib/contexts/DataContext';
import {
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  // ランブックで追加: { href: '/tasks', label: 'タスク', icon: CheckSquare },
  // ランブックで追加: { href: '/settings', label: '設定', icon: Settings },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(() => {
    const session = localStorage.getItem('fdc_session');
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(session);
      setUser(parsed.user);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.removeItem('fdc_session');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        読み込み中...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AuthProvider user={user} loading={loading}>
      {/* Phase 1 で DataProvider でラップ */}
      {/* ヘッダー */}
      <header className="header">
        <h1>FDC Modular</h1>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '14px', marginRight: '16px' }}>
          {user.name || user.email}
        </span>
        <button className="btn btn-secondary btn-small" onClick={handleLogout}>
          <LogOut size={16} />
          ログアウト
        </button>
      </header>

      {/* タブナビゲーション */}
      <nav className="nav">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <a
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* メインコンテンツ */}
      <main className="main">{children}</main>
    </AuthProvider>
  );
}
```

> **注意**: Phase 0 では `DataProvider` は使用しません。Phase 1 でタスク機能追加時に `DataProvider` でラップします。

### 7.9 ダッシュボードページ

`app/(app)/dashboard/page.tsx` を作成:

```typescript
'use client';

/**
 * app/(app)/dashboard/page.tsx
 *
 * ダッシュボードページ（Phase 0: 空ダッシュボード）
 * Phase 1 でタスク機能を追加します
 */

import { Rocket, ArrowRight, CheckSquare, Settings, Database } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div>
      {/* ウェルカムカード */}
      <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
        <Rocket size={64} style={{ color: 'var(--primary)', marginBottom: '24px' }} />

        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
          FDC Modular Starter へようこそ！
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginBottom: '32px' }}>
          このダッシュボードは Phase 0 の初期状態です。<br />
          各 Phase を進めることで機能が追加されていきます。
        </p>

        {/* 次のステップ */}
        <div style={{
          background: 'var(--background)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'left',
          maxWidth: '400px',
          margin: '0 auto',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
            次のステップ
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckSquare size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px' }}>Phase 1: タスク機能を追加</span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px' }}>Phase 2: 設定ページを追加</span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Database size={18} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '14px' }}>Phase 3: Supabase 統合</span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
            </li>
          </ul>
        </div>
      </div>

      {/* Coming Soon カード */}
      <div className="stats-grid" style={{ marginTop: '24px' }}>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="stat-value">&mdash;</div>
          <div className="stat-label">タスク数（Phase 1）</div>
        </div>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="stat-value">&mdash;</div>
          <div className="stat-label">完了数（Phase 1）</div>
        </div>
        <div className="stat-card" style={{ opacity: 0.6 }}>
          <div className="stat-value">&mdash;</div>
          <div className="stat-label">進捗率（Phase 1）</div>
        </div>
      </div>
    </div>
  );
}
```

> **注意**: Phase 0 のダッシュボードはタスク機能を含みません。「ようこそ」画面と次のステップ案内のみです。タスクの追加・完了・削除は Phase 1 で実装します。

---

## Step 8: ドキュメント作成

### 8.1 README.md

ルートに `README.md` を作成:

```markdown
# FDC Modular Starter

Founders Direct Cockpit の学習用ミニマルスターターキットです。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 + App Router |
| UI | React 19 |
| 言語 | TypeScript 5.x (strict mode) |
| Node.js | 22.x |

## クイックスタート

\`\`\`bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# http://localhost:3000 でアクセス
# パスワード: fdc
\`\`\`

## ドキュメント

- `docs/FDC-CORE.md` - 開発コアガイド
- `docs/runbooks/` - 機能追加ランブック

## コマンド

\`\`\`bash
npm run dev        # 開発サーバー
npm run build      # プロダクションビルド
npm run type-check # 型チェック
\`\`\`
```

### 8.2 その他のドキュメント

ドキュメントファイルは `docs/` ディレクトリに配置します。
（FDC-CORE.md、DEVELOPMENT.md、CHANGELOG.md、runbooks/ は別途作成）

---

## Step 9: 依存関係インストール

```bash
# 依存関係をインストール
npm install
```

インストールが完了すると `node_modules/` と `package-lock.json` が生成されます。

---

## Step 10: 動作確認

### 10.1 型チェック

```bash
npm run type-check
```

エラーがないことを確認。

### 10.2 開発サーバー起動

```bash
npm run dev
```

### 10.3 ブラウザで確認

1. http://localhost:3000 にアクセス
2. ログインページが表示される
3. パスワード `fdc` でログイン
4. ダッシュボードに「ようこそ」画面と次のステップ案内が表示される

### 10.4 プロダクションビルド

```bash
npm run build
```

成功すると以下のような出力:

```
Route (app)                                 Size  First Load JS
┌ ○ /                                      120 B         102 kB
├ ○ /dashboard                             xxx B         xxx kB
└ ○ /login                                 xxx B         xxx kB
```

---

## Step 11: 初回コミット

```bash
# ステージング
git add .

# 初回コミット
git commit -m "Phase 0: FDC Modular Starter 初期構築

- Next.js 16 + React 19 + TypeScript 5.x
- ログインページ（デモ認証）
- ダッシュボード（ようこそ画面）
- AuthContext（認証コンテキスト）

🤖 Generated with Claude Code"
```

---

## 完了条件（DoD）チェックリスト

- [ ] プロジェクトフォルダが作成されている
- [ ] Git リポジトリが初期化されている
- [ ] package.json が存在する
- [ ] tsconfig.json が存在する
- [ ] .env.example が存在する
- [ ] `npm install` が成功する
- [ ] `npm run type-check` が成功する
- [ ] `npm run build` が成功する
- [ ] http://localhost:3000 でログインページが表示される
- [ ] パスワード `fdc` でログインできる
- [ ] ダッシュボードに「ようこそ」画面が表示される
- [ ] 初回コミットが完了している

---

## トラブルシューティング

### Q: `npm install` でエラーが出る

```bash
# Node.js バージョンを確認
node -v  # 22.x であること

# キャッシュをクリア
npm cache clean --force

# 再インストール
rm -rf node_modules package-lock.json
npm install
```

### Q: 型エラーが出る

tsconfig.json の設定を確認:
- `strict: true` になっているか
- `paths` の設定が正しいか

### Q: ポート 3000 が使用中

```bash
# 別のポートで起動
npm run dev -- -p 3001
```

### Q: localStorage が動作しない

ブラウザのプライベートモードでは localStorage が制限される場合があります。
通常モードで試してください。

---

## 次のフェーズ

→ [Phase 1: タスクページの追加](PHASE1-TASKS-PAGE.md)

---

## Claude Code 用プロンプト

### Phase 0 実行

```
Phase 0 を実行してください。

ランブック: docs/runbooks/PHASE0-STARTER-SETUP.md

新規プロジェクトを作成し、以下を確認してください:
1. npm run build が成功するか
2. npm run type-check が成功するか
3. 開発サーバーが起動するか
4. ログイン・ダッシュボードが動作するか

完了後、初回コミットを行ってください。
```
