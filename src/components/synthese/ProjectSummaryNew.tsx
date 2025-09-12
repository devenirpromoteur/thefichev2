import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type Projet = {
  surface_fonciere_m2?: number;
  cos_pct?: number;
  capacite_constructible_m2?: number;
  hauteur_moyenne_m?: number;
  nb_etages_libelle?: string;
  capacite_logements_collectifs_m2?: number;
  logements_libres_m2?: number;
  part_sociale_pct?: number;
  logements_sociaux_m2?: number;
  nb_lots_estime?: number;
  parkings_requis?: number;
  espaces_verts_pct?: number;
  espaces_verts_m2?: number;
};

interface ProjectSummaryNewProps {
  projet: Projet;
}

// Formatting helpers that return empty string for null/undefined values
const fmtInt = (value?: number): string => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
};

const fmtPct = (value?: number): string => {
  if (value === null || value === undefined) return '';
  return `${Math.round(value)} %`;
};

const fmtWithUnit = (value?: number, unit: string = ''): string => {
  if (value === null || value === undefined) return '';
  return `${fmtInt(value)}${unit ? ' ' + unit : ''}`;
};

export const ProjectSummaryNew: React.FC<ProjectSummaryNewProps> = ({ projet }) => {
  const projectItems = [
    {
      label: 'Périmètre foncier du projet',
      value: fmtWithUnit(projet.surface_fonciere_m2, 'm²')
    },
    {
      label: 'Sur une densité (COS) de',
      value: fmtPct(projet.cos_pct)
    },
    {
      label: 'Capacité constructive totale de l\'îlot',
      value: fmtWithUnit(projet.capacite_constructible_m2, 'm²')
    },
    {
      label: 'Hauteur moyenne des bâtiment(s)',
      value: fmtWithUnit(projet.hauteur_moyenne_m, 'm')
    },
    {
      label: 'Nombre d\'étages',
      value: projet.nb_etages_libelle || ''
    },
    {
      label: 'Capacité du programme de logements collectifs',
      value: fmtWithUnit(projet.capacite_logements_collectifs_m2, 'm²')
    },
    {
      label: 'Dont logements libres',
      value: fmtWithUnit(projet.logements_libres_m2, 'm²')
    },
    {
      label: 'Dont logements relevant du secteur social',
      value: (() => {
        const pct = fmtPct(projet.part_sociale_pct);
        const surface = fmtWithUnit(projet.logements_sociaux_m2, 'm²');
        if (!pct && !surface) return '';
        if (pct && surface) return `${pct} puis ${surface}`;
        return pct || surface;
      })()
    },
    {
      label: 'Nombre de lots estimé',
      value: fmtWithUnit(projet.nb_lots_estime, 'logts')
    },
    {
      label: 'Emplacements de stationnements requis (logts)',
      value: fmtWithUnit(projet.parkings_requis, 'pl.')
    },
    {
      label: 'Total des espaces libres végétalisés',
      value: (() => {
        const pct = fmtPct(projet.espaces_verts_pct);
        const surface = fmtWithUnit(projet.espaces_verts_m2, 'm²');
        if (!pct && !surface) return '';
        if (pct && surface) return `${pct} puis ${surface}`;
        return pct || surface;
      })()
    }
  ];

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <CardTitle className="text-lg">Synthèse du projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {projectItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0 text-sm gap-y-1.5"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-semibold text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};