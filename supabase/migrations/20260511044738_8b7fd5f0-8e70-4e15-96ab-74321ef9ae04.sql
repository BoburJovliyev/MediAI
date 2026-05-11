
-- doctor_groups
CREATE TABLE public.doctor_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  avatar_url text,
  specialty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_groups ENABLE ROW LEVEL SECURITY;

-- group_members
CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.doctor_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_user ON public.group_members(user_id);
CREATE INDEX idx_group_members_group ON public.group_members(group_id);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- group_messages
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.doctor_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  message text,
  image_url text,
  file_url text,
  file_name text,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_messages_group_created ON public.group_messages(group_id, created_at DESC);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages REPLICA IDENTITY FULL;

-- Helper: is user a member of a group (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.doctor_groups WHERE id = _group_id AND doctor_id = _user_id
  );
$$;

-- RLS: doctor_groups
CREATE POLICY "Members and owner can view group"
ON public.doctor_groups FOR SELECT TO authenticated
USING (
  doctor_id = auth.uid()
  OR public.is_group_member(id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctor can update own group"
ON public.doctor_groups FOR UPDATE TO authenticated
USING (doctor_id = auth.uid());

CREATE POLICY "Doctor can insert own group"
ON public.doctor_groups FOR INSERT TO authenticated
WITH CHECK (doctor_id = auth.uid());

-- RLS: group_members
CREATE POLICY "Members and doctor view membership"
ON public.group_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.doctor_groups g WHERE g.id = group_id AND g.doctor_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctor can manage members"
ON public.group_members FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.doctor_groups g WHERE g.id = group_id AND g.doctor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_groups g WHERE g.id = group_id AND g.doctor_id = auth.uid()));

-- RLS: group_messages
CREATE POLICY "Group members view messages"
ON public.group_messages FOR SELECT TO authenticated
USING (
  public.is_group_member(group_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only doctor can post"
ON public.group_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.doctor_groups g WHERE g.id = group_id AND g.doctor_id = auth.uid())
);

CREATE POLICY "Doctor can update own messages"
ON public.group_messages FOR UPDATE TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Doctor can delete own messages"
ON public.group_messages FOR DELETE TO authenticated
USING (sender_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Trigger: auto-create group when a doctor profile is created/updated
CREATE OR REPLACE FUNCTION public.ensure_doctor_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _name text;
BEGIN
  IF NEW.role = 'doctor' AND NOT public.is_admin_user(NEW.user_id) THEN
    _name := 'Dr. ' || COALESCE(NEW.full_name, 'Shifokor');
    IF NEW.specialty IS NOT NULL THEN
      _name := _name || ' — ' || NEW.specialty;
    END IF;
    INSERT INTO public.doctor_groups (doctor_id, name, avatar_url, specialty)
    VALUES (NEW.user_id, _name, NEW.avatar_url, NEW.specialty)
    ON CONFLICT (doctor_id) DO UPDATE
      SET name = EXCLUDED.name,
          avatar_url = EXCLUDED.avatar_url,
          specialty = EXCLUDED.specialty,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ensure_doctor_group
AFTER INSERT OR UPDATE OF role, full_name, specialty, avatar_url ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.ensure_doctor_group();

-- Trigger: auto-add patient to doctor's group when doctor_patients row inserted
CREATE OR REPLACE FUNCTION public.auto_add_to_doctor_group()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _group_id uuid;
BEGIN
  IF public.is_admin_user(NEW.patient_id) OR public.is_admin_user(NEW.doctor_id) THEN
    RETURN NEW;
  END IF;
  SELECT id INTO _group_id FROM public.doctor_groups WHERE doctor_id = NEW.doctor_id;
  IF _group_id IS NULL THEN
    INSERT INTO public.doctor_groups (doctor_id, name)
    SELECT NEW.doctor_id,
           'Dr. ' || COALESCE(p.full_name, 'Shifokor') ||
             CASE WHEN p.specialty IS NOT NULL THEN ' — ' || p.specialty ELSE '' END
    FROM public.profiles p WHERE p.user_id = NEW.doctor_id
    RETURNING id INTO _group_id;
  END IF;
  IF _group_id IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id)
    VALUES (_group_id, NEW.patient_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_add_to_doctor_group
AFTER INSERT ON public.doctor_patients
FOR EACH ROW EXECUTE FUNCTION public.auto_add_to_doctor_group();

-- Backfill: create groups for existing doctors
INSERT INTO public.doctor_groups (doctor_id, name, avatar_url, specialty)
SELECT p.user_id,
       'Dr. ' || COALESCE(p.full_name, 'Shifokor') ||
         CASE WHEN p.specialty IS NOT NULL THEN ' — ' || p.specialty ELSE '' END,
       p.avatar_url,
       p.specialty
FROM public.profiles p
WHERE p.role = 'doctor' AND NOT public.is_admin_user(p.user_id)
ON CONFLICT (doctor_id) DO NOTHING;

-- Backfill members from doctor_patients
INSERT INTO public.group_members (group_id, user_id)
SELECT g.id, dp.patient_id
FROM public.doctor_patients dp
JOIN public.doctor_groups g ON g.doctor_id = dp.doctor_id
WHERE NOT public.is_admin_user(dp.patient_id)
ON CONFLICT DO NOTHING;

-- Update trigger
CREATE TRIGGER trg_doctor_groups_updated
BEFORE UPDATE ON public.doctor_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_group_messages_updated
BEFORE UPDATE ON public.group_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
