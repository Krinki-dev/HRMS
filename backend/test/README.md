# RLS + Prisma pooling tests

`rls-tenant-isolation.test.js` proves the tenant-session RLS pattern against a
real disposable Postgres instance. It is skipped automatically unless
`RLS_TEST_APP_DATABASE_URL` is set, so it never fails a normal `npm test` run.

## One-time local setup

```bash
docker run -d --name hrms-rls-test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=rls_test -p 55432:5432 postgres:16-alpine

# Push the real central schema (all tables, including tenants + tenant_modules)
CENTRAL_DATABASE_URL="postgresql://postgres:test@localhost:55432/rls_test" \
  npx prisma db push --schema=prisma/central.prisma --skip-generate --accept-data-loss

# Apply the real tenant_modules RLS policy + a non-owner app role + seed data.
# Table owners/superusers bypass RLS by default in Postgres, so the test must
# connect as a granted-but-non-owning role to exercise the policy at all —
# this also means: if your production app connects as the table owner
# (e.g. the Supabase "postgres" role), these RLS policies provide NO
# protection at all, regardless of session variables. See the note in
# HRMS_Blueprint/07_FROZEN_DECISIONS.md.
docker exec -i hrms-rls-test psql -U postgres -d rls_test <<'SQL'
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_modules_select ON public.tenant_modules
  FOR SELECT USING (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_modules_insert ON public.tenant_modules
  FOR INSERT WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));
CREATE POLICY tenant_modules_modify ON public.tenant_modules
  FOR ALL USING (tenant_id::text = current_setting('app.current_tenant', true))
  WITH CHECK (tenant_id::text = current_setting('app.current_tenant', true));

CREATE ROLE hrms_app LOGIN PASSWORD 'app_pw';
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_modules TO hrms_app;
GRANT SELECT ON public.tenants TO hrms_app;

INSERT INTO tenants (id, name, subdomain) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'tenant-a'),
  ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'tenant-b');

INSERT INTO tenant_modules (tenant_id, module_name, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'payroll', true),
  ('22222222-2222-2222-2222-222222222222', 'payroll', true);
SQL
```

## Run

```bash
RLS_TEST_APP_DATABASE_URL="postgresql://hrms_app:app_pw@localhost:55432/rls_test" \
  node --test test/rls-tenant-isolation.test.js
```

## Teardown

```bash
docker rm -f hrms-rls-test
```

# Auth middleware integration test

`auth-middleware.test.js` runs the real `shared/middleware/auth.js` against a
real Postgres `central_user_index` table. Skipped automatically unless
`AUTH_TEST_CENTRAL_DATABASE_URL` is set.

## One-time local setup

```bash
docker run -d --name hrms-auth-test -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=auth_test -p 55433:5432 postgres:16-alpine

CENTRAL_DATABASE_URL="postgresql://postgres:test@localhost:55433/auth_test" \
  npx prisma db push --schema=prisma/central.prisma --skip-generate --accept-data-loss

docker exec -i hrms-auth-test psql -U postgres -d auth_test <<'SQL'
INSERT INTO tenants (id, name, subdomain) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Tenant A', 'tenant-a');

INSERT INTO central_user_index (email, subdomain, company_id, user_id, is_platform_admin, is_active) VALUES
  ('admin@syntern.in', 'syntern', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', true, true),
  ('staff@tenant-a.test', 'tenant-a', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', false, true);
SQL
```

## Run

```bash
AUTH_TEST_CENTRAL_DATABASE_URL="postgresql://postgres:test@localhost:55433/auth_test" \
  node --test test/auth-middleware.test.js
```

## Teardown

```bash
docker rm -f hrms-auth-test
```

