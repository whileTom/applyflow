-- Sync existing users from 'users' table to 'user_profiles' table
-- This is a one-time migration to ensure all users have profiles

INSERT INTO user_profiles (id, email, full_name, credits_remaining, subscription_status, stripe_customer_id, default_resume_url, google_api_key, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.full_name,
  COALESCE(u.credits_remaining, 3),
  COALESCE(u.subscription_status, 'free'),
  u.stripe_customer_id,
  u.default_resume_url,
  u.google_api_key,
  COALESCE(u.created_at, now()),
  now()
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = u.id
);

-- Create a trigger to automatically create user_profiles when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, credits_remaining, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    3,
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
