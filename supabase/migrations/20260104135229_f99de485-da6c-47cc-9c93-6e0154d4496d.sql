-- Create garages table
CREATE TABLE public.garages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_status text DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled')),
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create garage_members table (team members)
CREATE TABLE public.garage_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    garage_id uuid REFERENCES public.garages(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role text DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (garage_id, user_id)
);

-- Add garage_id to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN garage_id uuid REFERENCES public.garages(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_members ENABLE ROW LEVEL SECURITY;

-- Security definer function to check garage membership
CREATE OR REPLACE FUNCTION public.is_garage_member(_user_id uuid, _garage_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.garage_members
    WHERE user_id = _user_id
      AND garage_id = _garage_id
  )
$$;

-- Security definer function to check if garage has active subscription
CREATE OR REPLACE FUNCTION public.garage_has_subscription(_garage_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.garages
    WHERE id = _garage_id
      AND subscription_status = 'active'
  )
$$;

-- Security definer function to get user's garage id
CREATE OR REPLACE FUNCTION public.get_user_garage_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT garage_id
  FROM public.garage_members
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies for garages
CREATE POLICY "Admins can view all garages"
ON public.garages FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Members can view their garage"
ON public.garages FOR SELECT TO authenticated
USING (public.is_garage_member(auth.uid(), id));

CREATE POLICY "Admins can manage all garages"
ON public.garages FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- RLS Policies for garage_members
CREATE POLICY "Admins can view all members"
ON public.garage_members FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Members can view their team"
ON public.garage_members FOR SELECT TO authenticated
USING (public.is_garage_member(auth.uid(), garage_id));

CREATE POLICY "Admins can manage all members"
ON public.garage_members FOR ALL TO authenticated
USING (public.is_admin(auth.uid()));

-- Update vehicles RLS policies to include garage access
CREATE POLICY "Garage members can view their vehicles"
ON public.vehicles FOR SELECT TO authenticated
USING (
  garage_id IS NOT NULL 
  AND public.is_garage_member(auth.uid(), garage_id)
  AND public.garage_has_subscription(garage_id)
);

CREATE POLICY "Garage members can insert vehicles"
ON public.vehicles FOR INSERT TO authenticated
WITH CHECK (
  garage_id IS NOT NULL 
  AND public.is_garage_member(auth.uid(), garage_id)
  AND public.garage_has_subscription(garage_id)
);

CREATE POLICY "Garage members can update vehicles"
ON public.vehicles FOR UPDATE TO authenticated
USING (
  garage_id IS NOT NULL 
  AND public.is_garage_member(auth.uid(), garage_id)
  AND public.garage_has_subscription(garage_id)
);

CREATE POLICY "Garage members can delete vehicles"
ON public.vehicles FOR DELETE TO authenticated
USING (
  garage_id IS NOT NULL 
  AND public.is_garage_member(auth.uid(), garage_id)
  AND public.garage_has_subscription(garage_id)
);