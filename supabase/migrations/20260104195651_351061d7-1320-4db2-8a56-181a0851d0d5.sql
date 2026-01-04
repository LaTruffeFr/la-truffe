-- Add owner-specific RLS policies for garages table

-- Allow garage owners to update their garage
CREATE POLICY "Owners can update their garage"
ON public.garages
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Allow users to create garages (they become owner)
CREATE POLICY "Users can create garages"
ON public.garages
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Allow garage owners to delete their garage
CREATE POLICY "Owners can delete their garage"
ON public.garages
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());