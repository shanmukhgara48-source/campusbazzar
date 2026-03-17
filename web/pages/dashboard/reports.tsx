import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

type ReportRow = Database['public']['Tables']['reports']['Row'];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<'open' | 'resolved'>('open');

  useEffect(() => { fetchReports(); }, [filter]);

  async function fetchReports() {
    setLoading(true);
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('resolved', filter === 'resolved')
      .order('created_at', { ascending: false })
      .limit(100);
    setReports(data ?? []);
    setLoading(false);
  }

  async function resolve(id: string) {
    await supabase.from('reports').update({ resolved: true }).eq('id', id);
    setReports(prev => prev.filter(r => r.id !== id));
  }

  return (
    <DashboardLayout title="Reports">
      <div className="flex gap-2 mb-4">
        {(['open', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-400">No {filter} reports.</p>
        ) : reports.map(r => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-500">{r.reason}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400 capitalize">{r.target_type}</span>
              </div>
              {r.description && (
                <p className="text-sm text-gray-700 truncate">{r.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              </p>
            </div>
            {!r.resolved && (
              <button
                onClick={() => resolve(r.id)}
                className="shrink-0 text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50"
              >
                Resolve
              </button>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
