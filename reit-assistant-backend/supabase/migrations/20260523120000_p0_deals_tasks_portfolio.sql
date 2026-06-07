-- =============================================================================
-- REIT Assistant — P0 Backend & Live Data Migration
-- Fletcher Quill Group Inc. | May 23, 2026 Handoff
--
-- Purpose:
--   1. Extend `deals` with deal_state, property_type, entry_mode
--   2. Add soft-delete (archive) support on deals
--   3. Create `tasks` table (deal-linked workflow items)
--   4. Extend `analysis_results` for portfolio KPI calculations
--   5. Index tenant_id columns and refresh RLS policies
--
-- Run in: Supabase SQL Editor OR `supabase db push`
-- Prerequisites: tenants, profiles, properties, deals, analysis_results tables
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. ENUM types (idempotent)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_state_enum') THEN
    CREATE TYPE public.deal_state_enum AS ENUM (
      'Prospecting',
      'Under Contract',
      'Due Diligence',
      'Closed',
      'Lost'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_enum') THEN
    CREATE TYPE public.property_type_enum AS ENUM (
      'Multifamily',
      'Retail',
      'Office',
      'Industrial',
      'Land'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
    CREATE TYPE public.task_status_enum AS ENUM (
      'Pending',
      'In Progress',
      'Done'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority_enum') THEN
    CREATE TYPE public.task_priority_enum AS ENUM (
      'high',
      'medium',
      'low'
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Ensure baseline `deals` table exists (only if missing)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id   UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 3. Extend `deals` — handoff columns + archive support
-- ---------------------------------------------------------------------------

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS deal_state public.deal_state_enum NOT NULL DEFAULT 'Prospecting';

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS property_type public.property_type_enum;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS entry_mode TEXT;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.deals.deal_state IS
  'Pipeline stage. Backend maps UI pipeline/review/approved/closed to this enum.';
COMMENT ON COLUMN public.deals.property_type IS
  'CRE asset class captured at deal creation (Analyze flow).';
COMMENT ON COLUMN public.deals.entry_mode IS
  'Acquisition channel, e.g. Off-market, MLS, Broker, manual, automated.';
COMMENT ON COLUMN public.deals.archived_at IS
  'Soft delete timestamp. NULL = active deal.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deals_entry_mode_length_check'
  ) THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_entry_mode_length_check
      CHECK (entry_mode IS NULL OR char_length(entry_mode) <= 64);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. `tasks` table — deal-linked workflow (P0 requirement)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  deal_id           UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  status            public.task_status_enum NOT NULL DEFAULT 'Pending',
  priority          public.task_priority_enum NOT NULL DEFAULT 'medium',
  assignee_name     TEXT,
  assignee_initials TEXT,
  due_date          DATE,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,

  CONSTRAINT tasks_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- ---------------------------------------------------------------------------
-- 5. Extend `analysis_results` for portfolio KPI endpoints
--    (Total value, avg cap rate, total NOI)
-- ---------------------------------------------------------------------------

ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS indicated_value NUMERIC(14, 2);

ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS noi NUMERIC(14, 2);

ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS cap_rate NUMERIC(6, 3);

COMMENT ON COLUMN public.analysis_results.indicated_value IS
  'Snapshot at analysis time; used by GET /api/portfolio/kpis.';
COMMENT ON COLUMN public.analysis_results.noi IS
  'Net operating income snapshot at analysis time.';
COMMENT ON COLUMN public.analysis_results.cap_rate IS
  'Cap rate (percent) snapshot at analysis time.';

-- Backfill analysis_results financial snapshots from linked properties
UPDATE public.analysis_results ar
SET
  indicated_value = COALESCE(ar.indicated_value, p.indicated_value),
  noi             = COALESCE(ar.noi, p.noi),
  cap_rate        = COALESCE(ar.cap_rate, p.cap_rate)
FROM public.properties p
WHERE ar.property_id = p.id
  AND (
    ar.indicated_value IS NULL
    OR ar.noi IS NULL
    OR ar.cap_rate IS NULL
  );

-- ---------------------------------------------------------------------------
-- 6. Indexes — tenant isolation + query performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_deals_tenant_id
  ON public.deals (tenant_id);

CREATE INDEX IF NOT EXISTS idx_deals_tenant_state
  ON public.deals (tenant_id, deal_state)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deals_tenant_property
  ON public.deals (tenant_id, property_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deals_archived_at
  ON public.deals (tenant_id, archived_at);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id
  ON public.tasks (tenant_id);

CREATE INDEX IF NOT EXISTS idx_tasks_deal_id
  ON public.tasks (deal_id);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_status
  ON public.tasks (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_analysis_results_tenant_id
  ON public.analysis_results (tenant_id);

CREATE INDEX IF NOT EXISTS idx_properties_tenant_id
  ON public.properties (tenant_id);

-- ---------------------------------------------------------------------------
-- 7. updated_at triggers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deals_set_updated_at ON public.deals;
CREATE TRIGGER trg_deals_set_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_set_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_set_completed_at ON public.tasks;
CREATE OR REPLACE FUNCTION public.set_task_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'Done' AND (OLD.status IS DISTINCT FROM 'Done') THEN
    NEW.completed_at = now();
  ELSIF NEW.status <> 'Done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tasks_set_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_task_completed_at();

-- ---------------------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Helper: resolve tenant_id from JWT user_metadata (Supabase Auth)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() -> 'user_metadata' ->> 'tenant_id', '')::uuid;
$$;

-- Drop legacy policies if re-running migration
DROP POLICY IF EXISTS deals_select_tenant ON public.deals;
DROP POLICY IF EXISTS deals_insert_tenant ON public.deals;
DROP POLICY IF EXISTS deals_update_tenant ON public.deals;
DROP POLICY IF EXISTS deals_delete_tenant ON public.deals;

DROP POLICY IF EXISTS tasks_select_tenant ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_tenant ON public.tasks;
DROP POLICY IF EXISTS tasks_update_tenant ON public.tasks;
DROP POLICY IF EXISTS tasks_delete_tenant ON public.tasks;

-- DEALS policies (exclude archived rows from SELECT by default)
CREATE POLICY deals_select_tenant ON public.deals
  FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    AND archived_at IS NULL
  );

CREATE POLICY deals_insert_tenant ON public.deals
  FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY deals_update_tenant ON public.deals
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

-- Soft delete via UPDATE (set archived_at), not hard DELETE
CREATE POLICY deals_delete_tenant ON public.deals
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- TASKS policies
CREATE POLICY tasks_select_tenant ON public.tasks
  FOR SELECT
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY tasks_insert_tenant ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = public.current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM public.deals d
      WHERE d.id = deal_id
        AND d.tenant_id = public.current_tenant_id()
        AND d.archived_at IS NULL
    )
  );

CREATE POLICY tasks_update_tenant ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (tenant_id = public.current_tenant_id())
  WITH CHECK (tenant_id = public.current_tenant_id());

CREATE POLICY tasks_delete_tenant ON public.tasks
  FOR DELETE
  TO authenticated
  USING (tenant_id = public.current_tenant_id());

-- ---------------------------------------------------------------------------
-- 9. Portfolio KPI helper view (optional — used by /api/portfolio/kpis)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.portfolio_kpi_source AS
SELECT
  d.tenant_id,
  d.deal_state,
  p.state AS property_state,
  COALESCE(ar.indicated_value, p.indicated_value, 0)::numeric AS indicated_value,
  COALESCE(ar.noi, p.noi, 0)::numeric AS noi,
  COALESCE(ar.cap_rate, p.cap_rate, 0)::numeric AS cap_rate
FROM public.deals d
LEFT JOIN public.properties p ON p.id = d.property_id
LEFT JOIN LATERAL (
  SELECT ar2.indicated_value, ar2.noi, ar2.cap_rate
  FROM public.analysis_results ar2
  WHERE ar2.property_id = d.property_id
    AND ar2.tenant_id = d.tenant_id
  ORDER BY ar2.created_at DESC
  LIMIT 1
) ar ON TRUE
WHERE d.archived_at IS NULL;

COMMENT ON VIEW public.portfolio_kpi_source IS
  'Denormalized source for portfolio KPI aggregation by tenant.';

COMMIT;

-- =============================================================================
-- Post-migration verification (run manually)
-- =============================================================================
-- SELECT column_name, data_type, udt_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'deals'
-- ORDER BY ordinal_position;
--
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE schemaname = 'public' AND tablename IN ('deals', 'tasks');
--
-- SELECT policyname, cmd, qual FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('deals', 'tasks');
