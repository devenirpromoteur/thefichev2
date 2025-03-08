
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface CadastreEntry {
  id: string;
  parcelle: string;
  adresse: string;
  section: string;
  surface: string;
}

interface CadastreTableProps {
  entries: CadastreEntry[];
  selectedRow: string | null;
  onSelectRow: (id: string) => void;
  onInputChange: (id: string, field: keyof Omit<CadastreEntry, 'id'>, value: string) => void;
}

export const CadastreTable: React.FC<CadastreTableProps> = ({
  entries,
  selectedRow,
  onSelectRow,
  onInputChange,
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Section et Parcelle</TableHead>
            <TableHead>Adresse</TableHead>
            <TableHead className="w-[160px]">Surface (m²)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                Aucune parcelle enregistrée
              </TableCell>
            </TableRow>
          ) : (
            entries.map(entry => (
              <TableRow 
                key={entry.id}
                className={selectedRow === entry.id ? "bg-muted" : ""}
                onClick={() => onSelectRow(entry.id)}
              >
                <TableCell>
                  <div className="flex space-x-2">
                    <Input
                      value={entry.section}
                      onChange={(e) => onInputChange(entry.id, 'section', e.target.value)}
                      placeholder="Section"
                      className="max-w-[100px]"
                    />
                    <Input
                      value={entry.parcelle}
                      onChange={(e) => onInputChange(entry.id, 'parcelle', e.target.value)}
                      placeholder="Parcelle"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    value={entry.adresse}
                    onChange={(e) => onInputChange(entry.id, 'adresse', e.target.value)}
                    placeholder="ex: 10 rue Example"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={entry.surface}
                    onChange={(e) => onInputChange(entry.id, 'surface', e.target.value)}
                    placeholder="ex: 450"
                    type="number"
                    min="0"
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
