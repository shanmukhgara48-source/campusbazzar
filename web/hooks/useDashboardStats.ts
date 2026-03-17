import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalUsers: number;
  activeListings: number;
  completedTransactions: number;
  openReports: number;
  loading: boolean;
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    completedTransactions: 0,
    openReports: 0,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const [users, listings, txns, reports] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('resolved', false),
      ]);

      setStats({
        totalUsers:            users.count ?? 0,
        activeListings:        listings.count ?? 0,
        completedTransactions: txns.count ?? 0,
        openReports:           reports.count ?? 0,
        loading: false,
      });
    }

    load();
  }, []);

  return stats;
}
