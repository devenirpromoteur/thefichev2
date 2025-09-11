import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface SynthesisData {
  projectInfo: {
    name: string;
    address: string;
    date: string;
    id?: string;
  };
  cadastre: Array<{
    id: string;
    parcelle: string;
    adresse: string;
    section: string;
    surface: number;
  }>;
  projectSummary: {
    perimetre: number;
    capaciteConstructive: number;
    cos: number;
    hauteur: number;
    etages: number;
    capaciteLogements: number;
    logementsLibres: number;
    logementsSociaux: number;
    stationnementRequis: number;
    stationnementPrevu: number;
    stationnementExterieur: number;
    stationnementInterieur: number;
    surfaceBatimentPrincipal: number;
    surfaceBatimentsAnnexes: number;
    surfaceEspacesVerts: number;
  };
  housingDistribution?: {
    t2: number;
    t3: number;
    t4: number;
  };
  metadata?: {
    exportDate: string;
    version: string;
    source: string;
  };
}

export const useSynthesisExport = () => {
  const { toast } = useToast();

  const exportToJSON = useCallback((data: SynthesisData, filename?: string) => {
    const enrichedData = {
      ...data,
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
        source: 'synthesis-export',
        ...data.metadata
      }
    };

    const jsonString = JSON.stringify(enrichedData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `synthese-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: "Les données de synthèse ont été exportées en JSON."
    });
  }, [toast]);

  const importFromJSON = useCallback(async (): Promise<SynthesisData | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        try {
          const text = await file.text();
          const data = JSON.parse(text) as SynthesisData;
          
          // Basic validation
          if (!data.projectInfo || !data.cadastre || !data.projectSummary) {
            throw new Error('Format de fichier invalide');
          }

          toast({
            title: "Import réussi",
            description: "Les données de synthèse ont été importées."
          });
          
          resolve(data);
        } catch (error) {
          toast({
            title: "Erreur d'import",
            description: "Le fichier sélectionné n'est pas valide.",
            variant: "destructive"
          });
          resolve(null);
        }
      };
      
      input.click();
    });
  }, [toast]);

  const createFicheFromSynthesis = useCallback(async (
    synthesisData: SynthesisData, 
    createFiche: (ficheData: any) => Promise<string>
  ): Promise<string | null> => {
    try {
      const ficheData = {
        address: synthesisData.projectInfo.address,
        cadastre_section: synthesisData.cadastre[0]?.section || '',
        cadastre_number: synthesisData.cadastre[0]?.parcelle || '',
        completion: 50 // Base completion since we have synthesis data
      };

      const ficheId = await createFiche(ficheData);
      
      toast({
        title: "Fiche créée",
        description: "Une nouvelle fiche a été créée à partir de la synthèse."
      });
      
      return ficheId;
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la fiche à partir de la synthèse.",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  return {
    exportToJSON,
    importFromJSON,
    createFicheFromSynthesis
  };
};