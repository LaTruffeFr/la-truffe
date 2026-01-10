-- Ajoute des colonnes pour stocker les résultats d'analyse du rapport
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS prix_moyen INTEGER,
ADD COLUMN IF NOT EXISTS prix_truffe INTEGER,
ADD COLUMN IF NOT EXISTS economie_moyenne INTEGER,
ADD COLUMN IF NOT EXISTS decote_par_10k INTEGER,
ADD COLUMN IF NOT EXISTS total_vehicules INTEGER,
ADD COLUMN IF NOT EXISTS opportunites_count INTEGER,
ADD COLUMN IF NOT EXISTS vehicles_data JSONB;

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);