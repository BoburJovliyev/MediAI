
-- Allow doctors to view profiles of users connected through doctor_patients or patient_invitations
CREATE POLICY "Doctors can view related patient profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.doctor_patients dp WHERE dp.doctor_id = auth.uid() AND dp.patient_id = profiles.user_id)
  OR EXISTS (SELECT 1 FROM public.patient_invitations pi WHERE pi.doctor_id = auth.uid() AND pi.patient_user_id = profiles.user_id)
);

-- Aggregate function for public doctor patient counts
CREATE OR REPLACE FUNCTION public.get_doctor_patient_counts()
RETURNS TABLE(doctor_id uuid, patient_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT doctor_id, count(*)::bigint AS patient_count
  FROM public.doctor_patients
  GROUP BY doctor_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_doctor_patient_counts() TO anon, authenticated;
