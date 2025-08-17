import React, { useState, useCallback } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Info, Trash2, Search, Loader2 } from 'lucide-react';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useLandRecaps, type CadastreEntry } from '@/hooks/useLandRecaps';
import { useToast } from '@/hooks/use-toast';

interface LandRecapModuleProps {
  projectId: string;
  cadastreEntries: CadastreEntry[];
}

export const LandRecapModule: React.FC<LandRecapModuleProps> = React.memo(({ 
  projectId,
  cadastreEntries 
}) => {
  const { toast } = useToast();
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; entryId: string | null }>({ 
    open: false, 
    entryId: null 
  });

  const { 
    entries, 
    state, 
    addEntry, 
    updateEntry, 
    assignParcel,
    deleteEntry,
    occupationTypes,
    ownerStatusOptions,
    residentStatusOptions,
    availableParcels
  } = useLandRecaps(projectId, cadastreEntries);

  const handleAddEntry = useCallback(async () => {
    const unusedParcel = availableParcels[0];
    await addEntry(unusedParcel);
  }, [addEntry, availableParcels]);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm({ open: true, entryId: id });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteConfirm.entryId) {
      await deleteEntry(deleteConfirm.entryId);
      setDeleteConfirm({ open: false, entryId: null });
    }
  }, [deleteConfirm.entryId, deleteEntry]);

  const handleInputChange = useCallback((id: string, field: string, value: string) => {
    updateEntry(id, field as any, value);
  }, [updateEntry]);

  const handleParcelSelect = useCallback((entryId: string, parcelId: string) => {
    assignParcel(entryId, parcelId);
  }, [assignParcel]);

  const handleSearchOwner = useCallback((id: string) => {
    const entry = entries.find(entry => entry.id === id);
    if (!entry) return;

    let searchDetails = '';
    
    if (entry.ownerStatus === 'Personne morale') {
      // Simulate API call to Pappers API for company information
      setTimeout(() => {
        searchDetails = "SCI IMMOBILIER MODERNE\nSIRET: 123456789\nCapital: 100,000€\nCA: 580,000€\nDirigeant: Jean Dupont";
        updateEntry(id, 'ownerName', searchDetails);
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pappers Immobilier",
        });
      }, 1000);
    } else if (entry.ownerStatus === 'Personne physique') {
      // Simulate API call to Pages Jaunes or equivalent
      setTimeout(() => {
        searchDetails = "M. Pierre Martin\nTél: 01.XX.XX.XX.XX\nAdresse: 10 rue des Lilas, 75000 Paris";
        updateEntry(id, 'ownerName', searchDetails);
        
        toast({
          title: "Informations trouvées",
          description: "Données récupérées depuis Pages Jaunes",
        });
      }, 1000);
    }
  }, [entries, updateEntry, toast]);

  if (state.loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand">Récapitulatif foncier</h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="border rounded-md p-4">
          <Skeleton className="h-8 w-full mb-4" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-enter opacity-0">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-brand">Récapitulatif foncier</h2>
          <div className="text-sm text-muted-foreground">
            {entries.length} parcelle{entries.length > 1 ? 's' : ''} • {availableParcels.length} disponible{availableParcels.length > 1 ? 's' : ''}
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddEntry}
          disabled={state.saving === 'new'}
          className="flex items-center gap-1"
        >
          {state.saving === 'new' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Ajouter
        </Button>
      </div>

      {state.error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {state.error}
        </div>
      )}

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
                className={`cursor-pointer transition-colors ${
                  selectedRow === entry.id ? 'bg-brand/5' : ''
                } hover:bg-brand/5 ${state.deleting === entry.id ? 'opacity-50' : ''}`}
              >
                <TableCell>
                  <Select 
                    value={entry.parcelId || ""}
                    onValueChange={(value) => handleParcelSelect(entry.id, value)}
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
                      value={entry.ownerName}
                      onChange={(e) => handleInputChange(entry.id, 'ownerName', e.target.value)}
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
                      aria-label="Rechercher les informations du propriétaire"
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
                      handleDeleteClick(entry.id);
                    }}
                    disabled={state.deleting === entry.id}
                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                    aria-label={`Supprimer la parcelle ${entry.section} ${entry.parcelle}`}
                  >
                    {state.deleting === entry.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && !state.loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucune parcelle ajoutée. Cliquez sur "Ajouter" pour commencer.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        description="Êtes-vous sûr de vouloir supprimer cette parcelle du récapitulatif foncier ? Cette action ne peut pas être annulée."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
});

LandRecapModule.displayName = 'LandRecapModule';