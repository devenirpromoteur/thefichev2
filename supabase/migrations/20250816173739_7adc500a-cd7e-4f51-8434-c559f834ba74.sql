-- Create cadastre_servitudes table for tracking servitudes per project
CREATE TABLE public.cadastre_servitudes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  type TEXT NOT NULL,
  present BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_servitude UNIQUE (project_id, type)
);

-- Enable Row Level Security
ALTER TABLE public.cadastre_servitudes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies based on project access (users can only access servitudes for their own projects)
CREATE POLICY "Users can view servitudes for their projects" 
ON public.cadastre_servitudes 
FOR SELECT 
USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert servitudes for their projects" 
ON public.cadastre_servitudes 
FOR INSERT 
WITH CHECK (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update servitudes for their projects" 
ON public.cadastre_servitudes 
FOR UPDATE 
USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete servitudes for their projects" 
ON public.cadastre_servitudes 
FOR DELETE 
USING (project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid()));

-- Create index for better performance
CREATE INDEX idx_cadastre_servitudes_project_type ON public.cadastre_servitudes (project_id, type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cadastre_servitudes_updated_at
BEFORE UPDATE ON public.cadastre_servitudes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();