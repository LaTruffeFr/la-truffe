-- Create notifications table for seller-buyer interest tracking
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.cars(id) ON DELETE CASCADE,
  seller_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  buyer_phone TEXT,
  message TEXT,
  notification_type TEXT DEFAULT 'contact_inquiry',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_notifications_seller_id ON public.notifications(seller_user_id);
CREATE INDEX idx_notifications_listing_id ON public.notifications(listing_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own notifications
CREATE POLICY "Sellers view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = seller_user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Sellers can update (mark as read) their own notifications
CREATE POLICY "Sellers update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = seller_user_id)
WITH CHECK (auth.uid() = seller_user_id);

-- Sellers can delete their own notifications
CREATE POLICY "Sellers delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = seller_user_id);
