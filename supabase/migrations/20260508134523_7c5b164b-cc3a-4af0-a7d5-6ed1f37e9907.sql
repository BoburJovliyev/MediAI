
-- Helper: check if a user is an admin (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'::app_role
  )
$$;

-- Tighten profiles RLS so admin profiles are invisible to non-admins
DROP POLICY IF EXISTS "Patients can view doctor profiles" ON public.profiles;
CREATE POLICY "Patients can view doctor profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  role = 'doctor'
  AND NOT public.is_admin_user(user_id)
);

DROP POLICY IF EXISTS "Doctors can view related patient profiles" ON public.profiles;
CREATE POLICY "Doctors can view related patient profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  NOT public.is_admin_user(user_id)
  AND (
    EXISTS (
      SELECT 1 FROM public.doctor_patients dp
      WHERE dp.doctor_id = auth.uid() AND dp.patient_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.patient_invitations pi
      WHERE pi.doctor_id = auth.uid() AND pi.patient_user_id = profiles.user_id
    )
  )
);

-- Update doctor patient counts to exclude admins as doctors and admins as patients
CREATE OR REPLACE FUNCTION public.get_doctor_patient_counts()
RETURNS TABLE(doctor_id uuid, patient_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.doctor_id, count(*)::bigint AS patient_count
  FROM public.doctor_patients dp
  WHERE NOT public.is_admin_user(dp.doctor_id)
    AND NOT public.is_admin_user(dp.patient_id)
  GROUP BY dp.doctor_id;
$$;

-- Reaffirm search_users_by_email excludes admins (already does, keep guard)
CREATE OR REPLACE FUNCTION public.search_users_by_email(search_email text)
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.* FROM public.profiles p
  WHERE p.email ILIKE '%' || search_email || '%'
    AND p.is_blocked = false
    AND NOT public.is_admin_user(p.user_id)
  LIMIT 10;
$$;

-- Audit function: any caller can log a stealth-admin access attempt
CREATE OR REPLACE FUNCTION public.log_admin_access_attempt(
  _entity_type text,
  _entity_id uuid,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), 'admin_access_attempt', _entity_type, _entity_id, _details);
END;
$$;
