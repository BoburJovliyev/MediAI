
-- Add email column to profiles for searchability
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Create function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Update handle_new_user to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', COALESCE(NEW.raw_user_meta_data ->> 'user_role', 'user'), NEW.email);
  RETURN NEW;
END;
$$;

-- Backfill existing profiles with emails from auth.users
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.user_id = u.id AND p.email IS NULL;

-- Create search function
CREATE OR REPLACE FUNCTION public.search_users_by_email(search_email text)
RETURNS SETOF profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT * FROM public.profiles
  WHERE email ILIKE '%' || search_email || '%'
  AND is_blocked = false
  LIMIT 10;
$$;

-- Allow authenticated users to search profiles by email
CREATE POLICY "Users can search profiles by email" ON public.profiles
FOR SELECT TO authenticated
USING (true);
