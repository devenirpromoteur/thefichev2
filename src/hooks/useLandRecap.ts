import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [entries, setEntries] = useState<LandRecapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<LandRecapEntry | null>(null);

  // Load entries from localStorage
  const loadEntries = async () => {
    if (!ficheId) return;

    setIsLoading(true);
    
    // Load from localStorage
    const storedData = localStorage.getItem(`landSummary_${ficheId}`);
    const mappedEntries: LandRecapEntry[] = storedData 
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
    setEntries(mappedEntries);
    
    setIsLoading(false);
  };

  // Add new entry
  const addEntry = async (entry: Omit<LandRecapEntry, 'id'>) => {
    // Generate a temporary ID for local storage
    const tempId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    
    const newEntry: LandRecapEntry = {
      id: tempId,
      ...entry
    };

    const updatedEntries = [...entries, newEntry];
    setEntries(updatedEntries);
    
    // Save to localStorage
    localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(updatedEntries));
    
    toast({
      title: "Ligne ajoutée",
      description: "La ligne a été ajoutée avec succès",
    });
    
    return newEntry;
  };

  // Update entry
  const updateEntry = async (id: string, updates: Partial<LandRecapEntry>) => {
    const updatedEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    );
    
    setEntries(updatedEntries);
    
    // Save to localStorage
    localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(updatedEntries));
    
    return true;
  };

  // Delete entry
  const deleteEntry = async (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    
    // Save to localStorage
    localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(updatedEntries));
    
    toast({
      title: "Ligne supprimée",
      description: "La ligne a été supprimée avec succès",
    });
    
    return true;
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
  }, [ficheId]);

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