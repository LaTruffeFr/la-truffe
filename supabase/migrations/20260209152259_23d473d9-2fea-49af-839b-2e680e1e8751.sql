
-- Update handle_new_user to give 1 credit only to first 20 users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_count int;
  max_beta_users constant int := 20;
BEGIN
  -- Count existing profiles
  SELECT count(*) INTO current_count FROM public.profiles;

  -- Create profile with 1 credit if under limit, 0 otherwise
  INSERT INTO public.profiles (user_id, email, credits)
  VALUES (NEW.id, NEW.email, CASE WHEN current_count < max_beta_users THEN 1 ELSE 0 END);

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
$function$;

-- Create a function to get the beta spots count (callable from frontend)
CREATE OR REPLACE FUNCTION public.get_beta_spots_remaining()
 RETURNS int
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT GREATEST(0, 20 - (SELECT count(*)::int FROM public.profiles));
$function$;
