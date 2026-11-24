-- Durable, tenant-scoped onboarding step completion markers.
-- Apply only after reviewing the central database target and taking a backup.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS onboarding_progress JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tenants.onboarding_progress IS
  'Non-secret onboarding step completion metadata. Never store credentials or uploaded file contents here.';
