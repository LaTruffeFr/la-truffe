
-- Allow admins to update waitlist entries (for vip_approved toggle)
CREATE POLICY "Admins can update waitlist"
ON public.beta_waitlist
FOR UPDATE
USING (is_admin(auth.uid()));
