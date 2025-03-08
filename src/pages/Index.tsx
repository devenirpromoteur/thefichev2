
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, FileText, Image, Map, PlusSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserFicheList } from '@/components/fiches/UserFicheList';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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
  // Refs for animation elements
  const heroRef = useRef<HTMLDivElement>(null);
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  // State for showing/hiding features section
  const [showFeatures, setShowFeatures] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFiche, setNewFiche] = useState({
    address: '',
    cadastreSection: '',
    cadastreNumber: ''
  });
  
  // Mock state for logged-in user (replace with actual authentication state)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Mise à jour des valeurs des champs
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFiche(prev => ({ ...prev, [name]: value }));
  };
  
  // Toggle the visibility of features
  const toggleFeatures = () => {
    if (isLoggedIn) {
      // Quand l'utilisateur est connecté, ouvrir le dialogue de création de fiche
      setIsDialogOpen(true);
    } else {
      // Sinon, afficher la section des fonctionnalités
      setShowFeatures(!showFeatures);
    }
  };
  
  // Gestion de la création d'une nouvelle fiche
  const handleSubmitFiche = () => {
    // Vérifier que tous les champs sont remplis
    if (!newFiche.address || !newFiche.cadastreSection || !newFiche.cadastreNumber) {
      toast({
        title: "Champs incomplets",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    
    // Créer la nouvelle fiche
    const newId = Date.now().toString();
    const createdFiche = {
      id: newId,
      address: newFiche.address,
      cadastreSection: newFiche.cadastreSection,
      cadastreNumber: newFiche.cadastreNumber,
      completion: 10, // valeur initiale
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    // Récupérer les fiches existantes et ajouter la nouvelle
    const storedFiches = localStorage.getItem('userFiches');
    let fiches = storedFiches ? JSON.parse(storedFiches) : [];
    fiches = [...fiches, createdFiche];
    
    // Sauvegarder dans localStorage (à remplacer par Supabase)
    localStorage.setItem('userFiches', JSON.stringify(fiches));
    
    // Réinitialiser le formulaire et fermer la boîte de dialogue
    setNewFiche({
      address: '',
      cadastreSection: '',
      cadastreNumber: ''
    });
    setIsDialogOpen(false);
    
    toast({
      title: "Fiche créée avec succès",
      description: "La fiche a été ajoutée à votre liste",
    });
    
    // Naviguer vers la nouvelle fiche
    navigate(`/fiche/${newId}`);
  };
  
  // Simulate login check (replace with actual auth logic)
  useEffect(() => {
    // Mock login check - replace with actual auth check
    const checkLoginStatus = () => {
      const mockLoggedIn = localStorage.getItem('mockUserLoggedIn') === 'true';
      setIsLoggedIn(mockLoggedIn);
    };
    
    checkLoginStatus();
    
    // For demo purposes only - to toggle mock login state
    // Remove this in production and replace with actual auth
    const loginToggleBtn = document.getElementById('mock-login-toggle');
    if (loginToggleBtn) {
      loginToggleBtn.addEventListener('click', () => {
        const currentState = localStorage.getItem('mockUserLoggedIn') === 'true';
        localStorage.setItem('mockUserLoggedIn', (!currentState).toString());
        setIsLoggedIn(!currentState);
      });
    }
  }, []);
  
  // Intersection Observer for animations
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
      {/* Hero Section */}
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
            {/* Bouton principal "Créer sa Fiche" */}
            <Button 
              size="lg" 
              className="bg-brand hover:bg-brand-dark flex items-center gap-2" 
              onClick={toggleFeatures}
            >
              <PlusSquare className="h-5 w-5" />
              Créer sa Fiche
            </Button>
            
            {!isLoggedIn && (
              <Link to="/register">
                <Button variant="outline" size="lg">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            
            {/* For demo only - remove in production */}
            <Button id="mock-login-toggle" variant="ghost" size="sm" className="absolute top-4 right-4">
              {isLoggedIn ? 'Simuler Déconnexion' : 'Simuler Connexion'}
            </Button>
          </div>
        </div>
      </section>
      
      {/* Dialogue pour créer une nouvelle fiche */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle fiche parcelle</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              className="bg-brand hover:bg-brand-dark" 
              onClick={handleSubmitFiche}
            >
              Créer la fiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User's Fiches Section - Only shown when user is logged in */}
      {isLoggedIn && (
        <section className="py-16 bg-gray-50 rounded-3xl mb-12 opacity-0 animate-enter">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Mes Fiches Parcelles</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Retrouvez ici toutes vos fiches de projets immobiliers
            </p>
          </div>
          
          <UserFicheList />
        </section>
      )}
      
      {/* Features Grid - Only shown when showFeatures is true */}
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
      
      {/* CTA Section */}
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
          <Link to="/register">
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
