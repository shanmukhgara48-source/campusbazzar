import { FormEvent, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { supabase } from '@/lib/supabase';

type Audience = 'all' | 'sellers' | 'unverified';

const AUDIENCE_LABELS: Record<Audience, string> = {
  all:        'All Users',
  sellers:    'Sellers Only',
  unverified: 'Unverified Users',
};

export default function BroadcastPage() {
  const [title,    setTitle]    = useState('');
  const [body,     setBody]     = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);

    // Insert into a notifications broadcast table
    const { error: err } = await supabase.from('notifications' as never).insert({
      title,
      body,
      audience,
      type: 'system',
      created_at: new Date().toISOString(),
    } as never);

    setSending(false);
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
      setTitle('');
      setBody('');
      setTimeout(() => setSent(false), 4000);
    }
  }

  return (
    <DashboardLayout title="Broadcast Notification">
      <div className="max-w-xl">
        <p className="text-sm text-gray-500 mb-6">
          Send a push notification to a group of users on CampusBazaar.
        </p>

        <form onSubmit={handleSend} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          {/* Audience */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Audience
            </label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(AUDIENCE_LABELS) as Audience[]).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    audience === a
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {AUDIENCE_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={64}
              placeholder="e.g. 🎓 New semester sale!"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              required
              maxLength={256}
              rows={4}
              placeholder="Write your message here..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{body.length}/256</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {sent && (
            <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✅ Notification sent successfully!
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {sending ? 'Sending…' : '📢 Send Broadcast'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
