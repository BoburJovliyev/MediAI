
-- 1. Restrict health-data tables to authenticated users only
DROP POLICY IF EXISTS "Users manage own diagnoses" ON public.diagnoses;
CREATE POLICY "Users manage own diagnoses" ON public.diagnoses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own patients" ON public.patients;
CREATE POLICY "Users manage own patients" ON public.patients
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own rehab sessions" ON public.rehab_sessions;
CREATE POLICY "Users manage own rehab sessions" ON public.rehab_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own scans" ON public.scan_analyses;
CREATE POLICY "Users manage own scans" ON public.scan_analyses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Restrict chat file uploads to the uploader's own folder
DROP POLICY IF EXISTS "Authenticated users can upload chat files" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-files'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 3. Revoke anon EXECUTE on SECURITY DEFINER functions (keep authenticated/service_role)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public;', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role;', r.sig);
  END LOOP;
END $$;
