import React, { useState, useCallback, useMemo } from 'react';
import { 
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Plus, Trash2, Info, Loader2 } from 'lucide-react';
import { 
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger 
} from '@/components/ui/tooltip';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useExistingValues, type CadastreEntry } from '@/hooks/useExistingValues';

interface ExistingValuesModuleProps {
  projectId: string;
  cadastreEntries: CadastreEntry[];
}

const PROPERTY_TYPES = [
  { label: "Logements", value: "Logements" },
  { label: "Parkings", value: "Parkings" },
  { label: "Autres", value: "Autres" }
];

export const ExistingValuesModule: React.FC<ExistingValuesModuleProps> = React.memo(({ 
  projectId,
  cadastreEntries 
}) => {
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
    deleteEntry, 
    totalValue 
  } = useExistingValues(projectId, cadastreEntries);

  const handleAddEntry = useCallback(async () => {
    await addEntry();
  }, [addEntry]);

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirm({ open: true, entryId: id });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteConfirm.entryId) {
      await deleteEntry(deleteConfirm.entryId);
      setDeleteConfirm({ open: false, entryId: null });
    }
  }, [deleteConfirm.entryId, deleteEntry]);

  const handleInputChange = useCallback((id: string, field: string, value: string | number) => {
    updateEntry(id, field as any, value);
  }, [updateEntry]);

  const handleParcelSelect = useCallback((entryId: string, parcelId: string) => {
    const selectedParcel = cadastreEntries.find(parcel => parcel.id === parcelId);
    if (selectedParcel) {
      updateEntry(entryId, 'section', selectedParcel.section);
      updateEntry(entryId, 'parcelle', selectedParcel.parcelle);
      updateEntry(entryId, 'parcelId', selectedParcel.id);
    }
  }, [cadastreEntries, updateEntry]);

  const formatNumber = useMemo(() => (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }, []);

  if (state.loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-brand">Valeurs de l'existant</h2>
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
          <h2 className="text-xl font-semibold text-brand">Valeurs de l'existant</h2>
          {totalValue > 0 && (
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-brand">{formatNumber(totalValue)} k€</span>
            </div>
          )}
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
              <TableHead className="min-w-[120px]">Type</TableHead>
              <TableHead className="min-w-[100px]">Surface/Nb</TableHead>
              <TableHead className="min-w-[120px]">Abattement</TableHead>
              <TableHead className="min-w-[120px]">Prix/m² (€)</TableHead>
              <TableHead className="min-w-[120px]">Taux cap (%)</TableHead>
              <TableHead className="min-w-[100px]">État</TableHead>
              <TableHead className="min-w-[120px]">Valeur (k€)</TableHead>
              <TableHead className="min-w-[120px]">
                <div className="flex items-center">
                  DVF (€/m²)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">
                          Données DVF (Demandes de Valeurs Foncières) pour référence
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
                      {cadastreEntries.map((parcel) => (
                        <SelectItem key={parcel.id} value={parcel.id}>
                          {parcel.section} {parcel.parcelle}
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
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.surface}
                    onChange={(e) => handleInputChange(entry.id, 'surface', e.target.value ? Number(e.target.value) : '')}
                    className="h-8"
                    placeholder="0"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    step="0.01"
                    value={entry.abattement}
                    onChange={(e) => handleInputChange(entry.id, 'abattement', e.target.value ? Number(e.target.value) : '')}
                    className="h-8"
                    placeholder="1.00"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.prixM2}
                    onChange={(e) => handleInputChange(entry.id, 'prixM2', e.target.value ? Number(e.target.value) : '')}
                    className="h-8"
                    placeholder="0"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    step="0.001"
                    value={entry.tauxCap}
                    onChange={(e) => handleInputChange(entry.id, 'tauxCap', e.target.value ? Number(e.target.value) : '')}
                    className="h-8"
                    placeholder="0.050"
                    min="0"
                    max="1"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    step="0.01"
                    value={entry.etat}
                    onChange={(e) => handleInputChange(entry.id, 'etat', e.target.value ? Number(e.target.value) : '')}
                    className="h-8"
                    placeholder="1.00"
                    min="0"
                    max="1"
                  />
                </TableCell>
                <TableCell className="font-medium text-brand">
                  {formatNumber(entry.valeur)}
                </TableCell>
                <TableCell>
                  <Input 
                    type="number"
                    value={entry.dvf}
                    onChange={(e) => handleInputChange(entry.id, 'dvf', e.target.value ? Number(e.target.value) : '')}
                    className="h-8"
                    placeholder="0"
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
                    disabled={state.deleting === entry.id}
                    className="h-8 w-8 text-destructive hover:text-destructive/90"
                    aria-label={`Supprimer la ligne ${entry.section} ${entry.parcelle}`}
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
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Aucune valeur ajoutée. Cliquez sur "Ajouter" pour commencer.
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
        description="Êtes-vous sûr de vouloir supprimer cette valeur ? Cette action ne peut pas être annulée."
        confirmText="Supprimer"
        cancelText="Annuler"
      />
    </div>
  );
});

ExistingValuesModule.displayName = 'ExistingValuesModule';