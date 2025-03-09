
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface ParkingSectionProps {
  projectSummary: {
    stationnementRequis: number;
    stationnementPrevu: number;
    stationnementExterieur: number;
    stationnementInterieur: number;
    logementsLibres: number;
    logementsSociaux: number;
  };
  handleSummaryChange: (field: string, value: number) => void;
  isEditing: boolean;
  visibleSections: {
    stationnement: boolean;
  };
  toggleSection: (section: string) => void;
}

export const ParkingSection: React.FC<ParkingSectionProps> = ({
  projectSummary,
  handleSummaryChange,
  isEditing,
  visibleSections,
  toggleSection
}) => {
  return (
    <Card className="border-l-4 border-l-brand-light">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stationnement</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSection('stationnement')}
        >
          {visibleSections.stationnement ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {visibleSections.stationnement && (
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Places requises par réglementation</Label>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={projectSummary.stationnementRequis} 
                      onChange={(e) => handleSummaryChange('stationnementRequis', Number(e.target.value))}
                      className="w-24 h-8 text-right"
                    />
                  ) : (
                    <span className="font-medium">{projectSummary.stationnementRequis}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label>Places prévues dans le projet</Label>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={projectSummary.stationnementPrevu} 
                      onChange={(e) => handleSummaryChange('stationnementPrevu', Number(e.target.value))}
                      className="w-24 h-8 text-right"
                    />
                  ) : (
                    <span className="font-medium">{projectSummary.stationnementPrevu}</span>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Places en intérieur</Label>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={projectSummary.stationnementInterieur} 
                      onChange={(e) => handleSummaryChange('stationnementInterieur', Number(e.target.value))}
                      className="w-24 h-8 text-right"
                    />
                  ) : (
                    <span className="font-medium">{projectSummary.stationnementInterieur}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <Label>Places en extérieur</Label>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={projectSummary.stationnementExterieur} 
                      onChange={(e) => handleSummaryChange('stationnementExterieur', Number(e.target.value))}
                      className="w-24 h-8 text-right"
                    />
                  ) : (
                    <span className="font-medium">{projectSummary.stationnementExterieur}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="rounded-md p-3 bg-gray-50 border mt-2">
              <div className="flex justify-between">
                <div className="font-medium">
                  Ratio place/logement
                </div>
                <div className="font-medium">
                  {((projectSummary.stationnementInterieur + projectSummary.stationnementExterieur) / 
                    (projectSummary.logementsLibres + projectSummary.logementsSociaux)).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
