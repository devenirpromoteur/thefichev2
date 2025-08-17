import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type RecapRow = {
  id?: string;              // id Supabase si persisté
  tmpId: string;            // clé locale stable pour React
  projectId: string;        // FK project
  cadastreId?: string | number | null; // si import Cadastre
  // ... autres champs existants
};

type Params = {
  rows: RecapRow[];
  setRows: React.Dispatch<React.SetStateAction<RecapRow[]>>;
  projectId: string;
  processedCadastreIds?: any;
  setProcessedCadastreIds?: (updater: (prev: any) => any) => void;
  tableName?: string;
  childTables?: { name: string; fk: string }[];
};

export function useRecapFoncierDelete({
  rows,
  setRows,
  projectId,
  processedCadastreIds,
  setProcessedCadastreIds,
  tableName = "land_recaps",
  childTables = [],
}: Params) {
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [target, setTarget] = useState<RecapRow | null>(null);
  const snapshotRef = useRef<RecapRow[] | null>(null);

  const openConfirm = (row: RecapRow) => setTarget(row);
  const closeConfirm = () => setTarget(null);

  const releaseCadastreId = (cadastreId?: string | number | null) => {
    if (!cadastreId || !setProcessedCadastreIds) return;
    console.log('Removed cadastreId from processed list:', cadastreId); // Debug log
    setProcessedCadastreIds((prev: any) => {
      if (prev instanceof Set) { const n = new Set(prev); n.delete(cadastreId); return n; }
      if (Array.isArray(prev)) return prev.filter((id) => id !== cadastreId);
      if (prev && typeof prev === "object") { const n = { ...prev }; delete n[cadastreId as any]; return n; }
      return prev;
    });
  };

  const removeLocal = (tmpId: string) =>
    setRows((prev) => prev.filter((r) => r.tmpId !== tmpId));

  const rollback = () => { if (snapshotRef.current) setRows(snapshotRef.current); };

  const hardDeleteChildren = async (rowId: string) => {
    for (const ct of childTables) {
      const { error } = await supabase.from(ct.name as any).delete().eq(ct.fk, rowId);
      if (error) return error;
    }
    return null;
  };

  const handleDelete = async () => {
    if (!target) return;
    const row = target;
    closeConfirm();

    console.log('Deleting entry:', row); // Debug log

    if (!row.id) {
      releaseCadastreId(row.cadastreId);
      removeLocal(row.tmpId);
      toast({ 
        title: "Ligne supprimée",
        description: row.cadastreId 
          ? "Parcelle cadastrale libérée et supprimée avec succès" 
          : "La ligne a été supprimée avec succès"
      });
      return;
    }

    setBusyId(row.tmpId);
    snapshotRef.current = rows;
    
    // Optimistic deletion
    removeLocal(row.tmpId);
    releaseCadastreId(row.cadastreId);

    const childErr = await hardDeleteChildren(row.id);
    if (childErr) console.error("[recap-delete] child error:", childErr.message);

    const { error } = await supabase
      .from("land_recaps")
      .delete()
      .match({ id: row.id, project_id: projectId });
    
    setBusyId(null);

    if (error) {
      console.error('Supabase deletion error:', error); // Debug log
      rollback();
      // Re-add cadastreId back to processed list on rollback
      if (row.cadastreId && setProcessedCadastreIds) {
        setProcessedCadastreIds((prev: any) => {
          if (prev instanceof Set) { const n = new Set(prev); n.add(row.cadastreId); return n; }
          if (Array.isArray(prev)) return [...prev, row.cadastreId];
          if (prev && typeof prev === "object") return { ...prev, [row.cadastreId as any]: true };
          return prev;
        });
      }
      toast({ 
        title: "Erreur", 
        description: "Impossible de supprimer la ligne. Veuillez réessayer.", 
        variant: "destructive" 
      });
      return;
    }

    console.log('Successfully deleted from Supabase:', row.id); // Debug log
    toast({ 
      title: "Ligne supprimée",
      description: row.cadastreId 
        ? "Parcelle cadastrale libérée et supprimée définitivement" 
        : "La ligne a été supprimée définitivement"
    });
  };

  return { busyId, target, openConfirm, closeConfirm, handleDelete };
}