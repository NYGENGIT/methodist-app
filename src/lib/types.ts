export interface SegmentRow { label: string; premium: number; count: number; customers: number; }
export interface MonthRow {
  month: string; newBusiness: number; renewal: number; other: number;
  total: number; policies: number; customers: number;
}
export interface CustomerRow {
  customer: string; premium: number; policies: number; sumInsured: number;
  newBusiness: number; renewal: number; branch: string;
}
export interface MethodistData {
  generatedAt: string;
  period: { from: string; to: string };
  kpis: {
    totalPremium: number; newBusinessPremium: number; renewalPremium: number;
    newVsRenewalPct: number; renewalSharePct: number; policies: number;
    customers: number; sumInsured: number; avgPremium: number;
    newPolicies: number; renewalPolicies: number;
  };
  monthly: MonthRow[];
  byBranch: SegmentRow[];
  byBusiness: SegmentRow[];
  byCoverType: SegmentRow[];
  byTransactionType: SegmentRow[];
  topCustomers: CustomerRow[];
  topAgents: { agent: string; premium: number; policies: number }[];
  customerCount: number;
}

// Engagement tracker (stored in Supabase)
export interface Engagement {
  id?: string;
  date: string;
  branch: string;
  manager_name: string;
  institution_name: string;
  institution_type: string;
  region: string;
  engagement_type: string;
  contact_person: string;
  contact_role: string;
  contact_phone: string;
  outcome: string;
  pipeline_value: number;
  won_premium: number;
  next_action: string;
  next_action_date: string;
  status: string;
  priority: string;
  notes: string;
  created_by?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager';
  branches: string[];
}
