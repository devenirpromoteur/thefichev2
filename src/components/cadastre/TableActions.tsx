
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Info } from 'lucide-react';

interface TableActionsProps {
  onAddEntry: () => void;
  onDeleteEntry: () => void;
  isDeleteDisabled: boolean;
}

export const TableActions: React.FC<TableActionsProps> = ({
  onAddEntry,
  onDeleteEntry,
  isDeleteDisabled,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <Button 
          onClick={onAddEntry}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button 
          onClick={onDeleteEntry}
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isDeleteDisabled}
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Info className="h-4 w-4 mr-1" />
        <span>Sélectionnez une ligne pour la supprimer</span>
      </div>
    </div>
  );
};
