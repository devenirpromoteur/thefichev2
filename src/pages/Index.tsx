import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart2, FileText, Image, Map, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserFicheList } from '@/components/fiches/UserFicheList';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  
  const [showFeatures, setShowFeatures] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const toggleFeatures = () => {
    setShowFeatures(!showFeatures);
  };
  
  useEffect(() => {
    const checkLoginStatus = () => {
      const mockLoggedIn = localStorage.getItem('mockUserLoggedIn') === 'true';
      setIsLoggedIn(mockLoggedIn);
    };
    
    checkLoginStatus();
    
    const loginToggleBtn = document.getElementById('mock-login-toggle');
    if (loginToggleBtn) {
      loginToggleBtn.addEventListener('click', () => {
        const currentState = localStorage.getItem('mockUserLoggedIn') === 'true';
        localStorage.setItem('mockUserLoggedIn', (!currentState).toString());
        setIsLoggedIn(!currentState);
      });
    }
  }, []);
  
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
          <Button id="mock-login-toggle" variant="ghost" size="sm" className="absolute top-4 right-4">
            {isLoggedIn ? 'Simuler Déconnexion' : 'Simuler Connexion'}
          </Button>
        </div>
      </section>
      
      
      {user && (
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
