-- Create listing stats table to track performance metrics
CREATE TABLE public.listing_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE UNIQUE,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  contact_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_listing_stats_listing_id ON public.listing_stats(listing_id);
CREATE INDEX idx_listing_stats_view_count ON public.listing_stats(view_count DESC);
CREATE INDEX idx_listing_stats_contact_count ON public.listing_stats(contact_count DESC);

-- Enable RLS
ALTER TABLE public.listing_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view stats (for transparency and SEO)
CREATE POLICY "Anyone can view listing stats"
ON public.listing_stats FOR SELECT
USING (true);

-- System can insert/update stats
CREATE POLICY "System manages listing stats"
ON public.listing_stats FOR INSERT
WITH CHECK (true);

CREATE POLICY "System updates listing stats"
ON public.listing_stats FOR UPDATE
WITH CHECK (true);

-- Function to initialize stats when a listing is created
CREATE OR REPLACE FUNCTION initialize_listing_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.listing_stats (listing_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create stats record
CREATE TRIGGER trigger_initialize_listing_stats
AFTER INSERT ON public.cars
FOR EACH ROW
EXECUTE FUNCTION initialize_listing_stats();
