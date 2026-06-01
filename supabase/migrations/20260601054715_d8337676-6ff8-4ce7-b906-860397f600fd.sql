-- 1. activity_log: prevent forging NULL user_id rows
DROP POLICY IF EXISTS "Authenticated users can log activity" ON public.activity_log;
CREATE POLICY "Authenticated users can log activity"
ON public.activity_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 2. notifications: restrict inserts to admins only.
-- System notifications are created by SECURITY DEFINER trigger functions which bypass RLS,
-- so regular users no longer need direct INSERT access.
DROP POLICY IF EXISTS "Admins can insert notifications for anyone" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. doctor_patients: allow either side to terminate the relationship
CREATE POLICY "Doctor or patient can delete relationship"
ON public.doctor_patients
FOR DELETE
TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

-- 4. chat-files: explicit DELETE policy scoped to the file owner's folder
CREATE POLICY "Owners can delete their chat files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. Reduce SECURITY DEFINER exposure: revoke EXECUTE from anon/public on
-- internal helper & trigger functions so anonymous clients cannot call them.
REVOKE EXECUTE ON FUNCTION public.notify_new_invitation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_invitation_accept() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_doctor_group() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.sync_user_email() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.auto_add_to_doctor_group() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_admin_user(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_ids() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_doctor_patient_counts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.search_users_by_email(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_admin_access_attempt(text, uuid, jsonb) FROM anon, public;

-- Re-grant EXECUTE to authenticated for functions the app calls via RPC / RLS
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_doctor_patient_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_access_attempt(text, uuid, jsonb) TO authenticated;