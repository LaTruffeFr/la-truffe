
-- Create cars table for marketplace listings
CREATE TABLE public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  mileage INTEGER DEFAULT 0,
  year INTEGER,
  image_url TEXT,
  seller_contact TEXT,
  is_user_listing BOOLEAN NOT NULL DEFAULT true,
  ai_score INTEGER,
  ai_avis TEXT,
  ai_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Anyone can view listings (public marketplace)
CREATE POLICY "Anyone can view car listings"
ON public.cars FOR SELECT
USING (true);

-- Authenticated users can insert their own listings
CREATE POLICY "Authenticated users can create listings"
ON public.cars FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can manage all listings
CREATE POLICY "Admins can manage all cars"
ON public.cars FOR ALL
USING (is_admin(auth.uid()));

-- Create storage bucket for car photos
INSERT INTO storage.buckets (id, name, public) VALUES ('user-car-photos', 'user-car-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for car photos
CREATE POLICY "Public read car photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-car-photos');

-- Authenticated users can upload car photos
CREATE POLICY "Users can upload car photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'user-car-photos' AND auth.uid() IS NOT NULL);
