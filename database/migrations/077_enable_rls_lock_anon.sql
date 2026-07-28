-- Harden Supabase PostgREST exposure:
-- MachineFit serves data via Express (DATABASE_URL / table owner), not anon PostgREST.
-- Enable RLS on all public tables with NO permissive policies so anon/authenticated
-- cannot read/write through the Data API. Table owners (and service_role) still bypass RLS.
-- Also revoke direct table grants from anon/authenticated/PUBLIC.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r' -- ordinary tables only
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
    -- Keep policies empty (deny-by-default for non-owner roles).
    -- Do NOT FORCE RLS: Express migrations/app use a privileged DB role that must keep working.
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'v', 'm') -- tables, views, matviews
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE ALL ON TABLE public.%I FROM anon, authenticated, PUBLIC',
        r.tablename
      );
    EXCEPTION
      WHEN undefined_object THEN
        -- Roles may be missing outside Supabase; ignore.
        NULL;
    END;
  END LOOP;
END $$;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS seqname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'S'
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE ALL ON SEQUENCE public.%I FROM anon, authenticated, PUBLIC',
        r.seqname
      );
    EXCEPTION
      WHEN undefined_object THEN
        NULL;
    END;
  END LOOP;
END $$;

-- Future tables created by privileged roles should not auto-grant to API roles.
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM PUBLIC';
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;

  BEGIN
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated';
    EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated';
  EXCEPTION
    WHEN undefined_object THEN NULL;
  END;
END $$;

COMMENT ON SCHEMA public IS
  'MachineFit: RLS enabled on public tables; access via Express DB role / service_role only.';
