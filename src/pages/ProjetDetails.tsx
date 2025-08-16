import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const ProjetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('owner_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erreur récupération projet:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger le projet",
            variant: "destructive",
          });
          navigate('/projets');
          return;
        }

        if (!data) {
          toast({
            title: "Projet non trouvé",
            description: "Ce projet n'existe pas ou vous n'y avez pas accès",
            variant: "destructive",
          });
          navigate('/projets');
          return;
        }

        setProject(data);
      } catch (error) {
        console.error('Erreur inattendue:', error);
        toast({
          title: "Erreur inattendue",
          description: "Une erreur est survenue lors du chargement",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchProject();
    }
  }, [id, user, authLoading, navigate, toast]);

  if (authLoading || loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
          <Button onClick={() => navigate('/projets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/projets')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{project.name}</CardTitle>
            {project.description && (
              <p className="text-lg text-muted-foreground">{project.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Informations générales</h3>
                <p><strong>ID:</strong> {project.id}</p>
                <p><strong>Créé le:</strong> {new Date(project.created_at).toLocaleDateString('fr-FR')}</p>
                <p><strong>Modifié le:</strong> {new Date(project.updated_at).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Actions disponibles</h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Les modules de gestion détaillée du projet seront disponibles prochainement.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ProjetDetails;