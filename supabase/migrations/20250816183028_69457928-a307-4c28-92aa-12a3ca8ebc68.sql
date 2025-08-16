-- Add type_key column and unique constraint for servitudes
ALTER TABLE cadastre_servitudes ADD COLUMN IF NOT EXISTS type_key text;

-- Add unique constraint to prevent duplicates
ALTER TABLE cadastre_servitudes ADD CONSTRAINT IF NOT EXISTS uniq_project_type_key UNIQUE (project_id, type_key);

-- Update existing records with type_key based on type (migration)
UPDATE cadastre_servitudes 
SET type_key = LOWER(REGEXP_REPLACE(type, '[^a-zA-Z0-9]+', '_', 'g'))
WHERE type_key IS NULL;

-- Make type_key NOT NULL after migration
ALTER TABLE cadastre_servitudes ALTER COLUMN type_key SET NOT NULL;