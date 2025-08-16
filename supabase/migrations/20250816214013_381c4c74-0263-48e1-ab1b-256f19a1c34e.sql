-- Create existing_values table for property values
CREATE TABLE IF NOT EXISTS public.existing_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parcel_section TEXT NULL,
  parcel_code TEXT NULL,
  type TEXT NOT NULL CHECK (type IN ('LOGEMENTS','PARKINGS','AUTRES')),
  surface_or_count NUMERIC,
  abatt NUMERIC DEFAULT 1,
  price_m2 NUMERIC,
  price_unit NUMERIC,
  tcap NUMERIC DEFAULT 0.05,
  etat NUMERIC DEFAULT 1,
  dvf NUMERIC NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_existing_values_project_created ON public.existing_values(project_id, created_at);

-- Enable RLS
ALTER TABLE public.existing_values ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "existing_values_select"
  ON public.existing_values FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "existing_values_insert"
  ON public.existing_values FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p
                      WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "existing_values_update"
  ON public.existing_values FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p
                      WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "existing_values_delete"
  ON public.existing_values FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id = project_id AND p.owner_id = auth.uid()));