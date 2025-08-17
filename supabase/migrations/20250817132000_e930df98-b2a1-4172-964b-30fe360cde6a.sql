-- Create land_recaps table
CREATE TABLE public.land_recaps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  parcel_id UUID, -- Reference to cadastre entry if linked
  occupation_type TEXT NOT NULL DEFAULT '',
  owner_status TEXT NOT NULL DEFAULT '',  
  owner_name TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  resident_status TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.land_recaps ENABLE ROW LEVEL SECURITY;

-- Create policies linked to project owner
CREATE POLICY "Users can view land recaps for their projects" 
ON public.land_recaps 
FOR SELECT 
USING (EXISTS(SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can insert land recaps for their projects" 
ON public.land_recaps 
FOR INSERT 
WITH CHECK (EXISTS(SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can update land recaps for their projects" 
ON public.land_recaps 
FOR UPDATE 
USING (EXISTS(SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "Users can delete land recaps for their projects" 
ON public.land_recaps 
FOR DELETE 
USING (EXISTS(SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_land_recaps_updated_at
BEFORE UPDATE ON public.land_recaps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_land_recaps_project_id ON public.land_recaps(project_id);
CREATE INDEX idx_land_recaps_parcel_id ON public.land_recaps(parcel_id) WHERE parcel_id IS NOT NULL;