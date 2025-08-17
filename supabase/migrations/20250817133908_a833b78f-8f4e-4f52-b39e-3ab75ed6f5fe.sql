-- Create land_recaps table if not exists with proper constraints
CREATE TABLE IF NOT EXISTS public.land_recaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parcel_id UUID NULL,
    section TEXT,
    parcelle TEXT,
    occupation_type TEXT NOT NULL DEFAULT '',
    owner_status TEXT NOT NULL DEFAULT '',
    owner_name TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    resident_status TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cadastre_parcels table as fallback if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cadastre_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    parcelle TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraint for parcel_id if cadastre_parcels table exists
-- First drop existing constraint if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'land_recaps_parcel_id_fkey' 
               AND table_name = 'land_recaps') THEN
        ALTER TABLE public.land_recaps DROP CONSTRAINT land_recaps_parcel_id_fkey;
    END IF;
END $$;

-- Add proper foreign key constraint
ALTER TABLE public.land_recaps 
ADD CONSTRAINT land_recaps_parcel_id_fkey 
FOREIGN KEY (parcel_id) 
REFERENCES public.cadastre_parcels(id) 
ON DELETE SET NULL;

-- Enable RLS on both tables
ALTER TABLE public.land_recaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadastre_parcels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for land_recaps
DROP POLICY IF EXISTS "Users can select land recaps for their projects" ON public.land_recaps;
DROP POLICY IF EXISTS "Users can insert land recaps for their projects" ON public.land_recaps;
DROP POLICY IF EXISTS "Users can update land recaps for their projects" ON public.land_recaps;
DROP POLICY IF EXISTS "Users can delete land recaps for their projects" ON public.land_recaps;

CREATE POLICY "Users can select land recaps for their projects" 
ON public.land_recaps 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Users can insert land recaps for their projects" 
ON public.land_recaps 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Users can update land recaps for their projects" 
ON public.land_recaps 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Users can delete land recaps for their projects" 
ON public.land_recaps 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
));

-- Create RLS policies for cadastre_parcels
DROP POLICY IF EXISTS "Users can select parcels for their projects" ON public.cadastre_parcels;
DROP POLICY IF EXISTS "Users can insert parcels for their projects" ON public.cadastre_parcels;
DROP POLICY IF EXISTS "Users can update parcels for their projects" ON public.cadastre_parcels;
DROP POLICY IF EXISTS "Users can delete parcels for their projects" ON public.cadastre_parcels;

CREATE POLICY "Users can select parcels for their projects" 
ON public.cadastre_parcels 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = cadastre_parcels.project_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Users can insert parcels for their projects" 
ON public.cadastre_parcels 
FOR INSERT 
WITH CHECK (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = cadastre_parcels.project_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Users can update parcels for their projects" 
ON public.cadastre_parcels 
FOR UPDATE 
USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = cadastre_parcels.project_id AND p.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = cadastre_parcels.project_id AND p.owner_id = auth.uid()
));

CREATE POLICY "Users can delete parcels for their projects" 
ON public.cadastre_parcels 
FOR DELETE 
USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = cadastre_parcels.project_id AND p.owner_id = auth.uid()
));

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_land_recaps_updated_at
    BEFORE UPDATE ON public.land_recaps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cadastre_parcels_updated_at
    BEFORE UPDATE ON public.cadastre_parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();