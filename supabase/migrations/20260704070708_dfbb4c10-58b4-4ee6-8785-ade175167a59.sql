-- Fix 1: chat_messages UPDATE policy scoped to authenticated (not public/anon)
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
CREATE POLICY "Users can update own messages"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- Fix 2: restrict related-patient profile reads to users who are actually doctors,
-- so an arbitrary authenticated user cannot read another user's email by
-- establishing a relationship. Only real doctor-role users with a genuine
-- doctor_patients / patient_invitations link can read the related profile.
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
  )
);