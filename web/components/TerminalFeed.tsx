import { useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export interface FeedEvent {
  id: string;
  type: 'user_joined' | 'listing_posted' | 'transaction' | 'report' | 'ban' | 'message';
  message: string;
  timestamp: string;
  meta?: Record<string, string>;
}

const typeColor: Record<FeedEvent['type'], string> = {
  user_joined:    'text-blue-400',
  listing_posted: 'text-green-400',
  transaction:    'text-yellow-400',
  report:         'text-red-400',
  ban:            'text-red-600',
  message:        'text-gray-400',
};

const typePrefix: Record<FeedEvent['type'], string> = {
  user_joined:    '[JOIN]',
  listing_posted: '[LIST]',
  transaction:    '[TXN] ',
  report:         '[RPT] ',
  ban:            '[BAN] ',
  message:        '[MSG] ',
};

interface TerminalFeedProps {
  events: FeedEvent[];
  maxRows?: number;
}

export default function TerminalFeed({ events, maxRows = 20 }: TerminalFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const visible = events.slice(-maxRows);

  return (
    <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800 bg-gray-900">
        <span className="w-3 h-3 rounded-full bg-red-500" />
        <span className="w-3 h-3 rounded-full bg-yellow-500" />
        <span className="w-3 h-3 rounded-full bg-green-500" />
        <span className="ml-3 text-xs font-mono text-gray-500">campusbazaar — live activity</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-green-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          LIVE
        </span>
      </div>

      {/* Feed */}
      <div className="h-72 overflow-y-auto scrollbar-thin px-4 py-3 space-y-1 font-mono text-xs">
        {visible.length === 0 && (
          <p className="text-gray-600">Waiting for events...</p>
        )}
        {visible.map((ev) => (
          <div key={ev.id} className="flex items-start gap-2">
            <span className="text-gray-600 shrink-0 tabular-nums">
              {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
            </span>
            <span className={clsx('shrink-0 font-bold', typeColor[ev.type])}>
              {typePrefix[ev.type]}
            </span>
            <span className="text-gray-300 break-all">{ev.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
