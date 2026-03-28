'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/auth';
import clsx from 'clsx';

const nav = [
  { label: 'Overview',     href: '/dashboard',              icon: '📊' },
  { label: 'Listings',     href: '/dashboard/listings',     icon: '🛍️' },
  { label: 'Users',        href: '/dashboard/users',        icon: '👥' },
  { label: 'Transactions', href: '/dashboard/transactions', icon: '💳' },
  { label: 'Colleges',     href: '/dashboard/colleges',     icon: '🏫' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">CB</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">CampusBazaar</p>
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-violet-50 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <span>🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
