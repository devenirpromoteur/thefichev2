
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Plus, Trash2, Calculator, Building, Building2, ArrowRight } from 'lucide-react';

interface UnitEntry {
  id: string;
  typology: string;
  floor: string;
  area: string;
  balcony: string;
  socialHousing: boolean;
}

const Projet = () => {
  const [units, setUnits] = useState<UnitEntry[]>([]);
  const [newUnit, setNewUnit] = useState<Omit<UnitEntry, 'id'>>({
    typology: 'T2',
    floor: '0',
    area: '',
    balcony: '0',
    socialHousing: false,
  });
  const [projectDetails, setProjectDetails] = useState({
    name: '',
    address: '',
    parcelArea: '',
    maxHeight: '',
    maxFootprint: '',
  });
  
  const [summary, setSummary] = useState({
    totalUnits: 0,
    totalArea: 0,
    averageUnitSize: 0,
    socialHousingPercentage: 0,
    totalBalconyArea: 0,
    floorDistribution: {} as Record<string, number>,
    typologyDistribution: {} as Record<string, number>,
  });

  // Calculate summary whenever units change
  useEffect(() => {
    if (units.length === 0) {
      setSummary({
        totalUnits: 0,
        totalArea: 0,
        averageUnitSize: 0,
        socialHousingPercentage: 0,
        totalBalconyArea: 0,
        floorDistribution: {},
        typologyDistribution: {},
      });
      return;
    }
    
    const totalUnits = units.length;
    const totalArea = units.reduce((sum, unit) => sum + parseFloat(unit.area || '0'), 0);
    const averageUnitSize = totalArea / totalUnits;
    const socialHousingUnits = units.filter(unit => unit.socialHousing).length;
    const socialHousingPercentage = (socialHousingUnits / totalUnits) * 100;
    const totalBalconyArea = units.reduce((sum, unit) => sum + parseFloat(unit.balcony || '0'), 0);
    
    // Calculate floor distribution
    const floorDistribution = units.reduce((acc, unit) => {
      const floor = unit.floor;
      acc[floor] = (acc[floor] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate typology distribution
    const typologyDistribution = units.reduce((acc, unit) => {
      const typology = unit.typology;
      acc[typology] = (acc[typology] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    setSummary({
      totalUnits,
      totalArea,
      averageUnitSize,
      socialHousingPercentage,
      totalBalconyArea,
      floorDistribution,
      typologyDistribution,
    });
  }, [units]);
  
  const handleAddUnit = () => {
    if (!newUnit.area) return;
    
    const unit: UnitEntry = {
      id: Math.random().toString(36).substring(2, 9),
      ...newUnit
    };
    
    setUnits(prev => [...prev, unit]);
    setNewUnit({
      typology: 'T2',
      floor: '0',
      area: '',
      balcony: '0',
      socialHousing: false,
    });
  };
  
  const handleDeleteUnit = (id: string) => {
    setUnits(prev => prev.filter(unit => unit.id !== id));
  };

  return (
    <PageLayout>
      <div className="animate-enter">
        <h1 className="text-4xl font-bold mb-2">Configuration du projet</h1>
        <p className="text-lg text-gray-600 mb-8">
          Définissez les caractéristiques de votre projet immobilier
        </p>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="details" className="text-base">
              <Building className="w-4 h-4 mr-2" />
              Détails du projet
            </TabsTrigger>
            <TabsTrigger value="units" className="text-base">
              <Building2 className="w-4 h-4 mr-2" />
              Logements
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-base">
              <Calculator className="w-4 h-4 mr-2" />
              Analyse
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="animate-enter">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Informations générales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">Nom du projet</label>
                    <Input
                      value={projectDetails.name}
                      onChange={(e) => setProjectDetails({...projectDetails, name: e.target.value})}
                      placeholder="ex: Résidence Les Jardins"
                      className="mb-4"
                    />
                    
                    <label className="text-sm font-medium mb-1 block text-gray-700">Adresse</label>
                    <Input
                      value={projectDetails.address}
                      onChange={(e) => setProjectDetails({...projectDetails, address: e.target.value})}
                      placeholder="ex: 10 rue des Fleurs"
                      className="mb-4"
                    />
                    
                    <label className="text-sm font-medium mb-1 block text-gray-700">Surface de la parcelle (m²)</label>
                    <Input
                      value={projectDetails.parcelArea}
                      onChange={(e) => setProjectDetails({...projectDetails, parcelArea: e.target.value})}
                      placeholder="ex: 2500"
                      className="mb-4"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">Hauteur maximale autorisée (m)</label>
                    <Input
                      value={projectDetails.maxHeight}
                      onChange={(e) => setProjectDetails({...projectDetails, maxHeight: e.target.value})}
                      placeholder="ex: 15"
                      className="mb-4"
                    />
                    
                    <label className="text-sm font-medium mb-1 block text-gray-700">Emprise au sol maximale (%)</label>
                    <Input
                      value={projectDetails.maxFootprint}
                      onChange={(e) => setProjectDetails({...projectDetails, maxFootprint: e.target.value})}
                      placeholder="ex: 60"
                      className="mb-4"
                    />
                    
                    <div className="mt-6">
                      <Button className="bg-brand hover:bg-brand-dark mr-2">
                        Enregistrer les détails
                      </Button>
                      <Button variant="outline">
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="units" className="animate-enter">
            <Card className="shadow-soft mb-8">
              <CardHeader>
                <CardTitle>Ajouter un logement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">Typologie</label>
                    <Select
                      value={newUnit.typology}
                      onValueChange={(value) => setNewUnit({...newUnit, typology: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="T1">T1</SelectItem>
                        <SelectItem value="T2">T2</SelectItem>
                        <SelectItem value="T3">T3</SelectItem>
                        <SelectItem value="T4">T4</SelectItem>
                        <SelectItem value="T5+">T5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">Étage</label>
                    <Select
                      value={newUnit.floor}
                      onValueChange={(value) => setNewUnit({...newUnit, floor: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-1">Sous-sol</SelectItem>
                        <SelectItem value="0">RDC</SelectItem>
                        <SelectItem value="1">1er étage</SelectItem>
                        <SelectItem value="2">2ème étage</SelectItem>
                        <SelectItem value="3">3ème étage</SelectItem>
                        <SelectItem value="4">4ème étage</SelectItem>
                        <SelectItem value="5">5ème étage</SelectItem>
                        <SelectItem value="6+">6ème+ étage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">Surface (m²)</label>
                    <Input
                      value={newUnit.area}
                      onChange={(e) => setNewUnit({...newUnit, area: e.target.value})}
                      placeholder="ex: 65"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block text-gray-700">Surface balcon (m²)</label>
                    <Input
                      value={newUnit.balcony}
                      onChange={(e) => setNewUnit({...newUnit, balcony: e.target.value})}
                      placeholder="ex: 8"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newUnit.socialHousing}
                        onChange={(e) => setNewUnit({...newUnit, socialHousing: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className="text-sm font-medium text-gray-700">Logement social</span>
                    </label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddUnit}
                  className="mt-2 bg-brand hover:bg-brand-dark"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Logements du projet ({units.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Typologie</TableHead>
                        <TableHead>Étage</TableHead>
                        <TableHead>Surface (m²)</TableHead>
                        <TableHead>Balcon (m²)</TableHead>
                        <TableHead>Logement social</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            Aucun logement enregistré
                          </TableCell>
                        </TableRow>
                      ) : (
                        units.map(unit => (
                          <TableRow key={unit.id}>
                            <TableCell>
                              <span className="font-medium">{unit.typology}</span>
                            </TableCell>
                            <TableCell>
                              {unit.floor === '-1' ? 'Sous-sol' : 
                               unit.floor === '0' ? 'RDC' : 
                               `${unit.floor}${unit.floor === '1' ? 'er' : 'ème'} étage`}
                            </TableCell>
                            <TableCell>{unit.area} m²</TableCell>
                            <TableCell>{unit.balcony} m²</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                unit.socialHousing ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {unit.socialHousing ? 'Oui' : 'Non'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUnit(unit.id)}
                                className="h-8 p-2 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analysis" className="animate-enter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl">Chiffres clés</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nombre total de logements</dt>
                      <dd className="mt-1 text-3xl font-semibold">{summary.totalUnits}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Surface totale</dt>
                      <dd className="mt-1 text-3xl font-semibold">{summary.totalArea.toFixed(1)} m²</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Surface moyenne par logement</dt>
                      <dd className="mt-1 text-3xl font-semibold">
                        {summary.totalUnits > 0 ? summary.averageUnitSize.toFixed(1) : 0} m²
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Surface totale des balcons</dt>
                      <dd className="mt-1 text-3xl font-semibold">{summary.totalBalconyArea.toFixed(1)} m²</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl">Répartition par typologie</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(summary.typologyDistribution).length > 0 ? (
                    <ul className="space-y-3">
                      {Object.entries(summary.typologyDistribution).map(([typology, count]) => (
                        <li key={typology} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{typology}</span>
                          <div className="ml-2 flex items-center">
                            <div className="w-40 bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-brand h-2.5 rounded-full" 
                                style={{ width: `${(count / summary.totalUnits) * 100}%` }}
                              ></div>
                            </div>
                            <span className="ml-3 text-sm font-medium">
                              {count} ({((count / summary.totalUnits) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Ajoutez des logements pour voir les statistiques</p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl">Répartition par étage</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(summary.floorDistribution).length > 0 ? (
                    <ul className="space-y-3">
                      {Object.entries(summary.floorDistribution)
                        .sort((a, b) => Number(b[0]) - Number(a[0]))
                        .map(([floor, count]) => (
                          <li key={floor} className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {floor === '-1' ? 'Sous-sol' : 
                               floor === '0' ? 'RDC' : 
                               `${floor}${floor === '1' ? 'er' : 'ème'} étage`}
                            </span>
                            <div className="ml-2 flex items-center">
                              <div className="w-40 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-brand h-2.5 rounded-full" 
                                  style={{ width: `${(count / summary.totalUnits) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-3 text-sm font-medium">
                                {count} ({((count / summary.totalUnits) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Ajoutez des logements pour voir les statistiques</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl">Logement social</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className="bg-brand h-4 rounded-full transition-all duration-500" 
                        style={{ width: `${summary.socialHousingPercentage}%` }}
                      ></div>
                    </div>
                    <span className="ml-4 text-lg font-medium">
                      {summary.socialHousingPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {summary.totalUnits > 0 
                      ? `${Math.round(summary.socialHousingPercentage * summary.totalUnits / 100)} logements sociaux sur ${summary.totalUnits} au total`
                      : 'Ajoutez des logements pour calculer le pourcentage de logements sociaux'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button className="bg-brand hover:bg-brand-dark">
                Voir la synthèse complète
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Projet;
