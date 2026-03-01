-- Add google_drive_doc_id column to user_resumes table
ALTER TABLE user_resumes
ADD COLUMN IF NOT EXISTS google_drive_doc_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_resumes_doc_id 
ON user_resumes(google_drive_doc_id);

-- Add comment to document the column
COMMENT ON COLUMN user_resumes.google_drive_doc_id IS 'Google Drive document ID extracted from the shared URL';
