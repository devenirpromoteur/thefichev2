-- Mise à jour des contraintes et de l'indexation pour les modules existants

-- Vérifier et ajouter les contraintes UNIQUE si nécessaires
DO $$
BEGIN
  -- Pour land_recaps: contrainte UNIQUE sur project_id et parcel_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'land_recaps' 
    AND constraint_name = 'land_recaps_project_parcel_unique'
    AND table_schema = 'public'
  ) THEN
    -- Créer contrainte unique pour éviter les doublons parcel_id par projet
    ALTER TABLE public.land_recaps 
    ADD CONSTRAINT land_recaps_project_parcel_unique 
    UNIQUE (project_id, parcel_id);
  END IF;

  -- Pour existing_values: améliorer l'indexation et éviter les doublons de section/parcelle par projet
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'existing_values' 
    AND constraint_name = 'existing_values_project_parcel_unique'
    AND table_schema = 'public'
  ) THEN
    -- Créer contrainte unique pour éviter les doublons de parcelles par projet
    ALTER TABLE public.existing_values 
    ADD CONSTRAINT existing_values_project_parcel_unique 
    UNIQUE (project_id, parcel_section, parcel_code);
  END IF;
END
$$;

-- Améliorer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_existing_values_project_parcel ON public.existing_values(project_id, parcel_section, parcel_code);
CREATE INDEX IF NOT EXISTS idx_land_recaps_project_parcel_id ON public.land_recaps(project_id, parcel_id);