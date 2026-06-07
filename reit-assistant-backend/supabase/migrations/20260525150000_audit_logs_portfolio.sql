-- =============================================================================
-- audit_logs (ATTOM cost tracking) + portfolio holdings flag on deals
-- Run in Supabase SQL Editor (idempotent).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. audit_logs — ATTOM API call tracking ($0.10/call, $500/month budget)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL,
  action      TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_timestamp
  ON public.audit_logs (tenant_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action
  ON public.audit_logs (tenant_id, action, timestamp DESC);

COMMENT ON TABLE public.audit_logs IS
  'Tenant-scoped audit trail; ATTOM_API_CALL rows power monthly spend reporting.';

-- ---------------------------------------------------------------------------
-- 2. Portfolio holdings — explicit add from approved/closed deals
-- ---------------------------------------------------------------------------

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS in_portfolio BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_deals_tenant_portfolio
  ON public.deals (tenant_id, in_portfolio)
  WHERE archived_at IS NULL AND in_portfolio = true;

COMMENT ON COLUMN public.deals.in_portfolio IS
  'True when the deal is included in the tenant portfolio hub (approved/closed holdings).';

-- Portfolio KPI view scoped to holdings only (optional refresh)
CREATE OR REPLACE VIEW public.portfolio_holdings_source AS
SELECT
  d.id AS deal_id,
  d.tenant_id,
  d.deal_state,
  d.in_portfolio,
  p.id AS property_id,
  p.address,
  p.city,
  p.state,
  p.zip,
  p.property_type,
  COALESCE(ar.indicated_value, p.indicated_value, 0)::numeric AS indicated_value,
  COALESCE(ar.noi, p.noi, 0)::numeric AS noi,
  COALESCE(ar.cap_rate, p.cap_rate, 0)::numeric AS cap_rate,
  ar.score,
  ar.recommendation
FROM public.deals d
LEFT JOIN public.properties p ON p.id = d.property_id
LEFT JOIN LATERAL (
  SELECT ar2.indicated_value, ar2.noi, ar2.cap_rate, ar2.score, ar2.recommendation
  FROM public.analysis_results ar2
  WHERE ar2.property_id = d.property_id
    AND ar2.tenant_id = d.tenant_id
  ORDER BY ar2.created_at DESC
  LIMIT 1
) ar ON TRUE
WHERE d.archived_at IS NULL
  AND d.in_portfolio = true;

COMMIT;
