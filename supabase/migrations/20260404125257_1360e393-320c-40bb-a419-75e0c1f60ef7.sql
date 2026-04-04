
-- Delete all data for non-admin users
DELETE FROM public.chat_messages WHERE sender_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36' OR receiver_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.doctor_patients WHERE doctor_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36' AND patient_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.notifications WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.activity_log WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.diagnoses WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.scan_analyses WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.rehab_sessions WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.patients WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.user_roles WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';
DELETE FROM public.profiles WHERE user_id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';

-- Delete non-admin users from auth
DELETE FROM auth.users WHERE id != 'ee498862-0c20-4577-93ab-51da2ac9ef36';

-- Also add specialty column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty text;
