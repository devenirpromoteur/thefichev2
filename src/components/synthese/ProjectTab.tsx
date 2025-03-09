
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ProjectTabProps {
  projectData: {
    projet: {
      surfaceTotale: number;
      surfacePlancher: number;
      nombreLogements: number;
      typologies: {
        t2: number;
        t3: number;
        t4: number;
      };
      logementSocial: number;
      parking: number;
    };
  };
}

export const ProjectTab: React.FC<ProjectTabProps> = ({ projectData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Caractéristiques du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Surface plancher</dt>
              <dd className="font-medium">{projectData.projet.surfacePlancher} m²</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Nombre de logements</dt>
              <dd className="font-medium">{projectData.projet.nombreLogements}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Logements sociaux</dt>
              <dd className="font-medium">{projectData.projet.logementSocial} ({Math.round(projectData.projet.logementSocial / projectData.projet.nombreLogements * 100)}%)</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Places de parking</dt>
              <dd className="font-medium">{projectData.projet.parking}</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">Ratio parking/logement</dt>
              <dd className="font-medium">{(projectData.projet.parking / projectData.projet.nombreLogements).toFixed(2)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Répartition des typologies</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">T2</dt>
              <dd className="font-medium">{projectData.projet.typologies.t2} ({Math.round(projectData.projet.typologies.t2 / projectData.projet.nombreLogements * 100)}%)</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">T3</dt>
              <dd className="font-medium">{projectData.projet.typologies.t3} ({Math.round(projectData.projet.typologies.t3 / projectData.projet.nombreLogements * 100)}%)</dd>
            </div>
            <div className="flex justify-between border-b pb-2">
              <dt className="text-muted-foreground">T4</dt>
              <dd className="font-medium">{projectData.projet.typologies.t4} ({Math.round(projectData.projet.typologies.t4 / projectData.projet.nombreLogements * 100)}%)</dd>
            </div>
            <div className="flex justify-between pt-2 font-medium">
              <dt>Surface moyenne / logement</dt>
              <dd>{Math.round(projectData.projet.surfacePlancher / projectData.projet.nombreLogements)} m²</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};
