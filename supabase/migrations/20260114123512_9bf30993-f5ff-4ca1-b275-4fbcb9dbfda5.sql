-- =============================================
-- PHASE 1: Séparer les données Stripe sensibles
-- =============================================

-- 1. Créer la table garage_billing pour les données de paiement
CREATE TABLE public.garage_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id uuid REFERENCES public.garages(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text DEFAULT 'inactive',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Activer RLS sur garage_billing
ALTER TABLE public.garage_billing ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS restrictives - seuls les propriétaires et admins
CREATE POLICY "Owners can view their billing"
  ON public.garage_billing FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.garages
      WHERE garages.id = garage_billing.garage_id
      AND garages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their billing"
  ON public.garage_billing FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.garages
      WHERE garages.id = garage_billing.garage_id
      AND garages.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all billing"
  ON public.garage_billing FOR ALL
  USING (is_admin(auth.uid()));

-- 4. Migrer les données existantes
INSERT INTO public.garage_billing (garage_id, stripe_customer_id, stripe_subscription_id, subscription_status)
SELECT id, stripe_customer_id, stripe_subscription_id, subscription_status
FROM public.garages
WHERE stripe_customer_id IS NOT NULL OR stripe_subscription_id IS NOT NULL OR subscription_status IS NOT NULL;

-- 5. Supprimer les colonnes sensibles de garages
ALTER TABLE public.garages DROP COLUMN IF EXISTS stripe_customer_id;
ALTER TABLE public.garages DROP COLUMN IF EXISTS stripe_subscription_id;
ALTER TABLE public.garages DROP COLUMN IF EXISTS subscription_status;

-- =============================================
-- PHASE 2: Corriger les politiques RLS manquantes
-- =============================================

-- 2.1 Fonction helper pour vérifier si propriétaire du garage
CREATE OR REPLACE FUNCTION public.is_garage_owner(_user_id uuid, _garage_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.garages
    WHERE id = _garage_id AND owner_id = _user_id
  )
$$;

-- 2.2 Politiques pour garage_members (propriétaires peuvent gérer)
CREATE POLICY "Owners can insert members"
  ON public.garage_members FOR INSERT
  WITH CHECK (is_garage_owner(auth.uid(), garage_id));

CREATE POLICY "Owners can update members"
  ON public.garage_members FOR UPDATE
  USING (is_garage_owner(auth.uid(), garage_id));

CREATE POLICY "Owners can delete members"
  ON public.garage_members FOR DELETE
  USING (is_garage_owner(auth.uid(), garage_id));

-- 2.3 Politiques pour reports (utilisateurs peuvent modifier/supprimer leurs rapports)
CREATE POLICY "Users can update their own reports"
  ON public.reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Mettre à jour la fonction garage_has_subscription
-- =============================================
CREATE OR REPLACE FUNCTION public.garage_has_subscription(_garage_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.garage_billing
    WHERE garage_id = _garage_id
      AND subscription_status = 'active'
  )
$$;