
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CadastreEntry {
  id: string;
  parcelle: string;
  adresse: string;
  section: string;
  surface: number;
}

interface CadastreSectionProps {
  entries: CadastreEntry[];
  setEntries: React.Dispatch<React.SetStateAction<CadastreEntry[]>>;
  selectedRow: string | null;
  setSelectedRow: React.Dispatch<React.SetStateAction<string | null>>;
  isEditing: boolean;
  visibleSections: {
    cadastre: boolean;
  };
  toggleSection: (section: string) => void;
}

export const CadastreSection: React.FC<CadastreSectionProps> = ({
  entries,
  setEntries,
  selectedRow,
  setSelectedRow,
  isEditing,
  visibleSections,
  toggleSection
}) => {
  const { toast } = useToast();

  const handleAddCadastreEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      parcelle: '',
      adresse: '',
      section: '',
      surface: 0
    };
    setEntries([...entries, newEntry]);
  };

  const handleDeleteCadastreEntry = () => {
    if (selectedRow) {
      setEntries(entries.filter(entry => entry.id !== selectedRow));
      setSelectedRow(null);
      toast({
        title: "Parcelle supprimée",
        description: "La parcelle a été supprimée avec succès"
      });
    }
  };

  const handleCadastreChange = (id: string, field: keyof CadastreEntry, value: string | number) => {
    setEntries(entries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const getTotalSurface = () => {
    return entries.reduce((total, entry) => total + (typeof entry.surface === 'number' ? entry.surface : 0), 0);
  };

  return (
    <Card className="border-l-4 border-l-brand-light">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Parcelles cadastrales</CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => toggleSection('cadastre')}
        >
          {visibleSections.cadastre ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </Button>
      </CardHeader>
      {visibleSections.cadastre && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddCadastreEntry}
                  disabled={!isEditing}
                >
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteCadastreEntry}
                  disabled={!selectedRow || !isEditing}
                  className="text-red-500"
                >
                  <Minus className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </div>
            </div>
          
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcelle</TableHead>
                    <TableHead>Adresse</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Surface (m²)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow 
                      key={entry.id} 
                      className={`${selectedRow === entry.id ? "bg-brand/10" : ""} ${isEditing ? "cursor-pointer" : ""}`}
                      onClick={() => isEditing && setSelectedRow(entry.id)}
                    >
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            value={entry.parcelle} 
                            onChange={(e) => handleCadastreChange(entry.id, 'parcelle', e.target.value)}
                            className="h-8"
                          />
                        ) : entry.parcelle}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            value={entry.adresse} 
                            onChange={(e) => handleCadastreChange(entry.id, 'adresse', e.target.value)}
                            className="h-8"
                          />
                        ) : entry.adresse}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            value={entry.section} 
                            onChange={(e) => handleCadastreChange(entry.id, 'section', e.target.value)}
                            className="h-8"
                          />
                        ) : entry.section}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input 
                            type="number" 
                            value={entry.surface} 
                            onChange={(e) => handleCadastreChange(entry.id, 'surface', Number(e.target.value))}
                            className="h-8"
                          />
                        ) : entry.surface}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md border">
              <div className="flex justify-between items-center">
                <span className="font-medium">Surface totale</span>
                <span className="text-xl font-bold text-brand">{getTotalSurface()} m²</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
