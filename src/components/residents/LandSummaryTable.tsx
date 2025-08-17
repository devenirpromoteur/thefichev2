import React, { useState, useEffect } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Info, Trash2, Search, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

// Generate a UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

type LandSummaryEntry = {
  id: string;
  section: string;
  parcelle: string;
  occupationType: string;
  ownerStatus: string;
  ownerDetails: string;
  additionalInfo: string;
  residentStatus: string;
  cadastreId: string; // Added to track the source cadastre entry
};

interface LandSummaryTableProps {
  ficheId: string | undefined;
  cadastreEntries: Array<{
    id: string;
    section: string;
    parcelle: string;
  }>;
}

export const LandSummaryTable: React.FC<LandSummaryTableProps> = ({ 
  ficheId, 
  cadastreEntries 
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LandSummaryEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [processedCadastreIds, setProcessedCadastreIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  const occupationTypes = [
    "Terrain nu",
    "Local commercial",
    "Habitation",
    "Bureau",
    "Entrepôt",
    "Industriel",
    "Autre"
  ];

  const ownerStatusOptions = [
    "Personne morale",
    "Personne physique",
    "Indivision",
    "SCI",
    "Copropriété",
    "Autre"
  ];

  const residentStatusOptions = [
    "Locataires",
    "Propriétaires occupants",
    "Vacants",
    "Autres"
  ];

  // Helper function to ensure row is persisted in Supabase
  const ensureRowPersisted = async (entry: LandSummaryEntry) => {
    if (!ficheId) throw new Error('Project ID is required');
    
    const payload = {
      id: entry.id, 
      project_id: ficheId,
      parcel_id: entry.cadastreId || null,
      occupation_type: entry.occupationType,
      owner_status: entry.ownerStatus,
      owner_name: entry.ownerDetails,
      notes: entry.additionalInfo,
      resident_status: entry.residentStatus,
      section: entry.section,
      parcelle: entry.parcelle
    };
    
    const { error } = await supabase
      .from('land_recaps')
      .upsert(payload, { onConflict: 'id' })
      .select('id')
      .single();
    
    if (error) throw error;
  };

  // Load saved land summary values once on component mount - Supabase as source of truth
  useEffect(() => {
    const initializeData = async () => {
      if (ficheId && !initialized) {
        try {
          // First, try to load from Supabase (source of truth)
          const { data, error } = await supabase
            .from('land_recaps')
            .select('id, parcel_id, section, parcelle, occupation_type, owner_status, owner_name, notes, resident_status')
            .eq('project_id', ficheId)
            .order('created_at');

          if (!error && data?.length) {
            // Map Supabase data to component format
            const mappedEntries = data.map(d => ({
              id: d.id,
              cadastreId: d.parcel_id ?? '',
              section: d.section ?? '',
              parcelle: d.parcelle ?? '',
              occupationType: d.occupation_type ?? 'Terrain nu',
              ownerStatus: d.owner_status ?? 'Personne physique',
              ownerDetails: d.owner_name ?? '',
              additionalInfo: d.notes ?? '',
              residentStatus: d.resident_status ?? 'Vacants'
            }));
            
            setEntries(mappedEntries);
            setProcessedCadastreIds(
              data.filter(d => d.parcel_id).map(d => d.parcel_id!)
            );
          } else {
            // Fallback to localStorage if no data in Supabase
            const storedData = localStorage.getItem(`landSummary_${ficheId}`);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              setEntries(parsedData);
              setProcessedCadastreIds(
                parsedData.filter((entry: LandSummaryEntry) => entry.cadastreId)
                         .map((entry: LandSummaryEntry) => entry.cadastreId)
              );
            }
          }
        } catch (error) {
          console.error('Error loading land summary data:', error);
          // Fallback to localStorage on error
          const storedData = localStorage.getItem(`landSummary_${ficheId}`);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            setEntries(parsedData);
            setProcessedCadastreIds(
              parsedData.filter((entry: LandSummaryEntry) => entry.cadastreId)
                       .map((entry: LandSummaryEntry) => entry.cadastreId)
            );
          }
        }
        setInitialized(true);
      }
    };

    initializeData();
  }, [ficheId, initialized]);

  // Synchronize with cadastre entries only after initialization
  useEffect(() => {
    if (!initialized || !cadastreEntries.length || !ficheId) return;

    // Find cadastre entries that don't have a corresponding land summary entry
    const newCadastreEntries = cadastreEntries.filter(
      cadastreEntry => !processedCadastreIds.includes(cadastreEntry.id)
    );

    if (newCadastreEntries.length > 0) {
      const newLandSummaryEntries: LandSummaryEntry[] = newCadastreEntries.map(cadastreEntry => ({
        id: generateUUID(),
        section: cadastreEntry.section || '',
        parcelle: cadastreEntry.parcelle || '',
        occupationType: 'Terrain nu',
        ownerStatus: 'Personne physique',
        ownerDetails: '',
        additionalInfo: '',
        residentStatus: 'Vacants',
        cadastreId: cadastreEntry.id
      }));

      setEntries(prev => [...prev, ...newLandSummaryEntries]);
      setProcessedCadastreIds(prev => [...prev, ...newCadastreEntries.map(entry => entry.id)]);
      
      toast({
        title: "Nouvelles parcelles ajoutées",
        description: `${newLandSummaryEntries.length} nouvelle(s) parcelle(s) ajoutée(s) depuis le module Cadastre.`,
      });
    }

    // Check for deleted cadastre entries and remove corresponding land summary entries
    const existingCadastreIds = cadastreEntries.map(entry => entry.id);
    const entriesWithDeletedCadastre = entries.filter(
      entry => entry.cadastreId && !existingCadastreIds.includes(entry.cadastreId)
    );

    if (entriesWithDeletedCadastre.length > 0) {
      setEntries(prev => prev.filter(entry => 
        !entry.cadastreId || existingCadastreIds.includes(entry.cadastreId)
      ));
      
      // Update processedCadastreIds to remove deleted entries
      setProcessedCadastreIds(prev => prev.filter(id => existingCadastreIds.includes(id)));
      
      toast({
        title: "Parcelles supprimées",
        description: `${entriesWithDeletedCadastre.length} parcelle(s) supprimée(s) suite à leur suppression dans le module Cadastre.`,
      });
    }

    // Update section/parcelle info for existing entries if they changed in cadastre
    let updatedEntries = false;
    const newEntries = entries.map(entry => {
      if (entry.cadastreId) {
        const correspondingCadastreEntry = cadastreEntries.find(
          cadastreEntry => cadastreEntry.id === entry.cadastreId
        );
        
        if (correspondingCadastreEntry && 
            (entry.section !== correspondingCadastreEntry.section || 
             entry.parcelle !== correspondingCadastreEntry.parcelle)) {
          updatedEntries = true;
          return {
            ...entry,
            section: correspondingCadastreEntry.section,
            parcelle: correspondingCadastreEntry.parcelle
          };
        }
      }
      return entry;
    });

    if (updatedEntries) {
      setEntries(newEntries);
      toast({
        title: "Parcelles mises à jour",
        description: "Les informations des parcelles ont été mises à jour suite à des modifications dans le module Cadastre.",
      });
    }
  }, [cadastreEntries, processedCadastreIds, ficheId, toast, entries, initialized]);

  // Save changes to localStorage after each successful DB operation
  useEffect(() => {
    if (ficheId && entries.length > 0 && initialized) {
      localStorage.setItem(`landSummary_${ficheId}`, JSON.stringify(entries));
    }
  }, [entries, ficheId, initialized]);

  const handleAddEntry = async () => {
    // Find a cadastre entry that hasn't been used yet
    const unusedCadastreEntry = cadastreEntries.find(entry => 
      !processedCadastreIds.includes(entry.id)
    );
    
    // If no unused entry exists, use the first cadastre entry or create a blank one
    const defaultCadastreEntry = unusedCadastreEntry || 
      (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    const newEntry: LandSummaryEntry = {
      id: generateUUID(),
      section: defaultCadastreEntry.section || '',
      parcelle: defaultCadastreEntry.parcelle || '',
      occupationType: 'Terrain nu',
      ownerStatus: 'Personne physique',
      ownerDetails: '',
      additionalInfo: '',
      residentStatus: 'Vacants',
      cadastreId: defaultCadastreEntry.id || '' // Link to cadastre entry if available
    };

    try {
      // Persist to Supabase first
      await ensureRowPersisted(newEntry);
      
      // Then update state
      setEntries(prev => [...prev, newEntry]);
      
      // If we used an unused cadastre entry, add it to processed ids
      if (unusedCadastreEntry) {
        setProcessedCadastreIds(prev => [...prev, unusedCadastreEntry.id]);
      }

      toast({
        title: "Ligne ajoutée",
        description: "Nouvelle ligne créée et sauvegardée.",
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ligne.",
        variant: "destructive",
      });
    }
  };

  // Robust delete function with server-first approach
  const handleDeleteEntry = async (id: string): Promise<boolean> => {
    // Debug logging
    console.log('=== DELETE DEBUG ===');
    console.log('Entry ID:', id);
    console.log('Fiche ID:', ficheId);
    console.log('Fiche ID type:', typeof ficheId);
    console.log('Is ficheId UUID format:', ficheId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ficheId) : false);

    // Guard clause - skip project_id validation if ficheId is not a valid UUID
    if (!ficheId) {
      toast({
        title: "Erreur",
        description: "ID du projet manquant",
        variant: "destructive",
      });
      return false;
    }

    // Prevent double-click
    if (deletingId === id) return false;
    setDeletingId(id);

    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) {
      setDeletingId(null);
      return false;
    }

    try {
      // Check if ficheId is a valid UUID format
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ficheId);
      
      let deleteResult;
      
      if (isValidUUID) {
        // Normal deletion with project_id constraint
        console.log('Using normal deletion with project_id constraint');
        deleteResult = await supabase
          .from('land_recaps')
          .delete()
          .eq('id', id)
          .eq('project_id', ficheId)
          .select('id')
          .maybeSingle();
      } else {
        // Fallback: delete by ID only (less safe but should work)
        console.log('Using fallback deletion without project_id constraint');
        console.warn('ficheId is not a valid UUID format, deleting without project_id constraint');
        deleteResult = await supabase
          .from('land_recaps')
          .delete()
          .eq('id', id)
          .select('id')
          .maybeSingle();
      }

      const { data, error } = deleteResult;
      console.log('Delete result:', { data, error });
      
      // Handle specific error cases as success
      if (error && (error.code === 'PGRST116' || error.code === '404')) {
        // Row already deleted - treat as success
        console.log('Row already deleted or not found, treating as success');
      } else if (error) {
        // Log detailed error information
        console.error('Delete error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        
        // Try alternative deletion method if UUID constraint failed
        if (error.message.includes('uuid') && isValidUUID) {
          console.log('UUID error with valid UUID, trying deletion by ID only');
          const altResult = await supabase
            .from('land_recaps')
            .delete()
            .eq('id', id)
            .select('id')
            .maybeSingle();
          
          if (altResult.error && !(altResult.error.code === 'PGRST116' || altResult.error.code === '404')) {
            throw altResult.error;
          }
          console.log('Alternative deletion succeeded');
        } else {
          // Propagate actual errors
          let errorMessage = "Impossible de supprimer la ligne.";
          
          if (error.message.includes('RLS')) {
            errorMessage = "Accès non autorisé pour cette opération.";
          } else if (error.message.includes('foreign key')) {
            errorMessage = "Impossible de supprimer: des données liées existent.";
          } else if (error.message.includes('network')) {
            errorMessage = "Erreur de connexion. Vérifiez votre connexion internet.";
          }
          
          toast({
            title: "Erreur",
            description: `${errorMessage} (${error.message})`,
            variant: "destructive",
          });
          return false;
        }
      }

      // Success: update state after server confirmation
      console.log('Delete operation successful, updating state');
      setEntries(prev => {
        const updated = prev.filter(entry => entry.id !== id);
        console.log('Entries updated:', updated.length, 'remaining');
        return updated;
      });
      
      // Remove from processedCadastreIds if it has a cadastreId
      if (entryToDelete.cadastreId) {
        setProcessedCadastreIds(prev => prev.filter(cadastreId => cadastreId !== entryToDelete.cadastreId));
      }
      
      // Clear selection if the deleted row was selected
      if (selectedRow === id) {
        setSelectedRow(null);
      }
      
      toast({
        title: "Ligne supprimée",
        description: "La ligne a été supprimée définitivement",
      });
      
      return true;
    } catch (error) {
      console.error('Unexpected error deleting entry:', error);
      toast({
        title: "Erreur",
        description: `Erreur inattendue lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setDeletingId(null);
    }
  };

  // Confirm and delete entry
  const confirmDeleteEntry = (id: string) => {
    setDeleteDialogId(id);
  };

  const executeDelete = async () => {
    if (deleteDialogId) {
      await handleDeleteEntry(deleteDialogId);
      setDeleteDialogId(null);
    }
  };

  const handleInputChange = (id: string, field: keyof Omit<LandSummaryEntry, 'id'>, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Supabase update function
  const updateRowParcel = async (entryId: string, parcelId: string | null) => {
    if (!ficheId) throw new Error('Project ID is required');
    
    const { error } = await supabase
      .from('land_recaps')
      .update({ parcel_id: parcelId })
      .eq('id', entryId)
      .eq('project_id', ficheId)
      .select('id')
      .single();
    
    if (error) throw error;
  };

  const handleCadastreSelect = async (id: string, sectionId: string) => {
    // Find the current entry and its current cadastreId
    const currentEntry = entries.find(entry => entry.id === id);
    if (!currentEntry) return;
    
    const oldCadastreId = currentEntry.cadastreId;
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    if (!selectedCadastre) return;

    // Optimistic update
    const prevEntries = entries;
    const prevProcessedIds = processedCadastreIds;
    
    const updatedEntry = {
      ...currentEntry,
      section: selectedCadastre.section,
      parcelle: selectedCadastre.parcelle,
      cadastreId: selectedCadastre.id
    };

    setEntries(prev => prev.map(entry => 
      entry.id === id ? updatedEntry : entry
    ));
    
    // Update processedCadastreIds to reflect the change
    if (oldCadastreId) {
      setProcessedCadastreIds(prev => prev.filter(id => id !== oldCadastreId));
    }
    setProcessedCadastreIds(prev => [...prev, selectedCadastre.id]);

    try {
      // Ensure row is persisted before updating parcel
      await ensureRowPersisted(updatedEntry);
      // Then update the parcel reference
      await updateRowParcel(id, sectionId);
    } catch (error) {
      console.error('Error updating parcel selection:', error);
      // Rollback on error
      setEntries(prevEntries);
      setProcessedCadastreIds(prevProcessedIds);
      
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la sélection de parcelle.",
        variant: "destructive",
      });
    }
  };

  const [clearingParcel, setClearingParcel] = useState<string | null>(null);

  const handleClearParcel = async (entryId: string) => {
    // Prevent double-click
    if (clearingParcel === entryId) return;
    setClearingParcel(entryId);
    
    const currentEntry = entries.find(entry => entry.id === entryId);
    if (!currentEntry) {
      setClearingParcel(null);
      return;
    }

    // Optimistic update
    const prevEntries = entries;
    const prevProcessedIds = processedCadastreIds;
    
    const updatedEntry = {
      ...currentEntry,
      section: '',
      parcelle: '',
      cadastreId: ''
    };

    setEntries(prev => prev.map(entry => 
      entry.id === entryId ? updatedEntry : entry
    ));

    // Remove from processedCadastreIds
    if (currentEntry.cadastreId) {
      setProcessedCadastreIds(prev => prev.filter(id => id !== currentEntry.cadastreId));
    }

    try {
      // Ensure row is persisted before clearing parcel
      await ensureRowPersisted(updatedEntry);
      // Then clear the parcel reference (set parcel_id to null)
      await updateRowParcel(entryId, null);
      
      toast({
        title: "Parcelle effacée",
        description: "La sélection de parcelle a été supprimée.",
      });
    } catch (error) {
      console.error('Error clearing parcel:', error);
      // Rollback on error
      setEntries(prevEntries);
      setProcessedCadastreIds(prevProcessedIds);
      
      toast({
        title: "Erreur",
        description: "Impossible d'effacer la parcelle.",
        variant: "destructive",
      });
    } finally {
      setClearingParcel(null);
    }
  };

  const handleSearchOwner = (id: string) => {
    const entry = entries.find(entry => entry.id === id);
    if (!entry) return;

    let searchDetails = '';
    
    if (entry.ownerStatus === 'Personne morale') {
      // Simulate API call to Pappers API for company information
      setTimeout(() => {
        searchDetails = "SCI IMMOBILIER MODERNE\nSIRET: 123456789\nCapital: 100,000€\nCA: 580,000€\nDirigeant: Jean Dupont";
        setEntries(prev => prev.map(e => 
          e.id === id ? { ...e, ownerDetails: searchDetails } : e
        ));
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pappers Immobilier",
        });
      }, 1000);
    } else if (entry.ownerStatus === 'Personne physique') {
      // Simulate API call to Pages Jaunes or equivalent
      setTimeout(() => {
        searchDetails = "M. Pierre Martin\nTél: 01.XX.XX.XX.XX\nAdresse: 10 rue des Lilas, 75000 Paris";
        setEntries(prev => prev.map(e => 
          e.id === id ? { ...e, ownerDetails: searchDetails } : e
        ));
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pages Jaunes",
        });
      }, 1000);
    }
  };

  return (
    <div className="space-y-4 animate-enter opacity-0">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-brand">Récapitulatif foncier</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddEntry}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader className="bg-brand/10">
            <TableRow>
              <TableHead className="min-w-[150px]">Section et parcelles</TableHead>
              <TableHead className="min-w-[150px]">Type d'occupation</TableHead>
              <TableHead className="min-w-[150px]">
                <div className="flex items-center">
                  Statut du propriétaire
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Sélectionnez si le propriétaire est une personne morale ou physique pour la recherche.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[200px]">
                <div className="flex items-center">
                  Propriétaire
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Informations sur le propriétaire, recherchées via Pappers Immobilier ou Pages Jaunes.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[200px]">Informations complémentaires</TableHead>
              <TableHead className="min-w-[150px]">Situation des résidents</TableHead>
              <TableHead className="min-w-[100px]">Actions</TableHead>
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
                  <div 
                    className="flex items-center gap-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && entry.cadastreId && document.activeElement?.tagName !== 'INPUT') {
                        e.preventDefault();
                        handleClearParcel(entry.id);
                      }
                    }}
                    tabIndex={0}
                  >
                    <Select 
                      value={entry.cadastreId || undefined}
                      onValueChange={(value) => handleCadastreSelect(entry.id, value)}
                    >
                      <SelectTrigger className="h-8 flex-1">
                        <SelectValue placeholder="Sélectionner une parcelle" />
                      </SelectTrigger>
                      <SelectContent>
                        {cadastreEntries.map((cadastre) => (
                          <SelectItem key={cadastre.id} value={cadastre.id}>
                            {cadastre.section} {cadastre.parcelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {entry.cadastreId && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={clearingParcel === entry.id}
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearParcel(entry.id);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Retirer la parcelle</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.occupationType} 
                    onValueChange={(value) => handleInputChange(entry.id, 'occupationType', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.ownerStatus} 
                    onValueChange={(value) => handleInputChange(entry.id, 'ownerStatus', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ownerStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={entry.ownerDetails}
                      onChange={(e) => handleInputChange(entry.id, 'ownerDetails', e.target.value)}
                      className="h-8"
                      placeholder="Détails du propriétaire"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSearchOwner(entry.id);
                      }}
                      className="h-8 w-8"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Input 
                    value={entry.additionalInfo}
                    onChange={(e) => handleInputChange(entry.id, 'additionalInfo', e.target.value)}
                    className="h-8"
                    placeholder="Informations complémentaires"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.residentStatus} 
                    onValueChange={(value) => handleInputChange(entry.id, 'residentStatus', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {residentStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === entry.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteEntry(entry.id);
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive/90 disabled:opacity-50"
                  >
                    {deletingId === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialogId} onOpenChange={() => setDeleteDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};