
-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', true);

-- Allow authenticated users to upload to chat-files
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-files');
