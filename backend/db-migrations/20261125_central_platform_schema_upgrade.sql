-- Syntern HRMS: consolidated CENTRAL / PLATFORM database additive upgrade.
-- Target: the database referenced by CENTRAL_DATABASE_URL only.
-- Do NOT run against DEV_TENANT_DATABASE_URL or a customer's tenant database.
-- Safe to re-run; preserves existing tenant and billing records.
-- Take a verified Supabase backup before applying.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tenant storage lifecycle and onboarding metadata.
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS storage_tier TEXT NOT NULL DEFAULT 'legacy_unclassified',
  ADD COLUMN IF NOT EXISTS storage_status TEXT NOT NULL DEFAULT 'legacy_unclassified',
  ADD COLUMN IF NOT EXISTS storage_provisioned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS storage_error_code TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_progress JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenants_storage_tier_check'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_storage_tier_check
      CHECK (storage_tier IN ('shared','dedicated_schema','dedicated_database','legacy_unclassified'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenants_storage_status_check'
      AND conrelid = 'public.tenants'::regclass
  ) THEN
    ALTER TABLE public.tenants ADD CONSTRAINT tenants_storage_status_check
      CHECK (storage_status IN ('pending','provisioning','ready','failed','legacy_unclassified'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenants_storage_lifecycle
  ON public.tenants (storage_tier, storage_status) WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.tenants.onboarding_progress IS
  'Non-secret onboarding step completion metadata. Never store credentials or uploaded file contents here.';

-- 2. Durable Razorpay order ledger and webhook idempotency inbox.
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE RESTRICT,
  purpose TEXT NOT NULL DEFAULT 'invoice' CHECK (purpose IN ('invoice', 'subscription')),
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id TEXT NOT NULL UNIQUE,
  gateway_payment_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'captured', 'failed', 'expired')),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_invoice_status
  ON public.payment_orders (tenant_id, invoice_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_purpose_status
  ON public.payment_orders (tenant_id, purpose, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_one_open_per_invoice
  ON public.payment_orders (invoice_id)
  WHERE gateway = 'razorpay' AND status = 'created';
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_one_open_subscription
  ON public.payment_orders (tenant_id)
  WHERE purpose = 'subscription' AND gateway = 'razorpay' AND status = 'created';

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  gateway_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'ignored', 'failed')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  last_error TEXT,
  CONSTRAINT uq_payment_webhook_gateway_event UNIQUE (gateway, gateway_event_id)
);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_status_received
  ON public.payment_webhook_events (gateway, status, received_at);

-- 3. Company document metadata and review audit trail.
-- File bytes remain in private object storage; this DB stores metadata only.
CREATE TABLE IF NOT EXISTS public.company_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'gst_certificate', 'pan_card', 'incorporation_certificate',
    'address_proof', 'bank_proof', 'other'
  )),
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  sha256 TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'resubmission_required')),
  reviewer_id UUID,
  reviewer_note TEXT,
  reviewed_at TIMESTAMPTZ,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_documents_tenant_status
  ON public.company_documents (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_documents_review_queue
  ON public.company_documents (status, created_at)
  WHERE status IN ('submitted', 'under_review', 'resubmission_required');

CREATE TABLE IF NOT EXISTS public.company_document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.company_documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  reviewer_id UUID,
  from_status TEXT,
  to_status TEXT NOT NULL,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_company_document_reviews_document
  ON public.company_document_reviews (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_document_reviews_tenant
  ON public.company_document_reviews (tenant_id);

-- 4. Keep payment-order access tenant-scoped and document metadata isolated.
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_orders_tenant_access ON public.payment_orders;
CREATE POLICY payment_orders_tenant_access ON public.payment_orders
  FOR ALL USING (
    tenant_id::text = current_setting('app.current_tenant', true)
    OR current_setting('jwt.claims.is_platform_admin', true) = 'true'
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.current_tenant', true)
    OR current_setting('jwt.claims.is_platform_admin', true) = 'true'
  );

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_documents_select ON public.company_documents;
CREATE POLICY company_documents_select ON public.company_documents
  FOR SELECT USING (
    tenant_id::text = current_setting('app.current_tenant', true)
    OR current_setting('jwt.claims.is_platform_admin', true) = 'true'
  );
DROP POLICY IF EXISTS company_documents_insert ON public.company_documents;
CREATE POLICY company_documents_insert ON public.company_documents
  FOR INSERT WITH CHECK (
    tenant_id::text = current_setting('app.current_tenant', true)
  );
DROP POLICY IF EXISTS company_documents_update ON public.company_documents;
CREATE POLICY company_documents_update ON public.company_documents
  FOR UPDATE USING (
    tenant_id::text = current_setting('app.current_tenant', true)
    OR current_setting('jwt.claims.is_platform_admin', true) = 'true'
  )
  WITH CHECK (
    tenant_id::text = current_setting('app.current_tenant', true)
    OR current_setting('jwt.claims.is_platform_admin', true) = 'true'
  );

ALTER TABLE public.company_document_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_document_reviews_admin ON public.company_document_reviews;
CREATE POLICY company_document_reviews_admin ON public.company_document_reviews
  FOR ALL USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

-- 5. Platform billing event log (present in central Prisma schema).
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  gateway TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'info',
  reference_id TEXT,
  amount_paise INTEGER,
  message TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_billing_events_tenant ON public.billing_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_event_type ON public.billing_events (event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_status ON public.billing_events (status);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON public.billing_events (created_at);

-- 6. Verification result is emitted before commit; any SQL error rolls back all DDL.
SELECT
  to_regclass('public.tenants') IS NOT NULL AS tenants_table_present,
  to_regclass('public.payment_orders') IS NOT NULL AS payment_orders_present,
  to_regclass('public.payment_webhook_events') IS NOT NULL AS payment_webhook_events_present,
  to_regclass('public.company_documents') IS NOT NULL AS company_documents_present,
  to_regclass('public.company_document_reviews') IS NOT NULL AS company_document_reviews_present,
  to_regclass('public.billing_events') IS NOT NULL AS billing_events_present;

COMMIT;
