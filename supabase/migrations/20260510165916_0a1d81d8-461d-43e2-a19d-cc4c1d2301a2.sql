-- Allow receivers to mark messages as read (update is_read / read_at)
CREATE POLICY "Receivers can mark as read"
ON public.chat_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Ensure realtime broadcasts full row on UPDATE so sender sees is_read flip
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;