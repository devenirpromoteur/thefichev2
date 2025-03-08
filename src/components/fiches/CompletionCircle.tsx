
import React from 'react';
import { cn } from '@/lib/utils';

interface CompletionCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CompletionCircle({ 
  percentage, 
  size = 40, 
  strokeWidth = 3,
  className 
}: CompletionCircleProps) {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.min(100, Math.max(0, percentage));
  
  // Calculate circle properties
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (validPercentage / 100) * circumference;
  
  // Determine color based on percentage
  const getColor = () => {
    if (validPercentage < 30) return 'text-orange-500';
    if (validPercentage < 70) return 'text-amber-500';
    return 'text-green-500';
  };
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg 
        className="transform -rotate-90"
        width={size} 
        height={size}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          className="text-gray-200"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-1000 ease-out",
            getColor()
          )}
        />
      </svg>
      
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold">
          {validPercentage}%
        </span>
      </div>
    </div>
  );
}
