'use client';

import { useEffect, useState } from 'react';
import { adminApi, listingsApi, type ApiListing } from '@/lib/api';

type Filter = 'all' | 'active' | 'pending' | 'sold' | 'rejected';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-700',
  sold:     'bg-blue-100 text-blue-700',
  pending:  'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function ListingsPage() {
  const [listings, setListings]     = useState<ApiListing[]>([]);
  const [filter, setFilter]         = useState<Filter>('all');
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [toast, setToast]           = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Try admin endpoint first, fall back to standard
      const result = await adminApi.allListings().catch(() =>
        listingsApi.list({ limit: 100 })
      );
      setListings(result.listings ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const updateStatus = async (id: string, status: string) => {
    setActionId(id);
    try {
      await adminApi.updateListing(id, status);
      setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
      showToast(`Listing ${status} successfully`);
    } catch {
      // Fallback to standard update
      try {
        await listingsApi.update(id, { status } as Partial<ApiListing>);
        setListings(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        showToast(`Listing ${status} successfully`);
      } catch (e: unknown) {
        showToast(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    } finally {
      setActionId(null);
    }
  };

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;
    setActionId(id);
    try {
      await listingsApi.delete(id);
      setListings(prev => prev.filter(l => l.id !== id));
      showToast('Listing deleted');
    } catch (e: unknown) {
      showToast(`Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setActionId(null);
    }
  };

  const filtered = listings.filter(l => {
    const matchesFilter = filter === 'all' || l.status === filter;
    const matchesSearch = !search ||
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.seller?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts: Record<Filter, number> = {
    all:      listings.length,
    active:   listings.filter(l => l.status === 'active').length,
    pending:  listings.filter(l => l.status === 'pending').length,
    sold:     listings.filter(l => l.status === 'sold').length,
    rejected: listings.filter(l => l.status === 'rejected').length,
  };

  return (
    <div className="p-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-500 text-sm mt-1">Moderate and manage all product listings</p>
        </div>
        <button
          onClick={load}
          className="text-sm text-primary border border-primary px-4 py-2 rounded-lg hover:bg-violet-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['all', 'active', 'pending', 'sold', 'rejected'] as Filter[]).map(f => (
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
          placeholder="Search by title or seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ml-auto w-64"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Loading listings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No listings found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {l.images?.[0] ? (
                          <img src={l.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-lg">🛍️</div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 max-w-[200px] truncate">{l.title}</p>
                          <p className="text-xs text-gray-400">{l.condition}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{l.category}</td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmt(l.price)}</td>
                    <td className="px-5 py-3 text-gray-600">{l.seller?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{l.views ?? 0}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[l.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {l.status === 'pending' && (
                          <>
                            <ActionBtn
                              label="Approve" color="green"
                              loading={actionId === l.id}
                              onClick={() => updateStatus(l.id, 'active')}
                            />
                            <ActionBtn
                              label="Reject" color="red"
                              loading={actionId === l.id}
                              onClick={() => updateStatus(l.id, 'rejected')}
                            />
                          </>
                        )}
                        {l.status === 'active' && (
                          <ActionBtn
                            label="Deactivate" color="gray"
                            loading={actionId === l.id}
                            onClick={() => updateStatus(l.id, 'rejected')}
                          />
                        )}
                        {l.status === 'rejected' && (
                          <ActionBtn
                            label="Restore" color="blue"
                            loading={actionId === l.id}
                            onClick={() => updateStatus(l.id, 'active')}
                          />
                        )}
                        <ActionBtn
                          label="Delete" color="red"
                          loading={actionId === l.id}
                          onClick={() => deleteListing(l.id)}
                        />
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

function ActionBtn({
  label, color, loading, onClick,
}: {
  label: string;
  color: 'green' | 'red' | 'blue' | 'gray';
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    green: 'text-green-700 hover:bg-green-50 border-green-200',
    red:   'text-red-600 hover:bg-red-50 border-red-200',
    blue:  'text-blue-600 hover:bg-blue-50 border-blue-200',
    gray:  'text-gray-600 hover:bg-gray-100 border-gray-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`text-xs px-2.5 py-1.5 border rounded-md font-medium transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {label}
    </button>
  );
}
