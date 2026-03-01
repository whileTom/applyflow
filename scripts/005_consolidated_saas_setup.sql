-- ============================================
-- ApplyFlow SaaS Setup - Consolidated Migration
-- Run this script to set up all SaaS features
-- ============================================

-- 1. Ensure user_id column exists on resume_history
ALTER TABLE public.resume_history 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Drop old constraint and add new user-scoped one
ALTER TABLE public.resume_history 
DROP CONSTRAINT IF EXISTS unique_job_company;

ALTER TABLE public.resume_history 
DROP CONSTRAINT IF EXISTS unique_user_job_company;

ALTER TABLE public.resume_history 
ADD CONSTRAINT unique_user_job_company UNIQUE (user_id, job_title, company_name);

-- 3. Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_resume_history_user_id ON public.resume_history(user_id);

-- 4. Enable RLS on resume_history
ALTER TABLE public.resume_history ENABLE ROW LEVEL SECURITY;

-- 5. Drop and recreate RLS policies for resume_history
DROP POLICY IF EXISTS "Users can read own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can insert own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can update own resume history" ON public.resume_history;
DROP POLICY IF EXISTS "Users can delete own resume history" ON public.resume_history;

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

-- ============================================
-- User Profiles Table
-- ============================================

-- 6. Create user_profiles table if not exists
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  -- User's default resume URL (replaces Google Drive hardcode)
  default_resume_url TEXT,
  -- Custom Google AI Studio API key (optional)
  google_api_key TEXT,
  -- Stripe integration
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'pro', 'enterprise', 'cancelled')),
  subscription_id TEXT,
  -- Credits system for pay-as-you-go
  credits_remaining INTEGER DEFAULT 3,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer ON public.user_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON public.user_profiles(subscription_status);

-- 8. Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 9. Drop and recreate RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can read own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ============================================
-- Auto-create profile on user signup
-- ============================================

-- 10. Create trigger function for new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.user_profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.user_profiles.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- 11. Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
