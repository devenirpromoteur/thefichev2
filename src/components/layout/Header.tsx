
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/auth/UserMenu';

// Les items du menu principal sont masqués par défaut
// Ils s'afficheront dans la vue détaillée de la fiche
const navItems = [
  { name: 'Accueil', path: '/' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fermer le menu mobile lorsque la route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200 ease-in-out py-4 px-6',
        scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-md bg-brand" />
          <span className="font-semibold text-xl">RealiFy</span>
        </Link>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                location.pathname === item.path 
                  ? 'text-brand' 
                  : 'text-gray-600 hover:text-brand hover:bg-gray-50'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        
        {/* Authentication buttons or user menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex space-x-2">
              <Link to="/login">
                <Button variant="outline" size="sm" className="font-medium">
                  Connexion
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="font-medium">
                  Inscription
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-md text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'block px-3 py-2 rounded-md text-base font-medium',
                  location.pathname === item.path
                    ? 'text-brand bg-gray-50'
                    : 'text-gray-600 hover:text-brand hover:bg-gray-50'
                )}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Mobile authentication buttons or user info */}
            <div className="pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="py-2 px-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm">{user.email}</p>
                  </div>
                  <Link to="/projets">
                    <Button variant="ghost" className="w-full justify-start">
                      Mes projets
                    </Button>
                  </Link>
                  <Link to="/account">
                    <Button variant="ghost" className="w-full justify-start">
                      Mon compte
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-center font-medium">
                      Connexion
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="w-full justify-center font-medium">
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
