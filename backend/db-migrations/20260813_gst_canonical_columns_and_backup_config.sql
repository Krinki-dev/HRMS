-- Bring existing production databases up to the canonical GST/deletion schema.
-- Safe to run repeatedly.

BEGIN;

ALTER TABLE public.central_gst_records
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS trade_name TEXT,
  ADD COLUMN IF NOT EXISTS gst_status TEXT,
  ADD COLUMN IF NOT EXISTS gst_reg_date TEXT,
  ADD COLUMN IF NOT EXISTS taxpayer_type TEXT,
  ADD COLUMN IF NOT EXISTS constitution TEXT,
  ADD COLUMN IF NOT EXISTS centre_jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS centre_code TEXT,
  ADD COLUMN IF NOT EXISTS state_jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_date TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'legalname') THEN
    EXECUTE 'UPDATE public.central_gst_records SET legal_name = COALESCE(legal_name, legalname) WHERE legal_name IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'tradename') THEN
    EXECUTE 'UPDATE public.central_gst_records SET trade_name = COALESCE(trade_name, tradename) WHERE trade_name IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'status') THEN
    EXECUTE 'UPDATE public.central_gst_records SET gst_status = COALESCE(gst_status, status) WHERE gst_status IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'regdate') THEN
    EXECUTE 'UPDATE public.central_gst_records SET gst_reg_date = COALESCE(gst_reg_date, regdate::text) WHERE gst_reg_date IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'type') THEN
    EXECUTE 'UPDATE public.central_gst_records SET taxpayer_type = COALESCE(taxpayer_type, type) WHERE taxpayer_type IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'constitutionofbusiness') THEN
    EXECUTE 'UPDATE public.central_gst_records SET constitution = COALESCE(constitution, constitutionofbusiness) WHERE constitution IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'state_juri') THEN
    EXECUTE 'UPDATE public.central_gst_records SET state_jurisdiction = COALESCE(state_jurisdiction, state_juri) WHERE state_jurisdiction IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'center_juri') THEN
    EXECUTE 'UPDATE public.central_gst_records SET centre_jurisdiction = COALESCE(centre_jurisdiction, center_juri) WHERE centre_jurisdiction IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'center_code') THEN
    EXECUTE 'UPDATE public.central_gst_records SET centre_code = COALESCE(centre_code, center_code) WHERE centre_code IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'cancel_date') THEN
    EXECUTE 'UPDATE public.central_gst_records SET cancellation_date = COALESCE(cancellation_date, cancel_date::text) WHERE cancellation_date IS NULL';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'central_gst_records' AND column_name = 'source') THEN
    EXECUTE 'UPDATE public.central_gst_records SET data_source = COALESCE(data_source, source) WHERE data_source IS NULL';
  END IF;
  EXECUTE 'UPDATE public.central_gst_records SET last_verified_at = COALESCE(last_verified_at, created_at, NOW()) WHERE last_verified_at IS NULL';
END $$;

CREATE TABLE IF NOT EXISTS public.backup_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  provider TEXT NOT NULL DEFAULT 'none',
  schedule TEXT NOT NULL DEFAULT 'daily',
  schedule_time TEXT NOT NULL DEFAULT '02:00',
  retention_days INTEGER NOT NULL DEFAULT 30,
  include_files BOOLEAN NOT NULL DEFAULT FALSE,
  gdrive_client_id_enc TEXT,
  gdrive_client_secret_enc TEXT,
  gdrive_refresh_token_enc TEXT,
  gdrive_folder_id TEXT,
  gdrive_folder_name TEXT,
  onedrive_client_id_enc TEXT,
  onedrive_tenant_id TEXT,
  onedrive_client_secret_enc TEXT,
  onedrive_folder_path TEXT,
  last_backup_at TIMESTAMPTZ,
  last_backup_status TEXT,
  last_backup_size_bytes BIGINT,
  last_backup_file_url TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenant_db_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  db_mode TEXT NOT NULL DEFAULT 'cloud',
  local_db_type TEXT,
  local_db_host TEXT,
  local_db_port INTEGER,
  local_db_name TEXT,
  local_db_user TEXT,
  local_db_pass TEXT,
  cloud_db_url TEXT,
  sync_interval_min INTEGER NOT NULL DEFAULT 5,
  sync_last_at TIMESTAMPTZ,
  sync_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;