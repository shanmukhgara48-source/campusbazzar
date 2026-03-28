'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '@/components/StatCard';
import { adminApi, listingsApi, type ApiListing, type ApiTransaction } from '@/lib/api';

interface Stats {
  totalUsers: number;
  totalListings: number;
  totalTransactions: number;
  totalRevenue: number;
  activeListings: number;
  pendingListings: number;
  monthlySales: { month: string; revenue: number; count: number }[];
  topCategories: { category: string; count: number }[];
}

const PIE_COLORS = ['#6C47FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const [stats, setStats]             = useState<Stats | null>(null);
  const [recentTx, setRecentTx]       = useState<ApiTransaction[]>([]);
  const [recentListings, setRecentListings] = useState<ApiListing[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.stats().catch(() => null),
      adminApi.allTransactions().catch(() => ({ transactions: [] })),
      adminApi.allListings().catch(() => ({ listings: [] })),
    ]).then(([s, tx, ls]) => {
      setStats(s);
      setRecentTx((tx?.transactions ?? []).slice(0, 5));
      setRecentListings((ls?.listings ?? []).slice(0, 5));
    }).catch(e => {
      // Fallback: load from standard endpoints
      setError('Admin stats endpoint not available — showing partial data.');
      Promise.all([
        listingsApi.list({ limit: 50 }).catch(() => ({ listings: [] })),
      ]).then(([ls]) => {
        setRecentListings((ls?.listings ?? []).slice(0, 5));
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  // Fallback stats from available data
  const displayStats = stats ?? {
    totalUsers: 0,
    totalListings: recentListings.length,
    totalTransactions: recentTx.length,
    totalRevenue: recentTx.reduce((s, t) => s + (t.platformFee ?? 0), 0),
    activeListings: recentListings.filter(l => l.status === 'active').length,
    pendingListings: recentListings.filter(l => l.status === 'pending').length,
    monthlySales: [],
    topCategories: [],
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Platform health at a glance</p>
        {error && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users"        value={displayStats.totalUsers}        icon="👥" color="purple" />
        <StatCard label="Total Listings"     value={displayStats.totalListings}     icon="🛍️" color="blue"   sub={`${displayStats.activeListings} active`} />
        <StatCard label="Transactions"       value={displayStats.totalTransactions} icon="💳" color="green"  />
        <StatCard label="Platform Revenue"   value={fmt(displayStats.totalRevenue)} icon="💰" color="orange" />
      </div>

      {/* Charts */}
      {displayStats.monthlySales.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Monthly Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={displayStats.monthlySales}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" fill="#6C47FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Top Categories</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={displayStats.topCategories}
                  dataKey="count"
                  nameKey="category"
                  cx="50%" cy="50%"
                  outerRadius={75}
                  label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {displayStats.topCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {recentTx.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Fee</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTx.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{tx.listingTitle}</td>
                    <td className="px-5 py-3 text-gray-600">{tx.buyerName}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(tx.amount)}</td>
                    <td className="px-5 py-3 text-green-600 font-medium">{fmt(tx.platformFee)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Listings */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Listings</h2>
          <a href="/dashboard/listings" className="text-xs text-primary hover:underline">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Seller</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentListings.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{l.title}</td>
                  <td className="px-5 py-3 text-gray-500 capitalize">{l.category}</td>
                  <td className="px-5 py-3 font-semibold">{fmt(l.price)}</td>
                  <td className="px-5 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-5 py-3 text-gray-600">{l.seller?.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    sold:      'bg-blue-100 text-blue-700',
    pending:   'bg-yellow-100 text-yellow-700',
    rejected:  'bg-red-100 text-red-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-600',
    disputed:  'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}
