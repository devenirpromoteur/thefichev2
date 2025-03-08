
import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  withoutFooter?: boolean;
  withoutHeader?: boolean;
}

export function PageLayout({ 
  children, 
  className, 
  fullWidth = false,
  withoutFooter = false,
  withoutHeader = false
}: PageLayoutProps) {
  const location = useLocation();
  
  // Déterminer automatiquement si on doit masquer le header et footer pour les pages d'authentification
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password';
  const hideHeader = withoutHeader || isAuthPage;
  const hideFooter = withoutFooter || isAuthPage;

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeader && <Header />}
      <main className={cn(
        'flex-grow',
        hideHeader ? 'pt-8' : 'pt-24',
        'pb-12',
        className
      )}>
        <div className={cn(
          fullWidth ? 'w-full px-4' : 'max-w-7xl mx-auto px-6'
        )}>
          {children}
        </div>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
