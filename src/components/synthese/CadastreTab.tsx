
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CadastreTabProps {
  projectData: {
    cadastre: Array<{
      id: string;
      parcelle: string;
      adresse: string;
      section: string;
      surface: number;
    }>;
    plu: Array<{
      id: string;
      zone: string;
      empriseMax: number;
      hauteurMax: number;
      espacesVerts: number;
      stationnement: number;
    }>;
  };
}

export const CadastreTab: React.FC<CadastreTabProps> = ({ projectData }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Données cadastrales</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>Parcelle</th>
                <th>Adresse</th>
                <th>Surface (m²)</th>
              </tr>
            </thead>
            <tbody>
              {projectData.cadastre.map((item) => (
                <tr key={item.id}>
                  <td>{item.parcelle}</td>
                  <td>{item.adresse}</td>
                  <td>{item.surface}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="font-bold text-right">Total</td>
                <td className="font-bold">{projectData.cadastre.reduce((acc, item) => acc + item.surface, 0)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Règles d'urbanisme (PLU)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>Zone</th>
                <th>Emprise max</th>
                <th>Hauteur max</th>
                <th>Espaces verts</th>
              </tr>
            </thead>
            <tbody>
              {projectData.plu.map((item) => (
                <tr key={item.id}>
                  <td>{item.zone}</td>
                  <td>{item.empriseMax}%</td>
                  <td>{item.hauteurMax}m</td>
                  <td>{item.espacesVerts}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
