-- Tenant-scope sensitive KYC/Aadhaar records in the Central database.
-- Existing records are intentionally left with tenant_id = NULL: do not guess
-- ownership from Aadhaar hashes or task IDs. Only platform admins can see them
-- until an independently verified ownership backfill is prepared.
BEGIN;

ALTER TABLE public.central_kyc_records
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE public.central_kyc_records
  DROP CONSTRAINT IF EXISTS central_kyc_records_aadhaar_hash_key;

CREATE UNIQUE INDEX IF NOT EXISTS central_kyc_records_tenant_aadhaar_hash_uq
  ON public.central_kyc_records (tenant_id, aadhaar_hash)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS central_kyc_records_tenant_id_idx
  ON public.central_kyc_records (tenant_id);

ALTER TABLE public.central_kyc_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS central_kyc_records_policy
  ON public.central_kyc_records;

CREATE POLICY central_kyc_records_tenant_policy
  ON public.central_kyc_records
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

COMMIT;
