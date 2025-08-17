
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

type LandSummaryEntry = {
  id: string;
  parcel_id: string | null;
  occupation_type: string;
  owner_status: string;
  owner_name: string;
  notes: string;
  resident_status: string;
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
  const [rows, setRows] = useState<LandSummaryEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const projectId = ficheId; // ficheId is project_id

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
  const loadRows = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .select('id, parcel_id, occupation_type, owner_status, owner_name, notes, resident_status')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRows(data || []);
    } catch (error) {
      console.error('Error loading land recaps:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Load data on mount
  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // Synchronize with cadastre entries - add new parcels
  useEffect(() => {
    if (loading || !cadastreEntries.length || !projectId) return;

    const existingParcelIds = rows.map(row => row.parcel_id).filter(Boolean);
    const newCadastreEntries = cadastreEntries.filter(
      entry => !existingParcelIds.includes(entry.id)
    );

    if (newCadastreEntries.length > 0) {
      // Add new entries for new parcels automatically
      newCadastreEntries.forEach(cadastreEntry => {
        addRowFromCadastre(cadastreEntry);
      });
      
      toast({
        title: "Nouvelles parcelles ajoutées",
        description: `${newCadastreEntries.length} nouvelle(s) parcelle(s) ajoutée(s) depuis le module Cadastre.`,
      });
    }
  }, [cadastreEntries, rows, loading, projectId]);

  // Add row from cadastre entry
  const addRowFromCadastre = async (cadastreEntry: { id: string; section: string; parcelle: string }) => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .insert({ 
          project_id: projectId, 
          parcel_id: cadastreEntry.id,
          occupation_type: 'Terrain nu', 
          owner_status: 'Personne physique', 
          owner_name: '',
          notes: '',
          resident_status: 'Vacants' 
        })
        .select('id, parcel_id, occupation_type, owner_status, owner_name, notes, resident_status')
        .single();

      if (error) throw error;
      setRows(prevRows => [data, ...prevRows]);
    } catch (error) {
      console.error('Error adding row from cadastre:', error);
    }
  };

  // Add row manually
  const addRow = async () => {
    if (!projectId || adding) return;
    
    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('land_recaps')
        .insert({ 
          project_id: projectId, 
          occupation_type: '', 
          owner_status: '', 
          owner_name: '',
          notes: '',
          resident_status: '' 
        })
        .select('id, parcel_id, occupation_type, owner_status, owner_name, notes, resident_status')
        .single();

      if (error) throw error;
      setRows(prevRows => [data, ...prevRows]);
      
      toast({
        title: "Ligne ajoutée",
        description: "Nouvelle ligne ajoutée avec succès"
      });
    } catch (error) {
      console.error('Error adding row:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la ligne",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  // Delete row with optimistic update and rollback
  const deleteRow = async (row: LandSummaryEntry) => {
    if (!projectId) return;
    
    const prevRows = rows;
    setRows(r => r.filter(x => x.id !== row.id));

    if (!row.id) return; // temporary row not persisted

    try {
      const { error } = await supabase
        .from('land_recaps')
        .delete()
        .eq('id', row.id)
        .eq('project_id', projectId);

      if (error) throw error;
      
      toast({
        title: "Ligne supprimée",
        description: "La ligne a été supprimée avec succès"
      });
    } catch (error) {
      console.error('Error deleting row:', error);
      setRows(prevRows); // Rollback
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la ligne",
        variant: "destructive"
      });
    }
  };

  // Debounced update for inline changes
  const debouncedUpdate = useCallback((rowId: string, field: keyof Omit<LandSummaryEntry, 'id'>, value: string) => {
    if (!projectId) return;
    
    // Clear existing timeout
    if (updateTimeoutRef.current[rowId]) {
      clearTimeout(updateTimeoutRef.current[rowId]);
    }

    // Set new timeout
    updateTimeoutRef.current[rowId] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('land_recaps')
          .update({ [field]: value })
          .eq('id', rowId)
          .eq('project_id', projectId);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating field:', error);
        toast({
          title: "Erreur de sauvegarde",
          description: "Impossible de sauvegarder les modifications",
          variant: "destructive"
        });
      }
    }, 500); // 500ms debounce
  }, [projectId, toast]);

  // Handle input changes with optimistic update
  const handleInputChange = (id: string, field: keyof Omit<LandSummaryEntry, 'id'>, value: string) => {
    // Optimistic update
    setRows(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
    
    // Debounced save
    debouncedUpdate(id, field, value);
  };

  // Handle parcel selection
  const handleParcelSelect = (id: string, parcelId: string) => {
    const selectedParcel = cadastreEntries.find(entry => entry.id === parcelId);
    if (selectedParcel) {
      handleInputChange(id, 'parcel_id', parcelId);
    }
  };

  // Handle search owner (simulate API call)
  const handleSearchOwner = (id: string) => {
    const entry = rows.find(entry => entry.id === id);
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

  if (loading) {
    return (
      <div className="space-y-4 animate-enter opacity-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand">Récapitulatif foncier</h2>
        </div>
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-enter opacity-0">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-brand">Récapitulatif foncier</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addRow}
            disabled={adding}
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
            {rows.map((entry) => {
              const linkedCadastre = cadastreEntries.find(c => c.id === entry.parcel_id);
              return (
                <TableRow 
                  key={entry.id}
                  onClick={() => setSelectedRow(entry.id)}
                  className={`cursor-pointer transition-colors ${selectedRow === entry.id ? 'bg-brand/5' : ''} hover:bg-brand/5`}
                >
                  <TableCell>
                    <Select 
                      value={entry.parcel_id || ""}
                      onValueChange={(value) => handleParcelSelect(entry.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Sélectionner une parcelle">
                          {linkedCadastre && `${linkedCadastre.section} ${linkedCadastre.parcelle}`}
                        </SelectValue>
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
                        deleteRow(entry);
                      }}
                      className="h-8 w-8 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
