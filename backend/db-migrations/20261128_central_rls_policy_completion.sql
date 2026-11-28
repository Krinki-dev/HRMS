-- Central PostgreSQL RLS policy completion.
-- Run only after the Central schema upgrade has created all listed tables.
-- This file is a migration artifact; do not execute it against production
-- until a DBA has verified the application role, table ownership and backup.
BEGIN;

-- Tenant-scoped tables: current tenant OR an explicitly scoped platform job.
ALTER TABLE public.backup_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS backup_config_tenant_access ON public.backup_config;
CREATE POLICY backup_config_tenant_access ON public.backup_config
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR company_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR company_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.tenant_db_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_db_config_tenant_access ON public.tenant_db_config;
CREATE POLICY tenant_db_config_tenant_access ON public.tenant_db_config
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR company_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR company_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_modules_select ON public.tenant_modules;
DROP POLICY IF EXISTS tenant_modules_insert ON public.tenant_modules;
DROP POLICY IF EXISTS tenant_modules_modify ON public.tenant_modules;
DROP POLICY IF EXISTS tenant_modules_access ON public.tenant_modules;
CREATE POLICY tenant_modules_access ON public.tenant_modules
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.tenant_pricing_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_pricing_select ON public.tenant_pricing_configs;
DROP POLICY IF EXISTS tenant_pricing_insert ON public.tenant_pricing_configs;
DROP POLICY IF EXISTS tenant_pricing_modify ON public.tenant_pricing_configs;
DROP POLICY IF EXISTS tenant_pricing_configs_access ON public.tenant_pricing_configs;
CREATE POLICY tenant_pricing_configs_access ON public.tenant_pricing_configs
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS invoices_select ON public.invoices;
DROP POLICY IF EXISTS invoices_insert ON public.invoices;
DROP POLICY IF EXISTS invoices_modify ON public.invoices;
DROP POLICY IF EXISTS invoices_tenant_access ON public.invoices;
CREATE POLICY invoices_tenant_access ON public.invoices
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.tenant_branch_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_branch_links_select ON public.tenant_branch_links;
DROP POLICY IF EXISTS tenant_branch_links_insert ON public.tenant_branch_links;
DROP POLICY IF EXISTS tenant_branch_links_modify ON public.tenant_branch_links;
DROP POLICY IF EXISTS tenant_branch_links_access ON public.tenant_branch_links;
CREATE POLICY tenant_branch_links_access ON public.tenant_branch_links
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.central_user_index ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS central_user_index_policy ON public.central_user_index;
DROP POLICY IF EXISTS central_user_index_access ON public.central_user_index;
CREATE POLICY central_user_index_access ON public.central_user_index
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR company_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR company_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_orders_tenant_access ON public.payment_orders;
CREATE POLICY payment_orders_tenant_access ON public.payment_orders
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_events_tenant_access ON public.billing_events;
CREATE POLICY billing_events_tenant_access ON public.billing_events
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR (
      tenant_id IS NOT NULL
      AND tenant_id::text = current_setting('app.current_tenant', true)
    )
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR (
      tenant_id IS NOT NULL
      AND tenant_id::text = current_setting('app.current_tenant', true)
    )
  );

ALTER TABLE public.company_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_documents_select ON public.company_documents;
DROP POLICY IF EXISTS company_documents_insert ON public.company_documents;
DROP POLICY IF EXISTS company_documents_update ON public.company_documents;
DROP POLICY IF EXISTS company_documents_tenant_access ON public.company_documents;
CREATE POLICY company_documents_tenant_access ON public.company_documents
  FOR ALL
  USING (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  )
  WITH CHECK (
    current_setting('jwt.claims.is_platform_admin', true) = 'true'
    OR tenant_id::text = current_setting('app.current_tenant', true)
  );

-- Global/platform-only tables: no tenant may query these by guessing IDs.
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenants_platform_admin ON public.tenants;
DROP POLICY IF EXISTS tenants_platform_admin_access ON public.tenants;
CREATE POLICY tenants_platform_admin_access ON public.tenants
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.central_kyc_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS central_kyc_records_policy ON public.central_kyc_records;
DROP POLICY IF EXISTS central_kyc_records_platform_admin ON public.central_kyc_records;
CREATE POLICY central_kyc_records_platform_admin ON public.central_kyc_records
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.central_gst_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS central_gst_records_policy ON public.central_gst_records;
DROP POLICY IF EXISTS central_gst_records_platform_admin ON public.central_gst_records;
CREATE POLICY central_gst_records_platform_admin ON public.central_gst_records
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_settings_admin ON public.platform_settings;
DROP POLICY IF EXISTS platform_settings_platform_admin ON public.platform_settings;
CREATE POLICY platform_settings_platform_admin ON public.platform_settings
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payment_webhook_events_platform_admin ON public.payment_webhook_events;
CREATE POLICY payment_webhook_events_platform_admin ON public.payment_webhook_events
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.company_document_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_document_reviews_admin ON public.company_document_reviews;
DROP POLICY IF EXISTS company_document_reviews_platform_admin ON public.company_document_reviews;
CREATE POLICY company_document_reviews_platform_admin ON public.company_document_reviews
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

ALTER TABLE public.tenant_migration_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_migration_jobs_platform_admin ON public.tenant_migration_jobs;
CREATE POLICY tenant_migration_jobs_platform_admin ON public.tenant_migration_jobs
  FOR ALL
  USING (current_setting('jwt.claims.is_platform_admin', true) = 'true')
  WITH CHECK (current_setting('jwt.claims.is_platform_admin', true) = 'true');

-- Do not FORCE RLS here until the deployed Central application role and
-- migration-owner behavior have been verified. The app role must not own
-- these tables or have BYPASSRLS; verify that separately before release.

COMMIT;
