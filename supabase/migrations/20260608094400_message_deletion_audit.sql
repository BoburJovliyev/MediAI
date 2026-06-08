CREATE TABLE IF NOT EXISTS message_deletion_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message_text text,
  image_url text,
  file_url text,
  file_name text,
  deleted_by uuid NOT NULL,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

-- Only admin/service role can read
ALTER TABLE message_deletion_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_only_audit" ON message_deletion_audit
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Trigger: log before delete
CREATE OR REPLACE FUNCTION log_message_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_deletion_audit (message_id, sender_id, receiver_id, message_text, image_url, file_url, file_name, deleted_by)
  VALUES (OLD.id, OLD.sender_id, OLD.receiver_id, OLD.message, OLD.image_url, OLD.file_url, OLD.file_name, auth.uid());
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to allow rerunning
DROP TRIGGER IF EXISTS trg_audit_message_delete ON chat_messages;

CREATE TRIGGER trg_audit_message_delete
  BEFORE DELETE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION log_message_deletion();
