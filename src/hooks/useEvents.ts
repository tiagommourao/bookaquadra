
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Busca eventos ativos e suas quadras vinculadas
export function useEvents() {
  return useQuery({
    queryKey: ["events-user"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          events_courts:courts (
            id, name
          )
        `)
        .eq("status", "active")
        .order("start_datetime", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}
