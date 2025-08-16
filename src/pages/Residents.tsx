
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Save, X, Users } from 'lucide-react';
import { PropertyValueTable } from '@/components/residents/PropertyValueTable';
import { PropertyOwnersTable } from '@/components/residents/PropertyOwnersTable';
import { useToast } from '@/hooks/use-toast';

interface ResidentEntry {
  id: string;
  parcelle: string;
  adresse: string;
  typeOccupation: string;
  statut: string;
  nbResidents: string;
  dateInstallation: string;
}

const occupationTypes = [
  'Résidence principale',
  'Résidence secondaire',
  'Location long terme',
  'Location courte durée',
  'Vacant',
  'Commerce',
  'Bureau',
  'Autre'
];

const ownershipStatuses = [
  'Propriétaire occupant',
  'Propriétaire non occupant',
  'Locataire',
  'Usufruitier',
  'Indivision',
  'Autre'
];

const Residents = () => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ResidentEntry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Omit<ResidentEntry, 'id'>>({
    parcelle: '',
    adresse: '',
    typeOccupation: '',
    statut: '',
    nbResidents: '',
    dateInstallation: '',
  });
  const [editedEntry, setEditedEntry] = useState<ResidentEntry | null>(null);
  const [cadastreEntries, setCadastreEntries] = useState<Array<{
    id: string;
    section: string;
    parcelle: string;
  }>>([]);

  // Load cadastre data on component mount
  useEffect(() => {
    // In a real app, this would be a call to your API
    // Here we'll simulate loading from localStorage
    const storedData = localStorage.getItem('cadastreEntries');
    if (storedData) {
      setCadastreEntries(JSON.parse(storedData));
    } else {
      // Provide some example data if none exists
      const exampleData = [
        { id: 'cad1', section: 'AB', parcelle: '123' },
        { id: 'cad2', section: 'AC', parcelle: '456' }
      ];
      setCadastreEntries(exampleData);
      localStorage.setItem('cadastreEntries', JSON.stringify(exampleData));
    }
  }, []);

  const handleAddEntry = () => {
    if (!newEntry.parcelle.trim() || !newEntry.typeOccupation) return;
    
    const entry: ResidentEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...newEntry
    };
    
    setEntries(prev => [...prev, entry]);
    setNewEntry({
      parcelle: '',
      adresse: '',
      typeOccupation: '',
      statut: '',
      nbResidents: '',
      dateInstallation: '',
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleEditEntry = (entry: ResidentEntry) => {
    setIsEditing(entry.id);
    setEditedEntry(entry);
  };

  const handleSaveEdit = () => {
    if (!editedEntry) return;
    
    setEntries(prev => prev.map(entry => 
      entry.id === editedEntry.id ? editedEntry : entry
    ));
    
    setIsEditing(null);
    setEditedEntry(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditedEntry(null);
  };

  const handleEditChange = (field: keyof Omit<ResidentEntry, 'id'>, value: string) => {
    if (!editedEntry) return;
    
    setEditedEntry({
      ...editedEntry,
      [field]: value
    });
  };

  // Get current fiche ID from URL (e.g. "fiche/1741469320495" → "1741469320495")
  const getFicheId = (): string | undefined => {
    const pathParts = window.location.pathname.split('/');
    const ficheIndex = pathParts.findIndex(part => part === 'fiche');
    if (ficheIndex !== -1 && pathParts.length > ficheIndex + 1) {
      return pathParts[ficheIndex + 1];
    }
    return undefined;
  };

  // Map ficheId to existing project UUIDs for persistence
  const getProjectIdForFiche = (ficheId: string | undefined): string => {
    const ficheToProjectMap: Record<string, string> = {
      '1': 'ea881c96-3ac0-471f-a3f6-a08344eb9325',
      '2': 'ea881c96-3ac0-471f-a3f6-a08344eb9325',
      '3': 'ea881c96-3ac0-471f-a3f6-a08344eb9325',
    };
    return ficheToProjectMap[ficheId || ''] || 'ea881c96-3ac0-471f-a3f6-a08344eb9325';
  };
  
  const projectId = getProjectIdForFiche(getFicheId());

  return (
    <PageLayout>
      <div className="animate-enter">
        <h1 className="text-4xl font-bold mb-2">Informations sur les résidents</h1>
        <p className="text-lg text-gray-600 mb-8">
          Enregistrez les données sur les occupants actuels des parcelles
        </p>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-brand" />
                Ajouter un nouveau résident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Numéro de parcelle</label>
                  <Input
                    value={newEntry.parcelle}
                    onChange={(e) => setNewEntry({ ...newEntry, parcelle: e.target.value })}
                    placeholder="ex: AB-123"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Adresse</label>
                  <Input
                    value={newEntry.adresse}
                    onChange={(e) => setNewEntry({ ...newEntry, adresse: e.target.value })}
                    placeholder="ex: 10 rue Example"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Type d'occupation</label>
                  <Select
                    value={newEntry.typeOccupation}
                    onValueChange={(value) => setNewEntry({ ...newEntry, typeOccupation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {occupationTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Statut</label>
                  <Select
                    value={newEntry.statut}
                    onValueChange={(value) => setNewEntry({ ...newEntry, statut: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {ownershipStatuses.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Nombre de résidents</label>
                  <Input
                    value={newEntry.nbResidents}
                    onChange={(e) => setNewEntry({ ...newEntry, nbResidents: e.target.value })}
                    placeholder="ex: 3"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Date d'installation</label>
                  <Input
                    type="date"
                    value={newEntry.dateInstallation}
                    onChange={(e) => setNewEntry({ ...newEntry, dateInstallation: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddEntry}
                className="mt-2 bg-brand hover:bg-brand-dark"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Résidents enregistrés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcelle</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Type d'occupation</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Nb résidents</TableHead>
                      <TableHead>Date d'installation</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Aucun résident enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map(entry => (
                        <TableRow key={entry.id}>
                          {isEditing === entry.id ? (
                            // Edit mode
                            <>
                              <TableCell>
                                <Input
                                  value={editedEntry?.parcelle || ''}
                                  onChange={(e) => handleEditChange('parcelle', e.target.value)}
                                  className="max-w-[100px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.adresse || ''}
                                  onChange={(e) => handleEditChange('adresse', e.target.value)}
                                  className="max-w-[150px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editedEntry?.typeOccupation || ''}
                                  onValueChange={(value) => handleEditChange('typeOccupation', value)}
                                >
                                  <SelectTrigger className="max-w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {occupationTypes.map(type => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editedEntry?.statut || ''}
                                  onValueChange={(value) => handleEditChange('statut', value)}
                                >
                                  <SelectTrigger className="max-w-[180px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ownershipStatuses.map(status => (
                                      <SelectItem key={status} value={status}>
                                        {status}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.nbResidents || ''}
                                  onChange={(e) => handleEditChange('nbResidents', e.target.value)}
                                  className="max-w-[80px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="date"
                                  value={editedEntry?.dateInstallation || ''}
                                  onChange={(e) => handleEditChange('dateInstallation', e.target.value)}
                                  className="max-w-[150px]"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleSaveEdit}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="h-8 w-8 p-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            // View mode
                            <>
                              <TableCell>{entry.parcelle}</TableCell>
                              <TableCell>{entry.adresse}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  entry.typeOccupation === 'Vacant' 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {entry.typeOccupation}
                                </span>
                              </TableCell>
                              <TableCell>{entry.statut}</TableCell>
                              <TableCell>{entry.nbResidents}</TableCell>
                              <TableCell>{entry.dateInstallation}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditEntry(entry)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Property Value Table from existing component */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <PropertyValueTable 
                ficheId={getFicheId()} 
                projectId={projectId}
                cadastreEntries={cadastreEntries}
              />
            </CardContent>
          </Card>

          {/* New Property Owners (Récapitulatif foncier) Table */}
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <PropertyOwnersTable 
                ficheId={getFicheId()} 
                cadastreEntries={cadastreEntries}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default Residents;
