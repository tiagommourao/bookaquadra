
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Court } from '@/types/court';

export function useCourts() {
  return useQuery({
    queryKey: ['courts'],
    queryFn: async (): Promise<Court[]> => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data || [];
    }
  });
}
