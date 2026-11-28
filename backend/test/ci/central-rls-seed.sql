-- Disposable GitHub Actions Central database only.
-- The full policy set is applied before this seed file.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'hrms_app') THEN
    CREATE ROLE hrms_app LOGIN PASSWORD 'app_pw';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE hrms_central_test TO hrms_app;
GRANT USAGE ON SCHEMA public TO hrms_app;
GRANT SELECT ON TABLE public.tenant_modules TO hrms_app;

INSERT INTO public.tenants (id, name, subdomain)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'RLS Tenant A', 'rls-tenant-a'),
  ('22222222-2222-2222-2222-222222222222', 'RLS Tenant B', 'rls-tenant-b'),
  ('33333333-3333-3333-3333-333333333333', 'Auth Tenant A', 'auth-tenant-a')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tenant_modules (tenant_id, module_name, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'payroll', true),
  ('22222222-2222-2222-2222-222222222222', 'payroll', true)
ON CONFLICT (tenant_id, module_name) DO NOTHING;

INSERT INTO public.central_user_index
  (email, subdomain, company_id, user_id, is_platform_admin, is_active)
VALUES
  ('admin@syntern.in', 'syntern', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', true, true),
  ('staff@tenant-a.test', 'auth-tenant-a', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', false, true)
ON CONFLICT (email, company_id) DO NOTHING;
