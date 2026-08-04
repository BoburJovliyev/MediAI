CREATE TABLE IF NOT EXISTS public.food_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  dish_name TEXT NOT NULL DEFAULT '',
  meal_type TEXT NOT NULL DEFAULT 'tushlik',
  total_calories NUMERIC NOT NULL DEFAULT 0,
  protein_g NUMERIC NOT NULL DEFAULT 0,
  fat_g NUMERIC NOT NULL DEFAULT 0,
  carbs_g NUMERIC NOT NULL DEFAULT 0,
  fiber_g NUMERIC NOT NULL DEFAULT 0,
  sugar_g NUMERIC NOT NULL DEFAULT 0,
  sodium_mg NUMERIC NOT NULL DEFAULT 0,
  health_score NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'norm',
  daily_percent NUMERIC NOT NULL DEFAULT 0,
  verdict TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.food_logs TO authenticated;
GRANT ALL ON public.food_logs TO service_role;

ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own food logs" ON public.food_logs;
CREATE POLICY "Users manage own food logs" ON public.food_logs
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS food_logs_user_created_idx ON public.food_logs (user_id, created_at DESC);