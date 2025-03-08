
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    // Simulation du chargement des données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <PageLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-brand">Synthèse du projet</h1>
          <div className="flex space-x-2">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-brand">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Surface totale du terrain</div>
                  <div className="text-2xl font-bold">{projectData.projet.surfaceTotale} m²</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-brand-light">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Nombre de logements</div>
                  <div className="text-2xl font-bold">{projectData.projet.nombreLogements} logements</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-brand-dark">
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground">Dont logements sociaux</div>
                  <div className="text-2xl font-bold">{projectData.projet.logementSocial} logements</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des typologies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typologiesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Surfaces du projet</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={surfaceData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="surface" fill="#4F3CE7" name="Surface (m²)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
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
