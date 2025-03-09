
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

export const ResidentsTab: React.FC<ResidentsTabProps> = ({ projectData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Résidents actuels</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Type d'occupation</th>
              <th>Nombre</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {projectData.residents.map((item, index) => (
              <tr key={item.id || index}>
                <td>{item.type}</td>
                <td>{item.nombre}</td>
                <td>{item.statut}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={1} className="font-bold text-right">Total</td>
              <td className="font-bold">{projectData.residents.reduce((acc, item) => acc + item.nombre, 0)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};
