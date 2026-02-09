
-- Add vip_approved flag to beta_waitlist
ALTER TABLE public.beta_waitlist ADD COLUMN vip_approved boolean NOT NULL DEFAULT false;

-- Update handle_new_user to auto-assign VIP role if email is pre-approved
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, credits)
  VALUES (NEW.id, NEW.email, 0);

  -- Auto-assign VIP if email was pre-approved in waitlist
  IF EXISTS (
    SELECT 1 FROM public.beta_waitlist
    WHERE lower(email) = lower(NEW.email)
      AND vip_approved = true
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'vip');
  END IF;

  RETURN NEW;
END;
$$;
