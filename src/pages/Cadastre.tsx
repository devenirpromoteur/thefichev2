
import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';

interface CadastreEntry {
  id: string;
  parcelle: string;
  adresse: string;
  section: string;
  surface: string;
}

const Cadastre = () => {
  const [entries, setEntries] = useState<CadastreEntry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Omit<CadastreEntry, 'id'>>({
    parcelle: '',
    adresse: '',
    section: '',
    surface: '',
  });
  const [editedEntry, setEditedEntry] = useState<CadastreEntry | null>(null);

  const handleAddEntry = () => {
    if (!newEntry.parcelle.trim()) return;
    
    const entry: CadastreEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...newEntry
    };
    
    setEntries(prev => [...prev, entry]);
    setNewEntry({ parcelle: '', adresse: '', section: '', surface: '' });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleEditEntry = (entry: CadastreEntry) => {
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

  const handleEditChange = (field: keyof Omit<CadastreEntry, 'id'>, value: string) => {
    if (!editedEntry) return;
    
    setEditedEntry({
      ...editedEntry,
      [field]: value
    });
  };

  return (
    <PageLayout>
      <div className="animate-enter">
        <h1 className="text-4xl font-bold mb-2">Données cadastrales</h1>
        <p className="text-lg text-gray-600 mb-8">
          Enregistrez et gérez les informations cadastrales de votre projet
        </p>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Ajouter une nouvelle parcelle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  <label className="text-sm font-medium mb-1 block text-gray-700">Section cadastrale</label>
                  <Input
                    value={newEntry.section}
                    onChange={(e) => setNewEntry({ ...newEntry, section: e.target.value })}
                    placeholder="ex: Section B"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Surface (m²)</label>
                  <Input
                    value={newEntry.surface}
                    onChange={(e) => setNewEntry({ ...newEntry, surface: e.target.value })}
                    placeholder="ex: 450"
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
              <CardTitle>Parcelles enregistrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro de parcelle</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Section cadastrale</TableHead>
                      <TableHead>Surface (m²)</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucune parcelle enregistrée
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
                                  className="max-w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.adresse || ''}
                                  onChange={(e) => handleEditChange('adresse', e.target.value)}
                                  className="max-w-[200px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.section || ''}
                                  onChange={(e) => handleEditChange('section', e.target.value)}
                                  className="max-w-[150px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.surface || ''}
                                  onChange={(e) => handleEditChange('surface', e.target.value)}
                                  className="max-w-[100px]"
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
                              <TableCell>{entry.section}</TableCell>
                              <TableCell>{entry.surface}</TableCell>
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
        </div>
      </div>
    </PageLayout>
  );
};

export default Cadastre;
