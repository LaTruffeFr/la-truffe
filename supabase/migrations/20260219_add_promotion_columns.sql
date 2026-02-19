-- Add promotion/featured columns to cars table
ALTER TABLE public.cars
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS promotion_type TEXT; -- 'none', 'featured', 'premium', etc.

-- Index for featured listings queries (important for marketplace sorting)
CREATE INDEX IF NOT EXISTS idx_cars_featured ON public.cars(is_featured, featured_until)
WHERE is_featured = true AND (featured_until IS NULL OR featured_until > now());

-- Function to automatically unfeature listings when promotion expires
CREATE OR REPLACE FUNCTION unfeature_expired_promotions()
RETURNS void AS $$
BEGIN
  UPDATE public.cars
  SET is_featured = false, promotion_type = 'none'
  WHERE is_featured = true 
    AND featured_until IS NOT NULL 
    AND featured_until < now();
END;
$$ LANGUAGE plpgsql;

-- Create listing_promotions table to track promotion history
CREATE TABLE IF NOT EXISTS public.listing_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL, -- 'featured', 'premium', 'boost', etc.
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cost_amount DECIMAL(10, 2),
  cost_currency TEXT DEFAULT 'EUR',
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for promotion queries
CREATE INDEX idx_listing_promotions_listing_id ON public.listing_promotions(listing_id);
CREATE INDEX idx_listing_promotions_active ON public.listing_promotions(ends_at DESC)
WHERE ends_at > now();

-- Enable RLS
ALTER TABLE public.listing_promotions ENABLE ROW LEVEL SECURITY;

-- Sellers can view promotion history for their listings
CREATE POLICY "Sellers view promotion history"
ON public.listing_promotions FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.cars WHERE id = listing_id
  )
);

-- System can insert promotions
CREATE POLICY "System creates promotions"
ON public.listing_promotions FOR INSERT
WITH CHECK (true);

-- System can update promotion status
CREATE POLICY "System updates promotions"
ON public.listing_promotions FOR UPDATE
WITH CHECK (true);

-- Admins can view all promotions
CREATE POLICY "Admins view all promotions"
ON public.listing_promotions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
