-- Clear remaining Supabase Security Advisor WARN items:
-- 1) mutable search_path on trigger functions
-- 2) pg_trgm installed in public
-- 3) public storage bucket with listing-capable SELECT policy

-- -----------------------------------------------------------------------------
-- 1. Pin function search_path
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.gyms_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.city, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.address, '')), 'C');
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Move pg_trgm out of public (Supabase keeps an `extensions` schema)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions')
     AND EXISTS (
       SELECT 1
       FROM pg_extension e
       JOIN pg_namespace n ON n.oid = e.extnamespace
       WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
     )
  THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

-- Ensure API / DB roles can still resolve operators after the move.
DO $$
BEGIN
  BEGIN
    EXECUTE 'GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role';
  EXCEPTION
    WHEN undefined_object THEN
      NULL;
  END;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Stop listing all objects in public muscle-group-images bucket
-- Public buckets can still serve known object URLs without a broad SELECT policy.
-- App uploads/reads use service_role (bypasses storage RLS) + Express media routes.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read muscle-group-images'
  ) THEN
    EXECUTE 'DROP POLICY "Public read muscle-group-images" ON storage.objects';
  END IF;
END $$;
