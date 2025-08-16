import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error_code = searchParams.get('error_code');
        const error_description = searchParams.get('error_description');

        if (error_code) {
          setError(error_description || 'Erreur d\'authentification');
          setLoading(false);
          return;
        }

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Error exchanging code for session:', error);
            setError(error.message);
            toast({
              title: "Erreur d'authentification",
              description: error.message,
              variant: "destructive",
            });
          } else if (data.session) {
            toast({
              title: "Email confirmé",
              description: "Votre compte a été confirmé avec succès",
            });
            
            // Redirect to projects or intended location
            const redirectUrl = sessionStorage.getItem('auth_redirect_url') || '/projets';
            sessionStorage.removeItem('auth_redirect_url');
            navigate(redirectUrl, { replace: true });
          }
        } else {
          // No code, redirect to login
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('Une erreur inattendue s\'est produite');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast]);

  if (loading) {
    return (
      <PageLayout className="flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Confirmation en cours...</h2>
            <p className="text-muted-foreground">
              Nous vérifions votre email, veuillez patienter.
            </p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout className="flex justify-center items-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Erreur de confirmation</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline"
              >
                Retour à la connexion
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="text-primary hover:underline"
              >
                Créer un nouveau compte
              </button>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout className="flex justify-center items-center">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Email confirmé</h2>
          <p className="text-muted-foreground">
            Redirection en cours...
          </p>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default AuthCallback;