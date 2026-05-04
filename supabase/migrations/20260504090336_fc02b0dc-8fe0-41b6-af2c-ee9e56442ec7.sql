DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit valid contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(full_name)) BETWEEN 2 AND 100
    AND length(trim(email)) BETWEEN 5 AND 200
    AND email LIKE '%_@__%.__%'
    AND length(trim(message)) BETWEEN 5 AND 4000
  );