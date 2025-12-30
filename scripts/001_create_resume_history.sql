-- Create resume_history table to track all optimization requests
CREATE TABLE IF NOT EXISTS public.resume_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_description TEXT NOT NULL,
  generated_resume_docx TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to ensure only one record per job_title + company_name combination
  CONSTRAINT unique_job_company UNIQUE (job_title, company_name)
);

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_resume_history_created_at ON public.resume_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_history_job_title ON public.resume_history(job_title);
CREATE INDEX IF NOT EXISTS idx_resume_history_company_name ON public.resume_history(company_name);

-- Enable public access (no RLS needed since this is a single-user app with no auth)
ALTER TABLE public.resume_history DISABLE ROW LEVEL SECURITY;
