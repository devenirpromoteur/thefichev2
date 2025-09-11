import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type LandRecapEntry = {
  id?: string;
  ficheId: string;
  section: string;
  parcelle: string;
  occupationType: string;
  ownerStatus: string;
  ownerDetails: string;
  additionalInfo: string;
  residentStatus: string;
  cadastreId: string;
  userId?: string;
};

interface UseLandRecapProps {
  ficheId: string;
}

export const useLandRecap = ({ ficheId }: UseLandRecapProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [entries, setEntries] = useState<LandRecapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<LandRecapEntry | null>(null);

  // Load entries from Supabase with localStorage fallback
  const loadEntries = async () => {
    if (!ficheId || !user) return;

    setIsLoading(true);
    
    try {
      // Try to load from Supabase first
      const { data: supabaseEntries, error } = await supabase
        .from('recapitulatif_foncier_rows')
        .select('*')
        .eq('fiche_id', ficheId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading from Supabase:', error);
        // Fallback to localStorage
        const storedData = localStorage.getItem(`landSummary_${ficheId}`);
        const localEntries: LandRecapEntry[] = storedData 
          ? JSON.parse(storedData).map((entry: any) => ({
              id: entry.id,
              ficheId: ficheId,
              section: entry.section || '',
              parcelle: entry.parcelle || '',
              occupationType: entry.occupationType,
              ownerStatus: entry.ownerStatus,
              ownerDetails: entry.ownerDetails,
              additionalInfo: entry.additionalInfo,
              residentStatus: entry.residentStatus,
              cadastreId: entry.cadastreId || '',
            }))
          : [];
        setEntries(localEntries);
      } else {
        // Map Supabase data to our format
        const mappedEntries: LandRecapEntry[] = supabaseEntries.map((entry: any) => ({
          id: entry.id,
          ficheId: entry.fiche_id,
          section: entry.section || '',
          parcelle: entry.parcelle || '',
          occupationType: entry.occupation_type,
          ownerStatus: entry.owner_status,
          ownerDetails: entry.owner_details || '',
          additionalInfo: entry.additional_info || '',
          residentStatus: entry.resident_status,
          cadastreId: entry.cadastre_id || '',
          userId: entry.user_id,
        }));
        setEntries(mappedEntries);
      }
    } catch (error) {
      console.error('Error in loadEntries:', error);
      // Fallback to localStorage
      const storedData = localStorage.getItem(`landSummary_${ficheId}`);
      const localEntries: LandRecapEntry[] = storedData ? JSON.parse(storedData) : [];
      setEntries(localEntries);
    }
    
    setIsLoading(false);
  };

  // Add new entry
  const addEntry = async (entry: Omit<LandRecapEntry, 'id'>) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour ajouter une entrée",
      });
      return null;
    }

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('recapitulatif_foncier_rows')
        .insert({
          fiche_id: entry.ficheId,
          section: entry.section,
          parcelle: entry.parcelle,
          occupation_type: entry.occupationType,
          owner_status: entry.ownerStatus,
          owner_details: entry.ownerDetails,
          additional_info: entry.additionalInfo,
          resident_status: entry.residentStatus,
          cadastre_id: entry.cadastreId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving to Supabase:', error);
        // Fallback: save to localStorage and create local entry
        const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
        const newEntry: LandRecapEntry = { id: tempId, ...entry };
        const updatedEntries = [...entries, newEntry];
        setEntries(updatedEntries);
        localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(updatedEntries));
        
        toast({
          title: "Ligne ajoutée (hors ligne)",
          description: "La ligne a été sauvegardée localement",
        });
        return newEntry;
      }

      // Map Supabase response back to our format
      const newEntry: LandRecapEntry = {
        id: data.id,
        ficheId: data.fiche_id,
        section: data.section,
        parcelle: data.parcelle,
        occupationType: data.occupation_type,
        ownerStatus: data.owner_status,
        ownerDetails: data.owner_details,
        additionalInfo: data.additional_info,
        residentStatus: data.resident_status,
        cadastreId: data.cadastre_id,
        userId: data.user_id,
      };

      setEntries([...entries, newEntry]);
      
      toast({
        title: "Ligne ajoutée",
        description: "La ligne a été ajoutée avec succès",
      });
      
      return newEntry;
    } catch (error) {
      console.error('Error in addEntry:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ligne",
      });
      return null;
    }
  };

  // Update entry
  const updateEntry = async (id: string, updates: Partial<LandRecapEntry>) => {
    if (!user) return false;

    try {
      // Update optimistically
      const updatedEntries = entries.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      );
      setEntries(updatedEntries);

      // Try to save to Supabase
      const updateData: any = {};
      if (updates.section !== undefined) updateData.section = updates.section;
      if (updates.parcelle !== undefined) updateData.parcelle = updates.parcelle;
      if (updates.occupationType !== undefined) updateData.occupation_type = updates.occupationType;
      if (updates.ownerStatus !== undefined) updateData.owner_status = updates.ownerStatus;
      if (updates.ownerDetails !== undefined) updateData.owner_details = updates.ownerDetails;
      if (updates.additionalInfo !== undefined) updateData.additional_info = updates.additionalInfo;
      if (updates.residentStatus !== undefined) updateData.resident_status = updates.residentStatus;
      if (updates.cadastreId !== undefined) updateData.cadastre_id = updates.cadastreId;

      const { error } = await supabase
        .from('recapitulatif_foncier_rows')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating in Supabase:', error);
        // Still save to localStorage as fallback
        localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(updatedEntries));
      }

      return true;
    } catch (error) {
      console.error('Error in updateEntry:', error);
      return false;
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour supprimer une entrée",
      });
      return false;
    }

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('recapitulatif_foncier_rows')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting from Supabase:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la ligne",
        });
        return false;
      }

      // Update local state
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      
      // Also remove from localStorage
      localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(updatedEntries));
      
      toast({
        title: "Ligne supprimée",
        description: "La ligne a été supprimée avec succès",
      });
      
      return true;
    } catch (error) {
      console.error('Error in deleteEntry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la ligne",
      });
      return false;
    }
  };

  // Confirm delete
  const confirmDelete = (entry: LandRecapEntry) => {
    setDeleteTarget(entry);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget?.id) {
      await deleteEntry(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, [ficheId, user]);

  return {
    entries,
    isLoading,
    deleteTarget,
    addEntry,
    updateEntry,
    confirmDelete,
    handleConfirmDelete,
    cancelDelete,
    reload: loadEntries,
  };
};