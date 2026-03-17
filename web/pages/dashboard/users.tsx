import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import clsx from 'clsx';

type UserRow = Database['public']['Tables']['users']['Row'];

export default function UsersPage() {
  const [users, setUsers]       = useState<UserRow[]>([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setUsers(data ?? []);
    setLoading(false);
  }

  async function shadowBan(userId: string, banned: boolean) {
    await supabase.from('users').update({ is_shadow_banned: banned }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_shadow_banned: banned } : u));
  }

  async function hardBan(userId: string, banned: boolean) {
    await supabase.from('users').update({ is_banned: banned }).eq('id', userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_banned: banned } : u));
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout title="Users">
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'College', 'Verified', 'Reports', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : filtered.map(u => (
              <tr key={u.id} className={clsx('hover:bg-gray-50', u.is_banned && 'opacity-50')}>
                <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{u.college}</td>
                <td className="px-4 py-3">
                  <span className={clsx(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    u.verification_status === 'id_verified'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {u.verification_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={clsx('font-mono text-xs', u.report_count > 3 && 'text-red-600 font-bold')}>
                    {u.report_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.is_banned ? (
                    <span className="text-xs text-red-600 font-medium">Banned</span>
                  ) : u.is_shadow_banned ? (
                    <span className="text-xs text-yellow-600 font-medium">Shadow</span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => shadowBan(u.id, !u.is_shadow_banned)}
                      className="text-xs px-2 py-1 rounded border border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                    >
                      {u.is_shadow_banned ? 'Un-shadow' : 'Shadow'}
                    </button>
                    <button
                      onClick={() => hardBan(u.id, !u.is_banned)}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
