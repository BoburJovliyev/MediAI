-- Add location_coords to appointments for Google Maps navigation
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS location_coords text;
