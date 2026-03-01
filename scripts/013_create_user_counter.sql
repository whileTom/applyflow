-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_user_counter_on_view();

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Allow public read access to user counter" ON public.user_counter;
DROP POLICY IF EXISTS "Allow service role to update user counter" ON public.user_counter;
DROP POLICY IF EXISTS "Allow function to update user counter" ON public.user_counter;

-- Create user counter table
CREATE TABLE IF NOT EXISTS public.user_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER NOT NULL DEFAULT 2242,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Add page_views column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_counter' 
    AND column_name = 'page_views'
  ) THEN
    ALTER TABLE public.user_counter ADD COLUMN page_views INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Insert initial row with starting count of 2242
INSERT INTO public.user_counter (id, count, page_views, last_updated)
VALUES (1, 2242, 0, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create function with SECURITY DEFINER to run with creator's permissions
CREATE OR REPLACE FUNCTION increment_user_counter_on_view()
RETURNS TABLE(count INTEGER, page_views INTEGER) 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_page_views INTEGER;
  new_count INTEGER;
  random_increment INTEGER;
BEGIN
  -- Generate random increment between 1 and 3
  random_increment := floor(random() * 3 + 1)::INTEGER;
  
  -- Increment page views and user count by random amount
  UPDATE public.user_counter
  SET page_views = user_counter.page_views + 1,
      count = user_counter.count + random_increment,
      last_updated = NOW()
  WHERE id = 1
  RETURNING user_counter.count, user_counter.page_views INTO new_count, new_page_views;
  
  RETURN QUERY SELECT new_count, new_page_views;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on the user_counter table for security
ALTER TABLE public.user_counter ENABLE ROW LEVEL SECURITY;

-- Create RLS policy allowing everyone to read the counter
CREATE POLICY "Allow public read access to user counter"
ON public.user_counter
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow UPDATE only from the function (which runs as SECURITY DEFINER)
CREATE POLICY "Allow function to update user counter"
ON public.user_counter
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.user_counter TO anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_user_counter_on_view TO anon, authenticated;
