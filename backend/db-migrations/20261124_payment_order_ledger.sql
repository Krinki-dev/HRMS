-- Razorpay invoice order ledger.
-- Apply only after reviewing the central database target and taking a backup.
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  gateway TEXT NOT NULL DEFAULT 'razorpay',
  gateway_order_id TEXT NOT NULL UNIQUE,
  gateway_payment_id TEXT UNIQUE,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'captured', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_invoice_status
  ON public.payment_orders (tenant_id, invoice_id, status);

-- At most one open Razorpay order per invoice. A failed/captured order may be
-- followed by a new attempt after its status is changed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_orders_one_open_per_invoice
  ON public.payment_orders (invoice_id)
  WHERE gateway = 'razorpay' AND status = 'created';
