ALTER TABLE public.doctor_availability DROP COLUMN IF EXISTS weekday;
ALTER TABLE public.doctor_availability ADD COLUMN available_date date NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.doctor_availability ADD COLUMN location_name text;
ALTER TABLE public.doctor_availability ADD COLUMN location_address text;
ALTER TABLE public.doctor_availability ADD COLUMN location_coords text;
