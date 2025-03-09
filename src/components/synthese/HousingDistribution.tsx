
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface HousingDistributionProps {
  projectSummary: {
    logementsLibres: number;
    logementsSociaux: number;
  };
  handleSummaryChange: (field: string, value: number) => void;
  isEditing: boolean;
  visibleSections: {
    logements: boolean;
  };
  toggleSection: (section: string) => void;
}

export const HousingDistribution: React.FC<HousingDistributionProps> = ({
  projectSummary,
  handleSummaryChange,
  isEditing,
  visibleSections,
  toggleSection
}) => {
  const COLORS = ['#6A5AEF', '#9b87f5', '#4F3CE7', '#E5DEFF'];

  return (
    <Card className="border-l-4 border-l-brand">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Répartition des logements</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSection('logements')}
        >
          {visibleSections.logements ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {visibleSections.logements && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Logements libres</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.logementsLibres} 
                    onChange={(e) => handleSummaryChange('logementsLibres', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.logementsLibres}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Label>Logements sociaux</Label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={projectSummary.logementsSociaux} 
                    onChange={(e) => handleSummaryChange('logementsSociaux', Number(e.target.value))}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className="font-medium">{projectSummary.logementsSociaux}</span>
                )}
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>Total logements</span>
                <span className="text-brand">
                  {projectSummary.logementsLibres + projectSummary.logementsSociaux}
                </span>
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Libres', value: projectSummary.logementsLibres },
                      { name: 'Sociaux', value: projectSummary.logementsSociaux }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
