-- Add the optional employee reference used by KYC linking.
-- employee_id belongs to a tenant database, so no cross-database FK is possible.
BEGIN;
ALTER TABLE public.central_kyc_records
  ADD COLUMN IF NOT EXISTS employee_id UUID;
COMMIT;
