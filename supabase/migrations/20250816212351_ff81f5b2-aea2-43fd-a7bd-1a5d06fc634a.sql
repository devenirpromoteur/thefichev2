-- Ensure plu_servitudes table exists with proper structure
CREATE TABLE IF NOT EXISTS public.plu_servitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type_key TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, type_key)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_plu_servitudes_proj_type ON public.plu_servitudes(project_id, type_key);

-- Enable RLS
ALTER TABLE public.plu_servitudes ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "sel_plu_servitudes" ON public.plu_servitudes;
DROP POLICY IF EXISTS "ins_plu_servitudes" ON public.plu_servitudes;
DROP POLICY IF EXISTS "del_plu_servitudes" ON public.plu_servitudes;
DROP POLICY IF EXISTS "plu_servitudes_update" ON public.plu_servitudes;

CREATE POLICY "plu_servitudes_select"
  ON public.plu_servitudes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "plu_servitudes_insert"
  ON public.plu_servitudes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p
                      WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "plu_servitudes_delete"
  ON public.plu_servitudes FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id = project_id AND p.owner_id = auth.uid()));

CREATE POLICY "plu_servitudes_update"
  ON public.plu_servitudes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.projects p
                 WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.projects p
                      WHERE p.id = project_id AND p.owner_id = auth.uid()));