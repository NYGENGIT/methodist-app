'use client';
import React from 'react';
import Link from 'next/link';
import { asset } from '@/lib/asset';

export function BrandBar({ active }: { active: 'dashboard' | 'tracker' }) {
  return (
    <header className="sticky top-0 z-30 border-b border-navy-line/30 bg-navy-deep text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href={asset('/') === '' ? '/' : '/'} className="flex items-center gap-3">
          <img src={asset('/assets/logo-mark.jpg')} alt="Donewell" className="h-9 w-auto rounded bg-white p-0.5" />
          <div className="leading-tight">
            <p className="font-brand text-lg font-bold tracking-wide">Methodist Business Hub</p>
            <p className="text-[11px] uppercase tracking-eyebrow text-gold">Donewell Insurance Ltd</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className={`rounded-md px-3 py-2 font-medium transition ${active === 'dashboard' ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Dashboard</Link>
          <Link href="/tracker" className={`rounded-md px-3 py-2 font-medium transition ${active === 'tracker' ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Engagement Tracker</Link>
        </nav>
      </div>
    </header>
  );
}

export function StatTile({ value, label, sub, accent = 'navy' }: {
  value: string; label: string; sub?: string;
  accent?: 'navy' | 'gold' | 'teal' | 'brick' | 'steel';
}) {
  const bar: Record<string, string> = { navy: 'bg-navy', gold: 'bg-gold', teal: 'bg-teal', brick: 'bg-brick', steel: 'bg-steel' };
  const val: Record<string, string> = { navy: 'text-navy', gold: 'text-gold-deep', teal: 'text-teal-deep', brick: 'text-brick-deep', steel: 'text-steel-deep' };
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-card">
      <div className={`h-1.5 w-full ${bar[accent]}`} />
      <div className="p-4 sm:p-5">
        <p className={`font-brand text-2xl font-bold sm:text-3xl ${val[accent]}`}>{value}</p>
        <p className="mt-1.5 text-sm font-semibold leading-snug text-navy-ink">{label}</p>
        {sub && <p className="mt-1 text-xs italic text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

export function Card({ children, className = '', title, action }: {
  children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg bg-white shadow-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-mist px-5 py-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return (
    <header className="mb-5">
      <div className="rule-gold mb-3" />
      <p className="eyebrow mb-1">{eyebrow}</p>
      <h2 className="font-brand text-2xl font-bold text-navy-ink sm:text-3xl">{title}</h2>
      {lede && <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-slate-600">{lede}</p>}
    </header>
  );
}

export function Pill({ children, tone = 'navy' }: { children: React.ReactNode; tone?: string }) {
  const map: Record<string, string> = {
    Won: 'bg-teal/15 text-teal-deep', 'In Progress': 'bg-gold/20 text-gold-deep',
    Open: 'bg-steel/15 text-steel-deep', Lost: 'bg-brick/15 text-brick-deep',
    'On Hold': 'bg-slate-200 text-slate-600', Closed: 'bg-slate-200 text-slate-600',
    High: 'bg-brick/15 text-brick-deep', Medium: 'bg-gold/20 text-gold-deep', Low: 'bg-slate-200 text-slate-600',
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[String(children)] || 'bg-navy/10 text-navy'}`}>{children}</span>;
}
