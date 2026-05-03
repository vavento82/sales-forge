-- SaaSForge app migration — additive only.
-- Existing `runs` and `leads` tables are preserved; we ALTER TABLE to add
-- new columns and replace permissive RLS policies with user-scoped ones.

-- =========================================================================
-- USER PROFILES
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.users_profile (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text,
  full_name text,
  avatar_url text,
  total_tools_generated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'users_profile' AND policyname = 'users read own profile') THEN
    CREATE POLICY "users read own profile"
      ON public.users_profile FOR SELECT TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'users_profile' AND policyname = 'users update own profile') THEN
    CREATE POLICY "users update own profile"
      ON public.users_profile FOR UPDATE TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'users_profile' AND policyname = 'service role full access') THEN
    CREATE POLICY "service role full access"
      ON public.users_profile FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- =========================================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users_profile (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- EXTEND EXISTING `runs` TABLE
-- =========================================================================

ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS tools_count_requested integer DEFAULT 1;
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT true;
ALTER TABLE public.runs ADD COLUMN IF NOT EXISTS error_message text;

-- Replace the open `anon insert runs` policy with a user-scoped one.
-- (We keep the runs RLS enabled.)
DROP POLICY IF EXISTS "authenticated read runs" ON public.runs;
DROP POLICY IF EXISTS "authenticated update runs" ON public.runs;
DROP POLICY IF EXISTS "authenticated insert runs" ON public.runs;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'runs' AND policyname = 'users read own runs') THEN
    CREATE POLICY "users read own runs"
      ON public.runs FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'runs' AND policyname = 'users insert own runs') THEN
    CREATE POLICY "users insert own runs"
      ON public.runs FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'runs' AND policyname = 'service role runs full access') THEN
    CREATE POLICY "service role runs full access"
      ON public.runs FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- =========================================================================
-- LEADS RLS — only the owning user can read leads tied to their runs
-- =========================================================================

DROP POLICY IF EXISTS "authenticated read leads" ON public.leads;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'users read own leads') THEN
    CREATE POLICY "users read own leads"
      ON public.leads FOR SELECT TO authenticated
      USING (
        run_id IN (
          SELECT run_id FROM public.runs WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename = 'leads' AND policyname = 'service role leads full access') THEN
    CREATE POLICY "service role leads full access"
      ON public.leads FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- =========================================================================
-- INDEXES
-- =========================================================================

CREATE INDEX IF NOT EXISTS runs_user_id_idx ON public.runs(user_id);
CREATE INDEX IF NOT EXISTS runs_status_idx  ON public.runs(status);
CREATE INDEX IF NOT EXISTS leads_run_id_idx ON public.leads(run_id);
