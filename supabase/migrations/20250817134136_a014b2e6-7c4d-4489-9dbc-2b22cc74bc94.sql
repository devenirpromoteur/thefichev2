-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_land_recaps_updated_at ON public.land_recaps;
DROP TRIGGER IF EXISTS update_cadastre_parcels_updated_at ON public.cadastre_parcels;

-- Create updated_at triggers
CREATE TRIGGER update_land_recaps_updated_at
    BEFORE UPDATE ON public.land_recaps
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cadastre_parcels_updated_at
    BEFORE UPDATE ON public.cadastre_parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();