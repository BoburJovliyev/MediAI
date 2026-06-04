CREATE OR REPLACE FUNCTION public.record_call_status(_call_id uuid, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid;
  _callee uuid;
  _caller_name text;
  _connected timestamptz;
BEGIN
  SELECT caller_id, callee_id, caller_name, connected_at
    INTO _caller, _callee, _caller_name, _connected
  FROM public.call_logs WHERE id = _call_id;

  IF _caller IS NULL THEN RETURN; END IF;
  IF auth.uid() <> _caller AND auth.uid() <> _callee THEN RETURN; END IF;

  UPDATE public.call_logs
  SET status = _status,
      connected_at = CASE WHEN _status = 'connected' AND connected_at IS NULL THEN now() ELSE connected_at END,
      ended_at = CASE WHEN _status IN ('completed','missed','rejected') THEN now() ELSE ended_at END,
      duration_seconds = CASE
        WHEN _status = 'completed' AND connected_at IS NOT NULL
        THEN GREATEST(0, EXTRACT(EPOCH FROM (now() - connected_at))::int)
        ELSE duration_seconds END,
      updated_at = now()
  WHERE id = _call_id;

  IF _status = 'missed' AND _callee IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_callee, 'Javobsiz video qo''ng''iroq',
            COALESCE(_caller_name, 'Foydalanuvchi') || ' sizga video qo''ng''iroq qildi', 'warning', 'chat');
  ELSIF _status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (_caller, 'Qo''ng''iroq rad etildi',
            'Video qo''ng''iroq rad etildi', 'warning', 'chat');
  END IF;
END;
$$;