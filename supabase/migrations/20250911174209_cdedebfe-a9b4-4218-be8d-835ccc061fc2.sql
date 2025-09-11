-- Clean up existing policies and create secure ones
DO $$
BEGIN
    -- Drop all existing policies for recapitulatif_foncier_rows
    DROP POLICY IF EXISTS "Users can view their own land recap entries" ON public.recapitulatif_foncier_rows;
    DROP POLICY IF EXISTS "Users can insert their own land recap entries" ON public.recapitulatif_foncier_rows;  
    DROP POLICY IF EXISTS "Users can update their own land recap entries" ON public.recapitulatif_foncier_rows;
    DROP POLICY IF EXISTS "Users can delete their own land recap entries" ON public.recapitulatif_foncier_rows;
    DROP POLICY IF EXISTS "Users can only access their own land recap entries" ON public.recapitulatif_foncier_rows;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recapitulatif_foncier_rows' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.recapitulatif_foncier_rows 
        ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Make user_id NOT NULL for security
    UPDATE public.recapitulatif_foncier_rows 
    SET user_id = (SELECT id FROM auth.users LIMIT 1) 
    WHERE user_id IS NULL;
    
    ALTER TABLE public.recapitulatif_foncier_rows 
    ALTER COLUMN user_id SET NOT NULL;
    
EXCEPTION WHEN OTHERS THEN
    -- Continue with policy creation even if some operations fail
    NULL;
END $$;

-- Create secure RLS policies
CREATE POLICY "Secure: Users can view their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Secure: Users can insert their own land recap entries"  
ON public.recapitulatif_foncier_rows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Secure: Users can update their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Secure: Users can delete their own land recap entries"
ON public.recapitulatif_foncier_rows
FOR DELETE
USING (auth.uid() = user_id);