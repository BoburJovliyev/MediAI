CREATE OR REPLACE FUNCTION public.get_booked_slots(_doctor_id uuid, _day date)
RETURNS TABLE(scheduled_at timestamptz, duration_minutes integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a.scheduled_at, a.duration_minutes
  FROM public.appointments a
  WHERE a.doctor_id = _doctor_id
    AND a.status <> 'cancelled'
    AND (a.scheduled_at AT TIME ZONE 'UTC')::date = _day;
$$;

REVOKE EXECUTE ON FUNCTION public.get_booked_slots(uuid, date) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_booked_slots(uuid, date) TO authenticated;