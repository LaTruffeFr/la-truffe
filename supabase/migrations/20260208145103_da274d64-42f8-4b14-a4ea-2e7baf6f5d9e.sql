-- Créer une fonction pour vérifier si un utilisateur est VIP
CREATE OR REPLACE FUNCTION public.is_vip(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'vip')
$$;