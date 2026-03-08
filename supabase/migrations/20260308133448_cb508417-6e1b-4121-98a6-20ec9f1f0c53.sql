-- Table de parrainage
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "Service role manages referrals" ON public.referrals
  FOR ALL USING (public.is_admin(auth.uid()));

-- Fonction RPC sécurisée pour appliquer le parrainage
CREATE OR REPLACE FUNCTION public.apply_referral(_new_user_id uuid, _referrer_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que le parrain existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = _referrer_id) THEN
    RETURN false;
  END IF;

  -- Vérifier que le nouveau n'a pas déjà été parrainé
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = _new_user_id) THEN
    RETURN false;
  END IF;

  -- Empêcher l'auto-parrainage
  IF _new_user_id = _referrer_id THEN
    RETURN false;
  END IF;

  -- Enregistrer le parrainage
  INSERT INTO referrals (referrer_id, referred_id) VALUES (_referrer_id, _new_user_id);

  -- +1 crédit au nouveau
  UPDATE profiles SET credits = credits + 1, updated_at = now() WHERE user_id = _new_user_id;

  -- +1 crédit au parrain
  UPDATE profiles SET credits = credits + 1, updated_at = now() WHERE user_id = _referrer_id;

  RETURN true;
END;
$$;