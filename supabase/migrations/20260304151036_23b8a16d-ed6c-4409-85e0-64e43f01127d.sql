
CREATE TABLE public.model_guides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint to avoid duplicates
CREATE UNIQUE INDEX model_guides_brand_model_idx ON public.model_guides (lower(brand), lower(model));

-- Enable RLS
ALTER TABLE public.model_guides ENABLE ROW LEVEL SECURITY;

-- Anyone can read guides (public content)
CREATE POLICY "Anyone can read guides" ON public.model_guides FOR SELECT USING (true);

-- Only service role inserts (via edge function)
CREATE POLICY "Service role can insert guides" ON public.model_guides FOR INSERT WITH CHECK (false);
