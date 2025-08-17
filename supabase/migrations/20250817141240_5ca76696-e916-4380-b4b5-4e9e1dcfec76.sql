-- Add missing columns to land_recaps table for better data tracking
ALTER TABLE public.land_recaps 
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS parcelle text;