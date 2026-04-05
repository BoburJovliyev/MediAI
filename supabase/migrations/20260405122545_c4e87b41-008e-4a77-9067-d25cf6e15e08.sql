CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _role text;
  _app_role app_role;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data ->> 'user_role', 'user');
  
  -- Insert profile
  INSERT INTO public.profiles (user_id, full_name, role, email, specialty)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    _role,
    NEW.email,
    NEW.raw_user_meta_data ->> 'specialty'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Map role to app_role enum
  IF _role IN ('admin', 'moderator', 'user', 'doctor', 'patient') THEN
    _app_role := _role::app_role;
  ELSE
    _app_role := 'user'::app_role;
  END IF;
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _app_role)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Ensure unique constraint on user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key'
  ) THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
  END IF;
END $$;