-- Add user_id column to cars table to track seller ownership
ALTER TABLE public.cars ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for efficient user queries
CREATE INDEX idx_cars_user_id ON public.cars(user_id);

-- Drop existing non-owner-aware policies
DROP POLICY IF EXISTS "Anyone can view car listings" ON public.cars;
DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.cars;
DROP POLICY IF EXISTS "Admins can manage all cars" ON public.cars;

-- New RLS policies

-- Users can view all listings OR listings they own
CREATE POLICY "View own or public listings"
ON public.cars FOR SELECT
USING (is_user_listing = false OR auth.uid() = user_id);

-- Only authenticated users can insert
CREATE POLICY "Create own listing"
ON public.cars FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own listings
CREATE POLICY "Update own listing"
ON public.cars FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own listings
CREATE POLICY "Delete own listing"
ON public.cars FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage everything (requires is_admin function)
CREATE POLICY "Admins manage all listings"                  
ON public.cars FOR ALL                                      
USING (public.is_admin(auth.uid()));;
