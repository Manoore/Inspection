import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Location, HealthScore, OhioRegion } from "@/types";

export function useLocations() {
  const [locations,    setLocations]    = useState<Location[]>([]);
  const [healthScores, setHealthScores] = useState<Record<string, HealthScore>>({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [locRes, hsRes] = await Promise.all([
      supabase.from("locations").select("*").order("name"),
      supabase.from("health_scores").select("*"),
    ]);

    if (locRes.error) { setError(locRes.error.message); setLoading(false); return; }

    setLocations(locRes.data ?? []);

    const scoresMap: Record<string, HealthScore> = {};
    (hsRes.data ?? []).forEach((hs: HealthScore) => { scoresMap[hs.location_id] = hs; });
    setHealthScores(scoresMap);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const byRegion = locations.reduce<Record<OhioRegion, Location[]>>((acc, loc) => {
    if (!acc[loc.region]) acc[loc.region] = [];
    acc[loc.region].push(loc);
    return acc;
  }, {} as Record<OhioRegion, Location[]>);

  const overallScore = locations.length
    ? Math.round(locations.reduce((s, l) => s + (healthScores[l.id]?.score ?? l.health_score), 0) / locations.length)
    : 0;

  return { locations, healthScores, byRegion, overallScore, loading, error, refresh: fetch };
}
