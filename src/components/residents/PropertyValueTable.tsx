
import React, { useState, useEffect } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Minus, Info } from 'lucide-react';
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

  const propertyTypes = [
    "Logements",
    "Bureaux",
    "Commerces",
    "Entrepôts",
    "Bâtiments industriels",
    "Parkings",
    "Garages"
  ];

  useEffect(() => {
    if (ficheId) {
      // Load saved property values if they exist
      const storedData = localStorage.getItem(`propertyValues_${ficheId}`);
      if (storedData) {
        setEntries(JSON.parse(storedData));
      } else if (cadastreEntries.length > 0 && entries.length === 0) {
        // Initialize with first cadastre entry if no data exists
        handleAddEntry();
      }
    }
  }, [ficheId, cadastreEntries]);

  useEffect(() => {
    if (ficheId && entries.length > 0) {
      // Save to localStorage whenever entries change
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
      dvf: ''
    };
    
    setEntries(prev => [...prev, newEntry]);
  };

  const handleDeleteEntry = () => {
    if (!selectedRow) {
      toast({
        title: "Aucune ligne sélectionnée",
        description: "Veuillez sélectionner une ligne à supprimer",
        variant: "destructive",
      });
      return;
    }
    
    setEntries(prev => prev.filter(entry => entry.id !== selectedRow));
    setSelectedRow(null);
    
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
    
    // For residential properties
    if (entry.type === 'Logements') {
      return (surface * abattement * prixM2 * etat) / 1000;
    } 
    // For commercial/tertiary properties
    else {
      const tauxCap = Number(entry.tauxCap);
      if (!tauxCap) return 0; // Prevent division by zero
      
      return (surface * abattement * (prixM2 / tauxCap) * etat) / 1000;
    }
  };

  const getTotalValue = (): number => {
    return entries.reduce((total, entry) => {
      // Use DVF value if available, otherwise use calculated value
      const entryValue = entry.dvf !== '' ? Number(entry.dvf) : entry.valeur;
      return total + entryValue;
    }, 0);
  };

  const handleCadastreSelect = (id: string, sectionId: string) => {
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    if (selectedCadastre) {
      setEntries(prev => prev.map(entry => 
        entry.id === id ? { 
          ...entry, 
          section: selectedCadastre.section,
          parcelle: selectedCadastre.parcelle
        } : entry
      ));
    }
  };

  // Format number to display with appropriate decimal places and K€
  const formatCurrency = (value: number | ''): string => {
    if (value === '') return '0 K€';
    return `${value.toFixed(2)} K€`;
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteEntry}
            disabled={!selectedRow}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 disabled:text-gray-400"
          >
            <Minus className="h-4 w-4" /> Supprimer
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
                        <p className="w-[200px] text-xs">
                          Coefficient (0.8 à 1) permettant de moduler la surface ou le nombre d'unités
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">
                <div className="flex items-center">
                  Estim'Prix M2
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          Prix unitaire (€/m²) ou valeur de référence pour le calcul
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                        <p className="w-[200px] text-xs">
                          Taux de capitalisation - S'applique uniquement aux types tertiaires (Non applicable aux logements)
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
                        <p className="w-[200px] text-xs">
                          Coefficient (0.7 à 1.25) reflétant l'état de conservation du bien
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
                        <p className="w-[200px] text-xs">
                          Données Valeurs Foncières - Si renseignée, cette valeur prime sur la valeur estimée calculée
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
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
                    value={cadastreEntries.find(c => c.section === entry.section && c.parcelle === entry.parcelle)?.id || ""}
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
                    disabled={entry.type === 'Logements'}
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
              </TableRow>
            ))}
            <TableRow className="bg-brand/10 font-bold">
              <TableCell colSpan={7} className="text-right">TOTAL</TableCell>
              <TableCell colSpan={2} className="text-brand">
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
          <li><span className="font-medium">Autres types :</span> Valeur (K€) = (Surface × Abattement × (Prix m² / Taux Cap) × État) / 1000</li>
        </ul>
      </div>
    </div>
  );
};
