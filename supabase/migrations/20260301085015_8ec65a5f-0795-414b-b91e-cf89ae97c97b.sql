
-- Create marketplace_listings table for moderated vehicle listings
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER,
  kilometrage INTEGER,
  prix NUMERIC NOT NULL,
  carburant TEXT,
  description TEXT,
  image_url TEXT,
  seller_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  score_ia INTEGER,
  ai_avis TEXT,
  ai_tags TEXT[],
  ai_arguments JSONB,
  ai_devis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can read approved listings
CREATE POLICY "Anyone can view approved listings"
  ON public.marketplace_listings FOR SELECT
  USING (status = 'approved');

-- Users can view their own listings (any status)
CREATE POLICY "Users can view own listings"
  ON public.marketplace_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can create listings
CREATE POLICY "Users can create listings"
  ON public.marketplace_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own listings (but not status)
CREATE POLICY "Users can update own listings"
  ON public.marketplace_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own listings
CREATE POLICY "Users can delete own listings"
  ON public.marketplace_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all listings"
  ON public.marketplace_listings FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Auto-update updated_at
CREATE TRIGGER update_marketplace_listings_updated_at
  BEFORE UPDATE ON public.marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
