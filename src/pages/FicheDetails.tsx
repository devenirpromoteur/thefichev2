
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { CompletionCircle } from '@/components/fiches/CompletionCircle';

// Mock data - Replace with actual data from Supabase
const mockFiches = [
  {
    id: '1',
    address: '15 rue de la Paix, 75001 Paris',
    cadastreSection: 'AB',
    cadastreNumber: '123',
    completion: 75,
    lastUpdated: '2023-10-15'
  },
  {
    id: '2',
    address: '8 avenue des Champs-Élysées, 75008 Paris',
    cadastreSection: 'CD',
    cadastreNumber: '456',
    completion: 30,
    lastUpdated: '2023-10-12'
  },
  {
    id: '3',
    address: '25 boulevard Haussmann, 75009 Paris',
    cadastreSection: 'EF',
    cadastreNumber: '789',
    completion: 100,
    lastUpdated: '2023-10-10'
  }
];

const FicheDetails = () => {
  const { ficheId } = useParams<{ ficheId: string }>();
  
  // In a real implementation, fetch fiche from Supabase
  // const [fiche, setFiche] = useState(null);
  // useEffect(() => { fetch fiche from Supabase }, [ficheId]);
  
  const fiche = mockFiches.find(f => f.id === ficheId);
  
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
        {/* Header with back button and fiche info */}
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
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Edit2 className="h-4 w-4" />
                Modifier
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-1 text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile completion circle */}
        <div className="flex justify-center md:hidden mb-6">
          <Card className="p-4 flex items-center gap-4">
            <CompletionCircle percentage={fiche.completion} size={50} />
            <div>
              <p className="text-sm text-gray-500">Avancement</p>
              <p className="font-semibold">{fiche.completion}% complété</p>
            </div>
          </Card>
        </div>
        
        {/* Tabs for different sections */}
        <Tabs defaultValue="images" className="mb-10">
          <TabsList className="mb-6">
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="cadastre">Cadastre</TabsTrigger>
            <TabsTrigger value="plu">PLU</TabsTrigger>
            <TabsTrigger value="residents">Résidents</TabsTrigger>
            <TabsTrigger value="projet">Projet</TabsTrigger>
            <TabsTrigger value="synthese">Synthèse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="images" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Images</h3>
              <p className="text-gray-600 mb-6">Importez et organisez vos photos de terrain et vues aériennes</p>
              <div className="text-center p-10 border-2 border-dashed border-gray-200 rounded-lg">
                <p className="text-gray-500 mb-2">Glissez et déposez vos images ici</p>
                <Button>Télécharger des images</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="cadastre" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Données cadastrales</h3>
              <p className="text-gray-600 mb-6">Référence parcellaire: {fiche.cadastreSection} {fiche.cadastreNumber}</p>
              {/* Add cadastre form or data */}
            </Card>
          </TabsContent>
          
          <TabsContent value="plu" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Données PLU</h3>
              <p className="text-gray-600 mb-6">Consultez et saisissez les données d'urbanisme</p>
              {/* Add PLU form or data */}
            </Card>
          </TabsContent>
          
          <TabsContent value="residents" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Résidents actuels</h3>
              <p className="text-gray-600 mb-6">Gérez les informations sur les occupants actuels</p>
              {/* Add residents form or data */}
            </Card>
          </TabsContent>
          
          <TabsContent value="projet" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Configuration du projet</h3>
              <p className="text-gray-600 mb-6">Configurez en détail votre projet immobilier</p>
              {/* Add project form or data */}
            </Card>
          </TabsContent>
          
          <TabsContent value="synthese" className="animate-enter opacity-0">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Synthèse</h3>
              <p className="text-gray-600 mb-6">Visualisez une analyse complète de la faisabilité</p>
              {/* Add synthesis data */}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default FicheDetails;
