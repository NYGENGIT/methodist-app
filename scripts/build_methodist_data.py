#!/usr/bin/env python3
"""
build_methodist_data.py — filter a Donewell production report to Methodist
business and emit the dashboard dataset (public/data/methodist.json).

Methodist business = Workgroup contains 'Methodist'  OR  Customer Name
contains 'Methodist'. The same rule is implemented client-side in the app's
monthly-upload feature, so this script and the app stay in sync.

    python scripts/build_methodist_data.py --inputs report1.xlsx report2.xlsx ...
"""
import argparse, json, re, warnings
from pathlib import Path
import pandas as pd, numpy as np
warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "methodist.json"

NEW_BUSINESS = "New Business"
RENEWAL = "Renewal Premium"

# child branch -> parent branch rollup (reports show only the parent)
try:
    BRANCH_MAP = json.load(open(ROOT / "src" / "lib" / "branch_map.json"))
except Exception:
    BRANCH_MAP = {}

def parent_branch(name: str) -> str:
    n = str(name).strip()
    return BRANCH_MAP.get(n, n)

def find_header(raw):
    for i in range(min(30, len(raw))):
        row = [str(v).strip() for v in raw.iloc[i].tolist()]
        if "Policy Number" in row and "Customer Name" in row:
            return i
    return 6

def load(paths):
    frames = []
    for p in paths:
        raw = pd.read_excel(p, sheet_name=0, header=None, dtype=str)
        h = find_header(raw)
        df = pd.read_excel(p, sheet_name=0, header=h, dtype=str)
        df.columns = [str(c).strip() for c in df.columns]
        df = df[df["Policy Number"].notna() & df["Customer Name"].notna()]
        frames.append(df)
        print(f"  {Path(p).name}: {len(df):,} rows")
    return pd.concat(frames, ignore_index=True)

def methodist_filter(df):
    wg = df["Workgroup"].astype(str)
    cn = df["Customer Name"].astype(str)
    mask = wg.str.contains("Methodist", case=False, na=False) | cn.str.contains("Methodist", case=False, na=False)
    return df[mask].copy()

def r2(x): return round(float(x), 2)

def build(df):
    df = methodist_filter(df)
    for c in ["Amount Paid", "Converted amt", "Sum Insured"]:
        df[c] = pd.to_numeric(df[c].astype(str).str.replace(",", "", regex=False), errors="coerce").fillna(0)
    df["amount"] = df["Converted amt"].where(df["Converted amt"] > 0, df["Amount Paid"])
    df["Receipt Date"] = pd.to_datetime(df["Receipt Date"], errors="coerce")
    df["month"] = df["Receipt Date"].dt.strftime("%Y-%m")
    df["custKey"] = df["Customer Name"].astype(str).str.strip().str.upper()
    df["txn"] = df["Transaction Type"].astype(str).str.strip()
    # roll child branches up to their parent for all reporting
    df["Branch"] = df["Branch"].map(parent_branch)
    # dedup exact duplicate receipt lines
    if "Receipt #" in df.columns:
        df = df.drop_duplicates(subset=["Receipt #", "Policy Number", "Item ID", "amount"])

    total_prem = df["amount"].sum()
    new_prem = df[df["txn"] == NEW_BUSINESS]["amount"].sum()
    ren_prem = df[df["txn"] == RENEWAL]["amount"].sum()

    def by(col, value="amount", n=None, count=True):
        g = df.groupby(df[col].astype(str).str.strip())
        rows = []
        for k, sub in g:
            rows.append({"label": k, "premium": r2(sub[value].sum()),
                         "count": int(len(sub)), "customers": int(sub["custKey"].nunique())})
        rows.sort(key=lambda x: -x["premium"])
        return rows[:n] if n else rows

    # monthly trend split by transaction type
    months = sorted([m for m in df["month"].dropna().unique()])
    monthly = []
    for m in months:
        s = df[df["month"] == m]
        monthly.append({
            "month": m,
            "newBusiness": r2(s[s["txn"] == NEW_BUSINESS]["amount"].sum()),
            "renewal": r2(s[s["txn"] == RENEWAL]["amount"].sum()),
            "other": r2(s[~s["txn"].isin([NEW_BUSINESS, RENEWAL])]["amount"].sum()),
            "total": r2(s["amount"].sum()),
            "policies": int(len(s)),
            "customers": int(s["custKey"].nunique()),
        })

    # top customers
    cust = []
    for k, sub in df.groupby("custKey"):
        cust.append({"customer": k.title(), "premium": r2(sub["amount"].sum()),
                     "policies": int(len(sub)), "sumInsured": r2(sub["Sum Insured"].sum()),
                     "newBusiness": r2(sub[sub["txn"] == NEW_BUSINESS]["amount"].sum()),
                     "renewal": r2(sub[sub["txn"] == RENEWAL]["amount"].sum()),
                     "branch": sub["Branch"].mode().iloc[0] if len(sub["Branch"].mode()) else ""})
    cust.sort(key=lambda x: -x["premium"])

    # agents
    agents = []
    for k, sub in df.groupby(df["Agent Name"].astype(str).str.strip()):
        if not k or k == "nan": k = "Direct / Unassigned"
        agents.append({"agent": k, "premium": r2(sub["amount"].sum()), "policies": int(len(sub))})
    agents.sort(key=lambda x: -x["premium"])

    data = {
        "generatedAt": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "period": {"from": df["Receipt Date"].min().strftime("%Y-%m-%d") if df["Receipt Date"].notna().any() else "",
                   "to": df["Receipt Date"].max().strftime("%Y-%m-%d") if df["Receipt Date"].notna().any() else ""},
        "kpis": {
            "totalPremium": r2(total_prem),
            "newBusinessPremium": r2(new_prem),
            "renewalPremium": r2(ren_prem),
            "newVsRenewalPct": r2(100 * new_prem / total_prem) if total_prem else 0,
            "renewalSharePct": r2(100 * ren_prem / total_prem) if total_prem else 0,
            "policies": int(len(df)),
            "customers": int(df["custKey"].nunique()),
            "sumInsured": r2(df["Sum Insured"].sum()),
            "avgPremium": r2(df["amount"].mean()) if len(df) else 0,
            "newPolicies": int((df["txn"] == NEW_BUSINESS).sum()),
            "renewalPolicies": int((df["txn"] == RENEWAL).sum()),
        },
        "monthly": monthly,
        "byBranch": by("Branch"),
        "byBusiness": by("Business"),
        "byCoverType": by("Cover Type"),
        "byTransactionType": by("Transaction Type"),
        "topCustomers": cust[:25],
        "topAgents": agents[:15],
        "customerCount": len(cust),
    }
    return data

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--inputs", nargs="+", required=True)
    a = ap.parse_args()
    print("Loading production report(s)...")
    df = load(a.inputs)
    print(f"Total rows: {len(df):,}")
    data = build(df)
    k = data["kpis"]
    print(f"\nMethodist business: {k['policies']} policies, {k['customers']} customers")
    print(f"  Premium GHS {k['totalPremium']:,.0f}  (new {k['newBusinessPremium']:,.0f} / renewal {k['renewalPremium']:,.0f})")
    print(f"  Sum insured GHS {k['sumInsured']:,.0f}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    json.dump(data, open(OUT, "w"), indent=1, ensure_ascii=False)
    print(f"\nWrote {OUT}")

if __name__ == "__main__":
    main()
