
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

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
      name: 'Commerces', 
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
      name: 'Étudiants/Senior', 
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
      name: 'Logistique', 
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
    shabCoefficientLibre: 0.93,
    shabCoefficientSocial: 0.93,
    shabLibre: 0,
    shabSocial: 0,
    avgSurfacePerUnitLibre: 60,
    avgSurfacePerUnitSocial: 60,
    totalUnitsLibre: 0,
    totalUnitsSocial: 0,
    internalParkingRatio: 1.5,
    externalParkingRatio: 0,
    internalParkingLibre: 0,
    internalParkingSocial: 0,
    externalParkingLibre: 0,
    externalParkingSocial: 0,
  });

  // Calculate SDP for a building
  const calculateSdp = (footprint: number, levels: number, atticCoefficient: number, sdpCoefficient: number) => {
    const baseArea = footprint * levels;
    const atticArea = footprint * atticCoefficient;
    return (baseArea + atticArea) * sdpCoefficient;
  };

  // Recalculate all values when buildings change
  useEffect(() => {
    // Calculate SDP for each building and totals
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

    // Calculate totals
    const totalSdp = updatedBuildings.reduce((sum, building) => sum + building.sdp, 0);
    const socialSdp = updatedBuildings.reduce((sum, building) => sum + building.socialSdp, 0);
    const libreSdp = totalSdp - socialSdp;
    
    // Calculate SHAB using the appropriate coefficients
    const shabLibre = libreSdp * totals.shabCoefficientLibre;
    const shabSocial = socialSdp * totals.shabCoefficientSocial;
    
    // Calculate units based on average surface - separately for Libre and Social
    const totalUnitsLibre = Math.round(shabLibre / totals.avgSurfacePerUnitLibre);
    const totalUnitsSocial = Math.round(shabSocial / totals.avgSurfacePerUnitSocial);
    
    // Calculate parking spots - separately for Libre and Social
    const internalParkingLibre = Math.round(totalUnitsLibre * totals.internalParkingRatio);
    const internalParkingSocial = Math.round(totalUnitsSocial * totals.internalParkingRatio);
    const externalParkingLibre = Math.round(totalUnitsLibre * totals.externalParkingRatio);
    const externalParkingSocial = Math.round(totalUnitsSocial * totals.externalParkingRatio);

    setTotals(prev => ({
      ...prev,
      totalSdp,
      socialSdp,
      shabLibre,
      shabSocial,
      totalUnitsLibre,
      totalUnitsSocial,
      internalParkingLibre,
      internalParkingSocial,
      externalParkingLibre,
      externalParkingSocial
    }));

    // Notify parent component of data change
    if (onDataChange) {
      onDataChange(updatedBuildings);
    }
  }, [
    // Only depend on the values that should trigger recalculation, not the entire buildings array
    JSON.stringify(buildings.map(b => ({ id: b.id, footprint: b.footprint, levels: b.levels, atticCoefficient: b.atticCoefficient, sdpCoefficient: b.sdpCoefficient, socialPercentage: b.socialPercentage }))),
    totals.shabCoefficientLibre, 
    totals.shabCoefficientSocial, 
    totals.avgSurfacePerUnitLibre,
    totals.avgSurfacePerUnitSocial,
    totals.internalParkingRatio,
    totals.externalParkingRatio
  ]);

  // Handle changes to building properties
  const handleBuildingChange = (id: string, field: keyof BuildingEntry, value: any) => {
    setBuildings(prev => 
      prev.map(building => {
        if (building.id === id) {
          const updatedBuilding = {
            ...building, 
            [field]: field === 'name' 
              ? value 
              : (typeof value === 'string' ? parseFloat(value) || 0 : value)
          };
          
          // Recalculate SDP immediately for this building
          if (field !== 'name') {
            const calculatedSdp = calculateSdp(
              updatedBuilding.footprint, 
              updatedBuilding.levels, 
              updatedBuilding.atticCoefficient, 
              updatedBuilding.sdpCoefficient
            );
            const calculatedSocialSdp = calculatedSdp * (updatedBuilding.socialPercentage / 100);
            
            updatedBuilding.sdp = parseFloat(calculatedSdp.toFixed(2));
            updatedBuilding.socialSdp = parseFloat(calculatedSocialSdp.toFixed(2));
          }
          
          return updatedBuilding;
        }
        return building;
      })
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
        name: `Projet ${newId}`, 
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
            Ajouter un projet
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
                  <Select 
                    value={building.name}
                    onValueChange={value => handleBuildingChange(building.id, 'name', value)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Sélectionner un type de projet" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="Logements">Logements</SelectItem>
                      <SelectItem value="Bureaux">Bureaux</SelectItem>
                      <SelectItem value="Logistique">Logistique</SelectItem>
                      <SelectItem value="Étudiants/Seniors">Étudiants/Seniors</SelectItem>
                      <SelectItem value="Réhabilitation">Réhabilitation</SelectItem>
                      <SelectItem value="Commerces">Commerces</SelectItem>
                      <SelectItem value="Mixte">Mixte</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={totals.shabCoefficientLibre.toString()} 
                    onValueChange={value => handleTotalChange('shabCoefficientLibre', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.85">0.85</SelectItem>
                      <SelectItem value="0.87">0.87</SelectItem>
                      <SelectItem value="0.9">0.90</SelectItem>
                      <SelectItem value="0.93">0.93</SelectItem>
                      <SelectItem value="0.95">0.95</SelectItem>
                      <SelectItem value="0.98">0.98</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select 
                    value={totals.shabCoefficientSocial.toString()} 
                    onValueChange={value => handleTotalChange('shabCoefficientSocial', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.85">0.85</SelectItem>
                      <SelectItem value="0.87">0.87</SelectItem>
                      <SelectItem value="0.9">0.90</SelectItem>
                      <SelectItem value="0.93">0.93</SelectItem>
                      <SelectItem value="0.95">0.95</SelectItem>
                      <SelectItem value="0.98">0.98</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">SHAB</TableCell>
                <TableCell className="text-center">
                  {totals.shabLibre.toFixed(0)}
                </TableCell>
                <TableCell className="text-center">
                  {totals.shabSocial.toFixed(0)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>Surface moyenne</span>
                    <span>par logement LIBRE</span>
                  </div>
                </TableCell>
                <TableCell colSpan={2}>
                  <Select 
                    value={totals.avgSurfacePerUnitLibre.toString()} 
                    onValueChange={value => handleTotalChange('avgSurfacePerUnitLibre', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 39 }, (_, i) => (i + 2) * 5).map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} m²
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>Surface moyenne</span>
                    <span>par logement SOCIAL</span>
                  </div>
                </TableCell>
                <TableCell colSpan={2}>
                  <Select 
                    value={totals.avgSurfacePerUnitSocial.toString()} 
                    onValueChange={value => handleTotalChange('avgSurfacePerUnitSocial', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] overflow-y-auto">
                      {Array.from({ length: 39 }, (_, i) => (i + 2) * 5).map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size} m²
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Logements</TableCell>
                <TableCell className="text-center font-medium">
                  {totals.totalUnitsLibre}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {totals.totalUnitsSocial}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>Ratio places</span>
                    <span>intérieures par logt</span>
                  </div>
                </TableCell>
                <TableCell colSpan={2}>
                  <Select 
                    value={totals.internalParkingRatio.toString()} 
                    onValueChange={value => handleTotalChange('internalParkingRatio', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.5">0.5</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="2.5">2.5</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>Ratio places</span>
                    <span>extérieures par logt</span>
                  </div>
                </TableCell>
                <TableCell colSpan={2}>
                  <Select 
                    value={totals.externalParkingRatio.toString()} 
                    onValueChange={value => handleTotalChange('externalParkingRatio', parseFloat(value))}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="0.5">0.5</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="1.5">1.5</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="2.5">2.5</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Right Summary Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-brand/10">
              <TableRow>
                <TableHead className="text-center">Parking</TableHead>
                <TableHead className="text-center">LIBRE</TableHead>
                <TableHead className="text-center">Social</TableHead>
                <TableHead className="text-center">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Places intérieures</TableCell>
                <TableCell className="text-center">
                  {totals.internalParkingLibre}
                </TableCell>
                <TableCell className="text-center">
                  {totals.internalParkingSocial}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {totals.internalParkingLibre + totals.internalParkingSocial}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Places extérieures</TableCell>
                <TableCell className="text-center">
                  {totals.externalParkingLibre}
                </TableCell>
                <TableCell className="text-center">
                  {totals.externalParkingSocial}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {totals.externalParkingLibre + totals.externalParkingSocial}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Total places</TableCell>
                <TableCell className="text-center font-medium">
                  {totals.internalParkingLibre + totals.externalParkingLibre}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {totals.internalParkingSocial + totals.externalParkingSocial}
                </TableCell>
                <TableCell className="text-center font-medium text-red-500">
                  {totals.internalParkingLibre + totals.internalParkingSocial + totals.externalParkingLibre + totals.externalParkingSocial}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
