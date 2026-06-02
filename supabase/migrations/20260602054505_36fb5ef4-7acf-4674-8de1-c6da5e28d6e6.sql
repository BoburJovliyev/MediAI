ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.toggle_pin_message(_message_id uuid, _pin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_messages
  SET is_pinned = _pin, updated_at = now()
  WHERE id = _message_id
    AND (sender_id = auth.uid() OR receiver_id = auth.uid());
END;
$$;