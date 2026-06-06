-- Allow senders (and admins) to permanently delete their own direct chat messages.
-- Telegram-style "delete for everyone" requires a real DELETE, leaving no trace.
CREATE POLICY "Senders can delete own messages"
ON public.chat_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure DELETE realtime events carry the row id for client-side removal.
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;