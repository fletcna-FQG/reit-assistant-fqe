-- Public SMS marketing opt-ins (Brevo compliance / subscription form)
BEGIN;

CREATE TABLE IF NOT EXISTS public.sms_opt_ins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT NOT NULL,
  email        TEXT,
  source       TEXT NOT NULL DEFAULT 'website',
  consent      BOOLEAN NOT NULL DEFAULT true,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_opt_ins_phone_normalized
  ON public.sms_opt_ins (phone);

CREATE INDEX IF NOT EXISTS idx_sms_opt_ins_created_at
  ON public.sms_opt_ins (created_at DESC);

COMMENT ON TABLE public.sms_opt_ins IS
  'Public SMS subscription opt-ins from /sms-updates. Service-role access only via backend API.';

ALTER TABLE public.sms_opt_ins ENABLE ROW LEVEL SECURITY;

COMMIT;
