-- Fix: no UPDATE policy on chat-files (also enables avatar upsert by owner)
CREATE POLICY "Owners can update their chat files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-files' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'chat-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Fix: prevent client-side role spoofing via profiles.role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin_user(auth.uid()) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();