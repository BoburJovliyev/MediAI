DROP VIEW IF EXISTS public.doctor_directory;

CREATE OR REPLACE FUNCTION public.get_public_doctors()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  specialty text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url, p.specialty
  FROM public.profiles p
  WHERE p.role = 'doctor'
    AND NOT public.is_admin_user(p.user_id)
    AND p.is_blocked = false;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_doctors() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_doctors() TO authenticated;