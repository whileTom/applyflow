-- Added DROP FUNCTION to avoid "cannot change return type" error
DROP FUNCTION IF EXISTS public.decrement_credits(UUID);

-- Function to decrement credits for non-pro users
CREATE OR REPLACE FUNCTION public.decrement_credits(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  UPDATE public.user_profiles 
  SET 
    credits_remaining = GREATEST(0, credits_remaining - 1),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING credits_remaining INTO v_credits;
  
  RETURN v_credits;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_credits(UUID) TO authenticated;
