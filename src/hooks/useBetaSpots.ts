import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MAX_BETA_USERS = 20;

export function useBetaSpots() {
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSpots = async () => {
      const { data, error } = await supabase.rpc('get_beta_spots_remaining');
      if (!error && data !== null) {
        setSpotsRemaining(data as number);
      }
      setIsLoading(false);
    };

    fetchSpots();

    // Realtime: listen for new profiles to update counter
    const channel = supabase
      .channel('beta-spots')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          // Refetch on new signup
          fetchSpots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    spotsRemaining,
    maxSpots: MAX_BETA_USERS,
    isBetaFull: spotsRemaining !== null && spotsRemaining <= 0,
    isLoading,
  };
}
