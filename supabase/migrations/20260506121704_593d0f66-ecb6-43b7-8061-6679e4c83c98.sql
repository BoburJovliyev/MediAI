
DROP TRIGGER IF EXISTS trg_handle_invitation_accept ON public.patient_invitations;
CREATE TRIGGER trg_handle_invitation_accept
AFTER UPDATE ON public.patient_invitations
FOR EACH ROW
EXECUTE FUNCTION public.handle_invitation_accept();

DROP TRIGGER IF EXISTS trg_notify_new_invitation ON public.patient_invitations;
CREATE TRIGGER trg_notify_new_invitation
AFTER INSERT ON public.patient_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_invitation();

-- Backfill: for any already-accepted invitations, ensure relationship exists
INSERT INTO public.doctor_patients (doctor_id, patient_id)
SELECT doctor_id, patient_user_id FROM public.patient_invitations WHERE status = 'accepted'
ON CONFLICT DO NOTHING;
