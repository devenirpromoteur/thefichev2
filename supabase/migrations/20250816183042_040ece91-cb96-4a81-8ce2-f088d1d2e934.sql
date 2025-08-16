-- Add type_key column for servitudes
ALTER TABLE cadastre_servitudes ADD COLUMN IF NOT EXISTS type_key text;

-- Update existing records with type_key based on type (migration)
UPDATE cadastre_servitudes 
SET type_key = LOWER(REGEXP_REPLACE(type, '[^a-zA-Z0-9]+', '_', 'g'))
WHERE type_key IS NULL;

-- Make type_key NOT NULL after migration
ALTER TABLE cadastre_servitudes ALTER COLUMN type_key SET NOT NULL;

-- Add unique constraint to prevent duplicates (drop first if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'uniq_project_type_key' 
               AND table_name = 'cadastre_servitudes') THEN
        ALTER TABLE cadastre_servitudes DROP CONSTRAINT uniq_project_type_key;
    END IF;
    ALTER TABLE cadastre_servitudes ADD CONSTRAINT uniq_project_type_key UNIQUE (project_id, type_key);
END $$;