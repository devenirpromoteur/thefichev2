import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ExistingValueEntry = {
  id: string;
  section: string;
  parcelle: string;
  type: string;
  surface: number | '';
  abattement: number | '';
  prixM2: number | '';
  tauxCap: number | '';
  etat: number | '';
  valeur: number;
  dvf: number | '';
  parcelId?: string; // For linking to cadastre
};

export type ExistingValueState = {
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

const PROPERTY_TYPES = [
  { label: "Logements", value: "LOGEMENTS" },
  { label: "Parkings", value: "PARKINGS" },
  { label: "Autres", value: "AUTRES" }
];

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
}

export const useExistingValues = (projectId: string, cadastreEntries: CadastreEntry[] = []) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ExistingValueEntry[]>([]);
  const [state, setState] = useState<ExistingValueState>({
    loading: false,
    saving: null,
    deleting: null,
    error: null,
  });

  const getPropertyTypeLabel = (dbValue: string): string => {
    const type = PROPERTY_TYPES.find(t => t.value === dbValue);
    return type ? type.label : dbValue;
  };

  const calculateValue = useCallback((entry: ExistingValueEntry): number => {
    // Early return if essential values are missing
    if (entry.surface === '' || entry.abattement === '' || entry.prixM2 === '' || entry.etat === '') {
      return 0;
    }

    const surface = Number(entry.surface);
    const abattement = Number(entry.abattement);
    const prixM2 = Number(entry.prixM2);
    const etat = Number(entry.etat);
    
    // Special calculation for parking
    if (entry.type === 'Parkings' || entry.type === 'PARKINGS') {
      const tauxCap = Number(entry.tauxCap);
      const baseValue = surface * prixM2 * abattement * etat;
      
      if (tauxCap && tauxCap > 0) {
        return baseValue / (tauxCap * 1000);
      } else {
        return baseValue / 1000;
      }
    }
    // For residential properties
    else if (entry.type === 'Logements' || entry.type === 'LOGEMENTS') {
      return (surface * abattement * prixM2 * etat) / 1000;
    } 
    // For commercial/tertiary properties
    else {
      const tauxCap = Number(entry.tauxCap);
      if (tauxCap && tauxCap > 0) {
        return (surface * abattement * prixM2 * etat) / (tauxCap * 1000);
      } else {
        return (surface * abattement * prixM2 * etat) / 1000;
      }
    }
  }, []);

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
        .from('existing_values')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (error) {
        if (error.code === '42501') {
          throw new Error("Accès non autorisé");
        }
        throw new Error(`Erreur de chargement: ${error.message}`);
      }

      const mappedEntries: ExistingValueEntry[] = (data || []).map(item => {
        const correspondingCadastre = cadastreEntries.find(cadastre => 
          cadastre.section === item.parcel_section && 
          cadastre.parcelle === item.parcel_code
        );

        return {
          id: item.id,
          section: item.parcel_section || '',
          parcelle: item.parcel_code || '',
          type: getPropertyTypeLabel(item.type),
          surface: item.surface_or_count || '',
          abattement: item.abatt || 1,
          prixM2: item.price_m2 || '',
          tauxCap: item.tcap || 0.05,
          etat: item.etat || 1,
          valeur: 0, // Will be calculated
          dvf: item.dvf || '',
          parcelId: correspondingCadastre?.id || ''
        };
      });

      // Calculate values for all entries
      const entriesWithValues = mappedEntries.map(entry => ({
        ...entry,
        valeur: calculateValue(entry)
      }));

      setEntries(entriesWithValues);
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
  }, [projectId, cadastreEntries, calculateValue, toast]);

  // Server-first add
  const addEntry = useCallback(async (cadastreEntry?: CadastreEntry) => {
    if (!projectId || state.saving) return;

    setState(prev => ({ ...prev, saving: 'new' }));

    const defaultCadastre = cadastreEntry || (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    const newEntryData = {
      section: defaultCadastre.section || '',
      parcelle: defaultCadastre.parcelle || '',
      type: 'Logements',
      surface: '' as number | '',
      abattement: 1 as number | '',
      prixM2: '' as number | '',
      tauxCap: 0.05 as number | '',
      etat: 1 as number | '',
      dvf: '' as number | '',
      parcelId: defaultCadastre.id || ''
    };

    try {
      const dbType = PROPERTY_TYPES.find(t => t.label === newEntryData.type)?.value || 'AUTRES';
      
      const { data, error } = await supabase
        .from('existing_values')
        .insert({
          project_id: projectId,
          parcel_section: newEntryData.section || null,
          parcel_code: newEntryData.parcelle || null,
          type: dbType,
          surface_or_count: newEntryData.surface || null,
          abatt: newEntryData.abattement || 1,
          price_m2: newEntryData.prixM2 || null,
          price_unit: null,
          tcap: newEntryData.tauxCap || 0.05,
          etat: newEntryData.etat || 1,
          dvf: newEntryData.dvf || null,
          notes: null
        })
        .select('id')
        .single();

      if (error) {
        if (error.code === '42501') {
          throw new Error("Création non autorisée");
        }
        if (error.code === '23505') {
          throw new Error("Cette parcelle existe déjà");
        }
        throw new Error(`Erreur de création: ${error.message}`);
      }

      const newEntry: ExistingValueEntry = {
        ...newEntryData,
        id: data.id,
        valeur: calculateValue(newEntryData as ExistingValueEntry)
      };
      
      setEntries(prev => [newEntry, ...prev]);
      setState(prev => ({ ...prev, saving: null }));
      
      toast({
        title: "Valeur ajoutée",
        description: "La nouvelle valeur a été créée avec succès.",
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
  }, [projectId, cadastreEntries, calculateValue, state.saving, toast]);

  // Debounced update function
  const debouncedUpdate = useMemo(
    () => debounce(async (entryId: string, updatedEntry: ExistingValueEntry) => {
      if (!projectId) return;

      try {
        const dbType = PROPERTY_TYPES.find(t => t.label === updatedEntry.type)?.value || 'AUTRES';
        
        const { error } = await supabase
          .from('existing_values')
          .update({
            parcel_section: updatedEntry.section || null,
            parcel_code: updatedEntry.parcelle || null,
            type: dbType,
            surface_or_count: updatedEntry.surface || null,
            abatt: updatedEntry.abattement || 1,
            price_m2: updatedEntry.prixM2 || null,
            tcap: updatedEntry.tauxCap || 0.05,
            etat: updatedEntry.etat || 1,
            dvf: updatedEntry.dvf || null
          })
          .eq('id', entryId)
          .eq('project_id', projectId);

        if (error) {
          if (error.code === '42501') {
            throw new Error("Modification non autorisée");
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
    }, 500),
    [projectId, toast]
  );

  // Update entry with auto-save
  const updateEntry = useCallback((id: string, field: keyof ExistingValueEntry, value: string | number) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry, [field]: value };
        
        // Recalculate the value after any input change
        if (field !== 'valeur' && field !== 'dvf') {
          updatedEntry.valeur = calculateValue(updatedEntry);
        }
        
        // Auto-save changes with debounce
        if (id && !id.startsWith('tmp_')) {
          debouncedUpdate(id, updatedEntry);
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  }, [calculateValue, debouncedUpdate]);

  // Server-first delete with optimistic rollback
  const deleteEntry = useCallback(async (id: string) => {
    if (!projectId || state.deleting) return;

    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) return;

    setState(prev => ({ ...prev, deleting: id }));

    try {
      const { data, error } = await supabase
        .from('existing_values')
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
        title: "Valeur supprimée",
        description: "La valeur a été supprimée avec succès.",
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
    deleteEntry,
    refetch: fetchEntries,
    totalValue: useMemo(() => entries.reduce((sum, entry) => sum + entry.valeur, 0), [entries])
  };
};