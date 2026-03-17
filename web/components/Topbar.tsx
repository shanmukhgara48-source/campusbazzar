import { useAuth } from '@/hooks/useAuth';

interface TopbarProps {
  title: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-60 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700 leading-none">{user.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">Administrator</p>
            </div>
            <button
              onClick={signOut}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded border border-gray-200 hover:border-red-200"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
