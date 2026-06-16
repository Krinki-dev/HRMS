-- ================================================================
-- SYNTERN HRMS — CENTRAL DATABASE SCHEMA
-- Database: hrms_central (separate from tenant DB)
-- Provider: PostgreSQL (Supabase / Neon / self-hosted)
--
-- Run this file ONCE on your central PostgreSQL database:
--   psql -h HOST -U USER -d hrms_central -f central_schema.sql
--   OR paste into Supabase → SQL Editor → Run
--
-- This creates 4 tables:
--   1. tenants              — registered companies
--   2. tenant_modules       — which modules each company has enabled
--   3. central_user_index   — email/phone → company mapping (powers login lookup)
--   4. central_kyc_records  — Aadhaar KYC store (cross-tenant dedup)
-- ================================================================

-- ── Enable UUID generation ─────────────────────────────────────────
-- Supabase/most PG setups already have this. Safe to run again.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ================================================================
-- TABLE 1: tenants
-- One row per registered company.
-- Referenced by: tenant middleware, auth lookup, registration
-- ================================================================
CREATE TABLE IF NOT EXISTS tenants (

  -- Identity
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT          NOT NULL,                          -- "Pro Caryingway Enterprise Pvt Ltd"
  legal_name          TEXT,                                            -- as per MCA/GST
  subdomain           TEXT          NOT NULL UNIQUE,                   -- "pcepl" → pcepl.syntern.in
  custom_domain       TEXT          UNIQUE,                            -- "hr.pcepl.com" (optional)
  logo_url            TEXT,
  primary_color       TEXT          DEFAULT '#2563eb',
  background_color    TEXT          DEFAULT '#f8fafc',
  background_url      TEXT,
  sitemap_url         TEXT,

  -- Plan / billing
  plan                TEXT          NOT NULL DEFAULT 'free',           -- 'free' | 'starter' | 'pro' | 'enterprise'
  plan_expires_at     TIMESTAMPTZ,
  max_employees       INT           NOT NULL DEFAULT 50,

  -- Database configuration
  -- db_mode controls which connection fields are used:
  --   cloud         → Syntern provisions DB (db_url set by ops)
  --   external_cloud→ db_url = client's own Supabase/Neon URL
  --   local         → local_db_* fields = client's on-premise server
  --   hybrid        → local_db_* (primary) + db_url (cloud backup)
  db_mode             TEXT          NOT NULL DEFAULT 'cloud',          -- 'cloud' | 'external_cloud' | 'local' | 'hybrid'
  db_url              TEXT,                                            -- encrypted cloud/external URL
  schema_name         TEXT,                                            -- for shared DB: schema name (e.g., 'tenant_abc')
  local_db_type       TEXT,                                            -- 'postgres' | 'mysql' | 'mssql'
  local_db_host       TEXT,                                            -- encrypted host
  local_db_port       INT           DEFAULT 5432,
  local_db_name       TEXT,
  local_db_user       TEXT,                                            -- encrypted
  local_db_pass       TEXT,                                            -- encrypted
  sync_interval_min   INT           DEFAULT 60,                        -- for hybrid: how often to sync

  -- Company info (from GST auto-fill on registration)
  gstin               TEXT,
  pan                 TEXT,
  city                TEXT,
  state               TEXT,
  address             TEXT,
  pincode             TEXT,
  gst_status          TEXT,                                            -- 'Active' | 'Cancelled'
  gst_reg_date        TEXT,                                            -- dd/mm/yyyy
  taxpayer_type       TEXT,                                            -- 'Regular' | 'Composition'
  constitution        TEXT,                                            -- 'Private Limited Company' etc.
  e_invoice_enabled   BOOLEAN       DEFAULT FALSE,
  business_nature     JSONB         DEFAULT '[]',                      -- ["Retail Business", ...]

  -- Admin contact (first user who registered)
  admin_name          TEXT,
  admin_email         TEXT,                                            -- used as login lookup fallback
  admin_phone         TEXT,

  -- Status
  is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
  is_setup_complete   BOOLEAN       NOT NULL DEFAULT FALSE,
  suspended_at        TIMESTAMPTZ,
  suspension_reason   TEXT,
  payout_config_enc   TEXT,                            -- Encrypted JSON: { provider, key, secret, account_no }

  -- Timestamps
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ                                      -- soft delete
);

-- Indexes for hot-path queries (tenant middleware runs on every request)
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain      ON tenants (subdomain)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain  ON tenants (custom_domain) WHERE deleted_at IS NULL AND custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_admin_email    ON tenants (admin_email)  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_admin_phone    ON tenants (admin_phone)  WHERE deleted_at IS NULL AND admin_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_is_active      ON tenants (is_active);


-- ================================================================
-- TABLE 2: tenant_modules
-- Which HRMS modules are enabled per tenant.
-- Referenced by: tenant middleware (enabledModules array)
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_modules (

  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  module_name   TEXT    NOT NULL,   -- 'employees' | 'attendance' | 'leave' | 'payroll' |
                                    -- 'compliance' | 'recruitment' | 'performance' |
                                    -- 'training' | 'assets' | 'expenses' | 'reports' |
                                    -- 'automation' | 'documents' | 'notifications' | 'settings'
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  custom_price_paise INT,           -- Per-tenant price override for this specific module
  enabled_at    TIMESTAMPTZ       DEFAULT NOW(),
  disabled_at   TIMESTAMPTZ,

  CONSTRAINT uq_tenant_module UNIQUE (tenant_id, module_name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant  ON tenant_modules (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_active  ON tenant_modules (tenant_id, is_active);


-- ================================================================
-- TABLE 3: central_user_index
-- Maps email / mobile → which tenant the user belongs to.
-- This is what powers the SmartLoginPage 2-step flow:
--   Step 1: POST /auth/lookup with email → finds subdomain here
--   Step 2: POST /auth/login → goes to that tenant's DB
--
-- One user can belong to multiple tenants (multi-company support).
-- ================================================================
CREATE TABLE IF NOT EXISTS public.central_user_index (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  company_id UUID NOT NULL,
  user_id UUID NULL,
  is_platform_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT central_user_index_pkey PRIMARY KEY (id),
  CONSTRAINT uq_email_company UNIQUE (email, company_id),
  CONSTRAINT central_user_index_company_id_fkey FOREIGN KEY (company_id) REFERENCES tenants (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_cui_email ON public.central_user_index USING btree (email) TABLESPACE pg_default WHERE (is_active = TRUE);
CREATE INDEX IF NOT EXISTS idx_cui_company ON public.central_user_index USING btree (company_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_cui_subdomain ON public.central_user_index USING btree (subdomain) TABLESPACE pg_default;


-- ================================================================
-- TABLE 4: tenant_branch_links
-- Records branch GSTINs that should be linked to an existing tenant.
-- This supports multi-GST/multi-branch accounts without creating duplicate tenant rows.
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_branch_links (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  gstin         TEXT        NOT NULL UNIQUE,
  pan           TEXT        NOT NULL,
  branch_name   TEXT,
  branch_no     TEXT,
  address       TEXT,
  city          TEXT,
  state         TEXT,
  pincode       TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending',
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  note          TEXT
);

CREATE INDEX IF NOT EXISTS idx_branch_links_tenant ON tenant_branch_links (tenant_id);


-- ================================================================
-- TABLE 5: central_kyc_records
-- Aadhaar KYC data stored centrally (cross-tenant deduplication).
-- Referenced by: centralDb.js (automation module / Aadhaar KYC worker)
-- Prevents the same Aadhaar from being used in multiple companies.
-- ================================================================
CREATE TABLE IF NOT EXISTS central_kyc_records (

  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aadhaar_hash    TEXT NOT NULL UNIQUE,          -- SHA-256 of 12-digit Aadhaar
  method          TEXT NOT NULL,                 -- 'otp_based' or 'xml_upload'
  kyc_timestamp   TIMESTAMPTZ,                   -- from XML attribute 'ts' (optional)
  
  -- Personal data (encrypted)
  name            TEXT,
  dob             TEXT,
  gender          TEXT,
  careof          TEXT,
  
  -- Contact details (encrypted original values, NOT hashes)
  mobile_encrypted TEXT,                         -- actual mobile number, encrypted
  email_encrypted  TEXT,                         -- actual email address, encrypted
  
  -- Address fields (plain text – not sensitive for your use)
  house           TEXT,
  street          TEXT,
  loc             TEXT,
  vtc             TEXT,
  po              TEXT,
  subdist         TEXT,
  dist            TEXT,
  state           TEXT,
  country         TEXT DEFAULT 'India',
  pc              TEXT,
  
  -- Photo (base64 data URL)
  pht             TEXT,
  
  -- Optional debugging
  task_id         TEXT,
  
  -- Minimal timestamps (only created_at)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_aadhaar_hash   ON central_kyc_records (aadhaar_hash);

CREATE TABLE IF NOT EXISTS central_gst_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gstin             TEXT NOT NULL UNIQUE,
  pan               TEXT,
  company_name      TEXT,
  legal_name        TEXT,
  trade_name        TEXT,
  state             TEXT,
  state_code        TEXT,
  gst_status        TEXT,
  gst_reg_date      TEXT,
  taxpayer_type     TEXT,
  constitution      TEXT,
  business_nature   JSONB DEFAULT '[]',
  dealing_in        JSONB DEFAULT '[]',
  address           TEXT,
  city              TEXT,
  pincode           TEXT,
  location          TEXT,
  district          TEXT,
  branch_no         TEXT,
  branch_name       TEXT,
  flat_no           TEXT,
  street            TEXT,
  centre_jurisdiction TEXT,
  centre_code       TEXT,
  state_jurisdiction  TEXT,
  cancellation_date   TEXT,
  data_source       TEXT,
  raw               JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_central_gst_gstin ON central_gst_records (gstin);

-- ================================================================
-- TABLE 7: platform_settings
-- Stores global configuration for the entire platform.
-- ================================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  id          TEXT PRIMARY KEY,
  values      JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE 8: tenant_pricing_configs
-- Stores the dynamic pricing engine rules for each client.
-- ================================================================
CREATE TABLE IF NOT EXISTS tenant_pricing_configs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Base Price Rules (In Paise)
  base_price_paise        INT NOT NULL DEFAULT 149900, -- ₹1,499.00
  employee_cap            INT DEFAULT 25,              -- NULL for unlimited
  per_employee_excess_paise INT DEFAULT 5000,          -- ₹50.00 per emp above cap
  
  -- Discount Engine (Percentages are 0.00 to 100.00)
  discount_base_pct       DECIMAL(5,2) DEFAULT 0.00,
  discount_module_pct     JSONB DEFAULT '{}',          -- e.g. {"payroll": 10.0}
  discount_bundle_pct     DECIMAL(5,2) DEFAULT 0.00,
  bundle_trigger_count    INT DEFAULT 3,
  discount_tenure_pct     DECIMAL(5,2) DEFAULT 0.00,   -- For annual/long-term
  tenure_months           INT DEFAULT 1,               -- 1, 6, 12, 24
  
  -- Offer Rules
  offer_flat_paise        INT DEFAULT 0,
  offer_expiry_date       TIMESTAMPTZ,
  is_stackable            BOOLEAN DEFAULT FALSE,
  final_override_paise    INT DEFAULT NULL,            -- Manual enterprise deal
  
  billing_cycle           TEXT DEFAULT 'monthly',      -- 'monthly', 'quarterly', 'annual'
  updated_at              TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_tenant_pricing UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_pricing_tenant ON tenant_pricing_configs (tenant_id);

-- ================================================================
-- TABLE 9: invoices
-- Stores monthly billing records generated by the pricing engine.
-- ================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_no        TEXT NOT NULL UNIQUE,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  issue_date        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date          TIMESTAMPTZ NOT NULL,
  
  -- Calculated Amounts (in Paise)
  base_amount_paise     INT NOT NULL,
  module_amount_paise   INT NOT NULL,
  excess_amount_paise   INT NOT NULL,
  discount_amount_paise INT NOT NULL,
  tax_amount_paise      INT NOT NULL DEFAULT 0,
  total_paise           INT NOT NULL,
  
  currency          TEXT NOT NULL DEFAULT 'INR',
  status            TEXT NOT NULL DEFAULT 'unpaid', -- unpaid, paid, cancelled, overdue
  breakdown         JSONB, -- full snapshot from calculator.js
  
  pdf_url           TEXT,
  payment_id        TEXT, -- Razorpay payment ID
  
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices (tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- AUTO-UPDATE updated_at on tenants and central_user_index
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_updated_at ON tenants;
CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_cui_updated_at ON central_user_index;
CREATE TRIGGER trg_cui_updated_at
  BEFORE UPDATE ON central_user_index
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_pricing_updated_at ON tenant_pricing_configs;
CREATE TRIGGER trg_pricing_updated_at
  BEFORE UPDATE ON tenant_pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ================================================================
-- BACKFILL: Populate central_user_index with admin emails from tenants
-- Ensures login works for tenants created before central_user_index existed
-- ================================================================
INSERT INTO central_user_index (id, email, subdomain, company_id, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  admin_email,
  subdomain,
  id,
  is_active,
  NOW(),
  NOW()
FROM tenants
WHERE admin_email IS NOT NULL 
  AND admin_email NOT IN (SELECT email FROM central_user_index WHERE company_id = tenants.id)
ON CONFLICT (email, company_id) DO NOTHING;


-- ================================================================
-- VERIFY: List created tables
-- ================================================================
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name
   AND table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('tenants','tenant_modules','central_user_index','central_kyc_records')
ORDER BY table_name;

-- Expected output:
--  table_name             | column_count
-- ------------------------+--------------
--  central_kyc_records    |     25
--  central_user_index     |      8
--  tenant_modules         |      7
--  tenants                |     37
