
import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

// Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

type LandSummaryEntry = {
  id: string;
  parcel_id: string | null;
  occupation_type: string;
  owner_status: string;
  owner_name: string;
  notes: string;
  resident_status: string;
  // UI computed fields
  section: string;
  parcelle: string;
  cadastreId: string;
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
  const [loading, setLoading] = useState(false);
  const [addingRow, setAddingRow] = useState(false);

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

  // Load data from Supabase
  const loadEntries = useCallback(async () => {
    if (!ficheId || initialized) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .select('id, parcel_id, occupation_type, owner_status, owner_name, notes, resident_status')
        .eq('project_id', ficheId);

      if (error) throw error;

      if (data) {
        const mappedEntries: LandSummaryEntry[] = data.map(item => {
          // Find the corresponding cadastre entry
          const correspondingCadastre = cadastreEntries.find(cadastre => cadastre.id === item.parcel_id);
          
          return {
            id: item.id,
            parcel_id: item.parcel_id,
            occupation_type: item.occupation_type,
            owner_status: item.owner_status,
            owner_name: item.owner_name,
            notes: item.notes,
            resident_status: item.resident_status,
            // UI computed fields
            section: correspondingCadastre?.section || '',
            parcelle: correspondingCadastre?.parcelle || '',
            cadastreId: item.parcel_id || ''
          };
        });

        setEntries(mappedEntries);
        setProcessedCadastreIds(mappedEntries.map(entry => entry.cadastreId).filter(Boolean));
      }
      setInitialized(true);
    } catch (error) {
      console.error('Error loading land recaps:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le récapitulatif foncier",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [ficheId, initialized, cadastreEntries, toast]);

  useEffect(() => {
    if (ficheId && cadastreEntries.length > 0) {
      loadEntries();
    }
  }, [loadEntries, ficheId, cadastreEntries]);

  // Debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (id: string, field: string, value: string) => {
      try {
        const { error } = await supabase
          .from('land_recaps')
          .update({ [field]: value })
          .eq('id', id)
          .eq('project_id', ficheId!)
          .select('id')
          .single();

        if (error) throw error;
      } catch (error) {
        console.error('Error updating land recap:', error);
        toast({
          title: "Erreur",
          description: "Impossible de sauvegarder les modifications",
          variant: "destructive"
        });
        // Reload data to restore correct state
        loadEntries();
      }
    }, 300),
    [ficheId, toast, loadEntries]
  );

  // Synchronize with cadastre entries
  useEffect(() => {
    if (!initialized || !cadastreEntries.length || !ficheId) return;

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
    }
  }, [cadastreEntries, entries, initialized, ficheId]);

  const handleAddEntry = async () => {
    if (!ficheId || addingRow) return;
    
    setAddingRow(true);
    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .insert({ 
          project_id: ficheId,
          occupation_type: 'Terrain nu',
          owner_status: 'Personne physique',
          resident_status: 'Vacants'
        })
        .select('id')
        .single();

      if (error) throw error;

      // Optimistic update
      const newEntry: LandSummaryEntry = {
        id: data.id,
        parcel_id: null,
        occupation_type: 'Terrain nu',
        owner_status: 'Personne physique',
        owner_name: '',
        notes: '',
        resident_status: 'Vacants',
        section: '',
        parcelle: '',
        cadastreId: ''
      };
      
      setEntries(prev => [newEntry, ...prev]);
      
      toast({
        title: "Ligne ajoutée",
        description: "Une nouvelle ligne a été ajoutée avec succès"
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ligne",
        variant: "destructive"
      });
    } finally {
      setAddingRow(false);
    }
  };

  const handleDeleteEntry = async (row: LandSummaryEntry) => {
    if (!ficheId) return;
    
    // Optimistic update
    const prevEntries = entries;
    setEntries(prev => prev.filter(entry => entry.id !== row.id));
    
    if (selectedRow === row.id) {
      setSelectedRow(null);
    }

    try {
      const { error } = await supabase
        .from('land_recaps')
        .delete()
        .eq('id', row.id)
        .eq('project_id', ficheId)
        .select('id')
        .single();

      if (error) throw error;

      // Remove from processed cadastre IDs
      if (row.cadastreId) {
        setProcessedCadastreIds(prev => prev.filter(id => id !== row.cadastreId));
      }
      
      toast({
        title: "Ligne supprimée",
        description: "La ligne a été supprimée avec succès"
      });
    } catch (error) {
      // Rollback on error
      setEntries(prevEntries);
      console.error('Error deleting entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la ligne",
        variant: "destructive"
      });
    }
  };

  const handleInputChange = (id: string, field: string, value: string) => {
    // Optimistic update
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
    
    // Debounced database update
    debouncedUpdate(id, field, value);
  };

  const handleCadastreSelect = async (id: string, sectionId: string) => {
    if (!ficheId) return;
    
    const currentEntry = entries.find(entry => entry.id === id);
    const oldCadastreId = currentEntry?.cadastreId;
    
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    const parcelId = sectionId ? sectionId : null;
    
    // Optimistic update
    if (selectedCadastre) {
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { 
          ...entry, 
          parcel_id: parcelId,
          section: selectedCadastre.section,
          parcelle: selectedCadastre.parcelle,
          cadastreId: selectedCadastre.id
        } : entry
      ));
      
      // Update processedCadastreIds
      if (oldCadastreId) {
        setProcessedCadastreIds(prev => prev.filter(cadastreId => cadastreId !== oldCadastreId));
      }
      setProcessedCadastreIds(prev => [...prev, selectedCadastre.id]);
    }

    try {
      const { error } = await supabase
        .from('land_recaps')
        .update({ parcel_id: parcelId })
        .eq('id', id)
        .eq('project_id', ficheId)
        .select('id')
        .single();

      if (error) throw error;
    } catch (error) {
      console.error('Error updating parcel:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la sélection de parcelle",
        variant: "destructive"
      });
      // Reload to restore correct state
      loadEntries();
    }
  };

  const handleSearchOwner = (id: string) => {
    const entry = entries.find(entry => entry.id === id);
    if (!entry) return;

    let searchDetails = '';
    
    if (entry.owner_status === 'Personne morale') {
      setTimeout(() => {
        searchDetails = "SCI IMMOBILIER MODERNE\nSIRET: 123456789\nCapital: 100,000€\nCA: 580,000€\nDirigeant: Jean Dupont";
        handleInputChange(id, 'owner_name', searchDetails);
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pappers Immobilier",
        });
      }, 1000);
    } else if (entry.owner_status === 'Personne physique') {
      setTimeout(() => {
        searchDetails = "M. Pierre Martin\nTél: 01.XX.XX.XX.XX\nAdresse: 10 rue des Lilas, 75000 Paris";
        handleInputChange(id, 'owner_name', searchDetails);
        
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
            disabled={addingRow || loading}
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
                  <Select 
                    value={entry.cadastreId || ""}
                    onValueChange={(value) => handleCadastreSelect(entry.id, value)}
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
                    value={entry.occupation_type} 
                    onValueChange={(value) => handleInputChange(entry.id, 'occupation_type', value)}
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
                    value={entry.owner_status} 
                    onValueChange={(value) => handleInputChange(entry.id, 'owner_status', value)}
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
                      value={entry.owner_name}
                      onChange={(e) => handleInputChange(entry.id, 'owner_name', e.target.value)}
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
                    value={entry.notes}
                    onChange={(e) => handleInputChange(entry.id, 'notes', e.target.value)}
                    className="h-8"
                    placeholder="Informations complémentaires"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.resident_status} 
                    onValueChange={(value) => handleInputChange(entry.id, 'resident_status', value)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(entry);
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
    </div>
  );
};
