
import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-md bg-brand" />
              <span className="font-semibold text-xl">RealiFy</span>
            </Link>
            <p className="text-gray-600 max-w-xs">
              Votre outil de faisabilité immobilière personnalisé pour analyser et optimiser vos projets.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Modules</h4>
            <ul className="space-y-2">
              <li><Link to="/images" className="text-gray-600 hover:text-brand">Importation d'images</Link></li>
              <li><Link to="/cadastre" className="text-gray-600 hover:text-brand">Données cadastrales</Link></li>
              <li><Link to="/plu" className="text-gray-600 hover:text-brand">Données PLU</Link></li>
              <li><Link to="/residents" className="text-gray-600 hover:text-brand">Informations résidents</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Outils</h4>
            <ul className="space-y-2">
              <li><Link to="/projet" className="text-gray-600 hover:text-brand">Configuration de projet</Link></li>
              <li><Link to="/synthese" className="text-gray-600 hover:text-brand">Synthèse</Link></li>
              <li><Link to="/ressources" className="text-gray-600 hover:text-brand">Ressources</Link></li>
              <li><Link to="/aide" className="text-gray-600 hover:text-brand">Aide & Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Compte</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="text-gray-600 hover:text-brand">Connexion</Link></li>
              <li><Link to="/register" className="text-gray-600 hover:text-brand">Inscription</Link></li>
              <li><Link to="/profil" className="text-gray-600 hover:text-brand">Mon profil</Link></li>
              <li><Link to="/projets" className="text-gray-600 hover:text-brand">Mes projets</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} RealiFy. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-500 hover:text-brand">
              Mentions légales
            </a>
            <a href="#" className="text-gray-500 hover:text-brand">
              Confidentialité
            </a>
            <a href="#" className="text-gray-500 hover:text-brand">
              Conditions d'utilisation
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
