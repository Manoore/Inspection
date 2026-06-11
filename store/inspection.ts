import { create } from "zustand";
import { Inspection, InspectionResponse, CorrectiveAction } from "@/types";
import { supabase } from "@/lib/supabase";

interface InspectionState {
  activeInspection: Inspection | null;
  responses: InspectionResponse[];
  pendingSync: Inspection[];
  startInspection: (inspection: Partial<Inspection>) => Promise<Inspection | null>;
  saveResponse: (response: Partial<InspectionResponse>) => void;
  completeInspection: (signatureUrl?: string) => Promise<void>;
  loadPendingSync: () => void;
  syncOfflineData: () => Promise<void>;
}

export const useInspectionStore = create<InspectionState>((set, get) => ({
  activeInspection: null,
  responses: [],
  pendingSync: [],

  startInspection: async (partial) => {
    const { data, error } = await supabase
      .from("inspections")
      .insert({ ...partial, status: "in_progress" })
      .select()
      .single();

    if (error) return null;
    set({ activeInspection: data, responses: [] });
    return data;
  },

  saveResponse: (response) => {
    set((state) => {
      const existing = state.responses.findIndex((r) => r.item_id === response.item_id);
      const updated =
        existing >= 0
          ? state.responses.map((r, i) => (i === existing ? { ...r, ...response } as InspectionResponse : r))
          : [...state.responses, response as InspectionResponse];
      return { responses: updated };
    });
  },

  completeInspection: async (signatureUrl) => {
    const { activeInspection, responses } = get();
    if (!activeInspection) return;

    const passed = responses.filter((r) => r.passed).length;
    const score = Math.round((passed / responses.length) * 100);

    await supabase.from("inspection_responses").insert(responses);
    await supabase
      .from("inspections")
      .update({ status: "completed", completed_at: new Date().toISOString(), score, signature_url: signatureUrl })
      .eq("id", activeInspection.id);

    const failedItems = responses.filter((r) => !r.passed);
    if (failedItems.length) {
      const actions = failedItems.map((r) => ({
        inspection_id: activeInspection.id,
        location_id:   activeInspection.location_id,
        item_id:       r.item_id,
        description:   `Failed item requires corrective action`,
        status:        "open" as const,
        due_date:      new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      }));
      await supabase.from("corrective_actions").insert(actions);
    }

    set({ activeInspection: null, responses: [] });
  },

  loadPendingSync: () => {
    // load from SQLite offline store — populated by offline queue
  },

  syncOfflineData: async () => {
    const { pendingSync } = get();
    for (const inspection of pendingSync) {
      await supabase.from("inspections").upsert(inspection);
    }
    set({ pendingSync: [] });
  },
}));
