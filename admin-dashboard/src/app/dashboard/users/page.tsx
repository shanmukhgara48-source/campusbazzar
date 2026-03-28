'use client';

import { useEffect, useState } from 'react';
import { adminApi, type ApiUser } from '@/lib/api';

type Filter = 'all' | 'admin' | 'seller' | 'buyer' | 'banned';

export default function UsersPage() {
  const [users, setUsers]     = useState<ApiUser[]>([]);
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [toast, setToast]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { users: data } = await adminApi.allUsers();
      setUsers(data ?? []);
    } catch {
      setToast('Admin users endpoint not available. Add /admin/users to the Worker.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const toggleBan = async (user: ApiUser) => {
    const newBanned = !user.isBanned;
    if (!confirm(`${newBanned ? 'Ban' : 'Unban'} ${user.name}?`)) return;
    setActionId(user.uid);
    try {
      await adminApi.updateUser(user.uid, { isBanned: newBanned });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, isBanned: newBanned } : u));
      showToast(`${user.name} has been ${newBanned ? 'banned' : 'unbanned'}`);
    } catch (e: unknown) {
      showToast(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActionId(null);
    }
  };

  const setRole = async (user: ApiUser, role: string) => {
    setActionId(user.uid);
    try {
      await adminApi.updateUser(user.uid, { role });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role } : u));
      showToast(`${user.name} is now ${role}`);
    } catch (e: unknown) {
      showToast(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActionId(null);
    }
  };

  const filtered = users.filter(u => {
    const matchesFilter =
      filter === 'all'    ? true :
      filter === 'banned' ? u.isBanned :
      u.role === filter;
    const matchesSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.college?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts: Record<Filter, number> = {
    all:    users.length,
    admin:  users.filter(u => u.role === 'admin').length,
    seller: users.filter(u => u.role === 'seller').length,
    buyer:  users.filter(u => u.role === 'buyer').length,
    banned: users.filter(u => u.isBanned).length,
  };

  return (
    <div className="p-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg ${toast.startsWith('Failed') ? 'bg-red-600' : 'bg-gray-900'}`}>
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage platform users — ban, unban, change roles</p>
        </div>
        <button onClick={load} className="text-sm text-primary border border-primary px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors">
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'admin', 'seller', 'buyer', 'banned'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f} <span className="ml-1 text-gray-400">({counts[f]})</span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search name, email, college..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ml-auto w-72"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {users.length === 0 ? 'No users loaded — ensure /admin/users endpoint is deployed.' : 'No users match filter'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">College</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Rating</th>
                  <th className="px-5 py-3">Sales</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.uid} className={`hover:bg-gray-50 transition-colors ${u.isBanned ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={u.avatar} alt="" className="w-9 h-9 rounded-full object-cover bg-gray-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-semibold text-sm">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 max-w-[150px] truncate">{u.college || '—'}</td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {u.rating > 0 ? `⭐ ${u.rating.toFixed(1)} (${u.reviewCount})` : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{u.totalSales ?? 0}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {u.isBanned ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Banned</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleBan(u)}
                          disabled={actionId === u.uid}
                          className={`text-xs px-2.5 py-1.5 border rounded-md font-medium transition-colors disabled:opacity-50 ${
                            u.isBanned
                              ? 'text-green-700 hover:bg-green-50 border-green-200'
                              : 'text-red-600 hover:bg-red-50 border-red-200'
                          }`}
                        >
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => setRole(u, 'admin')}
                            disabled={actionId === u.uid}
                            className="text-xs px-2.5 py-1.5 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-md font-medium transition-colors disabled:opacity-50"
                          >
                            Make Admin
                          </button>
                        )}
                        {u.role === 'admin' && u.uid !== 'self' && (
                          <button
                            onClick={() => setRole(u, 'buyer')}
                            disabled={actionId === u.uid}
                            className="text-xs px-2.5 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors disabled:opacity-50"
                          >
                            Revoke Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin:  'bg-violet-100 text-violet-700',
    seller: 'bg-blue-100 text-blue-700',
    buyer:  'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {role}
    </span>
  );
}
