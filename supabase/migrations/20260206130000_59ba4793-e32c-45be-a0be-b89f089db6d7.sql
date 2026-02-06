-- Create atomic credit deduction function with row-level locking
-- This prevents race conditions by checking and deducting credits atomically
CREATE OR REPLACE FUNCTION public.deduct_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits int;
BEGIN
  -- Lock the row and check credits atomically
  SELECT credits INTO current_credits
  FROM profiles
  WHERE user_id = _user_id
  FOR UPDATE;
  
  -- If no profile found or insufficient credits, return false
  IF current_credits IS NULL OR current_credits < 1 THEN
    RETURN false;
  END IF;
  
  -- Deduct the credit
  UPDATE profiles
  SET credits = credits - 1, updated_at = now()
  WHERE user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Add a check constraint to prevent negative credits (defense in depth)
ALTER TABLE profiles ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);