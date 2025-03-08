
import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { CadastreTable } from '@/components/cadastre/CadastreTable';
import { TableActions } from '@/components/cadastre/TableActions';
import { TotalSurface } from '@/components/cadastre/TotalSurface';

interface CadastreEntry {
  id: string;
  parcelle: string;
  adresse: string;
  section: string;
  surface: string;
}

const Cadastre = () => {
  const [entries, setEntries] = useState<CadastreEntry[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const { toast } = useToast();
  const { ficheId } = useParams();
  const navigate = useNavigate();

  // Load existing data for this fiche
  useEffect(() => {
    if (ficheId) {
      const storedFiches = localStorage.getItem('userFiches');
      if (storedFiches) {
        const fiches = JSON.parse(storedFiches);
        const currentFiche = fiches.find((fiche: any) => fiche.id === ficheId);
        
        if (currentFiche && currentFiche.cadastreEntries) {
          setEntries(currentFiche.cadastreEntries);
        } else {
          // Initialize with one empty row if no data exists
          handleAddEntry();
        }
      } else {
        // Initialize with one empty row if no data exists
        handleAddEntry();
      }
    } else {
      // Initialize with one empty row if no ficheId (shouldn't happen)
      handleAddEntry();
    }
  }, [ficheId]);

  // Save data whenever entries change
  useEffect(() => {
    if (ficheId && entries.length > 0) {
      saveToLocalStorage();
    }
  }, [entries]);

  const saveToLocalStorage = () => {
    const storedFiches = localStorage.getItem('userFiches');
    if (storedFiches && ficheId) {
      const fiches = JSON.parse(storedFiches);
      const updatedFiches = fiches.map((fiche: any) => {
        if (fiche.id === ficheId) {
          // Calculate completion for the cadastre section
          const filledFields = entries.reduce((count, entry) => {
            let fieldCount = 0;
            if (entry.section) fieldCount++;
            if (entry.parcelle) fieldCount++;
            if (entry.adresse) fieldCount++;
            if (entry.surface) fieldCount++;
            return count + fieldCount;
          }, 0);
          
          const totalPossibleFields = entries.length * 4;
          const cadastreCompletion = totalPossibleFields > 0 
            ? Math.round((filledFields / totalPossibleFields) * 100) 
            : 0;
          
          return {
            ...fiche,
            cadastreEntries: entries,
            cadastreCompletion: cadastreCompletion,
            // Update the overall completion based on all sections
            completion: calculateOverallCompletion(fiche, cadastreCompletion)
          };
        }
        return fiche;
      });
      
      localStorage.setItem('userFiches', JSON.stringify(updatedFiches));
      
      toast({
        title: "Données sauvegardées",
        description: "Les informations cadastrales ont été mises à jour",
        duration: 2000,
      });
    }
  };

  const calculateOverallCompletion = (fiche: any, cadastreCompletion: number) => {
    // Define weights for each section
    const weights = {
      cadastre: 0.2,
      plu: 0.2,
      residents: 0.2,
      projet: 0.4
    };
    
    // Get completions for each section or use 0 if not available
    const completions = {
      cadastre: cadastreCompletion,
      plu: fiche.pluCompletion || 0,
      residents: fiche.residentsCompletion || 0,
      projet: fiche.projetCompletion || 0
    };
    
    // Calculate weighted average
    const weightedSum = Object.keys(weights).reduce((sum, section) => {
      return sum + (completions[section as keyof typeof completions] * weights[section as keyof typeof weights]);
    }, 0);
    
    return Math.round(weightedSum);
  };

  const handleAddEntry = () => {
    const newEntry: CadastreEntry = {
      id: Math.random().toString(36).substring(2, 9),
      parcelle: '',
      adresse: '',
      section: '',
      surface: '',
    };
    
    setEntries(prev => [...prev, newEntry]);
  };

  const handleDeleteEntry = () => {
    if (!selectedRow) {
      toast({
        title: "Aucune ligne sélectionnée",
        description: "Veuillez sélectionner une ligne à supprimer",
        variant: "destructive",
      });
      return;
    }
    
    setEntries(prev => prev.filter(entry => entry.id !== selectedRow));
    setSelectedRow(null);
    
    toast({
      title: "Ligne supprimée",
      description: "La ligne a été supprimée avec succès",
    });
  };

  const handleInputChange = (id: string, field: keyof Omit<CadastreEntry, 'id'>, value: string) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const getTotalSurface = () => {
    return entries.reduce((total, entry) => {
      const surface = parseFloat(entry.surface) || 0;
      return total + surface;
    }, 0);
  };

  return (
    <PageLayout>
      <div className="animate-enter">
        <Card className="shadow-soft mt-4">
          <CardContent className="pt-6">
            <TableActions 
              onAddEntry={handleAddEntry}
              onDeleteEntry={handleDeleteEntry}
              isDeleteDisabled={!selectedRow}
            />
            
            <CadastreTable 
              entries={entries}
              selectedRow={selectedRow}
              onSelectRow={setSelectedRow}
              onInputChange={handleInputChange}
            />
            
            <TotalSurface totalSurface={getTotalSurface()} />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Cadastre;
