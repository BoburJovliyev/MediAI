ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_coords text;

ALTER TABLE public.doctor_availability
  ADD COLUMN IF NOT EXISTS available_date date,
  ADD COLUMN IF NOT EXISTS location_name text,
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_coords text;