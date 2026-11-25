BEGIN;

CREATE TABLE IF NOT EXISTS public.tenant_migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN (
    'inventory_only', 'blocked', 'copying', 'verifying',
    'completed', 'failed', 'rolled_back'
  )),
  source_schema TEXT NOT NULL,
  destination_schema TEXT NOT NULL,
  source_storage_tier TEXT NOT NULL,
  target_storage_tier TEXT NOT NULL,
  inventory JSONB NOT NULL,
  blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_by_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_migration_jobs_tenant_created
  ON public.tenant_migration_jobs (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tenant_migration_jobs_status_created
  ON public.tenant_migration_jobs (status, created_at DESC);

ALTER TABLE public.tenant_migration_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_migration_jobs_platform_admin
  ON public.tenant_migration_jobs;

CREATE POLICY tenant_migration_jobs_platform_admin
  ON public.tenant_migration_jobs
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

CREATE OR REPLACE FUNCTION public.prevent_tenant_migration_job_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $
BEGIN
  RAISE EXCEPTION 'Tenant migration inventory audit records are immutable';
END;
$;

DROP TRIGGER IF EXISTS trg_tenant_migration_jobs_immutable
  ON public.tenant_migration_jobs;
CREATE TRIGGER trg_tenant_migration_jobs_immutable
  BEFORE UPDATE OR DELETE ON public.tenant_migration_jobs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_tenant_migration_job_mutation();

COMMIT;
