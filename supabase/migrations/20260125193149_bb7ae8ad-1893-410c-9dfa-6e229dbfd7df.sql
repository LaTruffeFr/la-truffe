-- Ajouter le champ negotiation_arguments pour stocker les arguments de négociation personnalisés
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS negotiation_arguments TEXT;