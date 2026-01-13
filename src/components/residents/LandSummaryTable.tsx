
import React, { useState, useEffect } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Info, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useRecapFoncierDelete } from '@/hooks/useRecapFoncierDelete';

type LandSummaryEntry = {
  tmpId: string; // Stable frontend key
  id?: string; // Supabase ID (only when persisted)
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
  projectId: string;
  cadastreEntries: Array<{
    id: string;
    section: string;
    parcelle: string;
  }>;
}

export const LandSummaryTable: React.FC<LandSummaryTableProps> = ({ 
  ficheId, 
  projectId,
  cadastreEntries 
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<LandSummaryEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [processedCadastreIds, setProcessedCadastreIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Use the deletion hook
  const deleteHook = useRecapFoncierDelete({
    rows: entries.map(entry => ({
      ...entry,
      projectId
    })),
    setRows: setEntries as any,
    projectId,
    processedCadastreIds,
    setProcessedCadastreIds
  });

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

  // Load saved land summary values from Supabase once on component mount
  useEffect(() => {
    const loadLandSummaryData = async () => {
      if (!ficheId || initialized) return;

      try {
        const { data, error } = await supabase
          .from('land_recaps')
          .select('*')
          .eq('project_id', projectId);

        if (error) {
          console.error('Error loading land summary data:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les données du récapitulatif foncier.",
            variant: "destructive",
          });
        } else if (data) {
          const loadedEntries: LandSummaryEntry[] = data.map(item => ({
            tmpId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            id: item.id,
            section: item.section || '',
            parcelle: item.parcelle || '',
            occupationType: item.occupation_type || 'Terrain nu',
            ownerStatus: item.owner_status || 'Personne physique',
            ownerDetails: item.owner_name || '',
            additionalInfo: item.notes || '',
            residentStatus: item.resident_status || 'Vacants',
            cadastreId: item.parcel_id || ''
          }));
          setEntries(loadedEntries);
          setProcessedCadastreIds(loadedEntries.filter(entry => entry.cadastreId).map(entry => entry.cadastreId));
        }
      } catch (err) {
        console.error('Unexpected error loading land summary data:', err);
      }
      
      setInitialized(true);
    };

    loadLandSummaryData();
  }, [projectId, initialized, toast]);

  // Synchronize with cadastre entries only after initialization
  useEffect(() => {
    if (!initialized || !cadastreEntries.length || !ficheId) return;

    // Find cadastre entries that don't have a corresponding land summary entry
    const newCadastreEntries = cadastreEntries.filter(
      cadastreEntry => !processedCadastreIds.includes(cadastreEntry.id)
    );

    if (newCadastreEntries.length > 0) {
      const newLandSummaryEntries: LandSummaryEntry[] = newCadastreEntries.map(cadastreEntry => ({
        tmpId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
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

  const handleAddEntry = async () => {
    // Find a cadastre entry that hasn't been used yet
    const unusedCadastreEntry = cadastreEntries.find(entry => 
      !processedCadastreIds.includes(entry.id)
    );
    
    // If no unused entry exists, use the first cadastre entry or create a blank one
    const defaultCadastreEntry = unusedCadastreEntry || 
      (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    const newEntry: LandSummaryEntry = {
      tmpId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      section: defaultCadastreEntry.section || '',
      parcelle: defaultCadastreEntry.parcelle || '',
      occupationType: 'Terrain nu',
      ownerStatus: 'Personne physique',
      ownerDetails: '',
      additionalInfo: '',
      residentStatus: 'Vacants',
      cadastreId: defaultCadastreEntry.id || '' // Link to cadastre entry if available
    };
    
    setEntries(prev => [...prev, newEntry]);
    
    // If we used an unused cadastre entry, add it to processed ids
    if (unusedCadastreEntry) {
      setProcessedCadastreIds(prev => [...prev, unusedCadastreEntry.id]);
    }

    // Immediately save to Supabase
    saveToSupabase(newEntry);
  };

  const confirmDelete = (tmpId: string) => {
    const entryToDelete = entries.find(entry => entry.tmpId === tmpId);
    if (entryToDelete) {
      deleteHook.openConfirm({
        ...entryToDelete,
        projectId
      });
    }
  };

  const handleInputChange = (tmpId: string, field: keyof Omit<LandSummaryEntry, 'tmpId' | 'id'>, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.tmpId === tmpId ? { ...entry, [field]: value } : entry
    ));
    
    // Auto-save changes to Supabase
    const entry = entries.find(e => e.tmpId === tmpId);
    if (entry?.id) {
      saveToSupabase({ ...entry, [field]: value });
    }
  };

  const saveToSupabase = async (entry: LandSummaryEntry) => {
    if (!entry.id) {
      // Insert new entry
      const { data, error } = await supabase
        .from('land_recaps')
        .insert({
          project_id: projectId,
          section: entry.section,
          parcelle: entry.parcelle,
          occupation_type: entry.occupationType,
          owner_status: entry.ownerStatus,
          owner_name: entry.ownerDetails,
          notes: entry.additionalInfo,
          resident_status: entry.residentStatus,
          parcel_id: entry.cadastreId || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting land recap:', error);
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder la ligne.",
          variant: "destructive",
        });
      } else if (data) {
        // Update local state with Supabase ID
        setEntries(prev => prev.map(e => 
          e.tmpId === entry.tmpId ? { ...e, id: data.id } : e
        ));
      }
    } else {
      // Update existing entry
      const { error } = await supabase
        .from('land_recaps')
        .update({
          section: entry.section,
          parcelle: entry.parcelle,
          occupation_type: entry.occupationType,
          owner_status: entry.ownerStatus,
          owner_name: entry.ownerDetails,
          notes: entry.additionalInfo,
          resident_status: entry.residentStatus,
          parcel_id: entry.cadastreId || null
        })
        .eq('id', entry.id)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error updating land recap:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la ligne.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCadastreSelect = (tmpId: string, sectionId: string) => {
    // Find the current entry and its current cadastreId
    const currentEntry = entries.find(entry => entry.tmpId === tmpId);
    const oldCadastreId = currentEntry?.cadastreId;
    
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    if (selectedCadastre) {
      setEntries(prev => prev.map(entry => 
        entry.tmpId === tmpId ? { 
          ...entry, 
          section: selectedCadastre.section,
          parcelle: selectedCadastre.parcelle,
          cadastreId: selectedCadastre.id // Update the link to cadastre
        } : entry
      ));
      
      // Update processedCadastreIds to reflect the change
      if (oldCadastreId) {
        setProcessedCadastreIds(prev => prev.filter(id => id !== oldCadastreId));
      }
      setProcessedCadastreIds(prev => [...prev, selectedCadastre.id]);
    }
  };

  const handleSearchOwner = (tmpId: string) => {
    const entry = entries.find(entry => entry.tmpId === tmpId);
    if (!entry) return;

    let searchDetails = '';
    
    if (entry.ownerStatus === 'Personne morale') {
      // Simulate API call to Pappers API for company information
      setTimeout(() => {
        searchDetails = "SCI IMMOBILIER MODERNE\nSIRET: 123456789\nCapital: 100,000€\nCA: 580,000€\nDirigeant: Jean Dupont";
        setEntries(prev => prev.map(e => 
          e.tmpId === tmpId ? { ...e, ownerDetails: searchDetails } : e
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
          e.tmpId === tmpId ? { ...e, ownerDetails: searchDetails } : e
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
                key={entry.tmpId}
                onClick={() => setSelectedRow(entry.tmpId)}
                className={`cursor-pointer transition-colors ${selectedRow === entry.tmpId ? 'bg-brand/5' : ''} hover:bg-brand/5`}
              >
                <TableCell>
                  <Select 
                    value={entry.cadastreId || ""}
                    onValueChange={(value) => handleCadastreSelect(entry.tmpId, value)}
                  >
                    <SelectTrigger className="h-8">
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
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.occupationType} 
                    onValueChange={(value) => handleInputChange(entry.tmpId, 'occupationType', value)}
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
                    onValueChange={(value) => handleInputChange(entry.tmpId, 'ownerStatus', value)}
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
                      onChange={(e) => handleInputChange(entry.tmpId, 'ownerDetails', e.target.value)}
                      className="h-8"
                      placeholder="Détails du propriétaire"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSearchOwner(entry.tmpId);
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
                    onChange={(e) => handleInputChange(entry.tmpId, 'additionalInfo', e.target.value)}
                    className="h-8"
                    placeholder="Informations complémentaires"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.residentStatus} 
                    onValueChange={(value) => handleInputChange(entry.tmpId, 'residentStatus', value)}
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
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(entry.tmpId);
                    }}
                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteHook.target}
        onOpenChange={(open) => !open && deleteHook.closeConfirm()}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={deleteHook.handleDelete}
        destructive={true}
      />
    </div>
  );
};
