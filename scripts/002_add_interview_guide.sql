-- Add interview_guide_pdf column to resume_history table
ALTER TABLE public.resume_history
ADD COLUMN IF NOT EXISTS interview_guide_pdf TEXT;

-- Add model column to track which AI model was used
ALTER TABLE public.resume_history
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini-3-flash-preview';
