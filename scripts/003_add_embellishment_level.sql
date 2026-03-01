-- Add embellishment_level column to resume_history table
ALTER TABLE resume_history ADD COLUMN IF NOT EXISTS embellishment_level INTEGER DEFAULT 5;
