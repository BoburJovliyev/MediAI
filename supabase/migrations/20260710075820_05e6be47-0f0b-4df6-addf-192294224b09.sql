-- 1. Restrict doctor_availability reads so location details aren't exposed to every authenticated user.
DROP POLICY IF EXISTS "Anyone authenticated can view availability" ON public.doctor_availability;

CREATE POLICY "Owner or admin can view availability"
ON public.doctor_availability
FOR SELECT
TO authenticated
USING (auth.uid() = doctor_id OR public.is_admin_user(auth.uid()));

-- Patients browse availability through a controlled function (returns slots for a doctor/date).
CREATE OR REPLACE FUNCTION public.get_doctor_availability(_doctor_id uuid, _day date)
RETURNS TABLE(
  id uuid,
  doctor_id uuid,
  available_date date,
  start_time time without time zone,
  end_time time without time zone,
  slot_minutes integer,
  location_name text,
  location_address text,
  location_coords text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT da.id, da.doctor_id, da.available_date, da.start_time, da.end_time,
         da.slot_minutes, da.location_name, da.location_address, da.location_coords
  FROM public.doctor_availability da
  WHERE da.doctor_id = _doctor_id
    AND (_day IS NULL OR da.available_date = _day);
$$;

REVOKE ALL ON FUNCTION public.get_doctor_availability(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_doctor_availability(uuid, date) TO authenticated;

-- 2. Harden patient_invitations INSERT so doctors cannot forge accepted invitations or invite non-users.
DROP POLICY IF EXISTS "Doctors can insert their own invitations" ON public.patient_invitations;

CREATE POLICY "Doctors can insert their own invitations"
ON public.patient_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = doctor_id
  AND public.has_role(auth.uid(), 'doctor'::app_role)
  AND status = 'pending'
  AND patient_user_id <> doctor_id
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = patient_user_id)
);