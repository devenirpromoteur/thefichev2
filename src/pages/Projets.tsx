import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, FileText, Calendar, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const Projets = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    // Filter projects based on search query
    if (searchQuery.trim()) {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [projects, searchQuery]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les projets",
          variant: "destructive",
        });
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewProject = async () => {
    if (!user) return;

    const newProject = {
      name: `Nouveau projet ${new Date().toLocaleDateString('fr-FR')}`,
      description: 'Description du projet...',
      owner_id: user.id,
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        toast({
          title: "Erreur",
          description: "Impossible de créer le projet",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Projet créé",
        description: "Votre nouveau projet a été créé avec succès",
      });

      // Navigate to the new project
      navigate(`/fiche/${data.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Mes projets</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gérez tous vos projets d'analyse de faisabilité immobilière
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un projet..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={createNewProject} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nouveau projet</span>
          </Button>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {projects.length === 0 ? (
              <>
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucun projet</h3>
                <p className="text-muted-foreground mb-6">
                  Créez votre premier projet pour commencer votre analyse de faisabilité
                </p>
                <Button onClick={createNewProject} className="flex items-center space-x-2 mx-auto">
                  <Plus className="h-4 w-4" />
                  <span>Créer mon premier projet</span>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
                <p className="text-muted-foreground">
                  Aucun projet ne correspond à votre recherche "{searchQuery}"
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {project.description || 'Aucune description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <Link to={`/fiche/${project.id}`} className="block mt-4">
                    <Button className="w-full">
                      Ouvrir le projet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Projets;