
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface BuildingEntry {
  id: string;
  name: string;
  footprint: number;
  levels: number;
  atticCoefficient: number;
  sdpCoefficient: number;
  socialPercentage: number;
  sdp: number;
  socialSdp: number;
}

interface ProjectConfigTableProps {
  initialData?: BuildingEntry[];
  onDataChange?: (data: BuildingEntry[]) => void;
}

export const ProjectConfigTable = ({ initialData, onDataChange }: ProjectConfigTableProps) => {
  const [buildings, setBuildings] = useState<BuildingEntry[]>(initialData || [
    { 
      id: '1', 
      name: 'Bâtiment 1', 
      footprint: 100, 
      levels: 3, 
      atticCoefficient: 0.45, 
      sdpCoefficient: 0.85, 
      socialPercentage: 50, 
      sdp: 0, 
      socialSdp: 0 
    },
    { 
      id: '2', 
      name: 'Bâtiment 2', 
      footprint: 0, 
      levels: 0, 
      atticCoefficient: 0.45, 
      sdpCoefficient: 0.85, 
      socialPercentage: 0, 
      sdp: 0, 
      socialSdp: 0 
    },
    { 
      id: '3', 
      name: 'Bâtiment 3', 
      footprint: 0, 
      levels: 0, 
      atticCoefficient: 0.45, 
      sdpCoefficient: 0.85, 
      socialPercentage: 0, 
      sdp: 0, 
      socialSdp: 0 
    },
    { 
      id: '4', 
      name: 'Bâtiment 4', 
      footprint: 0, 
      levels: 0, 
      atticCoefficient: 0.45, 
      sdpCoefficient: 0.85, 
      socialPercentage: 0, 
      sdp: 0, 
      socialSdp: 0 
    }
  ]);

  const [totals, setTotals] = useState({
    totalSdp: 0,
    socialSdp: 0,
    shabCoefficient: 0.93,
    shab: 0,
    socialShab: 0,
    totalUnits: 15,
    internalParking: 0,
    externalParking: 0,
    commerceSdp: 0,
    commerceCoefficient: 0.98,
    studentSdp: 0,
    studentCoefficient: 0.95,
    logisticsSdp: 0,
    logisticsCoefficient: 0.98
  });

  // Calculate SDP for a building
  const calculateSdp = (footprint: number, levels: number, atticCoefficient: number, sdpCoefficient: number) => {
    const baseArea = footprint * levels;
    const atticArea = footprint * atticCoefficient;
    return (baseArea + atticArea) * sdpCoefficient;
  };

  // Recalculate all values when buildings change
  useEffect(() => {
    // Calculate SDP for each building
    const updatedBuildings = buildings.map(building => {
      const calculatedSdp = calculateSdp(
        building.footprint, 
        building.levels, 
        building.atticCoefficient, 
        building.sdpCoefficient
      );
      
      const calculatedSocialSdp = calculatedSdp * (building.socialPercentage / 100);
      
      return {
        ...building,
        sdp: parseFloat(calculatedSdp.toFixed(2)),
        socialSdp: parseFloat(calculatedSocialSdp.toFixed(2))
      };
    });

    setBuildings(updatedBuildings);

    // Calculate totals
    const totalSdp = updatedBuildings.reduce((sum, building) => sum + building.sdp, 0);
    const socialSdp = updatedBuildings.reduce((sum, building) => sum + building.socialSdp, 0);
    const shab = totalSdp * totals.shabCoefficient;
    const socialShab = socialSdp * totals.shabCoefficient;

    setTotals(prev => ({
      ...prev,
      totalSdp,
      socialSdp,
      shab,
      socialShab
    }));

    // Notify parent component of data change
    if (onDataChange) {
      onDataChange(updatedBuildings);
    }
  }, [buildings, totals.shabCoefficient]);

  // Handle changes to building properties
  const handleBuildingChange = (id: string, field: keyof BuildingEntry, value: any) => {
    setBuildings(prev => 
      prev.map(building => 
        building.id === id 
          ? { ...building, [field]: typeof value === 'string' ? parseFloat(value) || 0 : value } 
          : building
      )
    );
  };

  // Handle changes to totals
  const handleTotalChange = (field: keyof typeof totals, value: any) => {
    setTotals(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value
    }));
  };

  const handleAddBuilding = () => {
    const newId = (buildings.length + 1).toString();
    setBuildings(prev => [
      ...prev, 
      { 
        id: newId, 
        name: `Bâtiment ${newId}`, 
        footprint: 0, 
        levels: 0, 
        atticCoefficient: 0.45, 
        sdpCoefficient: 0.85, 
        socialPercentage: 0, 
        sdp: 0, 
        socialSdp: 0 
      }
    ]);
  };

  const handleRemoveBuilding = (id: string) => {
    if (buildings.length > 1) {
      setBuildings(prev => prev.filter(building => building.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Configuration du projet</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAddBuilding}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un bâtiment
          </Button>
        </div>
      </div>

      {/* Main Building Table */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader className="bg-brand/10">
            <TableRow>
              <TableHead className="text-center">Projet</TableHead>
              <TableHead className="text-center">Emprise au sol (m²)</TableHead>
              <TableHead className="text-center">Niveaux</TableHead>
              <TableHead className="text-center">Attique/Comble</TableHead>
              <TableHead className="text-center">Coefficient SDP</TableHead>
              <TableHead className="text-center">SDP (m²)</TableHead>
              <TableHead className="text-center">% Social</TableHead>
              <TableHead className="text-center">SDP Social (m²)</TableHead>
              <TableHead className="text-center w-12">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buildings.map((building) => (
              <TableRow key={building.id}>
                <TableCell>
                  <Input 
                    value={building.name}
                    onChange={e => handleBuildingChange(building.id, 'name', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={building.footprint}
                    onChange={e => handleBuildingChange(building.id, 'footprint', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={building.levels}
                    onChange={e => handleBuildingChange(building.id, 'levels', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={building.atticCoefficient.toString()} 
                    onValueChange={value => handleBuildingChange(building.id, 'atticCoefficient', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.45">0.45</SelectItem>
                      <SelectItem value="0.85">0.85</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={building.sdpCoefficient.toString()} 
                    onValueChange={value => handleBuildingChange(building.id, 'sdpCoefficient', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">0.80</SelectItem>
                      <SelectItem value="0.85">0.85</SelectItem>
                      <SelectItem value="0.9">0.90</SelectItem>
                      <SelectItem value="0.95">0.95</SelectItem>
                      <SelectItem value="1">1.00</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="font-medium text-center">
                  {building.sdp.toFixed(0)}
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={building.socialPercentage}
                    onChange={e => handleBuildingChange(building.id, 'socialPercentage', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell className="font-medium text-center">
                  {building.socialSdp.toFixed(0)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveBuilding(building.id)}
                    disabled={buildings.length <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Left Summary Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-brand/10">
              <TableRow>
                <TableHead className="text-center">Totaux</TableHead>
                <TableHead className="text-center">LIBRE</TableHead>
                <TableHead className="text-center">Social</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">SDP</TableCell>
                <TableCell className="text-center">{(totals.totalSdp - totals.socialSdp).toFixed(0)}</TableCell>
                <TableCell className="text-center">{totals.socialSdp.toFixed(0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    Coefficient SHAB
                  </div>
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.shabCoefficient}
                    onChange={e => handleTotalChange('shabCoefficient', e.target.value)}
                    className="text-center"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.shabCoefficient}
                    onChange={e => handleTotalChange('shabCoefficient', e.target.value)}
                    className="text-center"
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SHAB</TableCell>
                <TableCell className="text-center">
                  {((totals.totalSdp - totals.socialSdp) * totals.shabCoefficient).toFixed(0)}
                </TableCell>
                <TableCell className="text-center">
                  {(totals.socialSdp * totals.shabCoefficient).toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Logements</TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.totalUnits}
                    onChange={e => handleTotalChange('totalUnits', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell className="text-center">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Stat' int'</TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.internalParking}
                    onChange={e => handleTotalChange('internalParking', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell className="text-center">0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Stat' ext'</TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.externalParking}
                    onChange={e => handleTotalChange('externalParking', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell className="text-center">0</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Right Summary Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-brand/10">
              <TableRow>
                <TableHead className="text-center">Commerces</TableHead>
                <TableHead className="text-center">Étudiants / Senior</TableHead>
                <TableHead className="text-center">Logistique</TableHead>
                <TableHead className="text-center">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.commerceSdp}
                    onChange={e => handleTotalChange('commerceSdp', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.studentSdp}
                    onChange={e => handleTotalChange('studentSdp', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value={totals.logisticsSdp}
                    onChange={e => handleTotalChange('logisticsSdp', e.target.value)}
                    className="text-center"
                  />
                </TableCell>
                <TableCell className="font-medium text-center text-red-500">
                  {(totals.totalSdp + totals.commerceSdp + totals.studentSdp + totals.logisticsSdp).toFixed(0)} m²
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Select 
                    value={totals.commerceCoefficient.toString()} 
                    onValueChange={value => handleTotalChange('commerceCoefficient', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">0.80</SelectItem>
                      <SelectItem value="0.85">0.85</SelectItem>
                      <SelectItem value="0.9">0.90</SelectItem>
                      <SelectItem value="0.95">0.95</SelectItem>
                      <SelectItem value="0.98">0.98</SelectItem>
                      <SelectItem value="1">1.00</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={totals.studentCoefficient.toString()} 
                    onValueChange={value => handleTotalChange('studentCoefficient', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">0.80</SelectItem>
                      <SelectItem value="0.85">0.85</SelectItem>
                      <SelectItem value="0.9">0.90</SelectItem>
                      <SelectItem value="0.95">0.95</SelectItem>
                      <SelectItem value="0.98">0.98</SelectItem>
                      <SelectItem value="1">1.00</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={totals.logisticsCoefficient.toString()} 
                    onValueChange={value => handleTotalChange('logisticsCoefficient', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">0.80</SelectItem>
                      <SelectItem value="0.85">0.85</SelectItem>
                      <SelectItem value="0.9">0.90</SelectItem>
                      <SelectItem value="0.95">0.95</SelectItem>
                      <SelectItem value="0.98">0.98</SelectItem>
                      <SelectItem value="1">1.00</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="font-medium text-center">
                  {(
                    totals.totalSdp * totals.shabCoefficient + 
                    totals.commerceSdp * totals.commerceCoefficient + 
                    totals.studentSdp * totals.studentCoefficient + 
                    totals.logisticsSdp * totals.logisticsCoefficient
                  ).toFixed(0)} m²
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="text-center">0</TableCell>
                <TableCell className="text-center">0</TableCell>
                <TableCell className="text-center">0</TableCell>
                <TableCell className="font-medium text-center text-red-500">{totals.totalUnits}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Input 
                    type="number" 
                    value="80"
                    className="text-center"
                    readOnly
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value="30"
                    className="text-center"
                    readOnly
                  />
                </TableCell>
                <TableCell>
                  <Input 
                    type="number" 
                    value="200"
                    className="text-center"
                    readOnly
                  />
                </TableCell>
                <TableCell className="font-medium text-center">{totals.internalParking + totals.externalParking}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
