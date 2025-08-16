import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, X, Search, CheckCheck, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

const servitudesSchema = z.array(z.string().min(2)).max(20);

const DEFAULT_OPTIONS = [
  'PAPAG',
  'Monuments/ABF', 
  'Protection végétale (EBC…)',
  'Emplacements réservés',
  'Voies/Emprises publiques',
  'Mixité sociale',
  'Non aedificandi',
  'Ligne/Marge de recul',
  'Continuité/Discontinuité',
  'Polygone d\'implantation',
  'Passage',
  'Risques naturels (PPRN/PPRI/PPRT/PPRM)',
  'Autre…'
];

const SERVITUDES_OPTIONS = [
  { 
    value: 'papag', 
    label: 'PAPAG',
    description: 'Périmètres d\'Aménagement Programmé',
    requiresNote: false
  },
  { 
    value: 'monuments_abf', 
    label: 'Monuments/ABF',
    description: 'Monuments Historiques et Architecte des Bâtiments de France',
    requiresNote: false,
    isAlert: true
  },
  { 
    value: 'protection_vegetale', 
    label: 'Protection végétale (EBC…)',
    description: 'Espaces Boisés Classés et autres protections végétales',
    requiresNote: false
  },
  { 
    value: 'emplacements_reserves', 
    label: 'Emplacements réservés',
    description: 'Emplacements réservés aux voies et ouvrages publics',
    requiresNote: true,
    placeholder: 'Ex: ER 1, ER 15...'
  },
  { 
    value: 'voies_emprises', 
    label: 'Voies & emprises publiques',
    description: 'Servitudes de voies et d\'emprises publiques',
    requiresNote: false
  },
  { 
    value: 'mixite_sociale', 
    label: 'Mixité sociale',
    description: 'Obligations de mixité sociale',
    requiresNote: false
  },
  { 
    value: 'non_aedificandi', 
    label: 'Non aedificandi',
    description: 'Interdiction de construire',
    requiresNote: false,
    isAlert: true
  },
  { 
    value: 'ligne_marge_recul', 
    label: 'Ligne/marge de recul',
    description: 'Lignes et marges de recul obligatoires',
    requiresNote: true,
    placeholder: 'Ex: 5 m, 10 m...'
  },
  { 
    value: 'continuite_discontinuite', 
    label: 'Continuité/discontinuité',
    description: 'Obligations de continuité ou discontinuité urbaine',
    requiresNote: false
  },
  { 
    value: 'polygone_implantation', 
    label: 'Polygone d\'implantation',
    description: 'Polygones d\'implantation obligatoire',
    requiresNote: false
  },
  { 
    value: 'passage', 
    label: 'Passage',
    description: 'Servitudes de passage',
    requiresNote: false
  },
  { 
    value: 'risques_naturels', 
    label: 'Risques naturels (PPRN/PPRI/PPRT/PPRM)',
    description: 'Plans de Prévention des Risques',
    requiresNote: false,
    isAlert: true
  }
];

interface ServitudesMultiSelectProps {
  projectId: string;
  disabled?: boolean;
}

interface ServitudeData {
  type: string;
  present: boolean;
  notes?: string;
}

// Helper to validate UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

export const ServitudesMultiSelect: React.FC<ServitudesMultiSelectProps> = ({
  projectId,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [notesByType, setNotesByType] = useState<Record<string, string>>({});
  const [customServitude, setCustomServitude] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use default options (no API call needed)
  const availableOptions = DEFAULT_OPTIONS;

  // Load servitudes with React Query  
  const { data: servitudesData = [] } = useQuery({
    queryKey: ['plu-servitudes', projectId],
    queryFn: async () => {
      if (!isValidUUID(projectId)) {
        return [];
      }

      const { data, error } = await supabase
        .from('cadastre_servitudes')
        .select('type, present, notes')
        .eq('project_id', projectId)
        .eq('present', true);

      if (error) {
        throw error;
      }

      return data || [];
    },
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: isValidUUID(projectId)
  });

  // Optimistic mutation for servitude selection
  const servitudeMutation = useMutation({
    mutationFn: async ({ type, present }: { type: string; present: boolean }) => {
      if (!isValidUUID(projectId)) return;
      
      if (present) {
        const notes = notesByType[type];
        const { error } = await supabase
          .from('cadastre_servitudes')
          .upsert({
            project_id: projectId,
            type,
            present: true,
            notes: notes?.trim() || null
          }, { onConflict: 'project_id,type' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cadastre_servitudes')
          .delete()
          .eq('project_id', projectId)
          .eq('type', type);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plu-servitudes', projectId] });
    }
  });

  // Update local state when data changes
  useEffect(() => {
    const selectedTypes = servitudesData.map(item => item.type);
    const notes = servitudesData.reduce((acc, item) => {
      if (item.notes) acc[item.type] = item.notes;
      return acc;
    }, {} as Record<string, string>);

    setSelected(selectedTypes);
    setNotesByType(notes);
  }, [servitudesData]);


  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const handleSelect = (value: string) => {
    const isCurrentlySelected = selected.includes(value);
    const newSelected = isCurrentlySelected 
      ? selected.filter(item => item !== value)
      : [...selected, value];
    
    setSelected(newSelected);
    
    // Optimistic update
    servitudeMutation.mutate({
      type: value,
      present: !isCurrentlySelected
    });
  };

  const handleNoteChange = (type: string, note: string) => {
    setNotesByType(prev => ({
      ...prev,
      [type]: note
    }));
  };

  const handleSelectAll = () => {
    const allValues = availableOptions.slice(0, -1); // Exclude "Autre…"
    setSelected(allValues);
    // Batch optimistic updates
    allValues.forEach(value => {
      if (!selected.includes(value)) {
        servitudeMutation.mutate({ type: value, present: true });
      }
    });
  };

  const handleClearAll = () => {
    const toRemove = [...selected];
    setSelected([]);
    setNotesByType({});
    // Batch optimistic updates
    toRemove.forEach(value => {
      servitudeMutation.mutate({ type: value, present: false });
    });
  };

  const handleAddCustom = () => {
    if (customServitude.trim() && !selected.includes(customServitude.trim())) {
      setSelected(prev => [...prev, customServitude.trim()]);
      setCustomServitude('');
      setIsAddingCustom(false);
    }
  };

  const handleRemoveServitude = (value: string) => {
    setSelected(prev => prev.filter(item => item !== value));
    setNotesByType(prev => {
      const { [value]: _, ...rest } = prev;
      return rest;
    });
    // Optimistic update
    servitudeMutation.mutate({ type: value, present: false });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1">
        Servitudes
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="ml-1 text-muted-foreground cursor-help">ℹ</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Sélectionnez toutes les servitudes applicables au projet</p>
          </TooltipContent>
        </Tooltip>
      </label>
      
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              disabled && "cursor-not-allowed opacity-50",
              open && "ring-2 ring-[#4F3CE7] border-[#4F3CE7]"
            )}
            disabled={disabled || isSaving}
          >
            <span className="truncate">
              {selected.length === 0 
                ? "Sélectionner les servitudes" 
                : `Servitudes (${selected.length} sélectionnées)`
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput placeholder="Rechercher une servitude..." className="flex-1" />
            </div>
            
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                  disabled={isSaving}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Tout sélectionner
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                  disabled={isSaving}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Effacer
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {selected.length}/20
              </span>
            </div>

            <CommandList className="max-h-[300px]">
              <CommandEmpty>Aucune servitude trouvée.</CommandEmpty>
              
              {availableOptions.slice(0, -1).map((optionLabel) => {
                const option = SERVITUDES_OPTIONS.find(opt => opt.label === optionLabel) || { 
                  value: optionLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'), 
                  label: optionLabel,
                  description: '',
                  requiresNote: false,
                  isAlert: false
                };
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="flex items-start gap-2 p-3"
                  >
                    <Checkbox
                      checked={selected.includes(option.value)}
                      onChange={() => handleSelect(option.value)}
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        {option.isAlert && (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      {option.description && (
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      )}
                      {selected.includes(option.value) && option.requiresNote && (
                        <Input
                          placeholder={option.placeholder || ''}
                          value={notesByType[option.value] || ''}
                          onChange={(e) => handleNoteChange(option.value, e.target.value)}
                          className="h-7 text-xs mt-2"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </CommandItem>
                );
              })}

              <div className="border-t p-2">
                {isAddingCustom ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nom de la servitude personnalisée"
                      value={customServitude}
                      onChange={(e) => setCustomServitude(e.target.value)}
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCustom();
                        } else if (e.key === 'Escape') {
                          setIsAddingCustom(false);
                          setCustomServitude('');
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleAddCustom}
                      className="h-8 px-2"
                      disabled={!customServitude.trim()}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingCustom(false);
                        setCustomServitude('');
                      }}
                      className="h-8 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingCustom(true)}
                    className="w-full h-8 text-xs justify-start"
                  >
                    Autre...
                  </Button>
                )}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected servitudes as chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-md">
          {selected.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              {value}
              {!disabled && (
                <button
                  onClick={() => handleRemoveServitude(value)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-2 h-2" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};