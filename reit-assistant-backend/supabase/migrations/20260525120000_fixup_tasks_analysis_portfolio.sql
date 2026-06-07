-- =============================================================================
-- REIT Assistant — Fix-up migration (run after P0 if tables were partially applied)
-- Fixes E2E failures:
--   • tasks.completed_at missing (PATCH task → 500)
--   • tasks.assignee_* / description columns missing (POST task → 500)
--   • portfolio_kpi_source view missing (cap-rate chart → 500)
--   • analysis_results KPI columns (deal Rule Engine link / portfolio)
--
-- Run in: Supabase → SQL Editor → New query → Run
-- Safe to re-run (idempotent).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. ENUM types (idempotent)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deal_state_enum') THEN
    CREATE TYPE public.deal_state_enum AS ENUM (
      'Prospecting', 'Under Contract', 'Due Diligence', 'Closed', 'Lost'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_enum') THEN
    CREATE TYPE public.property_type_enum AS ENUM (
      'Multifamily', 'Retail', 'Office', 'Industrial', 'Land'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
    CREATE TYPE public.task_status_enum AS ENUM ('Pending', 'In Progress', 'Done');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority_enum') THEN
    CREATE TYPE public.task_priority_enum AS ENUM ('high', 'medium', 'low');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Deals columns (if deals existed before P0)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.deals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS deal_state public.deal_state_enum NOT NULL DEFAULT 'Prospecting';
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS property_type public.property_type_enum;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS entry_mode TEXT;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 3. Tasks — create OR add missing columns (partial table fix)
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
  completed_at      TIMESTAMPTZ
);

-- If tasks existed with an older schema, add every column the API expects:
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status public.task_status_enum NOT NULL DEFAULT 'Pending';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority public.task_priority_enum NOT NULL DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_name TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assignee_initials TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 4. analysis_results — KPI + Rules Engine persistence
-- ---------------------------------------------------------------------------

ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS indicated_value NUMERIC(14, 2);
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS noi NUMERIC(14, 2);
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS cap_rate NUMERIC(6, 3);
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;
ALTER TABLE public.analysis_results ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- Ensure triggered_rules accepts JSON (object or array)
-- If column is jsonb already, no change needed.

UPDATE public.analysis_results ar
SET
  indicated_value = COALESCE(ar.indicated_value, p.indicated_value),
  noi             = COALESCE(ar.noi, p.noi),
  cap_rate        = COALESCE(ar.cap_rate, p.cap_rate)
FROM public.properties p
WHERE ar.property_id = p.id
  AND (ar.indicated_value IS NULL OR ar.noi IS NULL OR ar.cap_rate IS NULL);

-- ---------------------------------------------------------------------------
-- 5. Triggers (tasks updated_at + completed_at)
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

DROP TRIGGER IF EXISTS trg_tasks_set_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

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

DROP TRIGGER IF EXISTS trg_tasks_set_completed_at ON public.tasks;
CREATE TRIGGER trg_tasks_set_completed_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_task_completed_at();

-- ---------------------------------------------------------------------------
-- 6. Portfolio KPI view (cap-rate chart + dashboard)
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

-- ---------------------------------------------------------------------------
-- 7. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_id ON public.tasks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON public.tasks (deal_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_property_id ON public.analysis_results (property_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_tenant_property ON public.analysis_results (tenant_id, property_id);

COMMIT;

-- ---------------------------------------------------------------------------
-- Verification (run separately after COMMIT)
-- ---------------------------------------------------------------------------
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'tasks'
-- ORDER BY ordinal_position;
--
-- SELECT id, title, status, completed_at FROM public.tasks LIMIT 5;
--
-- SELECT * FROM public.portfolio_kpi_source LIMIT 5;
