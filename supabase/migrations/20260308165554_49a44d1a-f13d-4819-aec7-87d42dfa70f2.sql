
CREATE TABLE public.reported_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  ad_url text NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.reported_listings ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reports
CREATE POLICY "Users can report listings"
  ON public.reported_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON public.reported_listings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all reports
CREATE POLICY "Admins can view all reported listings"
  ON public.reported_listings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update status
CREATE POLICY "Admins can update reported listings"
  ON public.reported_listings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
