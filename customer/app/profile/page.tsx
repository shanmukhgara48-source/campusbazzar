'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { transactionsApi, ApiTransaction } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  completed:  'text-green-400 bg-green-950',
  pending:    'text-yellow-400 bg-yellow-950',
  cancelled:  'text-red-400 bg-red-950',
  processing: 'text-blue-400 bg-blue-950',
};

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ApiTransaction[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    transactionsApi.byBuyer(user.id)
      .then(({ transactions }) => setOrders(transactions))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [user]);

  if (authLoading || !user) {
    return <div className="flex items-center justify-center min-h-[80vh]"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Profile card */}
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-700 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{user.name}</h1>
            <p className="text-gray-400 text-sm">{user.email}</p>
            {user.college && <p className="text-gray-500 text-xs mt-0.5">{user.college}</p>}
          </div>
          {user.verified && (
            <span className="ml-auto text-xs bg-green-900 text-green-300 px-2.5 py-1 rounded-full font-medium">
              ✓ Verified
            </span>
          )}
        </div>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="mt-4 text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">My Orders</h2>

        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-900 rounded-xl animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 text-center">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="text-gray-400">No orders yet</p>
            <Link href="/" className="mt-3 inline-block text-primary-400 hover:text-primary-300 text-sm">
              Browse listings →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex items-center gap-4">
                {order.listing?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.listing.images[0]} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gray-800" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{order.listing?.title ?? 'Item'}</p>
                  <p className="text-primary-400 text-sm font-bold">₹{order.amount.toLocaleString()}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_COLORS[order.status] ?? 'text-gray-400 bg-gray-800'}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
