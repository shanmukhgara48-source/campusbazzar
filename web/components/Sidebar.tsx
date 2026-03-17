import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Dashboard',     icon: '⬛' },
  { href: '/dashboard/users',        label: 'Users',         icon: '👥' },
  { href: '/dashboard/listings',     label: 'Listings',      icon: '🏷️' },
  { href: '/dashboard/reports',      label: 'Reports',       icon: '🚩' },
  { href: '/dashboard/transactions', label: 'Transactions',  icon: '💳' },
  { href: '/dashboard/activity',     label: 'Activity Feed', icon: '📡' },
  { href: '/dashboard/broadcast',    label: 'Broadcast',     icon: '📢' },
];

export default function Sidebar() {
  const { pathname } = useRouter();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-lg font-bold text-primary-500">🎓 CampusBazaar</span>
        <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-800 text-xs text-gray-600">
        v1.0.0 · Admin only
      </div>
    </aside>
  );
}
