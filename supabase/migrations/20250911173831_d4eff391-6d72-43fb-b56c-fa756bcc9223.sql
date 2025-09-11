-- First, let's create the table structure based on the code analysis
CREATE TABLE IF NOT EXISTS public.recapitulatif_foncier_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiche_id TEXT NOT NULL,
  section TEXT,
  parcelle TEXT,
  occupation_type TEXT NOT NULL,
  owner_status TEXT NOT NULL,
  owner_details TEXT,
  additional_info TEXT,
  resident_status TEXT NOT NULL,
  cadastre_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.recapitulatif_foncier_rows ENABLE ROW LEVEL SECURITY;

-- Create a profiles table to link users to their data if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create projects/fiches table to establish ownership
CREATE TABLE IF NOT EXISTS public.fiches (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on fiches
ALTER TABLE public.fiches ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint to link land recap entries to fiches
ALTER TABLE public.recapitulatif_foncier_rows 
ADD CONSTRAINT fk_fiche 
FOREIGN KEY (fiche_id) REFERENCES public.fiches(id) ON DELETE CASCADE;

-- Create security definer function to check if user owns the fiche
CREATE OR REPLACE FUNCTION public.user_owns_fiche(fiche_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fiches 
    WHERE id = fiche_id AND user_id = auth.uid()
  )
$$;

-- Secure RLS policies for recapitulatif_foncier_rows
CREATE POLICY "Users can only access their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR ALL
USING (public.user_owns_fiche(fiche_id))
WITH CHECK (public.user_owns_fiche(fiche_id));

-- Secure RLS policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Secure RLS policies for fiches
CREATE POLICY "Users can access their own fiches"
ON public.fiches
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_recapitulatif_foncier_rows_updated_at
  BEFORE UPDATE ON public.recapitulatif_foncier_rows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_fiches_updated_at
  BEFORE UPDATE ON public.fiches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();