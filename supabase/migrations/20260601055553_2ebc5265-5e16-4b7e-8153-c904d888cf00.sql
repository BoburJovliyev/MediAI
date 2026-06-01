-- ============ doctor_availability ============
CREATE TABLE public.doctor_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL,
  weekday smallint NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_availability TO authenticated;
GRANT ALL ON public.doctor_availability TO service_role;

ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view availability"
ON public.doctor_availability FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Doctor manages own availability insert"
ON public.doctor_availability FOR INSERT TO authenticated
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctor manages own availability update"
ON public.doctor_availability FOR UPDATE TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctor manages own availability delete"
ON public.doctor_availability FOR DELETE TO authenticated
USING (auth.uid() = doctor_id);

-- ============ appointments ============
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor or patient view appointments"
ON public.appointments FOR SELECT TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Patient books appointment"
ON public.appointments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctor or patient update appointment"
ON public.appointments FOR UPDATE TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE POLICY "Doctor or patient delete appointment"
ON public.appointments FOR DELETE TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

CREATE TRIGGER appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ prescriptions ============
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  medication text NOT NULL,
  dosage text,
  duration text,
  instructions text,
  appointment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO authenticated;
GRANT ALL ON public.prescriptions TO service_role;

ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor or patient view prescriptions"
ON public.prescriptions FOR SELECT TO authenticated
USING (auth.uid() = doctor_id OR auth.uid() = patient_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctor writes prescription"
ON public.prescriptions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctor updates own prescription"
ON public.prescriptions FOR UPDATE TO authenticated
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctor deletes own prescription"
ON public.prescriptions FOR DELETE TO authenticated
USING (auth.uid() = doctor_id);

CREATE TRIGGER prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ notification triggers ============
CREATE OR REPLACE FUNCTION public.notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _patient_name text;
BEGIN
  SELECT full_name INTO _patient_name FROM public.profiles WHERE user_id = NEW.patient_id;
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.doctor_id,
    'Yangi qabul so''rovi',
    COALESCE(_patient_name, 'Bemor') || ' siz bilan qabulga yozildi',
    'info',
    'appointments'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_appointment
AFTER INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_new_appointment();

CREATE OR REPLACE FUNCTION public.notify_appointment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _doctor_name text;
  _msg text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT full_name INTO _doctor_name FROM public.profiles WHERE user_id = NEW.doctor_id;
    _msg := CASE NEW.status
      WHEN 'confirmed' THEN 'Qabulingiz tasdiqlandi'
      WHEN 'cancelled' THEN 'Qabulingiz bekor qilindi'
      WHEN 'completed' THEN 'Qabulingiz yakunlandi'
      ELSE 'Qabul holati o''zgardi'
    END;
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.patient_id,
      'Qabul holati',
      COALESCE(_doctor_name, 'Shifokor') || ': ' || _msg,
      CASE WHEN NEW.status = 'cancelled' THEN 'warning' WHEN NEW.status = 'confirmed' THEN 'success' ELSE 'info' END,
      'appointments'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_appointment_status
AFTER UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.notify_appointment_status();

CREATE OR REPLACE FUNCTION public.notify_new_prescription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _doctor_name text;
BEGIN
  SELECT full_name INTO _doctor_name FROM public.profiles WHERE user_id = NEW.doctor_id;
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    NEW.patient_id,
    'Yangi retsept',
    COALESCE(_doctor_name, 'Shifokor') || ' sizga yangi retsept yozdi: ' || NEW.medication,
    'success',
    'prescriptions'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_prescription
AFTER INSERT ON public.prescriptions
FOR EACH ROW EXECUTE FUNCTION public.notify_new_prescription();

-- internal trigger functions should not be executable by anon/public
REVOKE EXECUTE ON FUNCTION public.notify_new_appointment() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_appointment_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_prescription() FROM anon, public;

-- realtime
ALTER TABLE public.appointments REPLICA IDENTITY FULL;
ALTER TABLE public.prescriptions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prescriptions;