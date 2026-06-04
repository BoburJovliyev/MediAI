CREATE TABLE public.call_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL,
  caller_id UUID NOT NULL,
  callee_id UUID,
  group_id UUID,
  caller_name TEXT,
  callee_name TEXT,
  status TEXT NOT NULL DEFAULT 'ringing',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  connected_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_logs TO authenticated;
GRANT ALL ON public.call_logs TO service_role;

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their calls"
ON public.call_logs FOR SELECT
TO authenticated
USING (
  auth.uid() = caller_id
  OR auth.uid() = callee_id
  OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);

CREATE POLICY "Caller can create call logs"
ON public.call_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Participants can update their calls"
ON public.call_logs FOR UPDATE
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE TRIGGER update_call_logs_updated_at
BEFORE UPDATE ON public.call_logs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;