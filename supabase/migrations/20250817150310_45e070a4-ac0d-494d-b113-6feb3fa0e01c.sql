-- Créer la table recapitulatif_foncier_rows pour le module "Récapitulatif foncier"
CREATE TABLE IF NOT EXISTS public.recapitulatif_foncier_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fiche_id TEXT NOT NULL, -- ID de la fiche (projet)
  section TEXT,
  parcelle TEXT, 
  occupation_type TEXT NOT NULL DEFAULT 'Terrain nu',
  owner_status TEXT NOT NULL DEFAULT 'Personne physique',
  owner_details TEXT NOT NULL DEFAULT '',
  additional_info TEXT NOT NULL DEFAULT '',
  resident_status TEXT NOT NULL DEFAULT 'Vacants',
  cadastre_id TEXT NOT NULL DEFAULT '', -- Lien vers l'entrée cadastre
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.recapitulatif_foncier_rows ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Users can view their fiche land recaps" 
ON public.recapitulatif_foncier_rows 
FOR SELECT 
USING (auth.uid()::text IS NOT NULL);

CREATE POLICY "Users can insert their fiche land recaps" 
ON public.recapitulatif_foncier_rows 
FOR INSERT 
WITH CHECK (auth.uid()::text IS NOT NULL);

CREATE POLICY "Users can update their fiche land recaps" 
ON public.recapitulatif_foncier_rows 
FOR UPDATE 
USING (auth.uid()::text IS NOT NULL);

CREATE POLICY "Users can delete their fiche land recaps" 
ON public.recapitulatif_foncier_rows 
FOR DELETE 
USING (auth.uid()::text IS NOT NULL);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_recapitulatif_foncier_rows_fiche_id ON public.recapitulatif_foncier_rows(fiche_id);

-- Créer la fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION public.update_recapitulatif_foncier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour la mise à jour automatique du timestamp
CREATE TRIGGER update_recapitulatif_foncier_updated_at
    BEFORE UPDATE ON public.recapitulatif_foncier_rows
    FOR EACH ROW
    EXECUTE FUNCTION public.update_recapitulatif_foncier_updated_at();