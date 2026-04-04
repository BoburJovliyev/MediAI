
-- Update handle_new_user to also save specialty
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, email, specialty)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'user_role', 'user'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'specialty'
  );
  RETURN NEW;
END;
$$;

-- Fix the overly permissive INSERT policy on contact_submissions
-- It's intentionally public (anyone can submit contact form without login), which is correct
-- No change needed for that one

-- Add daily_ai_usage column to profiles for tracking daily AI limit
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_ai_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS daily_ai_date date NOT NULL DEFAULT CURRENT_DATE;
