/**
 * app/api/workspaces/[workspaceId]/data/handlers/validation.ts
 *
 * Phase 14.6.4: バリデーション・認可処理（※Workshop Phase 20: セキュリティ強化）
 * Phase 14.6.7: E2E テストモードセキュリティ強化（※Workshop Phase 20: セキュリティ強化）
 * Phase 15.1: Super Tenant Mode（DEV環境）対応（※Workshop Phase 20: セキュリティ強化）
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server/db';
import { getSession } from '@/lib/server/auth';
import { extractSubdomain } from '@/lib/server/tenants';
import { apiLogger } from '@/lib/server/logger';
import { isE2ETestRequest } from '@/lib/server/test-mode';

/**
 * Phase 15.1: Super Tenant Mode が有効かどうかを判定
 * DEV環境（dev.foundersdirect.jp）では全ワークスペースにアクセス可能
 */
function isSuperTenantMode(request: NextRequest): boolean {
  // 環境変数で有効化されていない場合は無効
  if (process.env.FDC_SUPER_TENANT_MODE !== 'true') {
    return false;
  }

  // サブドメインが 'dev' の場合のみ有効
  const host = request.headers.get('host') || '';
  const subdomain = extractSubdomain(host);

  return subdomain === 'dev';
}

export type ValidationResult =
  | { success: true; wsId: number; session: { id: string } }
  | { success: false; response: NextResponse };

/**
 * リクエストの検証とアクセス権限チェック
 */
export async function validateRequest(
  request: NextRequest,
  workspaceId: string
): Promise<ValidationResult> {
  // Phase 14.6.7: E2Eテストモードのチェック（開発環境限定、環境変数で明示的に有効化）
  if (isE2ETestRequest(request)) {
    apiLogger.debug('[API] E2E Test mode enabled (development only)');
    const wsId = parseInt(workspaceId, 10);
    return { success: true, wsId, session: { id: '1' } };
  }

  // セッション検証
  const session = await getSession(request);
  if (!session) {
    apiLogger.debug('[API] No session found');
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // ワークスペースIDのバリデーション
  const wsId = parseInt(workspaceId, 10);
  if (isNaN(wsId)) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid workspace ID' }, { status: 400 }),
    };
  }

  // アクセス権限チェック
  const { data: memberData, error: memberError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', wsId)
    .eq('user_id', parseInt(session.id, 10))
    .single();

  if (memberError || !memberData) {
    apiLogger.debug({ message: memberError?.message }, '[API] Forbidden: Not a member');
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  // テナント境界チェック
  const tenantCheck = await checkTenantBoundary(request, wsId);
  if (!tenantCheck.success) {
    return tenantCheck;
  }

  return { success: true, wsId, session };
}

/**
 * テナント境界チェック
 * Phase 15.1: Super Tenant Mode ではバイパス
 */
export async function checkTenantBoundary(
  request: NextRequest,
  wsId: number
): Promise<{ success: true } | { success: false; response: NextResponse }> {
  // Phase 15.1: Super Tenant Mode（DEV環境）ではテナント境界チェックをバイパス
  if (isSuperTenantMode(request)) {
    apiLogger.debug({ workspaceId: wsId }, '[API] Super Tenant Mode: bypassing tenant boundary check');
    return { success: true };
  }

  const host = request.headers.get('host') || 'localhost';
  const currentSubdomain = extractSubdomain(host);

  const { data: currentTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', currentSubdomain)
    .single();

  // ワークスペースのテナントIDを確認
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('tenant_id')
    .eq('id', wsId)
    .single();

  // テナント境界チェック強化
  if (currentTenant) {
    if (workspace?.tenant_id && workspace.tenant_id !== currentTenant.id) {
      apiLogger.warn({
        currentTenantId: currentTenant.id,
        workspaceTenantId: workspace.tenant_id,
        workspaceId: wsId,
      }, '[API] Tenant boundary violation detected');
      return {
        success: false,
        response: NextResponse.json({ error: 'Forbidden: Tenant mismatch' }, { status: 403 }),
      };
    }
  } else if (workspace?.tenant_id) {
    apiLogger.warn({
      currentSubdomain,
      workspaceTenantId: workspace.tenant_id,
      workspaceId: wsId,
    }, '[API] Tenant boundary violation: accessing tenant workspace without subdomain');
    return {
      success: false,
      response: NextResponse.json({ error: 'Forbidden: Tenant access required' }, { status: 403 }),
    };
  }

  return { success: true };
}
