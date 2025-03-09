
import React, { useState, useEffect } from 'react';
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
  cadastreEntries: Array<{
    id: string;
    section: string;
    parcelle: string;
  }>;
}

export const PropertyValueTable: React.FC<PropertyValueTableProps> = ({ 
  ficheId, 
  cadastreEntries 
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<PropertyEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [processedCadastreIds, setProcessedCadastreIds] = useState<string[]>([]);

  const propertyTypes = [
    "Logements",
    "Bureaux",
    "Commerces",
    "Entrepôts",
    "Bâtiments industriels",
    "Parkings",
    "Garages"
  ];

  // Load saved property values or initialize with cadastre entries
  useEffect(() => {
    if (ficheId) {
      const storedData = localStorage.getItem(`propertyValues_${ficheId}`);
      if (storedData) {
        setEntries(JSON.parse(storedData));
      }
    }
  }, [ficheId]);

  // Track which cadastre entries have been processed
  useEffect(() => {
    if (entries.length > 0) {
      setProcessedCadastreIds(entries.filter(entry => entry.cadastreId).map(entry => entry.cadastreId));
    }
  }, [entries]);

  // Synchronize with cadastre entries: add new entries from cadastre
  useEffect(() => {
    if (cadastreEntries.length > 0 && ficheId) {
      // Find cadastre entries that don't have a corresponding property entry
      const newCadastreEntries = cadastreEntries.filter(
        cadastreEntry => !processedCadastreIds.includes(cadastreEntry.id)
      );

      if (newCadastreEntries.length > 0) {
        const newPropertyEntries: PropertyEntry[] = newCadastreEntries.map(cadastreEntry => ({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          section: cadastreEntry.section || '',
          parcelle: cadastreEntry.parcelle || '',
          type: 'Logements',
          surface: '',
          abattement: 1,
          prixM2: '',
          tauxCap: 0.05,
          etat: 1,
          valeur: 0,
          dvf: '',
          cadastreId: cadastreEntry.id
        }));

        setEntries(prev => [...prev, ...newPropertyEntries]);
        
        toast({
          title: "Nouvelles parcelles ajoutées",
          description: `${newPropertyEntries.length} nouvelle(s) parcelle(s) ajoutée(s) depuis le module Cadastre.`,
        });
      }

      // Check for deleted cadastre entries and remove corresponding property entries
      const existingCadastreIds = cadastreEntries.map(entry => entry.id);
      const entriesWithDeletedCadastre = entries.filter(
        entry => entry.cadastreId && !existingCadastreIds.includes(entry.cadastreId)
      );

      if (entriesWithDeletedCadastre.length > 0) {
        setEntries(prev => prev.filter(entry => 
          !entry.cadastreId || existingCadastreIds.includes(entry.cadastreId)
        ));
        
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
    }
  }, [cadastreEntries, processedCadastreIds, ficheId, toast, entries]);

  // Save changes to localStorage
  useEffect(() => {
    if (ficheId && entries.length > 0) {
      localStorage.setItem(`propertyValues_${ficheId}`, JSON.stringify(entries));
    }
  }, [entries, ficheId]);

  const handleAddEntry = () => {
    const defaultCadastreEntry = cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' };
    
    const newEntry: PropertyEntry = {
      id: Date.now().toString(),
      section: defaultCadastreEntry.section || '',
      parcelle: defaultCadastreEntry.parcelle || '',
      type: 'Logements',
      surface: '',
      abattement: 1,
      prixM2: '',
      tauxCap: 0.05,
      etat: 1,
      valeur: 0,
      dvf: '',
      cadastreId: defaultCadastreEntry.id || '' // Link to cadastre entry if available
    };
    
    setEntries(prev => [...prev, newEntry]);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
    if (selectedRow === id) {
      setSelectedRow(null);
    }
    
    toast({
      title: "Ligne supprimée",
      description: "La ligne a été supprimée avec succès",
    });
  };

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
        
        return updatedEntry;
      }
      return entry;
    }));
  };

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
    if (entry.type === 'Parkings') {
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
    else if (entry.type === 'Logements') {
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

  const handleCadastreSelect = (id: string, sectionId: string) => {
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
                    value={entry.type} 
                    onValueChange={(value) => handleInputChange(entry.id, 'type', value)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
                      handleDeleteEntry(entry.id);
                    }}
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
    </div>
  );
};
