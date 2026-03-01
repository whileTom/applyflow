-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON user_resumes;

-- Recreate policies with correct configuration
CREATE POLICY "Users can view own resumes"
  ON user_resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON user_resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON user_resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON user_resumes FOR DELETE
  USING (auth.uid() = user_id);
