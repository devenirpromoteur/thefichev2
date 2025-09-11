-- Drop the previous function and constraint that failed
DROP FUNCTION IF EXISTS public.user_owns_fiche(TEXT);
ALTER TABLE public.recapitulatif_foncier_rows DROP CONSTRAINT IF EXISTS fk_fiche;

-- Simplify the approach: add user_id directly to recapitulatif_foncier_rows
ALTER TABLE public.recapitulatif_foncier_rows 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old policy and create new secure RLS policies
DROP POLICY IF EXISTS "Users can only access their own land recap entries" ON public.recapitulatif_foncier_rows;

-- Create secure RLS policies based on user ownership
CREATE POLICY "Users can view their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own land recap entries"  
ON public.recapitulatif_foncier_rows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR DELETE
USING (auth.uid() = user_id);