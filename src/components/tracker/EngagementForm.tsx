'use client';
import React, { useState } from 'react';
import seed from '@/lib/seed.json';
import type { Engagement } from '@/lib/types';

const EMPTY: Engagement = {
  date: new Date().toISOString().slice(0, 10), branch: '', manager_name: '',
  institution_name: '', institution_type: '', region: '', engagement_type: '',
  contact_person: '', contact_role: '', contact_phone: '', outcome: '',
  pipeline_value: 0, won_premium: 0, next_action: '', next_action_date: '',
  status: 'Open', priority: 'Medium', notes: '',
};

const inst = (seed as any).institutions as { name: string; type: string; region: string; branch: string }[];

export default function EngagementForm({
  initial, lockBranch, managerName, onSave, onCancel, saving,
}: {
  initial?: Engagement; lockBranch?: string; managerName?: string;
  onSave: (e: Engagement) => void; onCancel: () => void; saving: boolean;
}) {
  const [f, setF] = useState<Engagement>(initial ? { ...initial } : {
    ...EMPTY, branch: lockBranch || '', manager_name: managerName || '',
  });
  const set = (k: keyof Engagement, v: any) => setF((p) => ({ ...p, [k]: v }));

  const L = (seed as any);
  const field = 'w-full rounded-md border border-mist bg-white px-3 py-2 text-sm focus:border-navy focus:outline-none';
  const lab = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';

  function pickInstitution(name: string) {
    set('institution_name', name);
    const m = inst.find((i) => i.name === name);
    if (m) { set('institution_type', m.type); set('region', m.region); }
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(f); }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div><label className={lab}>Date</label><input type="date" required value={f.date} onChange={(e) => set('date', e.target.value)} className={field} /></div>
        <div>
          <label className={lab}>Branch</label>
          <select required value={f.branch} onChange={(e) => set('branch', e.target.value)} className={field} disabled={!!lockBranch}>
            <option value="">Select…</option>
            {L.branches.map((b: string) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div><label className={lab}>Manager</label><input value={f.manager_name} onChange={(e) => set('manager_name', e.target.value)} className={field} placeholder="Your name" /></div>

        <div>
          <label className={lab}>Institution</label>
          <input list="inst-list" value={f.institution_name} onChange={(e) => pickInstitution(e.target.value)} className={field} placeholder="Methodist institution" required />
          <datalist id="inst-list">{inst.map((i) => <option key={i.name} value={i.name} />)}</datalist>
        </div>
        <div>
          <label className={lab}>Institution type</label>
          <select value={f.institution_type} onChange={(e) => set('institution_type', e.target.value)} className={field}>
            <option value="">Select…</option>{L.institutionTypes.map((t: string) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={lab}>Region / Diocese</label><input value={f.region} onChange={(e) => set('region', e.target.value)} className={field} /></div>

        <div>
          <label className={lab}>Engagement type</label>
          <select required value={f.engagement_type} onChange={(e) => set('engagement_type', e.target.value)} className={field}>
            <option value="">Select…</option>{L.engagementTypes.map((t: string) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={lab}>Outcome</label>
          <select value={f.outcome} onChange={(e) => set('outcome', e.target.value)} className={field}>
            <option value="">Select…</option>{L.outcomes.map((t: string) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={lab}>Status</label>
            <select value={f.status} onChange={(e) => set('status', e.target.value)} className={field}>
              {L.statuses.map((t: string) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className={lab}>Priority</label>
            <select value={f.priority} onChange={(e) => set('priority', e.target.value)} className={field}>
              {L.priorities.map((t: string) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div><label className={lab}>Contact person</label><input value={f.contact_person} onChange={(e) => set('contact_person', e.target.value)} className={field} /></div>
        <div><label className={lab}>Contact role</label><input value={f.contact_role} onChange={(e) => set('contact_role', e.target.value)} className={field} /></div>
        <div><label className={lab}>Contact phone</label><input value={f.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} className={field} /></div>

        <div><label className={lab}>Pipeline value (GHS)</label><input type="number" min="0" value={f.pipeline_value} onChange={(e) => set('pipeline_value', +e.target.value)} className={field} /></div>
        <div><label className={lab}>Won premium (GHS)</label><input type="number" min="0" value={f.won_premium} onChange={(e) => set('won_premium', +e.target.value)} className={field} /></div>
        <div><label className={lab}>Next action date</label><input type="date" value={f.next_action_date} onChange={(e) => set('next_action_date', e.target.value)} className={field} /></div>

        <div className="sm:col-span-2 lg:col-span-3"><label className={lab}>Next action</label><input value={f.next_action} onChange={(e) => set('next_action', e.target.value)} className={field} /></div>
        <div className="sm:col-span-2 lg:col-span-3"><label className={lab}>Notes / comments</label><textarea rows={3} value={f.notes} onChange={(e) => set('notes', e.target.value)} className={field} /></div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-md bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-deep disabled:opacity-60">
          {saving ? 'Saving…' : initial?.id ? 'Save changes' : 'Add engagement'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-mist px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-paper">Cancel</button>
      </div>
    </form>
  );
}
