import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, Plus } from 'lucide-react';
import { CompletionCircle } from './CompletionCircle';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Type definition for a fiche
interface Fiche {
  id: string;
  address: string;
  cadastre_section: string;
  cadastre_number: string;
  completion: number;
  created_at: string;
  updated_at: string;
}


export function UserFicheList() {
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newFiche, setNewFiche] = useState({
    address: '',
    cadastreSection: '',
    cadastreNumber: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Charger les fiches depuis Supabase
  useEffect(() => {
    const loadFiches = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('fiches')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching fiches:', error);
          toast({
            title: "Erreur de chargement",
            description: "Impossible de charger vos fiches parcelles",
            variant: "destructive",
          });
          return;
        }

        setFiches(data || []);
      } catch (error) {
        console.error("Erreur lors du chargement des fiches:", error);
        toast({
          title: "Erreur de chargement",
          description: "Impossible de charger vos fiches parcelles",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadFiches();
  }, [user, toast]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewFiche(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateFiche = () => {
    setIsDialogOpen(true);
  };
  
  const handleSubmitFiche = async () => {
    if (!user) {
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour créer une fiche",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que tous les champs sont remplis
    if (!newFiche.address || !newFiche.cadastreSection || !newFiche.cadastreNumber) {
      toast({
        title: "Champs incomplets",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Créer la nouvelle fiche dans Supabase
      const { data, error } = await supabase
        .from('fiches')
        .insert([{
          user_id: user.id,
          address: newFiche.address,
          cadastre_section: newFiche.cadastreSection,
          cadastre_number: newFiche.cadastreNumber
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating fiche:', error);
        toast({
          title: "Erreur de création",
          description: "Impossible de créer la fiche",
          variant: "destructive",
        });
        return;
      }

      // Ajouter la fiche à la liste locale
      setFiches(prev => [data, ...prev]);
      
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
      navigate(`/fiche/${data.id}`);
    } catch (error) {
      console.error('Error creating fiche:', error);
      toast({
        title: "Erreur de création",
        description: "Impossible de créer la fiche",
        variant: "destructive",
      });
    }
  };
  
  // Fonction pour naviguer directement vers la fiche sélectionnée
  const handleFicheClick = (id: string) => {
    navigate(`/fiche/${id}`);
  };
  
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Chargement de vos fiches...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Veuillez vous connecter pour voir vos fiches.</p>
      </div>
    );
  }

  if (fiches.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Vous n'avez pas encore créé de fiche parcelle.</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-brand hover:bg-brand-dark flex items-center gap-2"
              onClick={handleCreateFiche}
            >
              <Plus className="h-4 w-4" />
              Créer votre première fiche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle fiche parcelle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Adresse
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={newFiche.address}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="15 rue de la Paix, 75001 Paris"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cadastreSection" className="text-right">
                  Section
                </Label>
                <Input
                  id="cadastreSection"
                  name="cadastreSection"
                  value={newFiche.cadastreSection}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="AB"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cadastreNumber" className="text-right">
                  Numéro
                </Label>
                <Input
                  id="cadastreNumber"
                  name="cadastreNumber"
                  value={newFiche.cadastreNumber}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="123"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-brand hover:bg-brand-dark" onClick={handleSubmitFiche}>
                Créer la fiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {fiches.map((fiche) => (
          <Card 
            key={fiche.id} 
            className="hover-scale border border-gray-100 shadow-soft overflow-hidden cursor-pointer"
            onClick={() => handleFicheClick(fiche.id)}
          >
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
                <span>{fiche.cadastre_section} {fiche.cadastre_number}</span>
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Dernière modification: {new Date(fiche.updated_at).toLocaleDateString('fr-FR', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </CardContent>
            <CardFooter>
              <div 
                className="text-brand font-medium hover:underline group inline-flex items-center"
              >
                Voir la fiche
                <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="text-center mt-8">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-brand hover:bg-brand-dark flex items-center gap-2"
              onClick={handleCreateFiche}
            >
              <Plus className="h-4 w-4" />
              Créer une nouvelle fiche
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Créer une nouvelle fiche parcelle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address2" className="text-right">
                  Adresse
                </Label>
                <Input
                  id="address2"
                  name="address"
                  value={newFiche.address}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="15 rue de la Paix, 75001 Paris"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cadastreSection2" className="text-right">
                  Section
                </Label>
                <Input
                  id="cadastreSection2"
                  name="cadastreSection"
                  value={newFiche.cadastreSection}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="AB"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="cadastreNumber2" className="text-right">
                  Numéro
                </Label>
                <Input
                  id="cadastreNumber2"
                  name="cadastreNumber"
                  value={newFiche.cadastreNumber}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="123"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-brand hover:bg-brand-dark" onClick={handleSubmitFiche}>
                Créer la fiche
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
