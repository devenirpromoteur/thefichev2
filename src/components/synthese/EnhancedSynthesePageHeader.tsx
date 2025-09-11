import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Download, 
  Printer, 
  Share2, 
  Edit, 
  Save, 
  FileText, 
  Upload,
  Eye,
  Settings
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useSynthesisExport, SynthesisData } from '@/hooks/useSynthesisExport';
import { ExportPreviewDialog } from './ExportPreviewDialog';

interface EnhancedSynthesePageHeaderProps {
  isEditing: boolean;
  toggleEditing: () => void;
  handlePrint: () => void;
  handleShare: () => void;
  synthesisData: SynthesisData;
  onDataImport?: (data: SynthesisData) => void;
  onCreateFiche?: (data: SynthesisData) => void;
}

export const EnhancedSynthesePageHeader: React.FC<EnhancedSynthesePageHeaderProps> = ({
  isEditing,
  toggleEditing,
  handlePrint,
  handleShare,
  synthesisData,
  onDataImport,
  onCreateFiche
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { generatePDF, generatePreview } = usePDFExport();
  const { exportToJSON, importFromJSON, createFicheFromSynthesis } = useSynthesisExport();

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      await generatePDF('synthesis-content', {
        filename: `synthese-${synthesisData.projectInfo.name || 'projet'}.pdf`,
        format: 'a4',
        orientation: 'portrait',
        margin: [15, 15, 15, 15]
      });
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = async () => {
    try {
      setShowExportDialog(true);
      // Preview functionality can be implemented here
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleJSONExport = () => {
    exportToJSON(synthesisData);
  };

  const handleJSONImport = async () => {
    const importedData = await importFromJSON();
    if (importedData && onDataImport) {
      onDataImport(importedData);
    }
  };

  const handleCreateFiche = () => {
    if (onCreateFiche) {
      onCreateFiche(synthesisData);
    }
  };

  return (
    <div className="flex justify-between items-center print-hide">
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Synthèse du projet
        </h1>
        <p className="text-muted-foreground mt-1">
          {synthesisData.projectInfo.name || 'Nouveau projet'}
        </p>
      </div>
      
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handlePDFExport} disabled={isExporting}>
              <FileText className="mr-2 h-4 w-4" />
              {isExporting ? 'Génération PDF...' : 'Exporter PDF'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleJSONExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter données (JSON)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Options avancées
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleJSONImport}>
              <Upload className="mr-2 h-4 w-4" />
              Importer synthèse
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateFiche}>
              <FileText className="mr-2 h-4 w-4" />
              Créer fiche depuis synthèse
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ExportPreviewDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={async (sections, options) => {
          setIsExporting(true);
          setShowExportDialog(false);
          try {
            await generatePDF('synthesis-content', {
              filename: `synthese-${synthesisData.projectInfo.name || 'projet'}.pdf`,
              format: options.format,
              orientation: options.orientation,
              margin: options.margins === 'narrow' ? 10 : options.margins === 'wide' ? 20 : 15,
              quality: options.quality === 'high' ? 2 : 1
            });
          } finally {
            setIsExporting(false);
          }
        }}
        isExporting={isExporting}
      />
    </div>
  );
};