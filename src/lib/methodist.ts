import * as XLSX from 'xlsx';
import type { MethodistData } from './types';
import branchMap from './branch_map.json';

const NEW_BUSINESS = 'New Business';
const RENEWAL = 'Renewal Premium';

const BRANCH_MAP = branchMap as Record<string, string>;
const parentBranch = (name: string) => {
  const n = String(name ?? '').trim();
  return BRANCH_MAP[n] || n;
};

function num(v: any): number {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}
function r2(n: number) { return Math.round(n * 100) / 100; }

/** Parse a production report workbook (ArrayBuffer) into raw row objects. */
export function parseProductionWorkbook(buf: ArrayBuffer): Record<string, any>[] {
  const wb = XLSX.read(buf, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const grid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
  // locate header row containing Policy Number + Customer Name
  let h = grid.findIndex((r) => r.map((c) => String(c).trim()).includes('Policy Number') &&
                                r.map((c) => String(c).trim()).includes('Customer Name'));
  if (h < 0) h = 6;
  const headers = grid[h].map((c) => String(c).trim());
  const rows: Record<string, any>[] = [];
  for (let i = h + 1; i < grid.length; i++) {
    const r = grid[i];
    if (!r || r.every((c) => c === '' || c == null)) continue;
    const obj: Record<string, any> = {};
    headers.forEach((key, j) => { if (key) obj[key] = r[j]; });
    if (obj['Policy Number'] && obj['Customer Name']) rows.push(obj);
  }
  return rows;
}

export function isMethodist(row: Record<string, any>): boolean {
  const wg = String(row['Workgroup'] ?? '');
  const cn = String(row['Customer Name'] ?? '');
  return /methodist/i.test(wg) || /methodist/i.test(cn);
}

/** Aggregate raw rows (already concatenated across months) into the dashboard dataset. */
export function aggregateMethodist(rawRows: Record<string, any>[]): MethodistData {
  const rows = rawRows.filter(isMethodist).map((r) => {
    const converted = num(r['Converted amt']);
    const paid = num(r['Amount Paid']);
    const rd = r['Receipt Date'] ? new Date(r['Receipt Date']) : null;
    return {
      amount: converted > 0 ? converted : paid,
      sumInsured: num(r['Sum Insured']),
      month: rd && !isNaN(rd.getTime()) ? `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}` : '',
      date: rd,
      cust: String(r['Customer Name'] ?? '').trim().toUpperCase(),
      txn: String(r['Transaction Type'] ?? '').trim(),
      branch: parentBranch(String(r['Branch'] ?? '').trim()),
      business: String(r['Business'] ?? '').trim(),
      cover: String(r['Cover Type'] ?? '').trim(),
      agent: String(r['Agent Name'] ?? '').trim() || 'Direct / Unassigned',
      receipt: String(r['Receipt #'] ?? ''),
      policy: String(r['Policy Number'] ?? ''),
      item: String(r['Item ID'] ?? ''),
    };
  });

  // de-dup identical receipt lines
  const seen = new Set<string>();
  const data = rows.filter((r) => {
    const k = `${r.receipt}|${r.policy}|${r.item}|${r.amount}`;
    if (seen.has(k)) return false; seen.add(k); return true;
  });

  const sum = (a: typeof data, f: (r: typeof data[0]) => number) => a.reduce((s, r) => s + f(r), 0);
  const total = sum(data, (r) => r.amount);
  const newP = sum(data.filter((r) => r.txn === NEW_BUSINESS), (r) => r.amount);
  const renP = sum(data.filter((r) => r.txn === RENEWAL), (r) => r.amount);

  const segBy = (key: keyof typeof data[0]) => {
    const m = new Map<string, { premium: number; count: number; custs: Set<string> }>();
    data.forEach((r) => {
      const k = String(r[key] || '—');
      if (!m.has(k)) m.set(k, { premium: 0, count: 0, custs: new Set() });
      const e = m.get(k)!; e.premium += r.amount; e.count++; e.custs.add(r.cust);
    });
    return [...m.entries()].map(([label, e]) => ({ label, premium: r2(e.premium), count: e.count, customers: e.custs.size }))
      .sort((a, b) => b.premium - a.premium);
  };

  const months = [...new Set(data.map((r) => r.month).filter(Boolean))].sort();
  const monthly = months.map((mo) => {
    const s = data.filter((r) => r.month === mo);
    return {
      month: mo,
      newBusiness: r2(sum(s.filter((r) => r.txn === NEW_BUSINESS), (r) => r.amount)),
      renewal: r2(sum(s.filter((r) => r.txn === RENEWAL), (r) => r.amount)),
      other: r2(sum(s.filter((r) => r.txn !== NEW_BUSINESS && r.txn !== RENEWAL), (r) => r.amount)),
      total: r2(sum(s, (r) => r.amount)),
      policies: s.length,
      customers: new Set(s.map((r) => r.cust)).size,
    };
  });

  const custMap = new Map<string, typeof data>();
  data.forEach((r) => { if (!custMap.has(r.cust)) custMap.set(r.cust, []); custMap.get(r.cust)!.push(r); });
  const topCustomers = [...custMap.entries()].map(([cust, rs]) => ({
    customer: cust.replace(/\b\w/g, (c) => c.toUpperCase()),
    premium: r2(sum(rs, (r) => r.amount)), policies: rs.length,
    sumInsured: r2(sum(rs, (r) => r.sumInsured)),
    newBusiness: r2(sum(rs.filter((r) => r.txn === NEW_BUSINESS), (r) => r.amount)),
    renewal: r2(sum(rs.filter((r) => r.txn === RENEWAL), (r) => r.amount)),
    branch: rs[0].branch,
  })).sort((a, b) => b.premium - a.premium);

  const agentMap = new Map<string, { premium: number; count: number }>();
  data.forEach((r) => { if (!agentMap.has(r.agent)) agentMap.set(r.agent, { premium: 0, count: 0 }); const e = agentMap.get(r.agent)!; e.premium += r.amount; e.count++; });
  const topAgents = [...agentMap.entries()].map(([agent, e]) => ({ agent, premium: r2(e.premium), policies: e.count })).sort((a, b) => b.premium - a.premium);

  const dates = data.map((r) => r.date).filter((d): d is Date => !!d && !isNaN(d.getTime()));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  return {
    generatedAt: new Date().toISOString().slice(0, 10),
    period: { from: dates.length ? fmt(new Date(Math.min(...dates.map((d) => +d)))) : '', to: dates.length ? fmt(new Date(Math.max(...dates.map((d) => +d)))) : '' },
    kpis: {
      totalPremium: r2(total), newBusinessPremium: r2(newP), renewalPremium: r2(renP),
      newVsRenewalPct: total ? r2((100 * newP) / total) : 0, renewalSharePct: total ? r2((100 * renP) / total) : 0,
      policies: data.length, customers: custMap.size, sumInsured: r2(sum(data, (r) => r.sumInsured)),
      avgPremium: data.length ? r2(total / data.length) : 0,
      newPolicies: data.filter((r) => r.txn === NEW_BUSINESS).length,
      renewalPolicies: data.filter((r) => r.txn === RENEWAL).length,
    },
    monthly, byBranch: segBy('branch'), byBusiness: segBy('business'),
    byCoverType: segBy('cover'), byTransactionType: segBy('txn'),
    topCustomers: topCustomers.slice(0, 25), topAgents: topAgents.slice(0, 15),
    customerCount: custMap.size,
  };
}
