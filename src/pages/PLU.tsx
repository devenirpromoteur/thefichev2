
import React, { useState } from 'react';
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
import { Plus, Trash2, Edit, Save, X, FileText } from 'lucide-react';

interface PLUEntry {
  id: string;
  parcelle: string;
  zone: string;
  empriseMax: string;
  hauteurMax: string;
  espacesVerts: string;
  stationnement: string;
}

const zoneOptions = [
  'UA', 'UB', 'UC', 'UD', 'UE', 'UX', 
  'AU', 'A', 'N', 'NL'
];

const PLU = () => {
  const [entries, setEntries] = useState<PLUEntry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Omit<PLUEntry, 'id'>>({
    parcelle: '',
    zone: '',
    empriseMax: '',
    hauteurMax: '',
    espacesVerts: '',
    stationnement: '',
  });
  const [editedEntry, setEditedEntry] = useState<PLUEntry | null>(null);

  const handleAddEntry = () => {
    if (!newEntry.parcelle.trim() || !newEntry.zone) return;
    
    const entry: PLUEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...newEntry
    };
    
    setEntries(prev => [...prev, entry]);
    setNewEntry({
      parcelle: '',
      zone: '',
      empriseMax: '',
      hauteurMax: '',
      espacesVerts: '',
      stationnement: '',
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const handleEditEntry = (entry: PLUEntry) => {
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

  const handleEditChange = (field: keyof Omit<PLUEntry, 'id'>, value: string) => {
    if (!editedEntry) return;
    
    setEditedEntry({
      ...editedEntry,
      [field]: value
    });
  };

  return (
    <PageLayout>
      <div className="animate-enter">
        <h1 className="text-4xl font-bold mb-2">Données PLU</h1>
        <p className="text-lg text-gray-600 mb-8">
          Enregistrez les règles d'urbanisme applicables à votre projet
        </p>

        <div className="grid grid-cols-1 gap-8">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-brand" />
                Ajouter une nouvelle entrée PLU
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
                  <label className="text-sm font-medium mb-1 block text-gray-700">Zone PLU</label>
                  <Select
                    value={newEntry.zone}
                    onValueChange={(value) => setNewEntry({ ...newEntry, zone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneOptions.map(zone => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Emprise au sol max (%)</label>
                  <Input
                    value={newEntry.empriseMax}
                    onChange={(e) => setNewEntry({ ...newEntry, empriseMax: e.target.value })}
                    placeholder="ex: 60"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Hauteur max (m)</label>
                  <Input
                    value={newEntry.hauteurMax}
                    onChange={(e) => setNewEntry({ ...newEntry, hauteurMax: e.target.value })}
                    placeholder="ex: 12"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Espaces verts min (%)</label>
                  <Input
                    value={newEntry.espacesVerts}
                    onChange={(e) => setNewEntry({ ...newEntry, espacesVerts: e.target.value })}
                    placeholder="ex: 20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block text-gray-700">Stationnement (places/logement)</label>
                  <Input
                    value={newEntry.stationnement}
                    onChange={(e) => setNewEntry({ ...newEntry, stationnement: e.target.value })}
                    placeholder="ex: 1.5"
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
              <CardTitle>Règles d'urbanisme enregistrées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcelle</TableHead>
                      <TableHead>Zone PLU</TableHead>
                      <TableHead>Emprise max</TableHead>
                      <TableHead>Hauteur max</TableHead>
                      <TableHead>Espaces verts</TableHead>
                      <TableHead>Stationnement</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          Aucune donnée PLU enregistrée
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
                                  className="max-w-[120px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={editedEntry?.zone || ''}
                                  onValueChange={(value) => handleEditChange('zone', value)}
                                >
                                  <SelectTrigger className="max-w-[100px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {zoneOptions.map(zone => (
                                      <SelectItem key={zone} value={zone}>
                                        {zone}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.empriseMax || ''}
                                  onChange={(e) => handleEditChange('empriseMax', e.target.value)}
                                  className="max-w-[80px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.hauteurMax || ''}
                                  onChange={(e) => handleEditChange('hauteurMax', e.target.value)}
                                  className="max-w-[80px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.espacesVerts || ''}
                                  onChange={(e) => handleEditChange('espacesVerts', e.target.value)}
                                  className="max-w-[80px]"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editedEntry?.stationnement || ''}
                                  onChange={(e) => handleEditChange('stationnement', e.target.value)}
                                  className="max-w-[80px]"
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
                              <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand">
                                  {entry.zone}
                                </span>
                              </TableCell>
                              <TableCell>{entry.empriseMax}%</TableCell>
                              <TableCell>{entry.hauteurMax} m</TableCell>
                              <TableCell>{entry.espacesVerts}%</TableCell>
                              <TableCell>{entry.stationnement}</TableCell>
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

export default PLU;
