
import React, { useState, useEffect } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Info, Trash2, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useLandRecap, type LandRecapEntry } from '@/hooks/useLandRecap';

// Using LandRecapEntry from the hook

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
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [processedCadastreIds, setProcessedCadastreIds] = useState<string[]>([]);
  
  const {
    entries,
    isLoading,
    deleteTarget,
    addEntry,
    updateEntry,
    confirmDelete,
    handleConfirmDelete,
    cancelDelete,
  } = useLandRecap({ ficheId: ficheId || '' });

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

  // Update processed cadastre IDs when entries change
  useEffect(() => {
    if (!isLoading) {
      setProcessedCadastreIds(
        entries.filter(entry => entry.cadastreId).map(entry => entry.cadastreId)
      );
    }
  }, [entries, isLoading]);

  // State for import preview
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [pendingImports, setPendingImports] = useState<Array<{
    id: string;
    section: string;
    parcelle: string;
  }>>([]);

  // Get new cadastre entries that haven't been imported yet
  const getNewCadastreEntries = () => {
    return cadastreEntries.filter(
      cadastreEntry => !processedCadastreIds.includes(cadastreEntry.id)
    );
  };

  const handleImportFromCadastre = () => {
    const newEntries = getNewCadastreEntries();
    if (newEntries.length === 0) {
      toast({
        title: "Aucune nouvelle parcelle",
        description: "Toutes les parcelles du cadastre ont déjà été importées.",
      });
      return;
    }
    
    setPendingImports(newEntries);
    setShowImportPreview(true);
  };

  const confirmImport = async () => {
    if (!ficheId) return;

    // Add new entries
    for (const cadastreEntry of pendingImports) {
      await addEntry({
        ficheId,
        section: cadastreEntry.section || '',
        parcelle: cadastreEntry.parcelle || '',
        occupationType: 'Terrain nu',
        ownerStatus: 'Personne physique',
        ownerDetails: '',
        additionalInfo: '',
        residentStatus: 'Vacants',
        cadastreId: cadastreEntry.id
      });
    }

    toast({
      title: "Parcelles importées",
      description: `${pendingImports.length} parcelle(s) importée(s) depuis le module Cadastre.`,
    });
    
    setShowImportPreview(false);
    setPendingImports([]);
  };

  const cancelImport = () => {
    setShowImportPreview(false);
    setPendingImports([]);
  };

  const handleAddEntry = async () => {
    if (!ficheId) return;

    // Find a cadastre entry that hasn't been used yet
    const unusedCadastreEntry = cadastreEntries.find(entry => 
      !processedCadastreIds.includes(entry.id)
    );
    
    // If no unused entry exists, use the first cadastre entry or create a blank one
    const defaultCadastreEntry = unusedCadastreEntry || 
      (cadastreEntries.length > 0 ? cadastreEntries[0] : { id: '', section: '', parcelle: '' });
    
    await addEntry({
      ficheId,
      section: defaultCadastreEntry.section || '',
      parcelle: defaultCadastreEntry.parcelle || '',
      occupationType: 'Terrain nu',
      ownerStatus: 'Personne physique',
      ownerDetails: '',
      additionalInfo: '',
      residentStatus: 'Vacants',
      cadastreId: defaultCadastreEntry.id || ''
    });
  };

  const handleDeleteEntry = (entry: LandRecapEntry) => {
    confirmDelete(entry);
    if (selectedRow === entry.id) {
      setSelectedRow(null);
    }
  };

  const handleInputChange = async (id: string, field: keyof Omit<LandRecapEntry, 'id' | 'ficheId'>, value: string) => {
    await updateEntry(id, { [field]: value });
  };

  const handleCadastreSelect = async (id: string, sectionId: string) => {
    const selectedCadastre = cadastreEntries.find(entry => entry.id === sectionId);
    if (selectedCadastre) {
      await updateEntry(id, {
        section: selectedCadastre.section,
        parcelle: selectedCadastre.parcelle,
        cadastreId: selectedCadastre.id
      });
    }
  };

  const handleSearchOwner = async (id: string) => {
    const entry = entries.find(entry => entry.id === id);
    if (!entry) return;

    let searchDetails = '';
    
    if (entry.ownerStatus === 'Personne morale') {
      // Simulate API call to Pappers API for company information
      setTimeout(async () => {
        searchDetails = "SCI IMMOBILIER MODERNE\nSIRET: 123456789\nCapital: 100,000€\nCA: 580,000€\nDirigeant: Jean Dupont";
        await updateEntry(id, { ownerDetails: searchDetails });
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pappers Immobilier",
        });
      }, 1000);
    } else if (entry.ownerStatus === 'Personne physique') {
      // Simulate API call to Pages Jaunes or equivalent
      setTimeout(async () => {
        searchDetails = "M. Pierre Martin\nTél: 01.XX.XX.XX.XX\nAdresse: 10 rue des Lilas, 75000 Paris";
        await updateEntry(id, { ownerDetails: searchDetails });
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pages Jaunes",
        });
      }, 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-enter opacity-0">
        <div className="text-center py-8">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 animate-enter opacity-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand">Récapitulatif foncier</h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleImportFromCadastre}
              className="flex items-center gap-1"
              disabled={getNewCadastreEntries().length === 0}
            >
              <Download className="h-4 w-4" /> Importer du cadastre
            </Button>
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

    <ConfirmDialog
      open={!!deleteTarget}
      onOpenChange={(open) => !open && cancelDelete()}
      title="Supprimer la ligne"
      description="Êtes-vous sûr de vouloir supprimer cette ligne ? Cette action est irréversible."
      confirmText="Supprimer"
      cancelText="Annuler"
      onConfirm={handleConfirmDelete}
      destructive
    />

    {showImportPreview && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Importer des parcelles</h3>
          <div className="space-y-3 mb-6">
            <p className="text-sm">Les parcelles suivantes vont être importées depuis le module Cadastre :</p>
            <div className="max-h-32 overflow-y-auto bg-muted/30 rounded p-3">
              {pendingImports.map((entry, index) => (
                <div key={entry.id} className="text-sm py-1">
                  {index + 1}. {entry.section} {entry.parcelle}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Chaque parcelle sera ajoutée avec les valeurs par défaut que vous pourrez modifier ensuite.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelImport}>
              Annuler
            </Button>
            <Button onClick={confirmImport}>
              Importer
            </Button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
