-- Migration: 2026-06-15
-- Consolidate central_gst_records address fields into a single JSONB column
-- and add proper cache-staleness timestamps (last_verified_at, updated_at).
--
-- Context: gst.service.js / platform.routes.js previously wrote address
-- data across scattered columns (flat_no, street, location, district,
-- branch_no, branch_name, pincode) AND a separate `raw` JSON blob,
-- producing inconsistent read paths. This migration moves all detailed
-- address parts into one `address` JSONB object. `state` / `state_code`
-- stay as top-level columns (GSTIN-derived, used for filtering).
--
-- Run this file ONCE on the central PostgreSQL database:
--   psql -h HOST -U USER -d hrms_central -f 20260615_gst_records_consolidate_address.sql
--   OR paste into Supabase → SQL Editor → Run

BEGIN;

-- 1) Add new columns
ALTER TABLE public.central_gst_records
  ADD COLUMN IF NOT EXISTS address JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2) Backfill address JSON from existing scattered columns
UPDATE public.central_gst_records
SET address = jsonb_strip_nulls(jsonb_build_object(
  'flat_no',     flat_no,
  'street',      street,
  'location',    location,
  'district',    district,
  'branch_no',   branch_no,
  'branch_name', branch_name,
  'pincode',     pincode
))
WHERE address = '{}'::jsonb;

-- 3) Backfill new timestamps from created_at for existing rows
UPDATE public.central_gst_records
SET last_verified_at = COALESCE(last_verified_at, created_at),
    updated_at        = COALESCE(updated_at, created_at);

-- 4) Now enforce NOT NULL + defaults for future rows
ALTER TABLE public.central_gst_records
  ALTER COLUMN last_verified_at SET DEFAULT NOW(),
  ALTER COLUMN last_verified_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL;

-- 5) Drop the now-redundant scattered address columns
ALTER TABLE public.central_gst_records
  DROP COLUMN IF EXISTS flat_no,
  DROP COLUMN IF EXISTS street,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS district,
  DROP COLUMN IF EXISTS branch_no,
  DROP COLUMN IF EXISTS branch_name,
  DROP COLUMN IF EXISTS pincode;

-- 6) Keep updated_at current automatically (reuses shared trigger function,
--    already hardened for search_path in 20260606_rls_and_function_fix.sql)
DROP TRIGGER IF EXISTS trg_central_gst_records_updated_at ON public.central_gst_records;
CREATE TRIGGER trg_central_gst_records_updated_at
  BEFORE UPDATE ON public.central_gst_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7) Helpful index for cache-staleness queries
CREATE INDEX IF NOT EXISTS idx_central_gst_last_verified ON public.central_gst_records (last_verified_at);

COMMIT;

-- Resulting shape of public.central_gst_records after this migration:
--   id, gstin, pan, company_name, legalname, tradename,
--   state, state_code, status, regdate, type, constitutionofbusiness,
--   business_nature (jsonb), pincode-> moved into address,
--   center_juri, center_code, raw (jsonb), created_at,
--   state_juri, cancel_date, dealing_in (jsonb), data_source,
--   address (jsonb: {flat_no, street, location, district, branch_no, branch_name, pincode}),
--   last_verified_at, updated_at
