import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';

const zoneOptions = {
  "Zones Urbaines (U)": ["UA", "UB", "UC"],
  "Zones Urbaines spéciales": ["UE", "UI", "UZ"],
  "Zones à urbaniser (AU)": ["AU", "1AU", "2AU", "AUa", "AUb"]
};

const customZoneSchema = z.string()
  .min(1, "Code zone requis")
  .max(10, "Maximum 10 caractères")
  .regex(/^[A-Z0-9\-]+$/, "Lettres, chiffres et tirets uniquement");

interface ZoneSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ZoneSelect({ value, onValueChange, disabled, className }: ZoneSelectProps) {
  const [open, setOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check if current value is in predefined options
  const allPredefinedOptions = Object.values(zoneOptions).flat();
  const isValuePredefined = value ? allPredefinedOptions.includes(value) : false;

  useEffect(() => {
    // If value is not predefined, set custom mode
    if (value && !isValuePredefined) {
      setIsCustomMode(true);
      setCustomValue(value);
    }
  }, [value, isValuePredefined]);

  const handleSelect = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setIsCustomMode(true);
      setCustomValue('');
      setError(null);
    } else {
      setIsCustomMode(false);
      setCustomValue('');
      setError(null);
      onValueChange(selectedValue);
      setOpen(false);
    }
  };

  const handleCustomSubmit = () => {
    const trimmedValue = customValue.trim().toUpperCase();
    
    try {
      customZoneSchema.parse(trimmedValue);
      setError(null);
      onValueChange(trimmedValue);
      setIsCustomMode(false);
      setOpen(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
    }
  };

  const handleClear = () => {
    onValueChange('');
    setIsCustomMode(false);
    setCustomValue('');
    setError(null);
    setOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    
    // Auto-save on close
    if (!newOpen && isCustomMode && customValue.trim()) {
      handleCustomSubmit();
    }
  };

  const displayValue = value || '';

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
              "focus:border-[#4F3CE7] focus:ring-[#4F3CE7]",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span>{value ? displayValue : "Sélectionner une zone"}</span>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Rechercher une zone..." />
            <CommandList>
              <CommandEmpty>Aucune zone trouvée.</CommandEmpty>
              
              {Object.entries(zoneOptions).map(([groupName, zones]) => (
                <CommandGroup key={groupName} heading={groupName}>
                  {zones.map((zone) => (
                    <CommandItem
                      key={zone}
                      value={zone}
                      onSelect={handleSelect}
                      className="flex items-center justify-between"
                    >
                      <span>{zone}</span>
                      {value === zone && (
                        <Check className="ml-2 h-4 w-4 text-[#4F3CE7]" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              
              <CommandGroup heading="Personnalisé">
                <CommandItem
                  value="custom"
                  onSelect={handleSelect}
                  className="flex items-center justify-between"
                >
                  <span>Autres – à écrire…</span>
                  {isCustomMode && (
                    <Check className="ml-2 h-4 w-4 text-[#4F3CE7]" />
                  )}
                </CommandItem>
              </CommandGroup>
              
              {value && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="w-full justify-start text-muted-foreground hover:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Effacer
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
          
          {isCustomMode && (
            <div className="border-t p-3 space-y-2">
              <div className="space-y-2">
                <Input
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    setError(null);
                  }}
                  placeholder="ex : N, AUa1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomSubmit();
                    } else if (e.key === 'Escape') {
                      setIsCustomMode(false);
                      setCustomValue('');
                      setError(null);
                    }
                  }}
                  className={cn(
                    "text-sm",
                    "focus:border-[#4F3CE7] focus:ring-[#4F3CE7]",
                    error && "border-destructive focus:border-destructive"
                  )}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCustomSubmit}
                  className="flex-1 bg-[#4F3CE7] hover:bg-[#4F3CE7]/90"
                  disabled={!customValue.trim()}
                >
                  Valider
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCustomMode(false);
                    setCustomValue('');
                    setError(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      {/* Display selected value as chip */}
      {value && (
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "bg-[#4F3CE7]/10 text-[#4F3CE7] border-[#4F3CE7]/20",
              "hover:bg-[#4F3CE7]/20"
            )}
          >
            {value}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="ml-1 hover:text-[#4F3CE7]/70"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        </div>
      )}
      
      {error && !isCustomMode && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}