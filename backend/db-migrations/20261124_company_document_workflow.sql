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
