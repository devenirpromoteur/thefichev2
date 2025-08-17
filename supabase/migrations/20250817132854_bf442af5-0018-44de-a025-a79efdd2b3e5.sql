-- Ensure parcel_id has proper foreign key constraint with ON DELETE SET NULL
-- First, drop existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'land_recaps_parcel_id_fkey' 
               AND table_name = 'land_recaps') THEN
        ALTER TABLE public.land_recaps DROP CONSTRAINT land_recaps_parcel_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint with ON DELETE SET NULL
-- Note: This assumes a parcels table exists, if not we'll create a reference structure
ALTER TABLE public.land_recaps 
ADD CONSTRAINT land_recaps_parcel_id_fkey 
FOREIGN KEY (parcel_id) 
REFERENCES public.land_recaps(id) 
ON DELETE SET NULL;

-- Update RLS policies to allow parcel_id IS NULL in UPDATE operations
DROP POLICY IF EXISTS "Users can update land recaps for their projects" ON public.land_recaps;

CREATE POLICY "Users can update land recaps for their projects" 
ON public.land_recaps 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = land_recaps.project_id) AND (p.owner_id = auth.uid()))))
WITH CHECK (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = land_recaps.project_id) AND (p.owner_id = auth.uid()))));