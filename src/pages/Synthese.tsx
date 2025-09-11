
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

// Import refactored components
import { AerialPhoto } from '@/components/synthese/AerialPhoto';
import { CadastreSection } from '@/components/synthese/CadastreSection';
import { ProjectSummary } from '@/components/synthese/ProjectSummary';
import { HousingDistribution } from '@/components/synthese/HousingDistribution';
import { ParkingSection } from '@/components/synthese/ParkingSection';
import { CadastreTab } from '@/components/synthese/CadastreTab';
import { ResidentsTab } from '@/components/synthese/ResidentsTab';
import { ProjectTab } from '@/components/synthese/ProjectTab';
import { EnhancedSynthesePageHeader } from '@/components/synthese/EnhancedSynthesePageHeader';
import { SynthesisData } from '@/hooks/useSynthesisExport';
import { supabase } from '@/integrations/supabase/client';

// Données fictives pour la démonstration
const projectData = {
  cadastre: [
    { id: '1', parcelle: 'AB123', adresse: '15 rue des Lilas', section: 'AB', surface: 450 },
    { id: '2', parcelle: 'AB124', adresse: '17 rue des Lilas', section: 'AB', surface: 520 },
  ],
  plu: [
    { id: '1', zone: 'UA', empriseMax: 70, hauteurMax: 12, espacesVerts: 20, stationnement: 1.5 },
  ],
  residents: [
    { id: '1', type: 'Propriétaire occupant', nombre: 2, statut: 'Retraité' },
    { id: '2', type: 'Locataire', nombre: 3, statut: 'Famille' },
  ],
  projet: {
    surfaceTotale: 970,
    surfacePlancher: 1200,
    nombreLogements: 15,
    typologies: {
      t2: 5,
      t3: 7,
      t4: 3,
    },
    logementSocial: 4,
    parking: 18,
  }
};

const Synthese = () => {
  const [activeTab, setActiveTab] = useState('apercu');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showImage, setShowImage] = useState(true);
  const { toast } = useToast();

  // Enhanced synthesis data structure
  const [synthesisData, setSynthesisData] = useState<SynthesisData>({
    projectInfo: {
      name: "Projet de logements - Rue des Lilas",
      address: "15-17 rue des Lilas",
      date: new Date().toISOString().split('T')[0]
    },
    cadastre: projectData.cadastre,
    projectSummary: {
      perimetre: 970,
      capaciteConstructive: 1200,
      cos: 1.24,
      hauteur: 12,
      etages: 4,
      capaciteLogements: 1050,
      logementsLibres: 11,
      logementsSociaux: 4,
      stationnementRequis: 18,
      stationnementPrevu: 20,
      stationnementExterieur: 12,
      stationnementInterieur: 8,
      surfaceBatimentPrincipal: 850,
      surfaceBatimentsAnnexes: 200,
      surfaceEspacesVerts: 320
    },
    housingDistribution: {
      t2: 5,
      t3: 7,
      t4: 3
    }
  });

  // Cadastre state
  const [cadastreEntries, setCadastreEntries] = useState(projectData.cadastre);
  const [selectedCadastreRow, setSelectedCadastreRow] = useState<string | null>(null);

  // Résumé du projet state
  const [projectSummary, setProjectSummary] = useState({
    perimetre: 970,
    capaciteConstructive: 1200,
    cos: 1.24,
    hauteur: 12,
    etages: 4,
    capaciteLogements: 1050,
    logementsLibres: 11,
    logementsSociaux: 4,
    stationnementRequis: 18,
    stationnementPrevu: 20,
    stationnementExterieur: 12,
    stationnementInterieur: 8,
    surfaceBatimentPrincipal: 850,
    surfaceBatimentsAnnexes: 200,
    surfaceEspacesVerts: 320
  });

  // Sections visibles
  const [visibleSections, setVisibleSections] = useState({
    aerialPhoto: true,
    cadastre: true,
    projet: true,
    logements: true,
    stationnement: true,
    batiments: true,
    espacesVerts: true
  });

  useEffect(() => {
    // Simulation du chargement des données
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Calculer le COS dynamiquement
    const newCos = projectSummary.capaciteConstructive / projectSummary.perimetre;
    setProjectSummary(prev => ({
      ...prev,
      cos: parseFloat(newCos.toFixed(2))
    }));
  }, [projectSummary.capaciteConstructive, projectSummary.perimetre]);

  const handleDownload = () => {
    toast({
      title: "Export PDF",
      description: "Le téléchargement de votre rapport commence...",
    });
  };

  const handlePrint = () => {
    toast({
      title: "Impression",
      description: "Préparation de l'impression...",
    });
    window.print();
  };

  const handleShare = () => {
    toast({
      title: "Partage",
      description: "Lien de partage copié dans le presse-papier",
    });
  };

  const handleSummaryChange = (field: keyof typeof projectSummary, value: number) => {
    setProjectSummary({
      ...projectSummary,
      [field]: value
    });
    
    // Update synthesis data
    setSynthesisData(prev => ({
      ...prev,
      projectSummary: {
        ...prev.projectSummary,
        [field]: value
      }
    }));
  };

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections({
      ...visibleSections,
      [section]: !visibleSections[section]
    });
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      toast({
        title: "Modifications enregistrées",
        description: "Les changements ont été sauvegardés avec succès"
      });
    }
  };

  const handleDataImport = (importedData: SynthesisData) => {
    setSynthesisData(importedData);
    setProjectSummary(importedData.projectSummary);
    setCadastreEntries(importedData.cadastre);
    toast({
      title: "Données importées",
      description: "La synthèse a été mise à jour avec les données importées."
    });
  };

  const handleCreateFiche = async (data: SynthesisData) => {
    try {
      // We need a user_id for the fiche creation
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data: newFiche, error } = await supabase
        .from('fiches')
        .insert({
          address: data.projectInfo.address,
          cadastre_section: data.cadastre[0]?.section || '',
          cadastre_number: data.cadastre[0]?.parcelle || '',
          completion: 50,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Fiche créée",
        description: `Nouvelle fiche créée: ${newFiche.address}`
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la fiche.",
        variant: "destructive"
      });
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6 animate-fade-in">
        <EnhancedSynthesePageHeader 
          isEditing={isEditing} 
          toggleEditing={toggleEditing} 
          handlePrint={handlePrint}
          handleShare={handleShare}
          synthesisData={synthesisData}
          onDataImport={handleDataImport}
          onCreateFiche={handleCreateFiche}
        />

        <div id="synthesis-content" className="space-y-6 print:space-y-4">
          {/* Print header */}
          <div className="print-show hidden print:block print-header">
            <div className="print-title">{synthesisData.projectInfo.name}</div>
            <div className="print-subtitle">{synthesisData.projectInfo.address}</div>
            <div className="text-sm">Date: {new Date().toLocaleDateString('fr-FR')}</div>
          </div>

        <Tabs defaultValue="apercu" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="apercu">Aperçu général</TabsTrigger>
            <TabsTrigger value="cadastre">Cadastre & PLU</TabsTrigger>
            <TabsTrigger value="residents">Résidents</TabsTrigger>
            <TabsTrigger value="projet">Projet immobilier</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apercu" className="space-y-4 mt-4 print:space-y-2">
            {/* Photo aérienne */}
            <div className="print-section">
              <AerialPhoto showImage={showImage} setShowImage={setShowImage} />
            </div>

            {/* Parcelles cadastrales */}
            <div className="print-section">
              <CadastreSection 
                entries={cadastreEntries}
                setEntries={setCadastreEntries}
                selectedRow={selectedCadastreRow}
                setSelectedRow={setSelectedCadastreRow}
                isEditing={isEditing}
                visibleSections={{ cadastre: visibleSections.cadastre }}
                toggleSection={() => toggleSection('cadastre')}
              />
            </div>

            {/* Résumé du projet */}
            <div className="print-section">
              <ProjectSummary 
                projectSummary={projectSummary}
                handleSummaryChange={handleSummaryChange}
                isEditing={isEditing}
                visibleSections={{ projet: visibleSections.projet }}
                toggleSection={() => toggleSection('projet')}
              />
            </div>

            {/* Répartition des logements */}
            <div className="print-section">
              <HousingDistribution 
                projectSummary={projectSummary}
                handleSummaryChange={handleSummaryChange}
                isEditing={isEditing}
                visibleSections={{ logements: visibleSections.logements }}
                toggleSection={() => toggleSection('logements')}
              />
            </div>

            {/* Stationnement */}
            <div className="print-section">
              <ParkingSection 
                projectSummary={projectSummary}
                handleSummaryChange={handleSummaryChange}
                isEditing={isEditing}
                visibleSections={{ stationnement: visibleSections.stationnement }}
                toggleSection={() => toggleSection('stationnement')}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="cadastre" className="space-y-4 mt-4">
            <CadastreTab projectData={projectData} />
          </TabsContent>
          
          <TabsContent value="residents" className="space-y-4 mt-4">
            <ResidentsTab projectData={projectData} />
          </TabsContent>

          <TabsContent value="projet" className="space-y-4 mt-4">
            <ProjectTab projectData={projectData} />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </PageLayout>
  );
};

export default Synthese;
