
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Printer, Share2, Plus, Minus, Image, Eye, EyeOff, Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// Données fictives pour la démonstration
const projectData = {
  cadastre: [
    { id: '1', parcelle: 'AB123', adresse: '15 rue des Lilas', section: 'AB', surface: 450 },
    { id: '2', parcelle: 'AB124', adresse: '17 rue des Lilas', section: 'AB', surface: 520 },
  ],
  plu: [
    { id: '1', zone: 'UA', empriseMax: 70, hauteurMax: 12, espacesVerts: 20, stationnement: 1.5 },
  ],
  residents: [
    { id: '1', type: 'Propriétaire occupant', nombre: 2, statut: 'Retraité' },
    { id: '2', type: 'Locataire', nombre: 3, statut: 'Famille' },
  ],
  projet: {
    surfaceTotale: 970,
    surfacePlancher: 1200,
    nombreLogements: 15,
    typologies: {
      t2: 5,
      t3: 7,
      t4: 3,
    },
    logementSocial: 4,
    parking: 18,
  }
};

// Données pour les graphiques
const typologiesData = [
  { name: 'T2', value: 5 },
  { name: 'T3', value: 7 },
  { name: 'T4', value: 3 },
];

const surfaceData = [
  { name: 'Emprise au sol', surface: 679 },
  { name: 'Surface plancher', surface: 1200 },
  { name: 'Surface terrain', surface: 970 },
];

const COLORS = ['#6A5AEF', '#9b87f5', '#4F3CE7', '#E5DEFF'];

const Synthese = () => {
  const [activeTab, setActiveTab] = useState('apercu');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const { toast } = useToast();

  // Cadastre state
  const [cadastreEntries, setCadastreEntries] = useState(projectData.cadastre);
  const [selectedCadastreRow, setSelectedCadastreRow] = useState<string | null>(null);

  // Résumé du projet state
  const [projectSummary, setProjectSummary] = useState({
    perimetre: 970,
    capaciteConstructive: 1200,
    cos: 1.24,
    hauteur: 12,
    etages: 4,
    capaciteLogements: 1050,
    logementsLibres: 11,
    logementsSociaux: 4,
    stationnementRequis: 18,
    stationnementPrevu: 20,
    stationnementExterieur: 12,
    stationnementInterieur: 8,
    surfaceBatimentPrincipal: 850,
    surfaceBatimentsAnnexes: 200,
    surfaceEspacesVerts: 320
  });

  // Sections visibles
  const [visibleSections, setVisibleSections] = useState({
    aerialPhoto: true,
    cadastre: true,
    projet: true,
    logements: true,
    stationnement: true,
    batiments: true,
    espacesVerts: true
  });

  useEffect(() => {
    // Simulation du chargement des données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Calculer le COS dynamiquement
    const newCos = projectSummary.capaciteConstructive / projectSummary.perimetre;
    setProjectSummary(prev => ({
      ...prev,
      cos: parseFloat(newCos.toFixed(2))
    }));
  }, [projectSummary.capaciteConstructive, projectSummary.perimetre]);

  const handleDownload = () => {
    toast({
      title: "Export PDF",
      description: "Le téléchargement de votre rapport commence...",
    });
  };

  const handlePrint = () => {
    toast({
      title: "Impression",
      description: "Préparation de l'impression...",
    });
    window.print();
  };

  const handleShare = () => {
    toast({
      title: "Partage",
      description: "Lien de partage copié dans le presse-papier",
    });
  };

  const handleAddCadastreEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      parcelle: '',
      adresse: '',
      section: '',
      surface: 0
    };
    setCadastreEntries([...cadastreEntries, newEntry]);
  };

  const handleDeleteCadastreEntry = () => {
    if (selectedCadastreRow) {
      setCadastreEntries(cadastreEntries.filter(entry => entry.id !== selectedCadastreRow));
      setSelectedCadastreRow(null);
      toast({
        title: "Parcelle supprimée",
        description: "La parcelle a été supprimée avec succès"
      });
    }
  };

  const handleCadastreChange = (id: string, field: keyof typeof cadastreEntries[0], value: string | number) => {
    setCadastreEntries(cadastreEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const getTotalSurface = () => {
    return cadastreEntries.reduce((total, entry) => total + (typeof entry.surface === 'number' ? entry.surface : 0), 0);
  };

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections({
      ...visibleSections,
      [section]: !visibleSections[section]
    });
  };

  const handleSummaryChange = (field: keyof typeof projectSummary, value: number) => {
    setProjectSummary({
      ...projectSummary,
      [field]: value
    });
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      toast({
        title: "Modifications enregistrées",
        description: "Les changements ont été sauvegardés avec succès"
      });
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand">Synthèse du projet</h1>
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
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>

        <Tabs defaultValue="apercu" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="apercu">Aperçu général</TabsTrigger>
            <TabsTrigger value="cadastre">Cadastre & PLU</TabsTrigger>
            <TabsTrigger value="residents">Résidents</TabsTrigger>
            <TabsTrigger value="projet">Projet immobilier</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apercu" className="space-y-4 mt-4">
            {/* Photo aérienne */}
            <Card className="border-l-4 border-l-brand">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Photo aérienne du projet</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowImage(!showImage)}
                  >
                    {showImage ? (
                      <EyeOff className="h-4 w-4" /> 
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => toast({
                      title: "Sélection d'image", 
                      description: "Fonctionnalité de changement d'image à intégrer"
                    })}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {showImage && (
                <CardContent>
                  <div className="bg-gray-100 rounded-md w-full h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Photo aérienne du projet</p>
                      <p className="text-sm">(Placez ici une photo du module Images)</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Parcelles cadastrales */}
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
                          disabled={!selectedCadastreRow || !isEditing}
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
                          {cadastreEntries.map((entry) => (
                            <TableRow 
                              key={entry.id} 
                              className={`${selectedCadastreRow === entry.id ? "bg-brand/10" : ""} ${isEditing ? "cursor-pointer" : ""}`}
                              onClick={() => isEditing && setSelectedCadastreRow(entry.id)}
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

            {/* Résumé du projet */}
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

            {/* Répartition des logements */}
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
                            {typologiesData.map((entry, index) => (
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

            {/* Stationnement */}
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
          </TabsContent>
          
          <TabsContent value="cadastre" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Données cadastrales</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Parcelle</th>
                        <th>Adresse</th>
                        <th>Surface (m²)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectData.cadastre.map((item) => (
                        <tr key={item.id}>
                          <td>{item.parcelle}</td>
                          <td>{item.adresse}</td>
                          <td>{item.surface}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={2} className="font-bold text-right">Total</td>
                        <td className="font-bold">{projectData.cadastre.reduce((acc, item) => acc + item.surface, 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Règles d'urbanisme (PLU)</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Zone</th>
                        <th>Emprise max</th>
                        <th>Hauteur max</th>
                        <th>Espaces verts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectData.plu.map((item) => (
                        <tr key={item.id}>
                          <td>{item.zone}</td>
                          <td>{item.empriseMax}%</td>
                          <td>{item.hauteurMax}m</td>
                          <td>{item.espacesVerts}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="residents" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Résidents actuels</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type d'occupation</th>
                      <th>Nombre</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectData.residents.map((item) => (
                      <tr key={item.id}>
                        <td>{item.type}</td>
                        <td>{item.nombre}</td>
                        <td>{item.statut}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={1} className="font-bold text-right">Total</td>
                      <td className="font-bold">{projectData.residents.reduce((acc, item) => acc + item.nombre, 0)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projet" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Caractéristiques du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Surface plancher</dt>
                      <dd className="font-medium">{projectData.projet.surfacePlancher} m²</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Nombre de logements</dt>
                      <dd className="font-medium">{projectData.projet.nombreLogements}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Logements sociaux</dt>
                      <dd className="font-medium">{projectData.projet.logementSocial} ({Math.round(projectData.projet.logementSocial / projectData.projet.nombreLogements * 100)}%)</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Places de parking</dt>
                      <dd className="font-medium">{projectData.projet.parking}</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">Ratio parking/logement</dt>
                      <dd className="font-medium">{(projectData.projet.parking / projectData.projet.nombreLogements).toFixed(2)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Répartition des typologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">T2</dt>
                      <dd className="font-medium">{projectData.projet.typologies.t2} ({Math.round(projectData.projet.typologies.t2 / projectData.projet.nombreLogements * 100)}%)</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">T3</dt>
                      <dd className="font-medium">{projectData.projet.typologies.t3} ({Math.round(projectData.projet.typologies.t3 / projectData.projet.nombreLogements * 100)}%)</dd>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <dt className="text-muted-foreground">T4</dt>
                      <dd className="font-medium">{projectData.projet.typologies.t4} ({Math.round(projectData.projet.typologies.t4 / projectData.projet.nombreLogements * 100)}%)</dd>
                    </div>
                    <div className="flex justify-between pt-2 font-medium">
                      <dt>Surface moyenne / logement</dt>
                      <dd>{Math.round(projectData.projet.surfacePlancher / projectData.projet.nombreLogements)} m²</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Synthese;
