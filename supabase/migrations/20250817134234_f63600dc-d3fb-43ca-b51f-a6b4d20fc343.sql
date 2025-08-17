-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_land_recaps_updated_at ON public.land_recaps;

-- Create updated_at trigger for land_recaps only
CREATE TRIGGER update_land_recaps_updated_at
    BEFORE UPDATE ON public.land_recaps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Remove the foreign key constraint since cadastre_parcels doesn't exist
-- We'll use section/parcelle columns as fallback
ALTER TABLE public.land_recaps DROP CONSTRAINT IF EXISTS land_recaps_parcel_id_fkey;