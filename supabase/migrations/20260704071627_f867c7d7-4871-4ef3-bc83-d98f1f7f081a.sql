DROP POLICY IF EXISTS "Doctors can view related patient profiles" ON public.profiles;
CREATE POLICY "Doctors can view related patient profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'doctor'::app_role)
  AND (NOT public.is_admin_user(user_id))
  AND (
    EXISTS (
      SELECT 1 FROM public.doctor_patients dp
      WHERE dp.doctor_id = auth.uid() AND dp.patient_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.patient_invitations pi
      WHERE pi.doctor_id = auth.uid() AND pi.patient_user_id = profiles.user_id
    )
    OR EXISTS (
      SELECT 1 FROM public.appointments ap
      WHERE ap.doctor_id = auth.uid() AND ap.patient_id = profiles.user_id
    )
  )
);