
-- OBJECTIVE 1: Allow anonymous/public SELECT on reports for shared links
CREATE POLICY "Public can view completed reports by ID"
ON public.reports FOR SELECT
TO anon, authenticated
USING (status = 'completed');

-- OBJECTIVE 3: Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own reviews
CREATE POLICY "Users can view own reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
