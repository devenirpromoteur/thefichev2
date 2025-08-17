import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Minus, Info, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { supabase } from '@/integrations/supabase/client';

type PropertyEntry = {
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
  cadastreId: string; // Added to track the source cadastre entry
};

interface PropertyValueTableProps {
  ficheId: string | undefined;
  projectId: string;
  cadastreEntries: Array<{
    id: string;
    section: string;
    parcelle: string;
  }>;
}

export const PropertyValueTable: React.FC<PropertyValueTableProps> = ({ 
  ficheId, 
  projectId,
  cadastreEntries 
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<PropertyEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [processedCadastreIds, setProcessedCadastreIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; entryId: string | null }>({ open: false, entryId: null });

  // Map UI property types to database types
  const propertyTypes = [
    { label: "Logements", value: "LOGEMENTS" },
    { label: "Parkings", value: "PARKINGS" },
    { label: "Autres", value: "AUTRES" }
  ];

  const getPropertyTypeLabel = (dbValue: string): string => {
    const type = propertyTypes.find(t => t.value === dbValue);
    return type ? type.label : dbValue;
  };

  // Load existing values from Supabase
  const loadExistingValues = useCallback(async () => {
    try {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          variant: "destructive",
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour accéder à ces données.",
        });
        return;
      }

      const { data, error } = await supabase
        .from('existing_values')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at');

      if (error) {
        console.error('Error loading existing values:', error);
        if (error.code === '42501') {
          toast({
            variant: "destructive",
            title: "Erreur d'autorisation",
            description: "Vous n'êtes pas autorisé à accéder à ces données.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de chargement",
            description: "Impossible de charger les données existantes.",
          });
        }
        return;
      }

      if (data) {
        const mappedEntries: PropertyEntry[] = data.map(item => {
          // Find the corresponding cadastre entry
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
            cadastreId: correspondingCadastre?.id || '' // Map back to cadastre ID
          };
        });

        // Calculate values for all entries
        const entriesWithValues = mappedEntries.map(entry => ({
          ...entry,
          valeur: calculateValue(entry)
        }));

        setEntries(entriesWithValues);
        
        // Update processedCadastreIds based on loaded data
        const usedCadastreIds = entriesWithValues
          .map(entry => entry.cadastreId)
          .filter(id => id !== '');
        setProcessedCadastreIds(usedCadastreIds);
      }
    } catch (error) {
      console.error('Error in loadExistingValues:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast, cadastreEntries]);

  // Load data on mount and when cadastre entries change
  useEffect(() => {
    if (projectId && cadastreEntries.length > 0) {
      loadExistingValues();
    }
  }, [projectId, loadExistingValues, cadastreEntries]);

  // Re-map cadastre IDs when cadastre entries change (for existing data)
  useEffect(() => {
    if (cadastreEntries.length > 0 && entries.length > 0) {
      setEntries(prevEntries => prevEntries.map(entry => {
        const correspondingCadastre = cadastreEntries.find(cadastre => 
          cadastre.section === entry.section && 
          cadastre.parcelle === entry.parcelle
        );
        
        return {
          ...entry,
          cadastreId: correspondingCadastre?.id || ''
        };
      }));
    }
  }, [cadastreEntries]);

  // Create new entry in database
  const createEntry = async (newEntryData: Omit<PropertyEntry, 'id' | 'valeur'>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          variant: "destructive",
          title: "Erreur d'authentification",
          description: "Vous devez être connecté pour créer une entrée.",
        });
        return null;
      }

      const dbType = propertyTypes.find(t => t.label === newEntryData.type)?.value || 'AUTRES';
      
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
        console.error('Error creating entry:', error);
        if (error.code === '42501') {
          toast({
            variant: "destructive",
            title: "Erreur d'autorisation",
            description: "Vous n'êtes pas autorisé à créer cette entrée.",
          });
        } else if (error.code === '23503') {
          toast({
            variant: "destructive",
            title: "Erreur de référence",
            description: "Le projet spécifié n'existe pas.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de création",
            description: "Impossible de créer la nouvelle entrée.",
          });
        }
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in createEntry:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite lors de la création.",
      });
      return null;
    }
  };

  const handleAddEntry = async () => {
    if (saving) return; // Prevent double-click
    
    setSaving('new');
    
    // Find a cadastre entry that hasn't been used yet
    const unusedCadastreEntry = cadastreEntries.find(entry => 
      !processedCadastreIds.includes(entry.id)
    );
    
    // If no unused entry exists, use the first cadastre entry or create a blank one
    const defaultCadastreEntry = unusedCadastreEntry || 
      (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    const newEntryData = {
      section: defaultCadastreEntry.section || '',
      parcelle: defaultCadastreEntry.parcelle || '',
      type: 'Logements',
      surface: '' as number | '',
      abattement: 1 as number | '',
      prixM2: '' as number | '',
      tauxCap: 0.05 as number | '',
      etat: 1 as number | '',
      dvf: '' as number | '',
      cadastreId: defaultCadastreEntry.id || ''
    };
    
    const entryId = await createEntry(newEntryData);
    
    if (entryId) {
      const newEntry: PropertyEntry = {
        ...newEntryData,
        id: entryId,
        valeur: calculateValue(newEntryData as PropertyEntry)
      };
      
      setEntries(prev => [newEntry, ...prev]); // Add at beginning
      
      // If we used an unused cadastre entry, add it to processed ids
      if (unusedCadastreEntry) {
        setProcessedCadastreIds(prev => [...prev, unusedCadastreEntry.id]);
      }
      
      toast({
        title: "Ligne ajoutée",
        description: "La nouvelle ligne a été créée avec succès.",
      });
    }
    
    setSaving(null);
  };

  const deleteEntry = async (id: string) => {
    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) return;

    // Check if it's a temporary entry (not yet saved)
    const isTemporary = !id || id.startsWith('tmp_');
    
    // Optimistic update
    setEntries(prev => prev.filter(entry => entry.id !== id));
    if (selectedRow === id) {
      setSelectedRow(null);
    }
    
    if (entryToDelete.cadastreId) {
      setProcessedCadastreIds(prev => prev.filter(cadastreId => cadastreId !== entryToDelete.cadastreId));
    }

    // If temporary, no need to delete from database
    if (isTemporary) {
      toast({
        title: "Ligne supprimée",
        description: "La ligne temporaire a été supprimée.",
      });
      return;
    }

    // Delete from database
    try {
      const { error } = await supabase
        .from('existing_values')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error deleting entry:', error);
        // Rollback on error
        setEntries(prev => [entryToDelete, ...prev]);
        if (entryToDelete.cadastreId) {
          setProcessedCadastreIds(prev => [...prev, entryToDelete.cadastreId]);
        }
        
        if (error.code === '42501') {
          toast({
            variant: "destructive",
            title: "Erreur d'autorisation",
            description: "Vous n'êtes pas autorisé à supprimer cette entrée.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de suppression",
            description: "Impossible de supprimer la ligne.",
          });
        }
        return;
      }

      toast({
        title: "Ligne supprimée",
        description: "La ligne a été supprimée avec succès.",
      });
    } catch (error) {
      console.error('Error in deleteEntry:', error);
      // Rollback on error
      setEntries(prev => [entryToDelete, ...prev]);
      if (entryToDelete.cadastreId) {
        setProcessedCadastreIds(prev => [...prev, entryToDelete.cadastreId]);
      }
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite lors de la suppression.",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, entryId: id });
  };

  const confirmDelete = () => {
    if (deleteConfirm.entryId) {
      deleteEntry(deleteConfirm.entryId);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (entryId: string, updatedEntry: PropertyEntry) => {
      try {
        const dbType = propertyTypes.find(t => t.label === updatedEntry.type)?.value || 'AUTRES';
        
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
          console.error('Error updating entry:', error);
          if (error.code === '42501') {
            toast({
              variant: "destructive",
              title: "Erreur d'autorisation",
              description: "Vous n'êtes pas autorisé à modifier cette entrée.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erreur de sauvegarde",
              description: "Impossible de sauvegarder les modifications.",
            });
          }
        }
      } catch (error) {
        console.error('Error in debouncedSave:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur inattendue s'est produite lors de la sauvegarde.",
        });
      }
    }, 1000),
    [projectId, toast, propertyTypes]
  );

  const handleInputChange = (id: string, field: keyof PropertyEntry, value: string | number) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        // Convert to appropriate types based on the field
        const updatedEntry = { ...entry, [field]: value };
        
        // Recalculate the value after any input change
        if (field !== 'valeur' && field !== 'dvf') {
          const calculated = calculateValue(updatedEntry);
          updatedEntry.valeur = calculated;
        }
        
        // Auto-save changes with debounce (only for existing entries)
        if (id && !id.startsWith('tmp_')) {
          debouncedSave(id, updatedEntry);
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  };

  // Simple debounce implementation
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  }

  const calculateValue = (entry: PropertyEntry): number => {
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
      
      // Base calculation for parking: (Nb_places × Prix_unitaire) × Abattement × État
      const baseValue = surface * prixM2 * abattement * etat;
      
      // If using capitalization rate for tertiary properties
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
      if (!tauxCap) return 0; // Prevent division by zero
      
      return (surface * abattement * prixM2 * etat) / (tauxCap * 1000);
    }
  };

  const getTotalValue = (): number => {
    return entries.reduce((total, entry) => {
      // Use DVF value if available, otherwise use calculated value
      const entryValue = entry.dvf !== '' ? Number(entry.dvf) : entry.valeur;
      return total + entryValue;
    }, 0);
  };

  const getTotalEstimatedValue = (): number => {
    return entries.reduce((total, entry) => total + entry.valeur, 0);
  };

  const getTotalDVFValue = (): number => {
    return entries.reduce((total, entry) => {
      if (entry.dvf !== '') {
        return total + Number(entry.dvf);
      }
      return total;
    }, 0);
  };

  // Debounced parcel save function  
  const debouncedParcelSave = useCallback(
    debounce(async (entryId: string, section: string, parcelle: string) => {
      try {
        const { error } = await supabase
          .from('existing_values')
          .update({
            parcel_section: section || null,
            parcel_code: parcelle || null
          })
          .eq('id', entryId)
          .eq('project_id', projectId)
          .select('id')
          .single();

        if (error) {
          console.error('Error saving parcel selection:', error);
          if (error.code === '42501') {
            toast({
              variant: "destructive",
              title: "Erreur d'autorisation",
              description: "Vous n'êtes pas autorisé à modifier cette parcelle.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erreur de sauvegarde",
              description: "Impossible de sauvegarder la sélection de parcelle.",
            });
          }
        }
      } catch (error) {
        console.error('Error in debouncedParcelSave:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur inattendue s'est produite lors de la sauvegarde.",
        });
      }
    }, 300),
    [projectId, toast]
  );

  const handleCadastreSelect = async (id: string, sectionId: string) => {
    // Find the current entry and its current cadastreId
    const currentEntry = entries.find(entry => entry.id === id);
    const oldCadastreId = currentEntry?.cadastreId;
    
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    if (selectedCadastre) {
      // Optimistic update
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { 
          ...entry, 
          section: selectedCadastre.section,
          parcelle: selectedCadastre.parcelle,
          cadastreId: selectedCadastre.id
        } : entry
      ));
      
      // Update processedCadastreIds to reflect the change
      if (oldCadastreId) {
        setProcessedCadastreIds(prev => prev.filter(id => id !== oldCadastreId));
      }
      setProcessedCadastreIds(prev => [...prev, selectedCadastre.id]);

      // Save to database (only for existing entries)
      if (id && !id.startsWith('tmp_')) {
        debouncedParcelSave(id, selectedCadastre.section, selectedCadastre.parcelle);
      }
    }
  };

  // Format number to display with appropriate decimal places and K€
  const formatCurrency = (value: number | ''): string => {
    if (value === '') return '0 K€';
    return `${value.toFixed(2)} K€`;
  };

  // Helper function to get placeholder text based on property type
  const getSurfacePlaceholder = (type: string): string => {
    return type === 'Parkings' ? 'Nombre de places' : 'Surface (m²)';
  };

  // Helper function to get placeholder text for price field based on property type
  const getPricePlaceholder = (type: string): string => {
    return type === 'Parkings' ? 'Prix par place' : 'Prix au m²';
  };

  return (
    <div className="space-y-4 animate-enter opacity-0">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-brand">Valeurs de l'existant</h2>
        <div className="flex space-x-2">
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddEntry}
            disabled={saving === 'new' || loading}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> 
            {saving === 'new' ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader className="bg-brand/10">
            <TableRow>
              <TableHead className="min-w-[150px]">Section et parcelles</TableHead>
              <TableHead className="min-w-[120px]">Type</TableHead>
              <TableHead className="min-w-[120px]">Surface ou Nombre</TableHead>
              <TableHead className="min-w-[100px]">
                <div className="flex items-center">
                  Abat'
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Coefficient d'abattement entre la surface brute et la surface réelle.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <div className="flex items-center">
                  Estim'Prix M2
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <div className="flex items-center">
                  T.cap
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Ratio de rentabilité (NOI / valeur du bien).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">
                <div className="flex items-center">
                  État
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Coefficient reflétant l'état du bâtiment (de 0,7 à 1,25).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Valeur estimée (K€)</TableHead>
              <TableHead className="min-w-[120px]">
                <div className="flex items-center">
                  DVF
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Valeur(s) trouvée(s) sur Pappers Immo ou DVF.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow 
                key={entry.id}
                onClick={() => setSelectedRow(entry.id)}
                className={`cursor-pointer transition-colors ${selectedRow === entry.id ? 'bg-brand/5' : ''} hover:bg-brand/5`}
              >
                <TableCell>
                  <Select 
                    value={entry.cadastreId || ""}
                    onValueChange={(value) => handleCadastreSelect(entry.id, value)}
                    disabled={loading || cadastreEntries.length === 0}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={
                        loading ? "Chargement..." : 
                        cadastreEntries.length === 0 ? "Aucune parcelle cadastrale" : 
                        "Sélectionner une parcelle"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {cadastreEntries.length === 0 ? (
                        <SelectItem value="" disabled>
                          Aucune parcelle disponible
                        </SelectItem>
                      ) : (
                        cadastreEntries.map((cadastre) => (
                          <SelectItem key={cadastre.id} value={cadastre.id}>
                            {cadastre.section} {cadastre.parcelle}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                    <Select 
                    value={entry.type} 
                    onValueChange={(value) => handleInputChange(entry.id, 'type', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.label}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.surface === '' ? '' : entry.surface}
                    onChange={(e) => handleInputChange(entry.id, 'surface', e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-8"
                    min="0"
                    placeholder={getSurfacePlaceholder(entry.type)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.abattement === '' ? '' : entry.abattement}
                    onChange={(e) => handleInputChange(entry.id, 'abattement', e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-8"
                    min="0.8"
                    max="1"
                    step="0.05"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.prixM2 === '' ? '' : entry.prixM2}
                    onChange={(e) => handleInputChange(entry.id, 'prixM2', e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-8"
                    min="0"
                    placeholder={getPricePlaceholder(entry.type)}
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.tauxCap === '' ? '' : entry.tauxCap}
                    onChange={(e) => handleInputChange(entry.id, 'tauxCap', e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-8"
                    min="0.01"
                    max="0.2"
                    step="0.01"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.etat === '' ? '' : entry.etat}
                    onChange={(e) => handleInputChange(entry.id, 'etat', e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-8"
                    min="0.7"
                    max="1.25"
                    step="0.05"
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(entry.valeur)}
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.dvf === '' ? '' : entry.dvf}
                    onChange={(e) => handleInputChange(entry.id, 'dvf', e.target.value === '' ? '' : Number(e.target.value))}
                    className="h-8"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(entry.id);
                    }}
                    disabled={loading}
                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-brand/5 font-bold">
              <TableCell colSpan={7} className="text-right">Total Valeur(s) estimée(s)</TableCell>
              <TableCell colSpan={3} className="text-brand">
                {formatCurrency(getTotalEstimatedValue())}
              </TableCell>
            </TableRow>
            <TableRow className="bg-brand/5 font-bold">
              <TableCell colSpan={7} className="text-right">Total DVF</TableCell>
              <TableCell colSpan={3} className="text-brand">
                {formatCurrency(getTotalDVFValue())}
              </TableCell>
            </TableRow>
            <TableRow className="bg-brand/10 font-bold">
              <TableCell colSpan={7} className="text-right">TOTAL</TableCell>
              <TableCell colSpan={3} className="text-brand">
                {formatCurrency(getTotalValue())}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-4">
        <p>Formules de calcul :</p>
        <ul className="list-disc list-inside space-y-1 ml-4 mt-1">
          <li><span className="font-medium">Logements :</span> Valeur (K€) = (Surface × Abattement × Prix m² × État) / 1000</li>
          <li><span className="font-medium">Parkings :</span> Valeur (K€) = (Nombre de places × Prix unitaire × Abattement × État) / 1000</li>
          <li><span className="font-medium">Autres types :</span> Valeur (K€) = (Surface × Abattement × Prix m² × État) / (T.cap × 1000)</li>
        </ul>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, entryId: null })}
        title="Supprimer la ligne"
        description="Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        destructive
      />
    </div>
  );
};
