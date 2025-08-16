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
import { useQuery, useQueryClient } from '@tanstack/react-query';

const servitudesSchema = z.array(z.string().min(2)).max(20);

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
  const [saving, setSaving] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const consecutiveFailuresRef = useRef(0);
  const lastErrorToastRef = useRef<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load servitudes with React Query
  const {
    data: servitudesData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['servitudes', projectId],
    queryFn: async () => {
      // Don't fetch if projectId is not a valid UUID (local storage mode)
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
    enabled: isValidUUID(projectId), // Only fetch if UUID is valid
  });

  // Handle success - reset consecutive failures
  useEffect(() => {
    if (!isLoading && !isError) {
      consecutiveFailuresRef.current = 0;
    }
  }, [isLoading, isError]);

  // Handle errors with throttling and user interaction check
  useEffect(() => {
    if (isError && error) {
      console.error('Error loading servitudes:', error);
      consecutiveFailuresRef.current += 1;
      
      // Only show toast on user interaction or after 2 consecutive failures
      const shouldShowToast = userInteracted || consecutiveFailuresRef.current >= 2;
      const now = Date.now();
      const canShowToast = now - lastErrorToastRef.current > 60000; // 60s throttle
      
      if (shouldShowToast && canShowToast) {
        let errorMessage = "Impossible de charger les servitudes";
        
        // Check for specific error types
        const errorObj = error as any;
        if (errorObj?.code === '42501') {
          errorMessage = "Droits d'accès insuffisants";
        } else if (errorObj?.code === '22P02') {
          errorMessage = "Format d'identifiant invalide";
        } else if (error?.message?.toLowerCase().includes('network') || error?.message?.toLowerCase().includes('timeout')) {
          errorMessage = "Erreur de connexion - Veuillez réessayer";
        }
        
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
        
        lastErrorToastRef.current = now;
      }
    }
  }, [isError, error, userInteracted, toast]);

  // Update local state when data changes
  useEffect(() => {
    if (servitudesData) {
      const selectedTypes = servitudesData.map(item => item.type);
      const notes = servitudesData.reduce((acc, item) => {
        if (item.notes) acc[item.type] = item.notes;
        return acc;
      }, {} as Record<string, string>);

      setSelected(selectedTypes);
      setNotesByType(notes);
    }
  }, [servitudesData]);

  const saveServitudes = async () => {
    try {
      // Validate selection
      const validation = servitudesSchema.safeParse(selected);
      if (!validation.success) {
        toast({
          title: "Validation",
          description: "Nombre de servitudes invalide (max 20)",
          variant: "destructive",
        });
        return;
      }

      setSaving(true);

      // Get all existing servitudes for this project
      const { data: existing } = await supabase
        .from('cadastre_servitudes')
        .select('type')
        .eq('project_id', projectId);

      const existingTypes = existing?.map(item => item.type) || [];

      // Delete deselected servitudes
      const toDelete = existingTypes.filter(type => !selected.includes(type));
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('cadastre_servitudes')
          .delete()
          .eq('project_id', projectId)
          .in('type', toDelete);

        if (error) throw error;
      }

      // Upsert selected servitudes
      for (const type of selected) {
        const servitudeOption = SERVITUDES_OPTIONS.find(opt => opt.value === type);
        const notes = notesByType[type];

        // Validate required notes
        if (servitudeOption?.requiresNote && !notes?.trim()) {
          toast({
            title: "Information manquante",
            description: `Veuillez renseigner une valeur pour "${servitudeOption.label}"`,
            variant: "destructive",
          });
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from('cadastre_servitudes')
          .upsert({
            project_id: projectId,
            type,
            present: true,
            notes: notes?.trim() || null
          });

        if (error) throw error;
      }

      toast({
        title: "Sauvegarde réussie",
        description: "Les servitudes ont été mises à jour",
      });

    } catch (error) {
      console.error('Error saving servitudes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les servitudes",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setUserInteracted(true); // Mark user interaction when opening popover
    }
    setOpen(newOpen);
    if (!newOpen && !saving) {
      saveServitudes();
    }
  };

  const handleRefresh = () => {
    setUserInteracted(true);
    refetch();
  };

  const handleSelect = (value: string) => {
    setSelected(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleNoteChange = (type: string, note: string) => {
    setNotesByType(prev => ({
      ...prev,
      [type]: note
    }));
  };

  const handleSelectAll = () => {
    const allValues = SERVITUDES_OPTIONS.map(opt => opt.value);
    setSelected(allValues);
  };

  const handleClearAll = () => {
    setSelected([]);
    setNotesByType({});
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
  };

  const getServitudeLabel = (value: string) => {
    const option = SERVITUDES_OPTIONS.find(opt => opt.value === value);
    return option?.label || value;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">Servitudes</label>
        <div className="h-10 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  // Show empty state for non-UUID project IDs (localStorage mode)
  if (!isValidUUID(projectId)) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">
          Servitudes
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 text-muted-foreground cursor-help">ℹ</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fonctionnalité disponible avec un projet connecté</p>
            </TooltipContent>
          </Tooltip>
        </label>
        <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-md">
          Aucune servitude enregistrée
        </div>
      </div>
    );
  }

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
            disabled={disabled}
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
                  onClick={handleRefresh}
                  className="h-7 text-xs"
                  disabled={isRefetching}
                >
                  <RefreshCw className={cn("w-3 h-3 mr-1", isRefetching && "animate-spin")} />
                  {isRefetching ? "..." : "Actualiser"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs"
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Tout sélectionner
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
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
              
              {SERVITUDES_OPTIONS.map((option) => (
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
                        placeholder={option.placeholder}
                        value={notesByType[option.value] || ''}
                        onChange={(e) => handleNoteChange(option.value, e.target.value)}
                        className="h-7 text-xs mt-2"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </div>
                </CommandItem>
              ))}

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
              {getServitudeLabel(value)}
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