-- Quick patch if 20260525150000_audit_logs_portfolio.sql was partially applied.
-- Adds deals.in_portfolio + portfolio_holdings_source view.

BEGIN;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS in_portfolio BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_deals_tenant_portfolio
  ON public.deals (tenant_id, in_portfolio)
  WHERE archived_at IS NULL AND in_portfolio = true;

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
