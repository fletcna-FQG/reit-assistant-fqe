import { Request } from 'express';

export function getTenantId(req: Request): string | undefined {
  return req.user?.user_metadata?.tenant_id as string | undefined;
}

export function requireTenantId(req: Request): string | null {
  const tenantId = getTenantId(req);
  return tenantId ?? null;
}
