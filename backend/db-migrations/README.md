This folder contains SQL migrations to improve database security by enabling Row Level Security (RLS) and locking function search_path.

File: 20260606_rls_and_function_fix.sql
- Enables RLS on several central and tenant tables.
- Adds policies that:
  - Restrict tenant-scoped tables (`tenant_modules`, `tenant_pricing_configs`, `invoices`, `tenant_branch_links`) to the active tenant via `current_setting('app.current_tenant')`.
  - Restrict central/platform tables (`tenants`, `central_user_index`, `central_kyc_records`, `central_gst_records`, `platform_settings`) to platform administrators via `current_setting('jwt.claims.is_platform_admin') = 'true'`.
- Recreates `public.update_updated_at_column()` with `SET search_path = pg_catalog, public` to avoid mutable `search_path` vulnerabilities.

How to apply (example):
1. Backup your central database.
2. From a machine that can connect to the central DB (where CENTRAL_DATABASE_URL is set), run:

```bash
psql "$CENTRAL_DATABASE_URL" -f backend/db-migrations/20260606_rls_and_function_fix.sql
```

3. Ensure your application sets the session variable `app.current_tenant` on each connection / transaction. Example in Postgres drivers:

- Node (pg):
  ```js
  await client.query("SET LOCAL app.current_tenant = $1", [tenantId]);
  // or on pool connection acquire: await client.query(`SET app.current_tenant = '${tenantId}'`)
  ```

4. If using JWT claims for admin checks, ensure your gateway or middleware exposes `jwt.claims.is_platform_admin` to Postgres.

Testing checklist:
- As tenant A: set `app.current_tenant` to A's id and verify SELECT/INSERT/UPDATE works for A's rows and fails for B's rows.
- As platform admin (JWT claim is_platform_admin=true): verify access to central tables works.
- Run app integration tests to confirm no unexpected permission-denied errors.

If you want, I can also:
- Add application-level code to set `app.current_tenant` per-request.
- Create Prisma migration files instead of raw SQL.
- Add CI checks to run the DB linter and prevent regressions.
