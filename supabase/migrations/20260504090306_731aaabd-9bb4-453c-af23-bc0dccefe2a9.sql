-- 1) Lock down SECURITY DEFINER functions: revoke from public/anon
REVOKE EXECUTE ON FUNCTION public.handle_invitation_accept() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_invitation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_email() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_users_by_email(text) FROM PUBLIC, anon;

-- has_role and search_users_by_email need to be callable from the client by signed-in users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_users_by_email(text) TO authenticated;

-- update_updated_at_column is a generic trigger helper; not security definer concern, but lock anyway
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 2) Tighten profile search: replace permissive "true" SELECT policy with limited access
DROP POLICY IF EXISTS "Users can search profiles by email" ON public.profiles;
-- (search_users_by_email RPC handles email-based discovery securely as SECURITY DEFINER)

-- 3) Lock down chat-files storage bucket: require auth, deny public anon listing
DROP POLICY IF EXISTS "Anyone can view chat files" ON storage.objects;
CREATE POLICY "Authenticated users can view chat files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'chat-files');

-- Make bucket non-public so unauthenticated requests cannot list/read
UPDATE storage.buckets SET public = false WHERE id = 'chat-files';