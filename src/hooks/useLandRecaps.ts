import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type LandRecapEntry = {
  id: string;
  section: string;
  parcelle: string;
  occupationType: string;
  ownerStatus: string;
  ownerName: string;
  notes: string;
  residentStatus: string;
  parcelId?: string; // For linking to cadastre
};

export type LandRecapState = {
  loading: boolean;
  saving: string | null;
  deleting: string | null;
  error: string | null;
};

export type CadastreEntry = {
  id: string;
  section: string;
  parcelle: string;
};

const OCCUPATION_TYPES = [
  "Terrain nu",
  "Local commercial",
  "Habitation",
  "Bureau",
  "Entrepôt",
  "Industriel",
  "Autre"
];

const OWNER_STATUS_OPTIONS = [
  "Personne morale",
  "Personne physique",
  "Indivision",
  "SCI",
  "Copropriété",
  "Autre"
];

const RESIDENT_STATUS_OPTIONS = [
  "Locataires",
  "Propriétaires occupants",
  "Vacants",
  "Autres"
];

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

export const useLandRecaps = (projectId: string, cadastreEntries: CadastreEntry[] = []) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LandRecapEntry[]>([]);
  const [state, setState] = useState<LandRecapState>({
    loading: false,
    saving: null,
    deleting: null,
    error: null,
  });

  // Prevent duplicate parcel assignments
  const usedParcelIds = useMemo(() => 
    entries.map(entry => entry.parcelId).filter(Boolean), 
    [entries]
  );

  // Server-first fetch
  const fetchEntries = useCallback(async () => {
    if (!projectId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("Session non valide");
      }

      const { data, error } = await supabase
        .from('land_recaps')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (error) {
        if (error.code === '42501') {
          throw new Error("Accès non autorisé");
        }
        throw new Error(`Erreur de chargement: ${error.message}`);
      }

      const mappedEntries: LandRecapEntry[] = (data || []).map(item => {
        // Try to find corresponding cadastre entry by parcel_id first, then by section/parcelle
        const correspondingCadastre = cadastreEntries.find(cadastre => 
          cadastre.id === item.parcel_id
        ) || cadastreEntries.find(cadastre => 
          cadastre.section === item.section && 
          cadastre.parcelle === item.parcelle
        );

        return {
          id: item.id,
          section: item.section || '',
          parcelle: item.parcelle || '',
          occupationType: item.occupation_type,
          ownerStatus: item.owner_status,
          ownerName: item.owner_name,
          notes: item.notes,
          residentStatus: item.resident_status,
          parcelId: correspondingCadastre?.id || item.parcel_id || ''
        };
      });

      setEntries(mappedEntries);
      setState(prev => ({ ...prev, loading: false }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: errorMessage,
      });
    }
  }, [projectId, cadastreEntries, toast]);

  // Server-first add
  const addEntry = useCallback(async (cadastreEntry?: CadastreEntry) => {
    if (!projectId || state.saving) return;

    setState(prev => ({ ...prev, saving: 'new' }));

    // Find unused cadastre entry if not provided
    const availableCadastre = cadastreEntry || 
      cadastreEntries.find(entry => !usedParcelIds.includes(entry.id)) ||
      (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    const newEntryData = {
      section: availableCadastre.section || '',
      parcelle: availableCadastre.parcelle || '',
      occupationType: 'Terrain nu',
      ownerStatus: 'Personne physique',
      ownerName: '',
      notes: '',
      residentStatus: 'Vacants',
      parcelId: availableCadastre.id || ''
    };

    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .insert({
          project_id: projectId,
          section: newEntryData.section || null,
          parcelle: newEntryData.parcelle || null,
          occupation_type: newEntryData.occupationType,
          owner_status: newEntryData.ownerStatus,
          owner_name: newEntryData.ownerName,
          notes: newEntryData.notes,
          resident_status: newEntryData.residentStatus,
          parcel_id: newEntryData.parcelId || null
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '42501') {
          throw new Error("Création non autorisée");
        }
        if (error.code === '23505') {
          throw new Error("Cette parcelle existe déjà dans le récapitulatif");
        }
        throw new Error(`Erreur de création: ${error.message}`);
      }

      const newEntry: LandRecapEntry = {
        ...newEntryData,
        id: data.id
      };
      
      setEntries(prev => [newEntry, ...prev]);
      setState(prev => ({ ...prev, saving: null }));
      
      toast({
        title: "Parcelle ajoutée",
        description: "La nouvelle parcelle a été ajoutée au récapitulatif foncier.",
      });

      return newEntry;

    } catch (error) {
      setState(prev => ({ ...prev, saving: null }));
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        variant: "destructive",
        title: "Erreur de création",
        description: errorMessage,
      });
      return null;
    }
  }, [projectId, cadastreEntries, usedParcelIds, state.saving, toast]);

  // Debounced update function
  const debouncedUpdate = useMemo(
    () => debounce(async (entryId: string, updatedEntry: LandRecapEntry) => {
      if (!projectId) return;

      try {
        const { error } = await supabase
          .from('land_recaps')
          .update({
            section: updatedEntry.section || null,
            parcelle: updatedEntry.parcelle || null,
            occupation_type: updatedEntry.occupationType,
            owner_status: updatedEntry.ownerStatus,
            owner_name: updatedEntry.ownerName,
            notes: updatedEntry.notes,
            resident_status: updatedEntry.residentStatus,
            parcel_id: updatedEntry.parcelId || null
          })
          .eq('id', entryId)
          .eq('project_id', projectId);

        if (error) {
          if (error.code === '42501') {
            throw new Error("Modification non autorisée");
          }
          if (error.code === '23505') {
            throw new Error("Cette parcelle est déjà assignée");
          }
          throw new Error(`Erreur de sauvegarde: ${error.message}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        toast({
          variant: "destructive",
          title: "Erreur de sauvegarde",
          description: errorMessage,
        });
      }
    }, 400),
    [projectId, toast]
  );

  // Update entry with auto-save
  const updateEntry = useCallback((id: string, field: keyof LandRecapEntry, value: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry, [field]: value };
        
        // Auto-save changes with debounce
        if (id && !id.startsWith('tmp_')) {
          debouncedUpdate(id, updatedEntry);
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  }, [debouncedUpdate]);

  // Update parcel assignment
  const assignParcel = useCallback((entryId: string, parcelId: string) => {
    const selectedParcel = cadastreEntries.find(entry => entry.id === parcelId);
    if (!selectedParcel) return;

    // Check for duplicates
    if (usedParcelIds.includes(parcelId)) {
      const existingEntry = entries.find(e => e.parcelId === parcelId);
      if (existingEntry && existingEntry.id !== entryId) {
        toast({
          variant: "destructive",
          title: "Parcelle déjà utilisée",
          description: "Cette parcelle est déjà assignée à une autre ligne.",
        });
        return;
      }
    }

    setEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        const updatedEntry = {
          ...entry,
          section: selectedParcel.section,
          parcelle: selectedParcel.parcelle,
          parcelId: selectedParcel.id
        };
        
        // Auto-save changes
        if (entryId && !entryId.startsWith('tmp_')) {
          debouncedUpdate(entryId, updatedEntry);
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  }, [cadastreEntries, usedParcelIds, entries, toast, debouncedUpdate]);

  // Server-first delete with optimistic rollback
  const deleteEntry = useCallback(async (id: string) => {
    if (!projectId || state.deleting) return;

    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) return;

    setState(prev => ({ ...prev, deleting: id }));

    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId)
        .select('id')
        .maybeSingle(); // Avoid 406 error

      // Handle specific error codes
      if (error) {
        if (error.code === 'PGRST116' || error.code === '404') {
          // Entry already deleted, treat as success
        } else if (error.code === '42501') {
          throw new Error("Suppression non autorisée");
        } else {
          throw new Error(`Erreur de suppression: ${error.message}`);
        }
      }

      // Remove from local state only after server confirmation
      setEntries(prev => prev.filter(entry => entry.id !== id));
      setState(prev => ({ ...prev, deleting: null }));
      
      toast({
        title: "Parcelle supprimée",
        description: "La parcelle a été supprimée du récapitulatif foncier.",
      });

      return true;

    } catch (error) {
      setState(prev => ({ ...prev, deleting: null }));
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: errorMessage,
      });
      return false;
    }
  }, [projectId, entries, state.deleting, toast]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (projectId) {
      fetchEntries();
    }
  }, [fetchEntries]);

  return {
    entries,
    state,
    addEntry,
    updateEntry,
    assignParcel,
    deleteEntry,
    refetch: fetchEntries,
    occupationTypes: OCCUPATION_TYPES,
    ownerStatusOptions: OWNER_STATUS_OPTIONS,
    residentStatusOptions: RESIDENT_STATUS_OPTIONS,
    availableParcels: useMemo(() => 
      cadastreEntries.filter(parcel => !usedParcelIds.includes(parcel.id)),
      [cadastreEntries, usedParcelIds]
    )
  };
};