import DashboardLayout from '@/components/DashboardLayout';
import TerminalFeed from '@/components/TerminalFeed';
import { useLiveFeed } from '@/hooks/useLiveFeed';

export default function ActivityPage() {
  const events = useLiveFeed(200);

  return (
    <DashboardLayout title="Live Activity Feed">
      <p className="text-sm text-gray-500 mb-4">
        Real-time stream of all platform events via Supabase Realtime.
      </p>
      <TerminalFeed events={events} maxRows={200} />
    </DashboardLayout>
  );
}
