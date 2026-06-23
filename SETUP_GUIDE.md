# Setup Guide — Donewell Methodist Hub

This app has two parts:

- **Public dashboard** (`/`) — Methodist business analytics. Works immediately, no setup.
- **Engagement tracker** (`/tracker`) — branch-manager logins, shared data, admin-only delete. Needs a free **Supabase** backend (a ~10-minute one-time setup).

You can deploy the dashboard first and add the tracker backend whenever you're ready.

---

## Part A — Put it online (GitHub Pages)

1. Create a new GitHub repository and upload everything in this folder
   (**Add file → Upload files**, drag the contents in, commit to `main`).
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Wait for the **Actions** tab to show a green run. Your site URL appears under **Settings → Pages**.

The dashboard is now live. The tracker page will say "not connected yet" until Part B.

---

## Part B — Turn on the login + shared tracker (Supabase, free)

### B1. Create the project
1. Go to **https://supabase.com** → sign up (free) → **New project**.
2. Give it a name (e.g. `donewell-methodist`), set a database password, pick a region near Ghana (e.g. EU/London), and create it. Wait ~2 minutes.

### B2. Create the tables and security rules
1. In Supabase, open **SQL Editor → New query**.
2. Open `supabase/schema.sql` from this project, copy **all** of it, paste, and click **Run**.
   This creates the tables and the rules: managers can add and edit; **only admins can delete**; the dashboard data is publicly readable.

### B3. Create the manager logins
1. Go to **Authentication → Users → Add user**. For each branch manager, enter their
   Donewell email and a temporary password, and tick **Auto Confirm User**.
   (The roster is in `supabase/seed_managers.sql`.)
2. Back in **SQL Editor**, open `supabase/seed_managers.sql`, paste, and **Run**.
   This fills in each manager's name and assigned branch(es), and sets the **admin**.
   The default admin is the first email in that file — change it to whoever should be admin
   (admins can delete records and upload the monthly data).

### B4. Connect the app to Supabase
1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. In this project, open `src/lib/config.ts` and paste them in:
   ```ts
   export const SUPABASE_URL = 'https://YOURPROJECT.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...your anon key...';
   ```
3. Commit the change (upload the edited file to GitHub). The Action redeploys automatically.

Managers can now sign in at `/tracker` with their email and password. Tell them to change
their password on first login (Supabase sends a reset, or set a permanent one in B3).

> The **anon key is safe to ship** in a public site — it only allows what your security
> rules (Part B2) permit. Never paste the *service_role* key anywhere in this app.

---

## Part C — The monthly data update

Each month, after you export the production report from the core system:

1. Sign in to `/tracker` as an **admin**.
2. Open the **Data upload** tab → choose the report file(s) → it filters to Methodist
   business in your browser and shows a preview.
3. Click **Publish to dashboard**. Everyone now sees the updated figures.

Choose **Replace** if the file already contains the full picture, or **Append** to add a new
month on top of what's already published.

(If you ever skip the Supabase backend, the upload screen still gives you a **Download data file**
button — commit that file to `public/data/methodist.json` and the dashboard updates the static way.)

---

## Updating branch/manager pairings later

When you send the branch & sub-branch pairings file, the lists live in two places:
`src/lib/seed.json` (drop-downs in the app) and `supabase/seed_managers.sql` (who can log in
and which branches they own). I can regenerate both from your file.
