
-- Step 1: Update default credits to 1
ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 1;

-- Step 2: Update handle_new_user trigger to always give 1 credit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile: always give 1 free credit on signup
  INSERT INTO public.profiles (user_id, email, credits)
  VALUES (NEW.id, NEW.email, 1);

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

-- Step 3: Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Add RLS policy for storage bucket user-car-photos (INSERT)
CREATE POLICY "Users can upload their own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-car-photos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Step 5: Add RLS policy for storage bucket user-car-photos (SELECT)
CREATE POLICY "Anyone can view car photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'user-car-photos');
