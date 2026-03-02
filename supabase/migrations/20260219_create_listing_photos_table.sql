-- Create listing_photos table for gallery support
CREATE TABLE public.listing_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX idx_listing_photos_listing_id ON public.listing_photos(listing_id);
CREATE INDEX idx_listing_photos_order ON public.listing_photos(listing_id, display_order);
CREATE INDEX idx_listing_photos_primary ON public.listing_photos(listing_id, is_primary);

-- Enable RLS
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos (public marketplace)
CREATE POLICY "Anyone can view photos"
ON public.listing_photos FOR SELECT
USING (true);

-- Sellers can upload photos for their listings
CREATE POLICY "Sellers can upload photos"
ON public.listing_photos FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.cars WHERE id = listing_id
  )
);

-- Sellers can manage photos for their listings
CREATE POLICY "Sellers manage their photos"
ON public.listing_photos FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.cars WHERE id = listing_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.cars WHERE id = listing_id
  )
);

-- Sellers can delete photos from their listings
CREATE POLICY "Sellers delete their photos"
ON public.listing_photos FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.cars WHERE id = listing_id
  )
);

-- Function to maintain primary photo constraint
CREATE OR REPLACE FUNCTION ensure_single_primary_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.listing_photos
    SET is_primary = false
    WHERE listing_id = NEW.listing_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single primary photo per listing
CREATE TRIGGER trigger_ensure_single_primary_photo
BEFORE INSERT OR UPDATE ON public.listing_photos
FOR EACH ROW
EXECUTE FUNCTION ensure_single_primary_photo();
