
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface ProjectSummaryProps {
  projectSummary: {
    perimetre: number;
    capaciteConstructive: number;
    cos: number;
    hauteur: number;
    etages: number;
    capaciteLogements: number;
    surfaceBatimentPrincipal: number;
    surfaceBatimentsAnnexes: number;
    surfaceEspacesVerts: number;
  };
  handleSummaryChange: (field: string, value: number) => void;
  isEditing: boolean;
  visibleSections: {
    projet: boolean;
  };
  toggleSection: (section: string) => void;
}

export const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  projectSummary,
  handleSummaryChange,
  isEditing,
  visibleSections,
  toggleSection
}) => {
  return (
    <Card className="border-l-4 border-l-brand-dark">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Résumé du projet</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSection('projet')}
        >
          {visibleSections.projet ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {visibleSections.projet && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Périmètre foncier (m²)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.perimetre} 
                    onChange={(e) => handleSummaryChange('perimetre', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.perimetre}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Capacité constructive (m²)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.capaciteConstructive} 
                    onChange={(e) => handleSummaryChange('capaciteConstructive', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.capaciteConstructive}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Coefficient d'occupation des sols (COS)</Label>
                <span className="font-medium">{projectSummary.cos}</span>
              </div>
              <div className="flex items-center justify-between">
                <Label>Hauteur du bâtiment (m)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.hauteur} 
                    onChange={(e) => handleSummaryChange('hauteur', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.hauteur}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Nombre d'étages</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.etages} 
                    onChange={(e) => handleSummaryChange('etages', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.etages}</span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Capacité totale logements (m²)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.capaciteLogements} 
                    onChange={(e) => handleSummaryChange('capaciteLogements', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.capaciteLogements}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Surface du bâtiment principal (m²)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.surfaceBatimentPrincipal} 
                    onChange={(e) => handleSummaryChange('surfaceBatimentPrincipal', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.surfaceBatimentPrincipal}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Surface des bâtiments annexes (m²)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.surfaceBatimentsAnnexes} 
                    onChange={(e) => handleSummaryChange('surfaceBatimentsAnnexes', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.surfaceBatimentsAnnexes}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Surface des espaces verts (m²)</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.surfaceEspacesVerts} 
                    onChange={(e) => handleSummaryChange('surfaceEspacesVerts', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.surfaceEspacesVerts}</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
