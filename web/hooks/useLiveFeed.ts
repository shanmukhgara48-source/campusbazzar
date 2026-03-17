import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeedEvent } from '@/components/TerminalFeed';

export function useLiveFeed(limit = 50): FeedEvent[] {
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    // Subscribe to realtime changes across key tables
    const channel = supabase
      .channel('admin-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (payload) => {
        push({
          type: 'user_joined',
          message: `New user signed up: ${(payload.new as { email: string }).email}`,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => {
        push({
          type: 'listing_posted',
          message: `New listing: "${(payload.new as { title: string }).title}"`,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        push({
          type: 'transaction',
          message: `Transaction initiated · ₹${(payload.new as { amount: number }).amount}`,
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' }, (payload) => {
        push({
          type: 'report',
          message: `Report filed: ${(payload.new as { reason: string }).reason}`,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function push(ev: Omit<FeedEvent, 'id' | 'timestamp'>) {
    setEvents(prev => [
      ...prev.slice(-(limit - 1)),
      { ...ev, id: Math.random().toString(36).slice(2), timestamp: new Date().toISOString() },
    ]);
  }

  return events;
}
