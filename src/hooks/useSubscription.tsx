import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionTier = 'free' | 'country' | 'all' | 'premium';

interface Subscription {
  tier: SubscriptionTier;
  status: string;
  selectedCountry?: string;
}

export const useSubscription = (userId: string | undefined) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setSubscription({ tier: 'free', status: 'inactive' });
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .single();

      const { data: profileData } = await supabase
        .from('profiles')
        .select('selected_country')
        .eq('id', userId)
        .single();

      setSubscription({
        tier: (subData?.tier as SubscriptionTier) || 'free',
        status: subData?.status || 'inactive',
        selectedCountry: profileData?.selected_country || undefined
      });
      setLoading(false);
    };

    fetchSubscription();
  }, [userId]);

  return { subscription, loading };
};
