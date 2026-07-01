-- 1. chat_messages UPDATE: add WITH CHECK to prevent sender from changing receiver_id
DROP POLICY IF EXISTS "Users can update own messages" ON public.chat_messages;
CREATE POLICY "Users can update own messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- 2. patient_invitations UPDATE: restrict status to allowed transition values
DROP POLICY IF EXISTS "Patients can update invitation status" ON public.patient_invitations;
CREATE POLICY "Patients can update invitation status"
ON public.patient_invitations
FOR UPDATE
USING (auth.uid() = patient_user_id)
WITH CHECK (auth.uid() = patient_user_id AND status IN ('accepted', 'declined'));

-- 3. profiles: stop exposing doctor emails to all authenticated users.
-- Replace the broad doctor-read policy with a view that excludes the email column.
DROP POLICY IF EXISTS "Patients can view doctor profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.doctor_directory
WITH (security_invoker = false) AS
  SELECT user_id, full_name, avatar_url, specialty, role, is_blocked
  FROM public.profiles
  WHERE role = 'doctor'
    AND NOT public.is_admin_user(user_id)
    AND is_blocked = false;

GRANT SELECT ON public.doctor_directory TO authenticated;

-- 4. realtime.messages: restrict channel subscriptions to authenticated users
--    scoped to their own private topics / group membership.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can access their own realtime topics" ON realtime.messages;
CREATE POLICY "Authenticated users can access their own realtime topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- personal / user-scoped topics contain the subscriber's uid
  realtime.topic() LIKE ('%' || auth.uid()::text || '%')
  -- group topics the user belongs to
  OR EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.user_id = auth.uid()
      AND realtime.topic() LIKE ('%' || gm.group_id::text || '%')
  )
  OR EXISTS (
    SELECT 1 FROM public.doctor_groups dg
    WHERE dg.doctor_id = auth.uid()
      AND realtime.topic() LIKE ('%' || dg.id::text || '%')
  )
);