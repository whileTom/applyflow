-- Migration: Add user_id to resume_history and update unique constraint
-- This makes history user-specific instead of globally shared

-- Add user_id column if it doesn't exist
ALTER TABLE public.resume_history 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old unique constraint (job_title + company_name only)
ALTER TABLE public.resume_history 
DROP CONSTRAINT IF EXISTS unique_job_company;

-- Create new unique constraint per user (user_id + job_title + company_name)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_job_company'
  ) THEN
    ALTER TABLE public.resume_history 
    ADD CONSTRAINT unique_user_job_company UNIQUE (user_id, job_title, company_name);
  END IF;
END $$;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_resume_history_user_id ON public.resume_history(user_id);

-- Enable Row Level Security
ALTER TABLE public.resume_history ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can read own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can insert own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can update own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can delete own resume history" ON public.resume_history;

-- Create RLS policies for user isolation
CREATE POLICY "Users can read own resume history" 
ON public.resume_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume history" 
ON public.resume_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resume history" 
ON public.resume_history FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resume history" 
ON public.resume_history FOR DELETE 
USING (auth.uid() = user_id);
