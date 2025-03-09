
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Share2, Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SynthesePageHeaderProps {
  isEditing: boolean;
  toggleEditing: () => void;
  handleDownload: () => void;
  handlePrint: () => void;
  handleShare: () => void;
}

export const SynthesePageHeader: React.FC<SynthesePageHeaderProps> = ({
  isEditing,
  toggleEditing,
  handleDownload,
  handlePrint,
  handleShare
}) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-brand">Synthèse du projet</h1>
      <div className="flex space-x-2">
        <Button 
          variant={isEditing ? "secondary" : "outline"} 
          size="sm" 
          onClick={toggleEditing}
        >
          {isEditing ? (
            <>
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </>
          ) : (
            <>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </>
          )}
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          Imprimer
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Partager
        </Button>
      </div>
    </div>
  );
};
