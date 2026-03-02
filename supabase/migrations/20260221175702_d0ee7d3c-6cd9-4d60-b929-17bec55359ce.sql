-- Add RLS policy: owners can update their own listings
CREATE POLICY "Owners can update their listings"
ON public.cars
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add RLS policy: owners can delete their own listings
CREATE POLICY "Owners can delete their listings"
ON public.cars
FOR DELETE
USING (auth.uid() = user_id);

-- Tighten INSERT policy to set user_id
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.cars;
CREATE POLICY "Authenticated users can create listings"
ON public.cars
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
