
-- Add 'patient' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'patient';

-- Doctor-patient relationship table
CREATE TABLE public.doctor_patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, patient_id)
);
ALTER TABLE public.doctor_patients ENABLE ROW LEVEL SECURITY;

-- Chat messages table (Telegram-like)
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  message text,
  image_url text,
  file_url text,
  file_name text,
  reply_to uuid REFERENCES public.chat_messages(id),
  forwarded_from uuid REFERENCES public.chat_messages(id),
  is_read boolean NOT NULL DEFAULT false,
  is_edited boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- RLS: doctor_patients
CREATE POLICY "Users can view own relationships" ON public.doctor_patients
FOR SELECT TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Patients can insert relationship" ON public.doctor_patients
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Admins can view all relationships" ON public.doctor_patients
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS: chat_messages - only sender/receiver can see
CREATE POLICY "Users can view own messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.chat_messages
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages" ON public.chat_messages
FOR UPDATE TO authenticated
USING (auth.uid() = sender_id);

CREATE POLICY "Admins can view all messages" ON public.chat_messages
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Profiles: admins can view all (already exists), but let's also let patients see doctor profiles
CREATE POLICY "Patients can view doctor profiles" ON public.profiles
FOR SELECT TO authenticated
USING (role = 'doctor');
