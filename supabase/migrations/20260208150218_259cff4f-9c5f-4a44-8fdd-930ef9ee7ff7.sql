-- Add email format validation constraint to beta_waitlist table
-- This ensures only valid email formats can be inserted at the database level
ALTER TABLE public.beta_waitlist 
ADD CONSTRAINT beta_waitlist_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');