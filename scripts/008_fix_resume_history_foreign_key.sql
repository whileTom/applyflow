-- Migration: Fix resume_history foreign key to reference auth.users instead of public.users
-- This resolves the foreign key constraint violation error

-- Drop the incorrect foreign key constraint if it exists
ALTER TABLE public.resume_history 
DROP CONSTRAINT IF EXISTS resume_history_user_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE public.resume_history 
ADD CONSTRAINT resume_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint is correct
DO $$ 
BEGIN
  RAISE NOTICE 'Foreign key constraint updated successfully';
  RAISE NOTICE 'resume_history.user_id now references auth.users(id)';
END $$;
