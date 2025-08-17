-- Ensure land_recaps table is properly configured for LandSummaryTable module
-- Create or update the land_recaps table with all necessary fields

-- Create the table if it doesn't exist, or ensure all columns exist
DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'land_recaps') THEN
    CREATE TABLE public.land_recaps (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL,
      parcel_id UUID,
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
  END IF;

  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'section') THEN
    ALTER TABLE public.land_recaps ADD COLUMN section TEXT;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'parcelle') THEN
    ALTER TABLE public.land_recaps ADD COLUMN parcelle TEXT;
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'occupation_type') THEN
    ALTER TABLE public.land_recaps ADD COLUMN occupation_type TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'owner_status') THEN
    ALTER TABLE public.land_recaps ADD COLUMN owner_status TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'owner_name') THEN
    ALTER TABLE public.land_recaps ADD COLUMN owner_name TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'notes') THEN
    ALTER TABLE public.land_recaps ADD COLUMN notes TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'resident_status') THEN
    ALTER TABLE public.land_recaps ADD COLUMN resident_status TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'land_recaps' AND column_name = 'parcel_id') THEN
    ALTER TABLE public.land_recaps ADD COLUMN parcel_id UUID;
  END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE public.land_recaps ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for land_recaps
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view land recaps for their projects" ON public.land_recaps;
  DROP POLICY IF EXISTS "Users can insert land recaps for their projects" ON public.land_recaps;
  DROP POLICY IF EXISTS "Users can update land recaps for their projects" ON public.land_recaps;
  DROP POLICY IF EXISTS "Users can delete land recaps for their projects" ON public.land_recaps;

  -- Create new policies
  CREATE POLICY "Users can view land recaps for their projects" 
  ON public.land_recaps FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
  ));

  CREATE POLICY "Users can insert land recaps for their projects" 
  ON public.land_recaps FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
  ));

  CREATE POLICY "Users can update land recaps for their projects" 
  ON public.land_recaps FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
  ));

  CREATE POLICY "Users can delete land recaps for their projects" 
  ON public.land_recaps FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = land_recaps.project_id AND p.owner_id = auth.uid()
  ));
END
$$;

-- Create or update the trigger for updated_at
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS update_land_recaps_updated_at ON public.land_recaps;

  -- Create trigger for automatic timestamp updates
  CREATE TRIGGER update_land_recaps_updated_at
    BEFORE UPDATE ON public.land_recaps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_land_recaps_project_id ON public.land_recaps(project_id);
CREATE INDEX IF NOT EXISTS idx_land_recaps_parcel_id ON public.land_recaps(parcel_id);