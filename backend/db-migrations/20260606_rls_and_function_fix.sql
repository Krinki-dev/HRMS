-- Migration: 2026-06-06
-- Enable Row Level Security and add policies for tenant-scoped and platform tables
-- Also update update_updated_at_column() to lock search_path

BEGIN;

-- 1) Tenant-scoped tables: allow access only to the active tenant (app.current_tenant)
-- Use current_setting('app.current_tenant', true) which returns NULL if not set

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_modules_select ON public.tenant_modules
  FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_modules_insert ON public.tenant_modules
  FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_modules_modify ON public.tenant_modules
  FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE public.tenant_pricing_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_pricing_select ON public.tenant_pricing_configs
  FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_pricing_insert ON public.tenant_pricing_configs
  FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_pricing_modify ON public.tenant_pricing_configs
  FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_select ON public.invoices
  FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY invoices_insert ON public.invoices
  FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY invoices_modify ON public.invoices
  FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

ALTER TABLE public.tenant_branch_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_branch_links_select ON public.tenant_branch_links
  FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_branch_links_insert ON public.tenant_branch_links
  FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_branch_links_modify ON public.tenant_branch_links
  FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

-- 2) Central/platform-sensitive tables: restrict to platform admins (JWT claim) or specific checks
-- These policies assume your application exposes JWT claims to Postgres via current_setting('jwt.claims.<claim>')

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenants_platform_admin ON public.tenants
  FOR ALL USING (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.central_user_index ENABLE ROW LEVEL SECURITY;
-- Allow platform admin or allow rows that match the active tenant (for lookup convenience)
CREATE POLICY central_user_index_policy ON public.central_user_index
  FOR ALL USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR (company_id::text = current_setting('app.current_tenant', true))
  );

ALTER TABLE public.central_kyc_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY central_kyc_records_policy ON public.central_kyc_records
  FOR ALL USING (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.central_gst_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY central_gst_records_policy ON public.central_gst_records
  FOR ALL USING (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_settings_admin ON public.platform_settings
  FOR ALL USING (current_setting('jwt.claims.is_platform_admin', true) = 'true');

-- 3) Prevent accidental reliance on search_path in functions: lock search_path for update_updated_at_column
-- We recreate the function with an explicit search_path

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

COMMIT;

-- Notes:
-- 1) Policies use current_setting('app.current_tenant', true). Ensure your application sets this session variable for every DB session/transaction.
--    Example (per-request, inside a transaction):
--      SET LOCAL app.current_tenant = '00000000-0000-0000-0000-000000000000';
-- 2) To expose JWT claims to Postgres (if using a proxy like Supabase), make sure they are set as settings named 'jwt.claims.<name>' or use your mechanism.
-- 3) Test thoroughly in staging before applying to production.
