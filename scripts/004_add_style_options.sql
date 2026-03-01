-- Add style_options column to resume_history table
ALTER TABLE resume_history 
ADD COLUMN IF NOT EXISTS style_options JSONB DEFAULT '{}';
