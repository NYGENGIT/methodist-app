'use client';
import React, { useState } from 'react';
import { parseProductionWorkbook, aggregateMethodist } from '@/lib/methodist';
import { supabase } from '@/lib/supabase';
import { isSupabaseConfigured } from '@/lib/config';
import { ghs, int } from '@/lib/format';
import type { MethodistData } from '@/lib/types';

export default function AdminUpload() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<MethodistData | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [mode, setMode] = useState<'replace' | 'append'>('replace');

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg(null);
    try {
      let rows: Record<string, any>[] = [];
      for (const file of Array.from(files)) {
        const buf = await file.arrayBuffer();
        rows = rows.concat(parseProductionWorkbook(buf));
      }
      // optionally merge with the dataset currently published (append mode keeps history)
      let combined = rows;
      if (mode === 'append' && isSupabaseConfigured()) {
        try {
          const sb = supabase();
          const { data } = await sb!.from('methodist_raw').select('rows').eq('id', 1).single();
          if (data?.rows) combined = (data.rows as Record<string, any>[]).concat(rows);
        } catch { /* none stored yet */ }
      }
      const agg = aggregateMethodist(combined);
      setPreview(agg); setRawRows(combined);
      setMsg(`Parsed ${int(rows.length)} rows → ${int(agg.kpis.policies)} Methodist transactions, ${ghs(agg.kpis.totalPremium)} premium. Review below, then publish.`);
    } catch (e: any) {
      setMsg('Could not read that file. Make sure it is a production report export (.xlsx).');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!preview) return;
    setBusy(true); setMsg(null);
    try {
      if (isSupabaseConfigured()) {
        const sb = supabase();
        const { error } = await sb!.from('methodist_dataset').upsert({ id: 1, data: preview, updated_at: new Date().toISOString() });
        if (error) throw error;
        await sb!.from('methodist_raw').upsert({ id: 1, rows: rawRows, updated_at: new Date().toISOString() });
        setMsg('Published. The dashboard now shows the updated figures for everyone.');
      } else {
        setMsg('Backend not connected — use “Download data file” and commit it to public/data/methodist.json.');
      }
    } catch (e: any) {
      setMsg('Publish failed: ' + (e.message || 'unknown error'));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!preview) return;
    const blob = new Blob([JSON.stringify(preview, null, 1)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'methodist.json'; a.click();
    URL.revokeObjectURL(url);
  }

  const field = 'rounded-md border border-mist bg-white px-3 py-2 text-sm';
  return (
    <div className="rounded-lg border border-gold/40 bg-gold/5 p-5">
      <h3 className="font-brand text-lg font-bold text-navy-ink">Monthly data upload <span className="ml-2 rounded bg-gold/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-gold-deep">Admin</span></h3>
      <p className="mt-1 text-sm text-slate-600">
        Upload this month’s production report (the raw export from the core system). It’s filtered to Methodist business
        in your browser and published to the dashboard.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as any)} className={field}>
          <option value="replace">Replace — this file is the full picture</option>
          <option value="append">Append — add to previously uploaded months</option>
        </select>
      </div>

      <div className="mt-3">
        <input type="file" accept=".xlsx,.xls" multiple onChange={(e) => handleFiles(e.target.files)} disabled={busy}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-deep" />
      </div>

      {msg && <p className="mt-3 rounded-md bg-white px-3 py-2 text-sm text-navy-ink shadow-card">{msg}</p>}

      {preview && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini label="Total premium" value={ghs(preview.kpis.totalPremium)} />
            <Mini label="New business" value={ghs(preview.kpis.newBusinessPremium)} />
            <Mini label="Renewals" value={ghs(preview.kpis.renewalPremium)} />
            <Mini label="Customers" value={int(preview.kpis.customers)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={publish} disabled={busy} className="rounded-md bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-60">
              {isSupabaseConfigured() ? 'Publish to dashboard' : 'Publish (backend not connected)'}
            </button>
            <button onClick={download} className="rounded-md border border-navy/30 px-5 py-2 text-sm font-semibold text-navy hover:bg-paper">Download data file</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-3 shadow-card">
      <p className="font-brand text-lg font-bold text-navy">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
