import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Checklist, ChecklistItem, ServiceLine } from "@/types";

export function useChecklist(serviceLines: ServiceLine[]) {
  const [checklists, setChecklists] = useState<(Checklist & { items: ChecklistItem[] })[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    if (!serviceLines.length) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("checklists")
        .select("*, items:checklist_items(*)")
        .in("service_line", serviceLines)
        .eq("is_active", true)
        .order("name");
      setChecklists(data ?? []);
      setLoading(false);
    })();
  }, [serviceLines.join(",")]);

  return { checklists, loading };
}

export function useRiskBriefing(locationId: string): string | null {
  const [briefing, setBriefing] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      // Fetch historical failure patterns for AI briefing
      const { data } = await supabase
        .from("inspection_responses")
        .select("item_id, passed, inspections!inner(location_id, started_at)")
        .eq("inspections.location_id", locationId)
        .eq("passed", false)
        .order("inspections.started_at", { ascending: false })
        .limit(50);

      if (!data?.length) return;

      // Count failures per item
      const counts: Record<string, number> = {};
      data.forEach((r: any) => {
        counts[r.item_id] = (counts[r.item_id] ?? 0) + 1;
      });

      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      if (!topId) return;

      const { data: item } = await supabase
        .from("checklist_items")
        .select("label")
        .eq("id", topId[0])
        .single();

      if (item) {
        setBriefing(
          `"${item.label}" has failed ${topId[1]} time${topId[1] > 1 ? "s" : ""} recently at this location. Check this item first.`
        );
      }
    })();
  }, [locationId]);

  return briefing;
}
