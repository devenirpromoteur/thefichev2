
import React from 'react';

interface TotalSurfaceProps {
  totalSurface: number;
}

export const TotalSurface: React.FC<TotalSurfaceProps> = ({ totalSurface }) => {
  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-700">Surface totale</span>
        <span className="text-xl font-bold text-brand">{totalSurface} m²</span>
      </div>
    </div>
  );
};
