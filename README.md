# Donewell · Methodist Business Hub

An internal web app for Donewell Insurance Ltd combining:

1. **A public Methodist business dashboard** — all production written through the Methodist
   Unit or for Methodist-affiliated customers, with new-business vs. renewal analysis, branch,
   business-line, cover-type and customer breakdowns. Updated by uploading the monthly
   production report (parsed in the browser — no code changes).
2. **A branch engagement tracker** — branch managers log in to record and update their
   Methodist outreach (visits, quotes, pipeline, outcomes). Shared across the team, with
   **admin-only delete**.

Built with Next.js (static export), TypeScript, Tailwind and Recharts; hosted on **GitHub Pages**;
the tracker's login and shared data run on a free **Supabase** backend.

> **First time? Read `SETUP_GUIDE.md`.** It walks through deploying and connecting Supabase.

---

## Architecture at a glance

| Part | Tech | Needs a backend? |
|------|------|------------------|
| Dashboard (`/`) | static, reads `public/data/methodist.json` (or live data from Supabase) | No — works on deploy |
| Tracker (`/tracker`) | Supabase Auth + Postgres + row-level security | Yes — one-time setup |
| Monthly upload | SheetJS parses the Excel in-browser, publishes to Supabase | Uses the same backend |

The branding uses the Donewell navy palette and **Book Antiqua** for headings (the company font),
with the logo in `public/assets/`.

---

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export into ./out
npm run serve    # preview the built ./out
```

## Regenerating the dashboard data from a report (optional, command line)

The in-app **Data upload** is the normal way to refresh figures. To do it from the command
line instead (e.g. to seed `public/data/methodist.json`):

```bash
pip install pandas openpyxl
python scripts/build_methodist_data.py --inputs report_jan.xlsx report_feb.xlsx ...
```

Methodist business is defined as **Workgroup contains "Methodist" OR Customer Name contains
"Methodist"** — identical logic in the script and in the app, so they always agree.

---

## Project structure

```
methodist-app/
├── .github/workflows/deploy.yml   # GitHub Pages CI/CD
├── public/
│   ├── assets/                    # Donewell logos
│   └── data/methodist.json        # bundled dashboard snapshot
├── src/
│   ├── app/
│   │   ├── page.tsx               # public dashboard
│   │   └── tracker/page.tsx       # login + engagement tracker
│   ├── components/                # UI kit, dashboard charts, tracker form/upload
│   └── lib/                       # config, supabase client, aggregation, types, seed
├── supabase/
│   ├── schema.sql                 # tables + security rules (run once)
│   └── seed_managers.sql          # manager logins, roles, branches
├── scripts/build_methodist_data.py
├── SETUP_GUIDE.md                 # ← start here
└── README.md
```

---

## Security & privacy notes

- The Methodist dashboard is **public** (anyone with the link can view it), by request. If that
  changes, gate it behind the same login as the tracker.
- The Supabase **anon key** in `src/lib/config.ts` is safe for a public site; access is governed
  by the row-level-security rules in `schema.sql`. Never put the *service_role* key in this app.
- The app is marked `noindex`, so it won't appear in search engines — but a public GitHub Pages
  URL is still reachable by anyone who has it.
