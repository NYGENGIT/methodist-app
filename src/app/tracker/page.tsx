'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/config';
import { ghs, int, pct } from '@/lib/format';
import type { Engagement } from '@/lib/types';
import { BrandBar, StatTile, Card, Pill } from '@/components/ui';
import EngagementForm from '@/components/tracker/EngagementForm';
import AdminUpload from '@/components/tracker/AdminUpload';

export default function TrackerPage() {
  const auth = useAuth();

  if (!isSupabaseConfigured()) return <Shell><NotConnected /></Shell>;
  if (auth.loading) return <Shell><Spinner /></Shell>;
  if (!auth.email) return <Shell><LoginCard signIn={auth.signIn} /></Shell>;
  return <Shell><Tracker auth={auth} /></Shell>;
}

/* ───────────────────────── Tracker (authenticated) ───────────────────────── */
function Tracker({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const [rows, setRows] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Engagement | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<'log' | 'admin'>('log');

  const isAdmin = auth.isAdmin;
  const myBranches = auth.profile?.branches || [];

  async function load() {
    setLoading(true);
    const sb = supabase()!;
    const { data, error } = await sb.from('engagements').select('*').order('date', { ascending: false });
    if (error) setErr(error.message);
    else setRows((data || []) as Engagement[]);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function save(e: Engagement) {
    setSaving(true); setErr(null);
    const sb = supabase()!;
    const payload = { ...e, won_premium: +e.won_premium || 0, pipeline_value: +e.pipeline_value || 0 };
    let res;
    if (e.id) res = await sb.from('engagements').update(payload).eq('id', e.id);
    else res = await sb.from('engagements').insert({ ...payload, created_by: auth.email });
    setSaving(false);
    if (res.error) { setErr(res.error.message); return; }
    setAdding(false); setEditing(null); load();
  }

  async function remove(id?: string) {
    if (!id || !isAdmin) return;
    if (!confirm('Delete this engagement permanently? Only admins can do this.')) return;
    const sb = supabase()!;
    const { error } = await sb.from('engagements').delete().eq('id', id);
    if (error) setErr(error.message); else load();
  }

  const stats = useMemo(() => {
    const won = rows.filter((r) => r.status === 'Won');
    const pipeline = rows.reduce((s, r) => s + (+r.pipeline_value || 0), 0);
    const wonPrem = won.reduce((s, r) => s + (+r.won_premium || 0), 0);
    const open = rows.filter((r) => ['Open', 'In Progress', 'On Hold'].includes(r.status)).length;
    return { total: rows.length, won: won.length, open, pipeline, wonPrem, winRate: rows.length ? (won.length / rows.length) * 100 : 0 };
  }, [rows]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Methodist outreach</p>
          <h1 className="font-brand text-2xl font-bold text-navy-ink sm:text-3xl">Branch Engagement Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">
            Signed in as {auth.profile?.full_name || auth.email}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${isAdmin ? 'bg-gold/20 text-gold-deep' : 'bg-navy/10 text-navy'}`}>{isAdmin ? 'Admin' : 'Branch Manager'}</span>
            {myBranches.length > 0 && <span className="ml-2 text-xs">· {myBranches.join(', ')}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {!adding && !editing && <button onClick={() => setAdding(true)} className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-deep">+ Add engagement</button>}
          <button onClick={auth.signOut} className="rounded-md border border-mist px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-paper">Sign out</button>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-5 flex gap-2 border-b border-mist">
          {(['log', 'admin'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === t ? 'border-navy text-navy' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {t === 'log' ? 'Engagement log' : 'Data upload'}
            </button>
          ))}
        </div>
      )}

      {err && <div className="mb-4 rounded-md border border-brick/30 bg-brick/5 px-4 py-2 text-sm text-brick-deep">{err}</div>}

      {tab === 'admin' && isAdmin ? <AdminUpload /> : (
        <>
          {(adding || editing) ? (
            <Card title={editing ? 'Edit engagement' : 'New engagement'}>
              <EngagementForm
                initial={editing || undefined}
                lockBranch={!isAdmin && myBranches.length === 1 ? myBranches[0] : undefined}
                managerName={auth.profile?.full_name}
                onSave={save} onCancel={() => { setAdding(false); setEditing(null); }} saving={saving}
              />
            </Card>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
                <StatTile accent="navy" value={int(stats.total)} label="Engagements" />
                <StatTile accent="steel" value={int(stats.open)} label="Open / in progress" />
                <StatTile accent="teal" value={int(stats.won)} label="Won" sub={pct(stats.winRate) + ' win rate'} />
                <StatTile accent="gold" value={ghs(stats.pipeline)} label="Pipeline value" />
                <StatTile accent="brick" value={ghs(stats.wonPrem)} label="Won premium" />
              </div>

              {loading ? <Spinner /> : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-mist text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="py-2 pr-3">Date</th><th className="py-2 pr-3">Branch</th>
                          <th className="py-2 pr-3">Institution</th><th className="py-2 pr-3">Type</th>
                          <th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Priority</th>
                          <th className="hidden py-2 pr-3 text-right md:table-cell">Pipeline</th>
                          <th className="py-2 pr-3">Next action</th><th className="py-2 text-right">·</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-slate-400">No engagements yet. Add the first one.</td></tr>}
                        {rows.map((r) => (
                          <tr key={r.id} className="border-b border-mist/60 align-top last:border-0 hover:bg-paper">
                            <td className="py-2 pr-3 whitespace-nowrap text-slate-600">{r.date}</td>
                            <td className="py-2 pr-3 text-slate-600">{r.branch}</td>
                            <td className="py-2 pr-3 font-medium text-navy-ink">{r.institution_name}{r.notes && <span className="block max-w-xs truncate text-xs font-normal italic text-slate-400">{r.notes}</span>}</td>
                            <td className="py-2 pr-3 text-slate-500">{r.engagement_type}</td>
                            <td className="py-2 pr-3"><Pill>{r.status}</Pill></td>
                            <td className="py-2 pr-3"><Pill>{r.priority}</Pill></td>
                            <td className="hidden py-2 pr-3 text-right text-navy md:table-cell">{r.pipeline_value ? ghs(r.pipeline_value) : '—'}</td>
                            <td className="py-2 pr-3 text-xs text-slate-500">{r.next_action}{r.next_action_date && <span className="block text-slate-400">{r.next_action_date}</span>}</td>
                            <td className="py-2 text-right whitespace-nowrap">
                              <button onClick={() => setEditing(r)} className="rounded px-2 py-1 text-xs font-semibold text-navy hover:bg-navy/10">Edit</button>
                              {isAdmin && <button onClick={() => remove(r.id)} className="rounded px-2 py-1 text-xs font-semibold text-brick hover:bg-brick/10">Delete</button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

/* ───────────────────────── Login ───────────────────────── */
function LoginCard({ signIn }: { signIn: (e: string, p: string) => Promise<string | null> }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const msg = await signIn(email, pw);
    setBusy(false); if (msg) setErr(msg);
  }
  const field = 'w-full rounded-md border border-mist bg-white px-3 py-2.5 text-sm focus:border-navy focus:outline-none';
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-xl bg-white p-8 shadow-lift">
        <h1 className="font-brand text-2xl font-bold text-navy-ink">Branch Manager Sign-in</h1>
        <p className="mt-1 text-sm text-slate-500">Use your Donewell email and the password set up for you.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@donewellinsurance.com" /></div>
          <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Password</label>
            <input type="password" required value={pw} onChange={(e) => setPw(e.target.value)} className={field} /></div>
          {err && <p className="rounded-md bg-brick/5 px-3 py-2 text-sm text-brick-deep">{err}</p>}
          <button type="submit" disabled={busy} className="w-full rounded-md bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">Need access? Contact your administrator.</p>
    </div>
  );
}

function NotConnected() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="rounded-xl bg-white p-8 shadow-card">
        <h1 className="font-brand text-2xl font-bold text-navy-ink">Tracker not connected yet</h1>
        <p className="mt-3 text-sm text-slate-600">
          The login and shared engagement log need a one-time backend connection (free Supabase project).
          Follow <span className="font-semibold">SETUP_GUIDE.md</span> in the project — paste your two keys into
          <code className="mx-1 rounded bg-mist px-1">src/lib/config.ts</code> and redeploy.
        </p>
        <p className="mt-3 text-sm text-slate-500">The public dashboard works without this step.</p>
        <a href="/" className="mt-5 inline-block rounded-md bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep">Go to dashboard</a>
      </div>
    </div>
  );
}

function Spinner() { return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" /></div>; }

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <BrandBar active="tracker" />
      {children}
      <footer className="border-t border-mist bg-white py-6 text-center text-xs text-slate-400">Donewell Insurance Ltd · Internal use only</footer>
    </div>
  );
}
