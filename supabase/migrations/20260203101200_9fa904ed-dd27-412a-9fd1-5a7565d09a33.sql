-- =====================================================
-- FIX 1: Convert RESTRICTIVE policies to PERMISSIVE for profiles table
-- This prevents anonymous access and ensures proper authentication
-- =====================================================

-- Drop existing RESTRICTIVE policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create PERMISSIVE policies that require authentication
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- =====================================================
-- FIX 2: Convert RESTRICTIVE policies to PERMISSIVE for garage_billing
-- =====================================================

-- Drop existing RESTRICTIVE policies on garage_billing
DROP POLICY IF EXISTS "Admins can manage all billing" ON public.garage_billing;
DROP POLICY IF EXISTS "Owners can update their billing" ON public.garage_billing;
DROP POLICY IF EXISTS "Owners can view their billing" ON public.garage_billing;

-- Create PERMISSIVE policies that require authentication
CREATE POLICY "Owners can view their billing"
ON public.garage_billing FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM garages
  WHERE garages.id = garage_billing.garage_id 
  AND garages.owner_id = auth.uid()
));

CREATE POLICY "Owners can update their billing"
ON public.garage_billing FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM garages
  WHERE garages.id = garage_billing.garage_id 
  AND garages.owner_id = auth.uid()
));

CREATE POLICY "Admins can manage all billing"
ON public.garage_billing FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- =====================================================
-- FIX 3: Create processed_payments table for idempotency
-- Prevents replay attacks on payment verification
-- =====================================================

CREATE TABLE IF NOT EXISTS public.processed_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  credits INTEGER NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on processed_payments
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- Only admins and service role can access this table
CREATE POLICY "Service role can manage processed payments"
ON public.processed_payments FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_processed_payments_session_id ON public.processed_payments(session_id);