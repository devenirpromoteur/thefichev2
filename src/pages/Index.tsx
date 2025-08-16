import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, FileText, Image, Map, PlusSquare, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserFicheList } from '@/components/fiches/UserFicheList';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const features = [
  {
    title: 'Images',
    description: 'Importez et organisez facilement vos photos de terrain et vues aériennes',
    icon: Image,
    path: '/images',
  },
  {
    title: 'Cadastre',
    description: 'Enregistrez les données cadastrales de vos parcelles',
    icon: Map,
    path: '/cadastre',
  },
  {
    title: 'PLU',
    description: 'Consultez et saisissez les données d\'urbanisme',
    icon: FileText,
    path: '/plu',
  },
  {
    title: 'Résidents',
    description: 'Gérez les informations sur les occupants actuels',
    icon: Users,
    path: '/residents',
  },
  {
    title: 'Projet',
    description: 'Configurez en détail votre projet immobilier',
    icon: Map,
    path: '/projet',
  },
  {
    title: 'Synthèse',
    description: 'Visualisez une analyse complète de la faisabilité',
    icon: BarChart2,
    path: '/synthese',
  },
];

const Index = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const [showFeatures, setShowFeatures] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFiche, setNewFiche] = useState({
    name: '',
    address: '',
    cadastreSection: '',
    cadastreNumber: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFiche(prev => ({ ...prev, [name]: value }));
  };
  
  const toggleFeatures = () => {
    if (user) {
      setIsDialogOpen(true);
    } else {
      setShowFeatures(!showFeatures);
    }
  };
  
  const createFiche = async () => {
    // Validation
    if (!newFiche.name || !newFiche.address || !newFiche.cadastreSection || !newFiche.cadastreNumber) {
      toast({
        title: "Champs incomplets",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour créer une fiche",
        variant: "destructive",
      });
      return;
    }

    // Anti-double-clic
    if (isCreating) return;
    
    try {
      setIsCreating(true);
      
      // Création du projet avec description basée sur les données cadastrales
      const description = `Projet immobilier situé à ${newFiche.address}, section cadastrale ${newFiche.cadastreSection}, parcelle ${newFiche.cadastreNumber}`;
      
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newFiche.name,
          description,
          owner_id: user.id,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Erreur création projet:', error);
        
        // Gestion d'erreurs spécifiques
        let errorMessage = "Une erreur est survenue lors de la création";
        
        if (error.code === '42501') {
          errorMessage = "Permissions insuffisantes. Vérifiez que vous êtes bien connecté.";
        } else if (error.code === '23502') {
          errorMessage = "Données manquantes. Vérifiez que tous les champs sont remplis.";
        } else if (error.code === '23503') {
          errorMessage = "Référence utilisateur invalide. Reconnectez-vous.";
        } else if (error.message.includes('network')) {
          errorMessage = "Problème de réseau. Vérifiez votre connexion.";
        }

        toast({
          title: "Erreur de création",
          description: `${errorMessage} (Code: ${error.code || 'UNKNOWN'})`,
          variant: "destructive",
        });
        return;
      }

      // Reset du formulaire et fermeture du dialog
      setNewFiche({
        name: '',
        address: '',
        cadastreSection: '',
        cadastreNumber: ''
      });
      setIsDialogOpen(false);
      
      toast({
        title: "Fiche créée avec succès",
        description: `Le projet "${newFiche.name}" a été créé et ajouté à votre liste`,
      });
      
      // Redirection vers la page du projet
      navigate(`/projets/${data.id}`);
      
    } catch (error) {
      console.error('Erreur inattendue:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur technique est survenue. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-enter');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    if (showFeatures) {
      featureRefs.current.forEach(ref => {
        if (ref) observer.observe(ref);
      });
    }
    
    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
      
      featureRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [showFeatures]);
  
  return (
    <PageLayout>
      <section 
        ref={heroRef} 
        className="opacity-0 py-20 md:py-32 text-center"
      >
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Analyse de Faisabilité Immobilière Simplifiée
          </h1>
          <p className="text-xl text-gray-600 mb-8 md:text-2xl">
            Optimisez vos projets immobiliers grâce à notre plateforme intuitive d'analyse et de gestion
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-brand hover:bg-brand-dark flex items-center gap-2" 
              onClick={toggleFeatures}
            >
              <PlusSquare className="h-5 w-5" />
              Créer sa Fiche
            </Button>
            
            {!user && (
              <Link to="/signup">
                <Button variant="outline" size="lg">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle fiche parcelle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name-new" className="text-right">
                Nom du projet
              </Label>
              <Input
                id="name-new"
                name="name"
                value={newFiche.name}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Mon projet immobilier"
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address-new" className="text-right">
                Adresse
              </Label>
              <Input
                id="address-new"
                name="address"
                value={newFiche.address}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="15 rue de la Paix, 75001 Paris"
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cadastreSection-new" className="text-right">
                Section
              </Label>
              <Input
                id="cadastreSection-new"
                name="cadastreSection"
                value={newFiche.cadastreSection}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="AB"
                disabled={isCreating}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cadastreNumber-new" className="text-right">
                Numéro
              </Label>
              <Input
                id="cadastreNumber-new"
                name="cadastreNumber"
                value={newFiche.cadastreNumber}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="123"
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-brand hover:bg-brand-dark" 
              onClick={createFiche}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <PlusSquare className="mr-2 h-4 w-4" />
                  Créer la fiche
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {user && (
        <section className="py-16 bg-gray-50 rounded-3xl mb-12 opacity-0 animate-enter">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Mes Projets</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Retrouvez ici tous vos projets immobiliers
            </p>
          </div>
          
          <UserFicheList />
        </section>
      )}
      
      {showFeatures && (
        <section className="py-20 bg-gray-50 rounded-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Modules intégrés</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Notre application réunit tous les outils nécessaires pour analyser la faisabilité de vos projets immobiliers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                ref={el => featureRefs.current[index] = el}
                className={cn("opacity-0", index % 3 === 0 ? "animate-enter-delay-1" : index % 3 === 1 ? "animate-enter-delay-2" : "animate-enter-delay-3")}
              >
                <Card className="hover-scale h-full border border-gray-100 shadow-soft overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-brand" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Link to={feature.path} className="text-brand font-medium hover:underline group inline-flex items-center">
                      Explorer
                      <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </section>
      )}
      
      <section className="py-20">
        <div className="bg-gradient-to-r from-brand/90 to-brand text-white rounded-2xl p-10 md:p-16 text-center md:text-left md:flex items-center justify-between">
          <div className="md:max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt à optimiser vos projets immobiliers ?
            </h2>
            <p className="text-white/90 text-lg mb-8 md:mb-0">
              Rejoignez notre plateforme et bénéficiez d'une suite complète d'outils analytiques.
            </p>
          </div>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="font-medium text-brand">
              Créer un compte gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
};

export default Index;
