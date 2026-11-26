-- Syntern HRMS: durable lease metadata for safe tenant provisioning recovery.
-- Target: CENTRAL / PLATFORM PostgreSQL database only.
-- Additive and re-runnable. Does not claim or retry any tenant by itself.
-- Apply only after a verified Central DB backup.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.tenants') IS NULL THEN
    RAISE EXCEPTION 'Central schema prerequisite missing: public.tenants.';
  END IF;
END $$;

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS storage_lease_token UUID,
  ADD COLUMN IF NOT EXISTS storage_lease_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS provisioning_attempts INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenants_provisioning_attempts_nonnegative'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants
      ADD CONSTRAINT tenants_provisioning_attempts_nonnegative
      CHECK (provisioning_attempts >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_provisioning_lease_expiry
  ON public.tenants (storage_lease_expires_at)
  WHERE storage_status = 'provisioning';

COMMENT ON COLUMN public.tenants.storage_lease_token IS
  'Opaque claim token for one provisioning attempt; never expose to tenant clients.';
COMMENT ON COLUMN public.tenants.storage_lease_expires_at IS
  'Expiry of the active provisioning claim; expired claims may be reclaimed only after ownership and state checks.';
COMMENT ON COLUMN public.tenants.provisioning_attempts IS
  'Count of provisioning claims; operational telemetry, not a retry authorization by itself.';

SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenants' AND column_name='storage_lease_token') AS has_storage_lease_token,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenants' AND column_name='storage_lease_expires_at') AS has_storage_lease_expires_at,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenants' AND column_name='provisioning_attempts') AS has_provisioning_attempts,
  EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tenants_provisioning_attempts_nonnegative' AND conrelid='public.tenants'::regclass) AS has_attempts_check;

COMMIT;
