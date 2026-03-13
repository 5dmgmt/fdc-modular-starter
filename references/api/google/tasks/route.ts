/**
 * app/api/google/tasks/route.ts
 *
 * Google Tasks API エンドポイント
 * 【Phase 14.9-B】レート制限追加（※Workshop Phase 14: Google Tasks連携）
 * 【Phase 15-A】リフレッシュトークンの鍵バージョン管理対応（※Workshop Phase 14: Google Tasks連携）
 *
 * 【機能】
 * - GET: タスクリスト一覧を取得
 * - POST: タスクを作成
 * - PATCH: タスクを更新（完了状態など）
 * - DELETE: タスクを削除
 *
 * 【レート制限】
 * - 制限単位: ユーザーID
 * - 上限: 20リクエスト/分（GET/POST/PATCH/DELETE 全て共通）
 * - 理由: Google Tasks API クォータ保護
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  decrypt,
  encrypt,
  isValidEncryptedData,
  decryptRefreshToken,
} from '@/lib/server/encryption';
import { isTokenExpired, refreshAccessToken, getOAuthConfig } from '@/lib/google/oauth';
import { googleLogger } from '@/lib/server/logger';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { checkUserTenantBoundary } from '@/lib/server/workspace-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ========================================
// Phase 14.9-B: Google Tasks レート制限設定
// ========================================

/**
 * Google Tasks API レート制限
 * - 制限単位: ユーザーID
 * - 上限: 20リクエスト/分
 * - 理由: Google Tasks API はユーザー単位でクォータが設定されており、
 *         連続リクエストによるクォータ枯渇を防ぐため
 */
const GOOGLE_TASKS_RATE_LIMIT = 20; // req/min
const GOOGLE_TASKS_RATE_WINDOW = 60000; // 1分

/**
 * Phase 14.9-B: レート制限チェック共通関数
 * @param userId - ユーザーID
 * @param method - HTTPメソッド（ログ用）
 * @returns レート制限エラーレスポンス or null（許可）
 */
async function checkGoogleTasksRateLimit(
  userId: number,
  method: string
): Promise<NextResponse | null> {
  const rateLimitKey = `google_tasks:${userId}`;
  const rateLimit = await checkRateLimit(rateLimitKey, GOOGLE_TASKS_RATE_LIMIT, GOOGLE_TASKS_RATE_WINDOW);

  if (!rateLimit.allowed) {
    googleLogger.warn({
      userId,
      method,
      current: rateLimit.current,
      limit: rateLimit.limit,
    }, '[Google Tasks] Rate limit exceeded');

    return NextResponse.json(
      {
        error: 'レート制限に達しました。1分後に再試行してください。',
        code: 'RATE_LIMIT_EXCEEDED',
        resetAt: rateLimit.resetAt,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  }

  return null;
}

// スートに対応する絵文字マッピング
const SUIT_TO_EMOJI: Record<string, string> = {
  spade: '⬛️',
  heart: '🟥',
  diamond: '🟨',
  club: '🟦',
};

interface UserGoogleData {
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expires_at: string | null;
  google_api_enabled: boolean | null;
  token_key_version: string | null;
}

/**
 * アクセストークンを取得（必要に応じてリフレッシュ）
 * Phase 15-A: リフレッシュトークンの鍵バージョン管理対応
 */
async function getAccessToken(userId: number): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('google_access_token, google_refresh_token, google_token_expires_at, google_api_enabled, token_key_version')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    return null;
  }

  const typedUserData = userData as UserGoogleData;

  if (!typedUserData.google_api_enabled || !typedUserData.google_access_token) {
    return null;
  }

  const encryptedToken = JSON.parse(typedUserData.google_access_token);
  if (!isValidEncryptedData(encryptedToken)) {
    return null;
  }

  let accessToken = decrypt(encryptedToken).toString('utf8');

  // トークンの有効期限をチェックし、必要なら更新
  if (typedUserData.google_token_expires_at && isTokenExpired(typedUserData.google_token_expires_at)) {
    googleLogger.info('[Google Tasks] Access token expired, refreshing...');

    if (!typedUserData.google_refresh_token) {
      return null;
    }

    try {
      // Phase 15-A: 新しい復号関数を使用（旧形式・新形式両対応）
      const refreshToken = decryptRefreshToken(
        typedUserData.google_refresh_token,
        typedUserData.token_key_version ?? undefined
      );
      const config = getOAuthConfig();
      const newTokens = await refreshAccessToken(config, refreshToken);

      accessToken = newTokens.accessToken;

      // 新しいトークンをDBに保存
      const newEncryptedAccessToken = encrypt(newTokens.accessToken);
      await supabase
        .from('users')
        .update({
          google_access_token: JSON.stringify(newEncryptedAccessToken),
          google_token_expires_at: newTokens.expiresAt.toISOString(),
        })
        .eq('id', userId);

      googleLogger.info('[Google Tasks] Token refreshed successfully');
    } catch (refreshError) {
      googleLogger.error({ err: refreshError }, '[Google Tasks] Token refresh failed');
      return null;
    }
  }

  return accessToken;
}

/**
 * GET /api/google/tasks
 *
 * タスクリスト一覧を取得、または特定リストのタスクを取得
 */
export async function GET(request: NextRequest) {
  googleLogger.info('[Google Tasks] ========== GET START ==========');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheck = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheck.success) {
      return tenantCheck.response;
    }

    // Phase 14.9-B: レート制限チェック
    const rateLimitError = await checkGoogleTasksRateLimit(session.user_id, 'GET');
    if (rateLimitError) return rateLimitError;

    const accessToken = await getAccessToken(session.user_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google API not connected' }, { status: 400 });
    }

    const url = new URL(request.url);
    const taskListId = url.searchParams.get('taskListId');

    if (taskListId) {
      // 特定リストのタスクを取得
      const tasksResponse = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=true`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text();
        googleLogger.error({ errorText }, '[Google Tasks] Failed to fetch tasks');
        return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
      }

      const tasksData = await tasksResponse.json();
      googleLogger.info({ count: tasksData.items?.length || 0 }, '[Google Tasks] Found tasks');

      return NextResponse.json({ tasks: tasksData.items || [] });
    } else {
      // タスクリスト一覧を取得
      const listsResponse = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!listsResponse.ok) {
        const errorText = await listsResponse.text();
        googleLogger.error({ errorText }, '[Google Tasks] Failed to fetch task lists');
        return NextResponse.json({ error: 'Failed to fetch task lists' }, { status: 500 });
      }

      const listsData = await listsResponse.json();
      googleLogger.info({ count: listsData.items?.length || 0 }, '[Google Tasks] Found task lists');

      return NextResponse.json({ taskLists: listsData.items || [] });
    }
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Tasks] GET ERROR');
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

/**
 * POST /api/google/tasks
 *
 * タスクを作成
 */
export async function POST(request: NextRequest) {
  googleLogger.info('[Google Tasks] ========== POST START ==========');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheckPost = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheckPost.success) {
      return tenantCheckPost.response;
    }

    // Phase 14.9-B: レート制限チェック
    const rateLimitError = await checkGoogleTasksRateLimit(session.user_id, 'POST');
    if (rateLimitError) return rateLimitError;

    const accessToken = await getAccessToken(session.user_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google API not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { taskListId, title, notes, due, suit, fdcTaskId } = body;

    if (!taskListId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // スートに応じた絵文字プレフィックスを追加
    const emoji = suit ? SUIT_TO_EMOJI[suit] : '';
    const taskTitle = emoji ? `${emoji}${title}` : title;

    // タスクデータを構築
    const taskData: Record<string, unknown> = {
      title: taskTitle,
    };

    if (notes) {
      // FDCタスクIDをnotesに含める（同期用）
      taskData.notes = fdcTaskId ? `[FDC:${fdcTaskId}]\n${notes}` : notes;
    } else if (fdcTaskId) {
      taskData.notes = `[FDC:${fdcTaskId}]`;
    }

    if (due) {
      // RFC 3339形式で日付を設定
      taskData.due = new Date(due).toISOString();
    }

    const createResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      googleLogger.error({ errorText }, '[Google Tasks] Failed to create task');
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    const createdTask = await createResponse.json();
    googleLogger.info({ taskId: createdTask.id }, '[Google Tasks] Task created');

    return NextResponse.json({ task: createdTask });
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Tasks] POST ERROR');
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

/**
 * PATCH /api/google/tasks
 *
 * タスクを更新（完了状態、タイトルなど）
 */
export async function PATCH(request: NextRequest) {
  googleLogger.info('[Google Tasks] ========== PATCH START ==========');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheckPatch = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheckPatch.success) {
      return tenantCheckPatch.response;
    }

    // Phase 14.9-B: レート制限チェック
    const rateLimitError = await checkGoogleTasksRateLimit(session.user_id, 'PATCH');
    if (rateLimitError) return rateLimitError;

    const accessToken = await getAccessToken(session.user_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google API not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { taskListId, taskId, title, notes, due, status } = body;

    if (!taskListId || !taskId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 更新データを構築
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (due !== undefined) updateData.due = due ? new Date(due).toISOString() : null;
    if (status !== undefined) updateData.status = status; // 'needsAction' or 'completed'

    const updateResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      googleLogger.error({ errorText }, '[Google Tasks] Failed to update task');
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    const updatedTask = await updateResponse.json();
    googleLogger.info({ taskId, status }, '[Google Tasks] Task updated');

    return NextResponse.json({ task: updatedTask });
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Tasks] PATCH ERROR');
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

/**
 * DELETE /api/google/tasks
 *
 * タスクを削除
 */
export async function DELETE(request: NextRequest) {
  googleLogger.info('[Google Tasks] ========== DELETE START ==========');

  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('fdc_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Phase 14.9-C: ユーザーテナント境界チェック
    const tenantCheckDel = await checkUserTenantBoundary(request, session.user_id);
    if (!tenantCheckDel.success) {
      return tenantCheckDel.response;
    }

    // Phase 14.9-B: レート制限チェック
    const rateLimitError = await checkGoogleTasksRateLimit(session.user_id, 'DELETE');
    if (rateLimitError) return rateLimitError;

    const accessToken = await getAccessToken(session.user_id);
    if (!accessToken) {
      return NextResponse.json({ error: 'Google API not connected' }, { status: 400 });
    }

    const body = await request.json();
    const { taskListId, taskId } = body;

    if (!taskListId || !taskId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const deleteResponse = await fetch(
      `https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      const errorText = await deleteResponse.text();
      googleLogger.error({ errorText }, '[Google Tasks] Failed to delete task');
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    googleLogger.info({ taskId }, '[Google Tasks] Task deleted');

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    googleLogger.error({ err: error }, '[Google Tasks] DELETE ERROR');
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
