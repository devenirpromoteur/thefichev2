
import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  withoutFooter?: boolean;
}

export function PageLayout({ 
  children, 
  className, 
  fullWidth = false,
  withoutFooter = false
}: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={cn(
        'flex-grow pt-24 pb-12',
        className
      )}>
        <div className={cn(
          fullWidth ? 'w-full px-4' : 'max-w-7xl mx-auto px-6'
        )}>
          {children}
        </div>
      </main>
      {!withoutFooter && <Footer />}
    </div>
  );
}
