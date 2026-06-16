Name: function_search_path_mutable
Title: Function Search Path Mutable
Level: WARN
Facing: EXTERNAL
Categories: ["SECURITY"]
Description: Detects functions where the search_path parameter is not set.
Detail: Function `public.update_updated_at_column` has a role mutable search_path
Remediation: |
  This function should be recreated with an explicit, locked `search_path` to
  avoid privilege escalation risks from a mutable search_path. Apply the
  migration that recreates the function with `SET search_path = pg_catalog, public`.

  The SQL to apply is included in `backend/db-migrations/20260606_rls_and_function_fix.sql` and specifically recreates the function like so:

  ```sql
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
  ```

  Apply after backing up your central DB:

  ```bash
  psql "$CENTRAL_DATABASE_URL" -f backend/db-migrations/20260606_rls_and_function_fix.sql
  ```

Metadata: {"name":"update_updated_at_column","type":"function","schema":"public"}
Cache_Key: function_search_path_mutable_public_update_updated_at_column_10ff09e0d1433006b865e7959e736c46
