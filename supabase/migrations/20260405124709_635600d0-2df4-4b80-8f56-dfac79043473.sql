CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role_text text;
  _app_role public.app_role;
BEGIN
  _role_text := COALESCE(NEW.raw_user_meta_data ->> 'user_role', 'user');

  IF _role_text IN ('admin', 'moderator', 'user', 'doctor', 'patient') THEN
    _app_role := _role_text::public.app_role;
  ELSE
    _app_role := 'user'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;