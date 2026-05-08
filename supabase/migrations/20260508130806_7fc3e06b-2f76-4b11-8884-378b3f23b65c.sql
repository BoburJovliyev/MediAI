CREATE OR REPLACE FUNCTION public.get_admin_user_ids()
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_user_ids() TO anon, authenticated;