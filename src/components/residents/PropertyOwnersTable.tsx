
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

type PropertyOwnerEntry = {
  id: string;
  section: string;
  parcelle: string;
  typeOccupation: string;
  statutProprietaire: string;
  informationsComplementaires: string;
  situationResidents: string;
  cadastreId: string; // Link to cadastre entry
};

interface PropertyOwnersTableProps {
  ficheId: string | undefined;
  cadastreEntries: Array<{
    id: string;
    section: string;
    parcelle: string;
  }>;
}

export const PropertyOwnersTable: React.FC<PropertyOwnersTableProps> = ({ 
  ficheId, 
  cadastreEntries 
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<PropertyOwnerEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [processedCadastreIds, setProcessedCadastreIds] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const occupationTypes = [
    "Terrain nu",
    "Bâtiment",
    "Local commercial",
    "Habitation",
    "Mixte",
    "Autre"
  ];

  const ownershipStatuses = [
    "Personne morale",
    "Personne physique",
    "Collectivité",
    "Indivision",
    "Association",
    "Autre"
  ];

  const residentSituations = [
    "Locataires",
    "Propriétaires occupants",
    "Non occupé",
    "Usage mixte",
    "Autres"
  ];

  // Load saved property owner data once on component mount
  useEffect(() => {
    if (ficheId && !initialized) {
      const storedData = localStorage.getItem(`propertyOwners_${ficheId}`);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setEntries(parsedData);
        setProcessedCadastreIds(parsedData.filter((entry: PropertyOwnerEntry) => entry.cadastreId).map((entry: PropertyOwnerEntry) => entry.cadastreId));
      }
      setInitialized(true);
    }
  }, [ficheId, initialized]);

  // Synchronize with cadastre entries only after initialization
  useEffect(() => {
    if (!initialized || !cadastreEntries.length || !ficheId) return;

    // Find cadastre entries that don't have a corresponding property owner entry
    const newCadastreEntries = cadastreEntries.filter(
      cadastreEntry => !processedCadastreIds.includes(cadastreEntry.id)
    );

    if (newCadastreEntries.length > 0) {
      const newPropertyOwnerEntries: PropertyOwnerEntry[] = newCadastreEntries.map(cadastreEntry => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        section: cadastreEntry.section || '',
        parcelle: cadastreEntry.parcelle || '',
        typeOccupation: 'Terrain nu',
        statutProprietaire: 'Personne morale',
        informationsComplementaires: '',
        situationResidents: 'Non occupé',
        cadastreId: cadastreEntry.id
      }));

      setEntries(prev => [...prev, ...newPropertyOwnerEntries]);
      setProcessedCadastreIds(prev => [...prev, ...newCadastreEntries.map(entry => entry.id)]);
      
      toast({
        title: "Nouvelles parcelles ajoutées",
        description: `${newPropertyOwnerEntries.length} nouvelle(s) parcelle(s) ajoutée(s) depuis le module Cadastre.`,
      });
    }

    // Check for deleted cadastre entries and remove corresponding property owner entries
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

  // Save changes to localStorage
  useEffect(() => {
    if (ficheId && entries.length > 0 && initialized) {
      localStorage.setItem(`propertyOwners_${ficheId}`, JSON.stringify(entries));
    }
  }, [entries, ficheId, initialized]);

  const handleAddEntry = () => {
    // Find a cadastre entry that hasn't been used yet
    const unusedCadastreEntry = cadastreEntries.find(entry => 
      !processedCadastreIds.includes(entry.id)
    );
    
    // If no unused entry exists, use the first cadastre entry or create a blank one
    const defaultCadastreEntry = unusedCadastreEntry || 
      (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    const newEntry: PropertyOwnerEntry = {
      id: Date.now().toString(),
      section: defaultCadastreEntry.section || '',
      parcelle: defaultCadastreEntry.parcelle || '',
      typeOccupation: 'Terrain nu',
      statutProprietaire: 'Personne morale',
      informationsComplementaires: '',
      situationResidents: 'Non occupé',
      cadastreId: defaultCadastreEntry.id || '' // Link to cadastre entry if available
    };
    
    setEntries(prev => [...prev, newEntry]);
    
    // If we used an unused cadastre entry, add it to processed ids
    if (unusedCadastreEntry) {
      setProcessedCadastreIds(prev => [...prev, unusedCadastreEntry.id]);
    }
  };

  const handleDeleteEntry = (id: string) => {
    const entryToDelete = entries.find(entry => entry.id === id);
    if (entryToDelete && entryToDelete.cadastreId) {
      setProcessedCadastreIds(prev => prev.filter(cadastreId => cadastreId !== entryToDelete.cadastreId));
    }
    
    setEntries(prev => prev.filter(entry => entry.id !== id));
    if (selectedRow === id) {
      setSelectedRow(null);
    }
    
    toast({
      title: "Ligne supprimée",
      description: "La ligne a été supprimée avec succès",
    });
  };

  const handleInputChange = (id: string, field: keyof PropertyOwnerEntry, value: string) => {
    setEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        return { ...entry, [field]: value };
      }
      return entry;
    }));
  };

  const handleCadastreSelect = (id: string, sectionId: string) => {
    // Find the current entry and its current cadastreId
    const currentEntry = entries.find(entry => entry.id === id);
    const oldCadastreId = currentEntry?.cadastreId;
    
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    if (selectedCadastre) {
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { 
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

  const handleSearchOwner = (id: string) => {
    const entry = entries.find(entry => entry.id === id);
    if (!entry) return;

    // Simulate search process - in a real app this would call an API
    let infoText = '';
    
    if (entry.statutProprietaire === 'Personne morale') {
      infoText = 'SIRET/SIREN: 123456789, Raison sociale: Exemple SA, Capital: 10000€, CA: 1.2M€, Dirigeant: Jean Dupont';
    } else if (entry.statutProprietaire === 'Personne physique') {
      infoText = 'Nom: Martin Durand, Coordonnées: 10 rue des Lilas, 75001 Paris, Tel: 0123456789';
    } else {
      infoText = 'Informations non disponibles pour ce type de propriétaire';
    }

    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, informationsComplementaires: infoText } : e
    ));

    toast({
      title: "Recherche effectuée",
      description: "Les informations sur le propriétaire ont été récupérées",
    });
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
              <TableHead className="min-w-[150px]">Section et Parcelles</TableHead>
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
                          Type de propriétaire: personne morale ou physique
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[250px]">
                <div className="flex items-center">
                  Informations complémentaires
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Pour les personnes morales: SIRET/SIREN, Capital, CA, Dirigeant via Pappers Immobilier.
                          Pour les personnes physiques: Nom et Coordonnées via Pages Jaunes ou équivalent.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[150px]">
                <div className="flex items-center">
                  Situation des résidents
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[250px] text-xs">
                          Statut des occupants: locataires, propriétaires occupants, ou autres.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Aucune donnée foncière enregistrée
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
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
                      value={entry.typeOccupation} 
                      onValueChange={(value) => handleInputChange(entry.id, 'typeOccupation', value)}
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
                      value={entry.statutProprietaire} 
                      onValueChange={(value) => handleInputChange(entry.id, 'statutProprietaire', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ownershipStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={entry.informationsComplementaires}
                        onChange={(e) => handleInputChange(entry.id, 'informationsComplementaires', e.target.value)}
                        className="h-8 flex-grow"
                        placeholder="Informations sur le propriétaire"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSearchOwner(entry.id);
                        }}
                        className="h-8 w-8"
                        title="Rechercher les informations"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={entry.situationResidents} 
                      onValueChange={(value) => handleInputChange(entry.id, 'situationResidents', value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {residentSituations.map((situation) => (
                          <SelectItem key={situation} value={situation}>
                            {situation}
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
                        handleDeleteEntry(entry.id);
                      }}
                      className="h-8 w-8 text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
