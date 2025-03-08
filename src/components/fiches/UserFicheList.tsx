
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Plus } from 'lucide-react';
import { CompletionCircle } from './CompletionCircle';
import { useToast } from '@/hooks/use-toast';

// Type definition for a fiche
interface Fiche {
  id: string;
  address: string;
  cadastreSection: string;
  cadastreNumber: string;
  completion: number;
  lastUpdated: string;
}

// Mock data - À remplacer par les données réelles de Supabase
const mockFiches: Fiche[] = [
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

export function UserFicheList() {
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const { toast } = useToast();
  
  // Simuler le chargement des fiches depuis Supabase
  useEffect(() => {
    // Dans une implémentation réelle, récupérer les fiches depuis Supabase
    const loadFiches = async () => {
      try {
        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 500));
        setFiches(mockFiches);
      } catch (error) {
        console.error("Erreur lors du chargement des fiches:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger vos fiches parcelles",
          variant: "destructive",
        });
      }
    };
    
    loadFiches();
  }, [toast]);
  
  const handleCreateFiche = () => {
    toast({
      title: "Création de fiche",
      description: "La création de nouvelles fiches sera disponible prochainement",
    });
  };
  
  if (fiches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de fiche parcelle.</p>
        <Button 
          className="bg-brand hover:bg-brand-dark flex items-center gap-2"
          onClick={handleCreateFiche}
        >
          <Plus className="h-4 w-4" />
          Créer votre première fiche
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {fiches.map((fiche) => (
          <Card key={fiche.id} className="hover-scale border border-gray-100 shadow-soft overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{fiche.address.split(',')[0]}</CardTitle>
                <CompletionCircle percentage={fiche.completion} size={40} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2 text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mt-1 text-gray-400" />
                <p>{fiche.address}</p>
              </div>
              <div className="flex gap-2 text-sm text-gray-500">
                <span className="font-medium">Parcelle:</span>
                <span>{fiche.cadastreSection} {fiche.cadastreNumber}</span>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Dernière modification: {new Date(fiche.lastUpdated).toLocaleDateString('fr-FR', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Link 
                to={`/fiche/${fiche.id}`} 
                className="text-brand font-medium hover:underline group inline-flex items-center"
              >
                Voir la fiche
                <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Button 
          className="bg-brand hover:bg-brand-dark flex items-center gap-2"
          onClick={handleCreateFiche}
        >
          <Plus className="h-4 w-4" />
          Créer une nouvelle fiche
        </Button>
      </div>
    </div>
  );
}
