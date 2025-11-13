import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

export const useUserRole = (userId: string | undefined) => {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      console.log('useUserRole: No userId provided');
      setRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const fetchRole = async () => {
      console.log('useUserRole: Fetching role for user:', userId);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .order('role', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('useUserRole: Error fetching role:', error);
        setRole(null);
      } else {
        console.log('useUserRole: Role fetched:', data?.role);
        setRole((data?.role as UserRole) || null);
      }
      
      setLoading(false);
    };

    fetchRole();
  }, [userId]);

  return { role, loading, isAdmin: role === 'admin', isModerator: role === 'moderator' };
};
