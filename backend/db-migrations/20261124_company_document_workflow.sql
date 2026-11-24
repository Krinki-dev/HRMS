-- Tenant-isolated private company document submission and review workflow.
-- Apply to the CENTRAL database only after backup and environment confirmation.
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

-- Only one active unpaid subscription order per tenant; invoice uniqueness remains separate.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_one_open_subscription
  ON public.payment_orders (tenant_id)
  WHERE purpose = 'subscription' AND gateway = 'razorpay' AND status = 'created';

-- Tenant isolation for document metadata. Platform reviewers use the explicit admin RLS context.
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
  ) WITH CHECK (
    tenant_id::text = current_setting('app.current_tenant', true)
    OR current_setting('jwt.claims.is_platform_admin', true) = 'true'
  );

-- Append-only reviewer audit history; latest status also remains on company_documents.
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
ALTER TABLE public.company_document_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_document_reviews_admin ON public.company_document_reviews;
CREATE POLICY company_document_reviews_admin ON public.company_document_reviews
  FOR ALL USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');
