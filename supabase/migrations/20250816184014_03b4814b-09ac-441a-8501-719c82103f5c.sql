-- Create dedicated plu_servitudes table with proper schema
CREATE TABLE IF NOT EXISTS plu_servitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type_key text NOT NULL,        -- ex: 'PPRN', 'ABF', 'NON_AEDIFICANDI'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, type_key)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_plu_servitudes_proj_type ON plu_servitudes(project_id, type_key);

-- Enable RLS
ALTER TABLE plu_servitudes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies linking user to project
CREATE POLICY sel_plu_servitudes ON plu_servitudes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );

CREATE POLICY ins_plu_servitudes ON plu_servitudes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );

CREATE POLICY del_plu_servitudes ON plu_servitudes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.owner_id = auth.uid())
  );