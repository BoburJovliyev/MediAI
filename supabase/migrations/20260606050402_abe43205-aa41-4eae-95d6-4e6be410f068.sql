-- 1. chat-media bucket storage RLS policies
DROP POLICY IF EXISTS "chat-media owner can upload" ON storage.objects;
DROP POLICY IF EXISTS "chat-media owner can update" ON storage.objects;
DROP POLICY IF EXISTS "chat-media owner can delete" ON storage.objects;
DROP POLICY IF EXISTS "chat-media participants can view" ON storage.objects;

CREATE POLICY "chat-media owner can upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "chat-media owner can update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-media' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "chat-media owner can delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "chat-media participants can view"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media' AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.chat_messages m
      WHERE (m.file_url = storage.objects.name OR m.image_url = storage.objects.name)
        AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.group_messages gm
      WHERE (gm.file_url = storage.objects.name OR gm.image_url = storage.objects.name)
        AND public.is_group_member(gm.group_id, auth.uid())
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- 2. doctor_patients: require an accepted invitation for patient-initiated links
DROP POLICY IF EXISTS "Patients can insert relationship" ON public.doctor_patients;
CREATE POLICY "Patients can insert relationship"
ON public.doctor_patients FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = patient_id
  AND EXISTS (
    SELECT 1 FROM public.patient_invitations pi
    WHERE pi.doctor_id = doctor_patients.doctor_id
      AND pi.patient_user_id = doctor_patients.patient_id
      AND pi.status = 'accepted'
  )
);

-- 3. activity_log: restrict inserts to admins only
DROP POLICY IF EXISTS "Authenticated users can log activity" ON public.activity_log;
CREATE POLICY "Admins can log activity"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND user_id IS NOT NULL);

-- 4. Revoke EXECUTE on SECURITY DEFINER functions from anon/public
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon, public;', r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role;', r.proname, r.args);
  END LOOP;
END $$;