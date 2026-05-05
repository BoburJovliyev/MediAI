
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

UPDATE storage.buckets SET public = true WHERE id = 'chat-files';
