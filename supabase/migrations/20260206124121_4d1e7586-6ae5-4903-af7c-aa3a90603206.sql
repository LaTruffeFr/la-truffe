-- Create beta_waitlist table for collecting emails
CREATE TABLE public.beta_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public waitlist signup)
CREATE POLICY "Anyone can join waitlist"
ON public.beta_waitlist
FOR INSERT
WITH CHECK (true);

-- Only admins can view the waitlist
CREATE POLICY "Admins can view waitlist"
ON public.beta_waitlist
FOR SELECT
USING (public.is_admin(auth.uid()));