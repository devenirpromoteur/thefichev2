import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FileText, Eye, Settings } from 'lucide-react';

interface ExportSection {
  id: string;
  label: string;
  enabled: boolean;
}

interface ExportOptions {
  format: 'a4' | 'letter';
  orientation: 'portrait' | 'landscape';
  quality: 'standard' | 'high';
  margins: 'normal' | 'narrow' | 'wide';
}

interface ExportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (sections: string[], options: ExportOptions) => void;
  isExporting?: boolean;
}

export const ExportPreviewDialog: React.FC<ExportPreviewDialogProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting = false
}) => {
  const [sections, setSections] = useState<ExportSection[]>([
    { id: 'photo', label: 'Photo aérienne', enabled: true },
    { id: 'cadastre', label: 'Parcelles cadastrales', enabled: true },
    { id: 'project', label: 'Résumé du projet', enabled: true },
    { id: 'housing', label: 'Répartition des logements', enabled: true },
    { id: 'parking', label: 'Stationnement', enabled: true }
  ]);

  const [options, setOptions] = useState<ExportOptions>({
    format: 'a4',
    orientation: 'portrait',
    quality: 'standard',
    margins: 'normal'
  });

  const toggleSection = (id: string) => {
    setSections(sections.map(section => 
      section.id === id 
        ? { ...section, enabled: !section.enabled }
        : section
    ));
  };

  const handleExport = () => {
    const enabledSections = sections
      .filter(section => section.enabled)
      .map(section => section.id);
    
    onExport(enabledSections, options);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Options d'export PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sections à inclure */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Sections à inclure
            </Label>
            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={section.id}
                    checked={section.enabled}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <Label 
                    htmlFor={section.id}
                    className="text-sm cursor-pointer"
                  >
                    {section.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Options de format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Format
              </Label>
              <Select 
                value={options.format} 
                onValueChange={(value: 'a4' | 'letter') => 
                  setOptions({ ...options, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Orientation
              </Label>
              <Select 
                value={options.orientation} 
                onValueChange={(value: 'portrait' | 'landscape') => 
                  setOptions({ ...options, orientation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Paysage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Qualité
              </Label>
              <Select 
                value={options.quality} 
                onValueChange={(value: 'standard' | 'high') => 
                  setOptions({ ...options, quality: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">Haute qualité</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Marges
              </Label>
              <Select 
                value={options.margins} 
                onValueChange={(value: 'normal' | 'narrow' | 'wide') => 
                  setOptions({ ...options, margins: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="narrow">Étroites</SelectItem>
                  <SelectItem value="normal">Normales</SelectItem>
                  <SelectItem value="wide">Larges</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || sections.every(s => !s.enabled)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? 'Génération...' : 'Générer PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};