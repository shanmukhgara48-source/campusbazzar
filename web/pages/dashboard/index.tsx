import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import TerminalFeed from '@/components/TerminalFeed';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLiveFeed } from '@/hooks/useLiveFeed';

export default function DashboardPage() {
  const stats = useDashboardStats();
  const feed  = useLiveFeed();

  return (
    <DashboardLayout title="Dashboard">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Users"
          value={stats.loading ? '—' : stats.totalUsers.toLocaleString()}
          icon="👥"
          color="blue"
          change="since launch"
          positive
        />
        <StatCard
          title="Active Listings"
          value={stats.loading ? '—' : stats.activeListings.toLocaleString()}
          icon="🏷️"
          color="green"
        />
        <StatCard
          title="Completed Deals"
          value={stats.loading ? '—' : stats.completedTransactions.toLocaleString()}
          icon="✅"
          color="green"
          change="this month"
          positive
        />
        <StatCard
          title="Open Reports"
          value={stats.loading ? '—' : stats.openReports.toLocaleString()}
          icon="🚩"
          color={stats.openReports > 10 ? 'red' : 'yellow'}
        />
      </div>

      {/* Live feed */}
      <div className="max-w-3xl">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Live Activity Feed</h2>
        <TerminalFeed events={feed} />
      </div>
    </DashboardLayout>
  );
}
