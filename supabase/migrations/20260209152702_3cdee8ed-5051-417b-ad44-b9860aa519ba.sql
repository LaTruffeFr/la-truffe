
-- Update handle_new_user: only give 1 free credit if user's email is in beta_waitlist
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile: give 1 credit only if email was registered in beta_waitlist
  INSERT INTO public.profiles (user_id, email, credits)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.beta_waitlist WHERE lower(email) = lower(NEW.email)
    ) THEN 1 ELSE 0 END
  );

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

-- Update beta spots counter: count waitlist entries (capped at 20)
CREATE OR REPLACE FUNCTION public.get_beta_spots_remaining()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT GREATEST(0, 20 - (SELECT count(*)::int FROM public.beta_waitlist));
$function$;
