-- Add share_token column to reports table for secure public sharing
ALTER TABLE public.reports ADD COLUMN share_token TEXT UNIQUE;

-- Create index for fast share_token lookups
CREATE INDEX idx_reports_share_token ON public.reports(share_token) WHERE share_token IS NOT NULL;

-- Create a function to generate secure share tokens
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;