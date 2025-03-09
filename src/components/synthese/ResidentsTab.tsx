
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ResidentsTabProps {
  projectData: {
    residents: Array<{
      id?: string;
      type: string;
      nombre: number;
      statut: string;
    }>;
  };
}

export const ResidentsTab: React.FC<ResidentsTabProps> = () => {
  // This component now returns null as we're removing the "Occupants actuels" section completely
  return null;
};
