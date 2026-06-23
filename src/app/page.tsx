'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line,
} from 'recharts';
import { asset } from '@/lib/asset';
import { ghs, ghsK, int, pct, monthLabel, COLORS, SERIES } from '@/lib/format';
import type { MethodistData } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/config';
import { BrandBar, StatTile, Card, SectionHead } from '@/components/ui';

export default function DashboardPage() {
  const [data, setData] = useState<MethodistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'live' | 'bundled'>('bundled');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. prefer the latest dataset stored in Supabase (updated by admin uploads)
      if (isSupabaseConfigured()) {
        try {
          const sb = supabase();
          const { data: row } = await sb!.from('methodist_dataset').select('data').eq('id', 1).single();
          if (row?.data && !cancelled) { setData(row.data as MethodistData); setSource('live'); return; }
        } catch { /* fall through to bundled */ }
      }
      // 2. fall back to the bundled snapshot (always present)
      try {
        const res = await fetch(asset('/data/methodist.json'));
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json();
        if (!cancelled) { setData(j); setSource('bundled'); }
      } catch (e) {
        if (!cancelled) setError('Could not load Methodist data.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (error) return <Shell><p className="p-10 text-center text-brick-deep">{error}</p></Shell>;
  if (!data) return <Shell><div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" /></div></Shell>;

  const k = data.kpis;
  const split = [
    { name: 'New business', value: k.newBusinessPremium, color: COLORS.gold },
    { name: 'Renewals', value: k.renewalPremium, color: COLORS.navy },
    { name: 'Other', value: Math.max(k.totalPremium - k.newBusinessPremium - k.renewalPremium, 0), color: COLORS.steel },
  ].filter((s) => s.value > 0);

  const monthly = data.monthly.map((m) => ({ ...m, label: monthLabel(m.month) }));

  return (
    <Shell>
      {/* Hero */}
      <div className="border-b border-mist bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="eyebrow mb-2">Methodist portfolio · production analytics</p>
          <h1 className="font-brand text-3xl font-bold text-navy-ink sm:text-4xl">Methodist Business Dashboard</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-slate-600">
            All Donewell business written through the Methodist Unit or for Methodist-affiliated customers.
            Covering {data.period.from} to {data.period.to}.
          </p>
          <p className="mt-1 text-xs italic text-slate-400">
            {source === 'live' ? 'Live data' : 'Snapshot'} · generated {data.generatedAt} · {int(k.policies)} transactions
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile accent="navy" value={ghsK(k.totalPremium)} label="Total premium" sub={`${int(k.policies)} transactions`} />
          <StatTile accent="gold" value={ghsK(k.newBusinessPremium)} label="New business" sub={`${int(k.newPolicies)} policies · ${pct(k.newVsRenewalPct)}`} />
          <StatTile accent="teal" value={ghsK(k.renewalPremium)} label="Renewals" sub={`${int(k.renewalPolicies)} policies · ${pct(k.renewalSharePct)}`} />
          <StatTile accent="steel" value={int(k.customers)} label="Methodist customers" sub="distinct insured" />
          <StatTile accent="brick" value={ghsK(k.sumInsured)} label="Sum insured" sub="total exposure" />
          <StatTile accent="navy" value={ghs(k.avgPremium)} label="Avg premium / policy" />
        </div>

        {/* New vs renewal + monthly trend */}
        <section className="grid gap-6 lg:grid-cols-3">
          <Card title="New business vs renewals">
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={split} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={52} outerRadius={84} paddingAngle={2}>
                    {split.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => ghs(v)} />
                  <Legend verticalAlign="bottom" height={28} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-center text-sm text-slate-500">
              Renewals are <span className="font-semibold text-navy">{pct(k.renewalSharePct)}</span> of premium — a {k.renewalSharePct > 60 ? 'renewal-led' : 'balanced'} book.
            </p>
          </Card>

          <Card title="Monthly premium — new business vs renewals" className="lg:col-span-2">
            <div className="h-64">
              <ResponsiveContainer>
                <ComposedChart data={monthly} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tickFormatter={(v) => ghsK(v).replace('GHS ', '')} tickLine={false} axisLine={false} width={48} />
                  <Tooltip formatter={(v: number, n) => [ghs(v), n]} />
                  <Legend />
                  <Bar dataKey="newBusiness" name="New business" stackId="a" fill={COLORS.gold} />
                  <Bar dataKey="renewal" name="Renewals" stackId="a" fill={COLORS.navy} />
                  <Bar dataKey="other" name="Other" stackId="a" fill={COLORS.steel} />
                  <Line dataKey="total" name="Total" stroke={COLORS.brick} strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>

        {/* Branch + business + cover */}
        <section>
          <SectionHead eyebrow="Where the premium sits" title="Branch, business line & cover" />
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Premium by branch (top 10)">
              <BarList rows={data.byBranch.slice(0, 10)} color={COLORS.navy} />
            </Card>
            <Card title="By business line">
              <BarList rows={data.byBusiness} color={COLORS.teal} />
            </Card>
            <Card title="By cover type">
              <BarList rows={data.byCoverType.slice(0, 8)} color={COLORS.gold} />
            </Card>
          </div>
        </section>

        {/* Top customers */}
        <section>
          <SectionHead eyebrow="Relationships" title="Top Methodist customers" lede="The largest Methodist-affiliated accounts by premium, with their new-business and renewal split." />
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mist text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Customer</th>
                    <th className="py-2 pr-3">Branch</th>
                    <th className="py-2 pr-3 text-right">Premium</th>
                    <th className="hidden py-2 pr-3 text-right sm:table-cell">New</th>
                    <th className="hidden py-2 pr-3 text-right sm:table-cell">Renewal</th>
                    <th className="py-2 pr-3 text-right">Policies</th>
                    <th className="hidden py-2 text-right md:table-cell">Sum insured</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.slice(0, 15).map((c, i) => (
                    <tr key={i} className="border-b border-mist/60 last:border-0 hover:bg-paper">
                      <td className="py-2 pr-3 font-medium text-navy-ink">{c.customer}</td>
                      <td className="py-2 pr-3 text-slate-500">{c.branch}</td>
                      <td className="py-2 pr-3 text-right font-semibold text-navy">{ghs(c.premium)}</td>
                      <td className="hidden py-2 pr-3 text-right text-gold-deep sm:table-cell">{c.newBusiness ? ghs(c.newBusiness) : '—'}</td>
                      <td className="hidden py-2 pr-3 text-right text-navy sm:table-cell">{c.renewal ? ghs(c.renewal) : '—'}</td>
                      <td className="py-2 pr-3 text-right text-slate-600">{c.policies}</td>
                      <td className="hidden py-2 text-right text-slate-500 md:table-cell">{ghsK(c.sumInsured)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <p className="pt-2 text-center text-xs italic text-slate-400">
          Source: Donewell production report · Methodist business = Methodist Unit workgroup or “Methodist” in the customer name.
        </p>
      </main>
    </Shell>
  );
}

function BarList({ rows, color }: { rows: { label: string; premium: number; count: number }[]; color: string }) {
  const max = Math.max(...rows.map((r) => r.premium), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="truncate pr-2 text-navy-ink">{r.label}</span>
            <span className="shrink-0 font-semibold text-navy">{ghsK(r.premium)}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded bg-mist">
            <div className="h-full rounded" style={{ width: `${(r.premium / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper">
      <BrandBar active="dashboard" />
      {children}
      <footer className="border-t border-mist bg-white py-6 text-center text-xs text-slate-400">
        Donewell Insurance Ltd · “If it must be done, it must be Donewell”
      </footer>
    </div>
  );
}
