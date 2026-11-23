-- Syntern HRMS: additive tenant storage lifecycle metadata.
-- Apply manually to the CENTRAL PostgreSQL database after taking a verified backup.
-- This migration does not alter tenant routing or provision/move any tenant data.
BEGIN;
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS storage_tier TEXT NOT NULL DEFAULT 'legacy_unclassified',
  ADD COLUMN IF NOT EXISTS storage_status TEXT NOT NULL DEFAULT 'legacy_unclassified',
  ADD COLUMN IF NOT EXISTS storage_provisioned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_error_code TEXT;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tenants_storage_tier_check' AND conrelid='public.tenants'::regclass) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_storage_tier_check
      CHECK (storage_tier IN ('shared','dedicated_schema','dedicated_database','legacy_unclassified'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tenants_storage_status_check' AND conrelid='public.tenants'::regclass) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_storage_status_check
      CHECK (storage_status IN ('pending','provisioning','ready','failed','legacy_unclassified'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_tenants_storage_lifecycle
  ON public.tenants (storage_tier, storage_status) WHERE deleted_at IS NULL;
COMMIT;
