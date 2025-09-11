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

  // Load entries from database and localStorage fallback
  const loadEntries = async () => {
    if (!ficheId || !user) return;

    setIsLoading(true);
    
    try {
      // First try to load from database
      const { data: dbEntries, error } = await supabase
        .from('recapitulatif_foncier_rows')
        .select('*')
        .eq('fiche_id', ficheId)
        .eq('user_id', user.id);

      if (error) throw error;

      // If no database entries, try localStorage for migration
      if (!dbEntries || dbEntries.length === 0) {
        const storedData = localStorage.getItem(`landSummary_${ficheId}`);
        if (storedData) {
          const localEntries = JSON.parse(storedData);
          // Migrate localStorage data to database
          for (const entry of localEntries) {
            const { error: insertError } = await supabase
              .from('recapitulatif_foncier_rows')
              .insert({
                user_id: user.id,
                fiche_id: ficheId,
                section: entry.section || '',
                parcelle: entry.parcelle || '',
                occupation_type: entry.occupationType,
                owner_status: entry.ownerStatus,
                owner_details: entry.ownerDetails,
                additional_info: entry.additionalInfo,
                resident_status: entry.residentStatus,
                cadastre_id: entry.cadastreId || '',
              });
            
            if (insertError) {
              console.error('Migration error:', insertError);
            }
          }
          
          // Reload from database after migration
          const { data: migratedEntries } = await supabase
            .from('recapitulatif_foncier_rows')
            .select('*')
            .eq('fiche_id', ficheId)
            .eq('user_id', user.id);
          
          setEntries(migratedEntries?.map(mapDbEntryToLocal) || []);
          
          // Clean up localStorage after successful migration
          localStorage.removeItem(`landSummary_${ficheId}`);
        } else {
          setEntries([]);
        }
      } else {
        setEntries(dbEntries.map(mapDbEntryToLocal));
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
      setEntries([]);
    }
    
    setIsLoading(false);
  };

  // Helper function to map database entry to local format
  const mapDbEntryToLocal = (dbEntry: any): LandRecapEntry => ({
    id: dbEntry.id,
    ficheId: dbEntry.fiche_id,
    section: dbEntry.section || '',
    parcelle: dbEntry.parcelle || '',
    occupationType: dbEntry.occupation_type,
    ownerStatus: dbEntry.owner_status,
    ownerDetails: dbEntry.owner_details || '',
    additionalInfo: dbEntry.additional_info || '',
    residentStatus: dbEntry.resident_status,
    cadastreId: dbEntry.cadastre_id || '',
  });

  // Add new entry
  const addEntry = async (entry: Omit<LandRecapEntry, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('recapitulatif_foncier_rows')
        .insert({
          user_id: user.id,
          fiche_id: entry.ficheId,
          section: entry.section,
          parcelle: entry.parcelle,
          occupation_type: entry.occupationType,
          owner_status: entry.ownerStatus,
          owner_details: entry.ownerDetails,
          additional_info: entry.additionalInfo,
          resident_status: entry.residentStatus,
          cadastre_id: entry.cadastreId,
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry = mapDbEntryToLocal(data);
      setEntries(prev => [...prev, newEntry]);
      
      toast({
        title: "Ligne ajoutée",
        description: "La ligne a été ajoutée avec succès",
      });
      
      return newEntry;
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ligne",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update entry
  const updateEntry = async (id: string, updates: Partial<LandRecapEntry>) => {
    try {
      // Prepare database updates by mapping field names
      const dbUpdates: any = {};
      if (updates.section !== undefined) dbUpdates.section = updates.section;
      if (updates.parcelle !== undefined) dbUpdates.parcelle = updates.parcelle;
      if (updates.occupationType !== undefined) dbUpdates.occupation_type = updates.occupationType;
      if (updates.ownerStatus !== undefined) dbUpdates.owner_status = updates.ownerStatus;
      if (updates.ownerDetails !== undefined) dbUpdates.owner_details = updates.ownerDetails;
      if (updates.additionalInfo !== undefined) dbUpdates.additional_info = updates.additionalInfo;
      if (updates.residentStatus !== undefined) dbUpdates.resident_status = updates.residentStatus;
      if (updates.cadastreId !== undefined) dbUpdates.cadastre_id = updates.cadastreId;

      const { error } = await supabase
        .from('recapitulatif_foncier_rows')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { ...entry, ...updates } : entry
      ));
      
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la ligne",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recapitulatif_foncier_rows')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== id));
      
      toast({
        title: "Ligne supprimée",
        description: "La ligne a été supprimée avec succès",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la ligne",
        variant: "destructive",
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

  // Load entries on mount and when user changes
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