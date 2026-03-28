'use client';

import { useEffect, useState } from 'react';
import { adminApi, type ApiTransaction } from '@/lib/api';

function fmt(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
  disputed:  'bg-orange-100 text-orange-700',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    adminApi.allTransactions()
      .then(({ transactions: data }) => setTransactions(data ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = transactions.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.listingTitle?.toLowerCase().includes(q) ||
      t.buyerName?.toLowerCase().includes(q) ||
      t.sellerName?.toLowerCase().includes(q)
    );
  });

  const totalRevenue    = transactions.reduce((s, t) => s + (t.platformFee ?? 0), 0);
  const totalGst        = transactions.reduce((s, t) => s + (t.gst ?? 0), 0);
  const totalVolume     = transactions.reduce((s, t) => s + (t.amount ?? 0), 0);
  const completedCount  = transactions.filter(t => t.status === 'completed').length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-500 text-sm mt-1">All platform transactions and revenue breakdown</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
          ⚠️ {error} — ensure /admin/transactions is deployed to the Worker.
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Volume',    value: fmt(totalVolume),   icon: '💰', color: 'bg-blue-50 text-blue-600' },
          { label: 'Platform Revenue', value: fmt(totalRevenue), icon: '🏦', color: 'bg-violet-50 text-violet-600' },
          { label: 'GST Collected',   value: fmt(totalGst),      icon: '🧾', color: 'bg-green-50 text-green-600' },
          { label: 'Completed',       value: completedCount,     icon: '✅', color: 'bg-emerald-50 text-emerald-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search listing, buyer, seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-80"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Loading transactions...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {transactions.length === 0 ? 'No transactions yet or endpoint unavailable' : 'No results match your search'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Buyer</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Platform Fee</th>
                  <th className="px-5 py-3">GST</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {tx.listingImage && (
                          <img src={tx.listingImage} alt="" className="w-8 h-8 rounded-md object-cover bg-gray-100" />
                        )}
                        <span className="font-medium text-gray-900 max-w-[180px] truncate">{tx.listingTitle}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{tx.buyerName}</td>
                    <td className="px-5 py-3 text-gray-600">{tx.sellerName}</td>
                    <td className="px-5 py-3 font-semibold">{fmt(tx.amount)}</td>
                    <td className="px-5 py-3 text-green-700 font-medium">{fmt(tx.platformFee)}</td>
                    <td className="px-5 py-3 text-gray-500">{fmt(tx.gst)}</td>
                    <td className="px-5 py-3 capitalize">
                      <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">{tx.paymentMethod}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN')}
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
