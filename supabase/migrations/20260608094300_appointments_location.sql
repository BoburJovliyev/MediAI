-- Add location fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_name text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location_address text;

-- Update existing records if needed (optional)
-- UPDATE appointments SET location_name = 'Asosiy poliklinika', location_address = 'Toshkent sh., Yunusobod tumani' WHERE location_name IS NULL;
