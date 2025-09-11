-- Fix the function search path security issue
DROP FUNCTION IF EXISTS public.user_owns_fiche(TEXT);

CREATE OR REPLACE FUNCTION public.user_owns_fiche(fiche_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fiches 
    WHERE id = fiche_id AND user_id = auth.uid()
  )
$$;