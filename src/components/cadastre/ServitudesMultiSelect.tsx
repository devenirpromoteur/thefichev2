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

const SERVITUDES_OPTIONS = [
  { 
    type_key: 'PAPAG', 
    label: 'PAPAG',
    description: 'Périmètres d\'Aménagement Programmé',
    requiresNote: false
  },
  { 
    type_key: 'ABF', 
    label: 'Monuments/ABF',
    description: 'Monuments Historiques et Architecte des Bâtiments de France',
    requiresNote: false,
    isAlert: true
  },
  { 
    type_key: 'EBC', 
    label: 'Protection végétale (EBC…)',
    description: 'Espaces Boisés Classés et autres protections végétales',
    requiresNote: false
  },
  { 
    type_key: 'EMPL_RESERVES', 
    label: 'Emplacements réservés',
    description: 'Emplacements réservés aux voies et ouvrages publics',
    requiresNote: true,
    placeholder: 'Ex: ER 1, ER 15...'
  },
  { 
    type_key: 'VOIES_EMPRISES', 
    label: 'Voies & emprises publiques',
    description: 'Servitudes de voies et d\'emprises publiques',
    requiresNote: false
  },
  { 
    type_key: 'MIXITE_SOCIALE', 
    label: 'Mixité sociale',
    description: 'Obligations de mixité sociale',
    requiresNote: false
  },
  { 
    type_key: 'NON_AEDIFICANDI', 
    label: 'Non aedificandi',
    description: 'Interdiction de construire',
    requiresNote: false,
    isAlert: true
  },
  { 
    type_key: 'MARGE_RECUL', 
    label: 'Ligne/marge de recul',
    description: 'Lignes et marges de recul obligatoires',
    requiresNote: true,
    placeholder: 'Ex: 5 m, 10 m...'
  },
  { 
    type_key: 'CONTINUITE', 
    label: 'Continuité/discontinuité',
    description: 'Obligations de continuité ou discontinuité urbaine',
    requiresNote: false
  },
  { 
    type_key: 'POLYGONE_IMPL', 
    label: 'Polygone d\'implantation',
    description: 'Polygones d\'implantation obligatoire',
    requiresNote: false
  },
  { 
    type_key: 'PASSAGE', 
    label: 'Passage',
    description: 'Servitudes de passage',
    requiresNote: false
  },
  { 
    type_key: 'PPRN', 
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
  type_key: string;
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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [notesByKey, setNotesByKey] = useState<Record<string, string>>({});
  const [customServitude, setCustomServitude] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validate required conditions
  if (!projectId || !isValidUUID(projectId)) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium mb-1">Servitudes</label>
        <div className="p-3 text-sm text-muted-foreground bg-muted/30 rounded-md">
          Projet requis pour enregistrer les servitudes
        </div>
      </div>
    );
  }

  // Load servitudes with React Query  
  const { data: servitudesData = [] } = useQuery({
    queryKey: ['plu-servitudes', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plu_servitudes')
        .select('type_key, notes')
        .eq('project_id', projectId);

      if (error) {
        console.error('Load servitudes error:', { code: error.code, message: error.message });
        throw error;
      }

      return data || [];
    },
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !!projectId
  });

  // Add servitude mutation
  const addServitudeMutation = useMutation({
    mutationFn: async (type_key: string) => {
      console.log('Adding servitude:', { project_id: projectId, type_key });
      const { data, error } = await supabase
        .from('plu_servitudes')
        .upsert({ 
          project_id: projectId, 
          type_key,
          notes: notesByKey[type_key]?.trim() || null
        }, { onConflict: 'project_id,type_key' })
        .select('id')
        .single();
      
      if (error) {
        console.error('Add servitude error:', { code: error.code, message: error.message });
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plu-servitudes', projectId] });
    },
    onError: (error: any) => {
      console.error('Add servitude mutation error:', error);
      toast({
        title: "Erreur d'ajout",
        description: `Impossible d'ajouter la servitude: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Remove servitude mutation
  const removeServitudeMutation = useMutation({
    mutationFn: async (type_key: string) => {
      console.log('Removing servitude:', { project_id: projectId, type_key });
      const { error } = await supabase
        .from('plu_servitudes')
        .delete()
        .eq('project_id', projectId)
        .eq('type_key', type_key);
      
      if (error) {
        console.error('Remove servitude error:', { code: error.code, message: error.message });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plu-servitudes', projectId] });
    },
    onError: (error: any) => {
      console.error('Remove servitude mutation error:', error);
      toast({
        title: "Erreur de suppression",
        description: `Impossible de supprimer la servitude: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update local state when data changes
  useEffect(() => {
    const selectedTypeKeys = new Set(servitudesData.map(item => item.type_key));
    const notes = servitudesData.reduce((acc, item) => {
      if (item.notes) acc[item.type_key] = item.notes;
      return acc;
    }, {} as Record<string, string>);

    setSelectedKeys(selectedTypeKeys);
    setNotesByKey(notes);
  }, [servitudesData]);


  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const toggleServitude = (type_key: string) => {
    const isCurrentlySelected = selectedKeys.has(type_key);
    const newSelectedKeys = new Set(selectedKeys);
    
    if (isCurrentlySelected) {
      newSelectedKeys.delete(type_key);
      setSelectedKeys(newSelectedKeys);
      removeServitudeMutation.mutate(type_key);
    } else {
      newSelectedKeys.add(type_key);
      setSelectedKeys(newSelectedKeys);
      addServitudeMutation.mutate(type_key);
    }
  };

  const handleNoteChange = (type_key: string, note: string) => {
    setNotesByKey(prev => ({
      ...prev,
      [type_key]: note
    }));
  };

  const handleSelectAll = () => {
    const allKeys = SERVITUDES_OPTIONS.map(opt => opt.type_key);
    const newSelectedKeys = new Set(allKeys);
    setSelectedKeys(newSelectedKeys);
    // Add missing servitudes
    allKeys.forEach(type_key => {
      if (!selectedKeys.has(type_key)) {
        addServitudeMutation.mutate(type_key);
      }
    });
  };

  const handleClearAll = () => {
    const toRemove = Array.from(selectedKeys);
    setSelectedKeys(new Set());
    setNotesByKey({});
    // Remove all servitudes
    toRemove.forEach(type_key => {
      removeServitudeMutation.mutate(type_key);
    });
  };

  const handleAddCustom = () => {
    if (customServitude.trim()) {
      const type_key = customServitude.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      const newSelectedKeys = new Set(selectedKeys);
      newSelectedKeys.add(type_key);
      setSelectedKeys(newSelectedKeys);
      setCustomServitude('');
      setIsAddingCustom(false);
      addServitudeMutation.mutate(type_key);
    }
  };

  const handleRemoveServitude = (type_key: string) => {
    const newSelectedKeys = new Set(selectedKeys);
    newSelectedKeys.delete(type_key);
    setSelectedKeys(newSelectedKeys);
    setNotesByKey(prev => {
      const { [type_key]: _, ...rest } = prev;
      return rest;
    });
    removeServitudeMutation.mutate(type_key);
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
            disabled={disabled || addServitudeMutation.isPending || removeServitudeMutation.isPending}
          >
            <span className="truncate">
              {selectedKeys.size === 0 
                ? "Sélectionner les servitudes" 
                : `Servitudes (${selectedKeys.size} sélectionnées)`
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
                  disabled={addServitudeMutation.isPending || removeServitudeMutation.isPending}
                >
                  <CheckCheck className="w-3 h-3 mr-1" />
                  Tout sélectionner
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                  disabled={addServitudeMutation.isPending || removeServitudeMutation.isPending}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Effacer
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {selectedKeys.size}/20
              </span>
            </div>

            <CommandList className="max-h-[300px]">
              <CommandEmpty>Aucune servitude trouvée.</CommandEmpty>
              
              {SERVITUDES_OPTIONS.map((option) => (
                <CommandItem
                  key={option.type_key}
                  value={option.type_key}
                  onSelect={(e) => {
                    // Prevent popover from closing
                  }}
                  className="flex items-start gap-2 p-3 cursor-pointer"
                  onClick={() => toggleServitude(option.type_key)}
                >
                  <Checkbox
                    checked={selectedKeys.has(option.type_key)}
                    onCheckedChange={() => toggleServitude(option.type_key)}
                    onPointerDown={(e) => e.preventDefault()}
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
                    {selectedKeys.has(option.type_key) && option.requiresNote && (
                      <Input
                        placeholder={option.placeholder || ''}
                        value={notesByKey[option.type_key] || ''}
                        onChange={(e) => handleNoteChange(option.type_key, e.target.value)}
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
      {selectedKeys.size > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-muted/30 rounded-md">
          {Array.from(selectedKeys).map((type_key) => {
            const option = SERVITUDES_OPTIONS.find(opt => opt.type_key === type_key);
            const label = option?.label || type_key;
            return (
              <Badge
                key={type_key}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {label}
                {!disabled && (
                  <button
                    onClick={() => handleRemoveServitude(type_key)}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="w-2 h-2" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};