
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit2, Trash2, Save, Download } from 'lucide-react';
import { CompletionCircle } from '@/components/fiches/CompletionCircle';
import { useToast } from '@/hooks/use-toast';

// Type definition for a fiche
interface Fiche {
  id: string;
  address: string;
  cadastreSection: string;
  cadastreNumber: string;
  completion: number;
  lastUpdated: string;
  zone?: string;
  empriseAuSol?: number;
  hauteurMax?: number;
  espacesVerts?: number;
  occupants?: Array<{ type: string; nombre: number; statut: string }>;
  surfacePlancher?: number;
  logements?: number;
  logementsTypologies?: {
    t2?: number;
    t3?: number;
    t4?: number;
  };
  logementsSociaux?: number;
}

export default function FicheDetails() {
  const { ficheId } = useParams<{ ficheId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cadastre'); // Changer le tab par défaut
  const [isEditing, setIsEditing] = useState(false);
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Charger la fiche depuis localStorage (au lieu de Supabase pour l'instant)
  useEffect(() => {
    const loadFiche = async () => {
      setLoading(true);
      try {
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const storedFiches = localStorage.getItem('userFiches');
        if (storedFiches) {
          const fiches: Fiche[] = JSON.parse(storedFiches);
          const foundFiche = fiches.find(f => f.id === ficheId);
          
          if (foundFiche) {
            // Ajouter des propriétés par défaut si elles n'existent pas
            setFiche({
              ...foundFiche,
              zone: foundFiche.zone || 'UA',
              empriseAuSol: foundFiche.empriseAuSol || 70,
              hauteurMax: foundFiche.hauteurMax || 12,
              espacesVerts: foundFiche.espacesVerts || 20,
              occupants: foundFiche.occupants || [
                { type: 'Propriétaire occupant', nombre: 2, statut: 'Retraités' },
                { type: 'Locataires', nombre: 3, statut: 'Famille' }
              ],
              surfacePlancher: foundFiche.surfacePlancher || 1200,
              logements: foundFiche.logements || 15,
              logementsSociaux: foundFiche.logementsSociaux || 4,
              logementsTypologies: foundFiche.logementsTypologies || {
                t2: 5,
                t3: 7,
                t4: 3
              }
            });
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la fiche:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger les détails de la fiche",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadFiche();
  }, [ficheId, toast]);
  
  // Gestion des actions utilisateur
  const handleEdit = () => {
    setIsEditing(true);
    toast({
      title: "Mode édition activé",
      description: "Vous pouvez maintenant modifier les informations de cette fiche"
    });
  };
  
  const handleSave = () => {
    if (!fiche) return;
    
    // Calculer le pourcentage de complétion
    const fieldsToCheck = [
      fiche.address, 
      fiche.cadastreSection, 
      fiche.cadastreNumber,
      fiche.zone,
      fiche.empriseAuSol,
      fiche.hauteurMax,
      fiche.espacesVerts,
      fiche.surfacePlancher,
      fiche.logements,
      fiche.logementsSociaux
    ];
    
    const nonEmptyFields = fieldsToCheck.filter(field => field !== undefined && field !== '').length;
    const completionPercentage = Math.round((nonEmptyFields / fieldsToCheck.length) * 100);
    
    // Mettre à jour la fiche avec le nouveau pourcentage de complétion
    const updatedFiche = {
      ...fiche,
      completion: completionPercentage,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    // Sauvegarder dans localStorage
    const storedFiches = localStorage.getItem('userFiches');
    if (storedFiches) {
      const fiches: Fiche[] = JSON.parse(storedFiches);
      const updatedFiches = fiches.map(f => f.id === ficheId ? updatedFiche : f);
      localStorage.setItem('userFiches', JSON.stringify(updatedFiches));
    }
    
    setFiche(updatedFiche);
    setIsEditing(false);
    toast({
      title: "Modifications enregistrées",
      description: "Vos changements ont été sauvegardés avec succès"
    });
  };
  
  const handleDelete = () => {
    // Supprimer la fiche de localStorage
    const storedFiches = localStorage.getItem('userFiches');
    if (storedFiches) {
      const fiches: Fiche[] = JSON.parse(storedFiches);
      const updatedFiches = fiches.filter(f => f.id !== ficheId);
      localStorage.setItem('userFiches', JSON.stringify(updatedFiches));
    }
    
    toast({
      title: "Fiche supprimée",
      description: "Cette fiche a été supprimée définitivement",
      variant: "destructive",
    });
    navigate('/');
  };
  
  const handleExport = () => {
    toast({
      title: "Export en cours",
      description: "Votre fiche est en cours d'export au format PDF"
    });
  };
  
  // Mise à jour des valeurs des champs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!fiche) return;
    
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      // Gérer les propriétés imbriquées (ex: logementsTypologies.t2)
      const [parent, child] = name.split('.');
      setFiche({
        ...fiche,
        [parent]: {
          ...fiche[parent as keyof Fiche] as object,
          [child]: value
        }
      });
    } else {
      // Gérer les propriétés simples
      setFiche({
        ...fiche,
        [name]: value
      });
    }
  };
  
  // Si la fiche n'existe pas
  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse">Chargement en cours...</div>
        </div>
      </PageLayout>
    );
  }
  
  if (!fiche) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">Fiche non trouvée</h2>
          <p className="text-gray-600 mb-6">La fiche demandée n'existe pas ou a été supprimée.</p>
          <Link to="/">
            <Button className="bg-brand hover:bg-brand-dark">Retour à l'accueil</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="animate-enter opacity-0">
        {/* Header avec bouton retour et info fiche */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link to="/" className="text-gray-500 hover:text-brand flex items-center gap-1 mb-3">
              <ArrowLeft className="h-4 w-4" />
              Retour aux fiches
            </Link>
            <h1 className="text-3xl font-bold">{fiche.address.split(',')[0]}</h1>
            <p className="text-gray-600 mt-1">{fiche.address}</p>
            <p className="text-gray-500 text-sm mt-1">
              Parcelle: {fiche.cadastreSection} {fiche.cadastreNumber}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <CompletionCircle 
              percentage={fiche.completion} 
              size={60} 
              className="hidden md:flex"
            />
            <div className="flex gap-2">
              {isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={handleEdit}
                >
                  <Edit2 className="h-4 w-4" />
                  Modifier
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 text-red-500 hover:text-red-600"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cercle de complétion mobile */}
        <div className="flex justify-center md:hidden mb-6">
          <Card className="p-4 flex items-center gap-4">
            <CompletionCircle percentage={fiche.completion} size={50} />
            <div>
              <p className="text-sm text-gray-500">Avancement</p>
              <p className="font-semibold">{fiche.completion}% complété</p>
            </div>
          </Card>
        </div>
        
        {/* Tabs pour différentes sections */}
        <Tabs 
          defaultValue="cadastre" 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="mb-10"
        >
          <TabsList className="mb-6 grid grid-cols-2 md:grid-cols-6 gap-1">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="cadastre">Cadastre</TabsTrigger>
            <TabsTrigger value="plu">PLU</TabsTrigger>
            <TabsTrigger value="residents">Résidents</TabsTrigger>
            <TabsTrigger value="projet">Projet</TabsTrigger>
            <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images" className="animate-enter opacity-0">
            <Card className="p-6">
              <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-2">Glissez et déposez vos images ici</p>
                <Button>Télécharger des images</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="cadastre" className="animate-enter opacity-0">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Informations cadastrales</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Section</label>
                      <input 
                        type="text" 
                        name="cadastreSection"
                        value={fiche.cadastreSection}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Numéro</label>
                      <input 
                        type="text" 
                        name="cadastreNumber"
                        value={fiche.cadastreNumber}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">Adresse</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Adresse complète</label>
                      <input 
                        type="text" 
                        name="address"
                        value={fiche.address}
                        onChange={handleInputChange}
                        readOnly={!isEditing}
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="plu" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Données PLU</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Zone</label>
                    <select 
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      name="zone"
                      value={fiche.zone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    >
                      <option>UA</option>
                      <option>UB</option>
                      <option>UC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Emprise au sol max</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        name="empriseAuSol"
                        value={fiche.empriseAuSol}
                        onChange={handleInputChange}
                        placeholder="70"
                        readOnly={!isEditing}
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hauteur maximale</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        name="hauteurMax"
                        value={fiche.hauteurMax}
                        onChange={handleInputChange}
                        placeholder="12"
                        readOnly={!isEditing}
                      />
                      <span className="ml-2">m</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Espaces verts</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        name="espacesVerts"
                        value={fiche.espacesVerts}
                        onChange={handleInputChange}
                        placeholder="20"
                        readOnly={!isEditing}
                      />
                      <span className="ml-2">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="residents" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Occupants actuels</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fiche.occupants?.map((occupant, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">{occupant.type}</td>
                        <td className="px-4 py-3">{occupant.nombre}</td>
                        <td className="px-4 py-3">{occupant.statut}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {isEditing && (
                <Button className="mt-4 bg-brand hover:bg-brand-dark">
                  Ajouter un occupant
                </Button>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="projet" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Configuration du projet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Surface plancher</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="border border-gray-300 rounded-md px-3 py-2 w-full"
                        name="surfacePlancher"
                        value={fiche.surfacePlancher}
                        onChange={handleInputChange}
                        placeholder="1200"
                        readOnly={!isEditing}
                      />
                      <span className="ml-2">m²</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre de logements</label>
                    <input 
                      type="number" 
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      name="logements"
                      value={fiche.logements}
                      onChange={handleInputChange}
                      placeholder="15"
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dont logements sociaux</label>
                    <input 
                      type="number" 
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      name="logementsSociaux"
                      value={fiche.logementsSociaux}
                      onChange={handleInputChange}
                      placeholder="4"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Typologies</h4>
                  <div>
                    <label className="block text-sm font-medium mb-1">T2</label>
                    <input 
                      type="number" 
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      name="logementsTypologies.t2"
                      value={fiche.logementsTypologies?.t2}
                      onChange={handleInputChange}
                      placeholder="5"
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">T3</label>
                    <input 
                      type="number" 
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      name="logementsTypologies.t3"
                      value={fiche.logementsTypologies?.t3}
                      onChange={handleInputChange}
                      placeholder="7"
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">T4</label>
                    <input 
                      type="number" 
                      className="border border-gray-300 rounded-md px-3 py-2 w-full"
                      name="logementsTypologies.t4"
                      value={fiche.logementsTypologies?.t4}
                      onChange={handleInputChange}
                      placeholder="3"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="synthese" className="animate-enter opacity-0">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium">Synthèse du projet</h3>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="border-l-4 border-l-brand p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Surface totale</div>
                  <div className="text-xl font-semibold">{fiche.surfacePlancher} m²</div>
                </div>
                <div className="border-l-4 border-l-brand p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Nombre de logements</div>
                  <div className="text-xl font-semibold">{fiche.logements} logements</div>
                </div>
                <div className="border-l-4 border-l-brand p-4 bg-gray-50 rounded">
                  <div className="text-sm text-gray-500">Dont sociaux</div>
                  <div className="text-xl font-semibold">
                    {fiche.logementsSociaux} logements 
                    ({fiche.logements && fiche.logementsSociaux ? Math.round((fiche.logementsSociaux / fiche.logements) * 100) : 0}%)
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Répartition des typologies</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Pourcentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2">T2</td>
                        <td className="px-4 py-2">{fiche.logementsTypologies?.t2}</td>
                        <td className="px-4 py-2">
                          {fiche.logements && fiche.logementsTypologies?.t2 
                            ? Math.round((fiche.logementsTypologies.t2 / fiche.logements) * 100) 
                            : 0}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">T3</td>
                        <td className="px-4 py-2">{fiche.logementsTypologies?.t3}</td>
                        <td className="px-4 py-2">
                          {fiche.logements && fiche.logementsTypologies?.t3 
                            ? Math.round((fiche.logementsTypologies.t3 / fiche.logements) * 100) 
                            : 0}%
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">T4</td>
                        <td className="px-4 py-2">{fiche.logementsTypologies?.t4}</td>
                        <td className="px-4 py-2">
                          {fiche.logements && fiche.logementsTypologies?.t4 
                            ? Math.round((fiche.logementsTypologies.t4 / fiche.logements) * 100) 
                            : 0}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Contraintes PLU</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Élément</th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Autorisé</th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Projet</th>
                        <th className="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2">Emprise</td>
                        <td className="px-4 py-2">70%</td>
                        <td className="px-4 py-2">65%</td>
                        <td className="px-4 py-2 text-green-600">Conforme</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Hauteur</td>
                        <td className="px-4 py-2">{fiche.hauteurMax}m</td>
                        <td className="px-4 py-2">11m</td>
                        <td className="px-4 py-2 text-green-600">Conforme</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Parking</td>
                        <td className="px-4 py-2">1,5/log</td>
                        <td className="px-4 py-2">1,2/log</td>
                        <td className="px-4 py-2 text-red-600">Non conforme</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
