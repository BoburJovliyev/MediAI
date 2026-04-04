
CREATE OR REPLACE FUNCTION public.search_users_by_email(search_email text)
RETURNS SETOF profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.* FROM public.profiles p
  WHERE p.email ILIKE '%' || search_email || '%'
  AND p.is_blocked = false
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'admin'
  )
  LIMIT 10;
$$;
