'use client';

import { useEffect, useState, useRef } from 'react';
import { adminApi, collegesApi, type ApiCollege, type ApiUser } from '@/lib/api';

// ─── Edit / Add Modal ─────────────────────────────────────────────────────────

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  college: ApiCollege | null;
}

function CollegeModal({
  state,
  onClose,
  onSave,
}: {
  state: ModalState;
  onClose: () => void;
  onSave: (name: string, domain: string) => Promise<void>;
}) {
  const [name, setName]     = useState('');
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const nameRef             = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.open) {
      setName(state.college?.name ?? '');
      setDomain(state.college?.domain ?? '');
      setError('');
      setTimeout(() => nameRef.current?.focus(), 50);
    }
  }, [state.open, state.college]);

  const handleSave = async () => {
    if (!name.trim())   { setError('College name is required');  return; }
    if (!domain.trim()) { setError('Email domain is required');  return; }
    const cleanDomain = domain.trim().toLowerCase().replace(/^@/, '').replace(/\s/g, '');
    if (!cleanDomain.includes('.')) { setError('Invalid domain — must contain a dot (e.g. vnrvjiet.ac.in)'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave(name.trim(), cleanDomain);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (!state.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-lg">🏫</div>
            <h2 className="text-base font-bold text-gray-900">
              {state.mode === 'add' ? 'Add College' : 'Edit College'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              College Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. VNR VJIET"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
              Email Domain <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition">
              <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-300 select-none">@</span>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value.toLowerCase().replace(/\s/g, ''))}
                placeholder="vnrvjiet.ac.in"
                className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none"
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Students must use emails ending in this domain to register.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3.5 py-2.5 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {saving ? (state.mode === 'add' ? 'Adding...' : 'Saving...') : (state.mode === 'add' ? 'Add College' : 'Save Changes')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation ──────────────────────────────────────────────────────

function DeleteModal({
  college,
  onClose,
  onConfirm,
}: {
  college: ApiCollege | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  if (!college) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try { await onConfirm(); onClose(); }
    finally { setDeleting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-6 py-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">🗑️</div>
          <h2 className="text-base font-bold text-gray-900 mb-2">Remove College?</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Are you sure you want to remove <strong className="text-gray-900">{college.name}</strong>?
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            New registrations from <span className="font-mono font-semibold">@{college.domain}</span> will be blocked. Existing accounts are not affected.
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="flex-1 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {deleting ? 'Removing...' : 'Yes, Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'ok' | 'err' }) {
  if (!message) return null;
  return (
    <div className={`fixed top-4 right-4 z-[100] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${type === 'err' ? 'bg-red-600' : 'bg-gray-900'}`}>
      <span>{type === 'err' ? '✕' : '✓'}</span>
      {message}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CollegesPage() {
  const [colleges, setColleges]   = useState<ApiCollege[]>([]);
  const [userStats, setUserStats] = useState<Record<string, number>>({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState('');
  const [toastType, setToastType] = useState<'ok' | 'err'>('ok');

  // Modals
  const [modal, setModal]           = useState<ModalState>({ open: false, mode: 'add', college: null });
  const [deleteTarget, setDeleteTarget] = useState<ApiCollege | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast(msg); setToastType(type);
    setTimeout(() => setToast(''), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [collegeRes, userRes] = await Promise.all([
        collegesApi.list(),
        adminApi.allUsers().catch(() => ({ users: [] as ApiUser[] })),
      ]);
      setColleges(collegeRes.colleges ?? []);
      const stats: Record<string, number> = {};
      for (const u of userRes.users ?? []) {
        const d = u.email?.split('@')[1];
        if (d) stats[d] = (stats[d] ?? 0) + 1;
      }
      setUserStats(stats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Add ────────────────────────────────────────────────────────────────────

  const handleAdd = async (name: string, domain: string) => {
    const { college } = await collegesApi.create(name, domain);
    setColleges(prev => [...prev, college].sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`${college.name} added`);
  };

  // ── Edit ───────────────────────────────────────────────────────────────────

  const handleEdit = async (name: string, domain: string) => {
    const id = modal.college!.id;
    const { college } = await collegesApi.update(id, name, domain);
    setColleges(prev => prev.map(c => c.id === id ? college : c).sort((a, b) => a.name.localeCompare(b.name)));
    showToast(`${college.name} updated`);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    await collegesApi.delete(deleteTarget!.id);
    setColleges(prev => prev.filter(c => c.id !== deleteTarget!.id));
    showToast(`${deleteTarget!.name} removed`);
    setDeleteTarget(null);
  };

  const filtered = colleges.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = Object.values(userStats).reduce((s, n) => s + n, 0);

  return (
    <div className="p-8">
      <Toast message={toast} type={toastType} />

      <CollegeModal
        state={modal}
        onClose={() => setModal({ open: false, mode: 'add', college: null })}
        onSave={modal.mode === 'add' ? handleAdd : handleEdit}
      />

      <DeleteModal
        college={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
          <p className="text-gray-500 text-sm mt-1">Manage which institutions can register on CampusBazaar</p>
        </div>
        <button
          onClick={() => setModal({ open: true, mode: 'add', college: null })}
          className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          <span className="text-base leading-none">+</span>
          Add College
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Registered Colleges', value: colleges.length,                              icon: '🏫', color: 'bg-violet-50 text-violet-600' },
          { label: 'Total Students',      value: totalUsers,                                   icon: '👥', color: 'bg-blue-50 text-blue-600'   },
          { label: 'Active Domains',      value: Object.keys(userStats).length,                icon: '🌐', color: 'bg-green-50 text-green-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${card.color}`}>{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search college or domain..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-72"
          />
        </div>
        <button
          onClick={load}
          className="text-sm text-gray-500 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} college{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Loading colleges...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {colleges.length === 0 ? (
              <>
                <p className="text-4xl mb-3">🏫</p>
                <p className="text-gray-500 font-medium">No colleges yet</p>
                <p className="text-xs text-gray-400 mt-1">Click "Add College" to register your first institution</p>
              </>
            ) : (
              <p className="text-gray-400">No colleges match your search</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 w-8">#</th>
                <th className="px-5 py-3">College Name</th>
                <th className="px-5 py-3">Email Domain</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3">Last Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-4 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-gray-900">{c.name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs bg-violet-50 text-violet-700 border border-violet-100 px-2.5 py-1 rounded-md">
                      @{c.domain}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${userStats[c.domain] ? 'text-gray-900' : 'text-gray-400'}`}>
                      {userStats[c.domain] ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          {userStats[c.domain]}
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {c.updatedAt
                      ? new Date(c.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal({ open: true, mode: 'edit', college: c })}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(c)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info note */}
      <p className="mt-4 text-xs text-gray-400">
        ⚠️ Removing a college only blocks <strong>future</strong> registrations from that domain. Existing student accounts are unaffected.
      </p>
    </div>
  );
}
