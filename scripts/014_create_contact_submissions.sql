-- Create contact_submissions table to store form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Service role can read contact submissions" ON public.contact_submissions;

-- Create policies
-- Allow anyone to submit a contact form
CREATE POLICY "Allow public insert contact submissions"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only service role can read contact submissions (for admin purposes)
CREATE POLICY "Service role can read contact submissions"
ON public.contact_submissions
FOR SELECT
TO service_role
USING (true);

-- Create index on created_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
ON public.contact_submissions(created_at DESC);
