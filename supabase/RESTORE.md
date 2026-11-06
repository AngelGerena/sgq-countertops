# Rebuilding the SGQ database from scratch

The Supabase project was deleted on **2026-11-05** because the client had not paid.
Everything needed to stand it back up is in this folder. Budget about 20 minutes.

## Read this first

**`supabase/migrations/` cannot rebuild this database.** Migrations 01 (foundation)
and 02 (sales and jobs) were never committed — they only ever existed in the SQL
Editor of the live project. The folder has 03, 04 and 05 only. Running those three
against an empty project produces errors, not a database.

**`RESTORE.sql` in this folder is the source of truth.** It was captured from the
live database on 2026-10-26, re-verified unchanged on 2026-11-05, and tested by
running it against a real Postgres cluster three times in a row. It rebuilds
everything 01 through 05 created, plus the storage bucket, in one pass.

It is safe to run twice. Every statement is guarded, so a timeout mid-paste is
recoverable — just run the whole thing again.

---

## What the restore gives you

| | |
|---|---|
| Tables | 21 |
| RLS policies | 31 (public) + 4 (storage) |
| Functions | 9 |
| Triggers | 12 |
| Indexes | 14 |
| Storage buckets | 1 (`site-images`, empty) |
| Seed rows | 19 materials, 38 site_content keys, 3 travel zones, 3 doc counters, 1 agent, settings |

## What is NOT in the restore, because it cannot be

- **Auth users.** `auth.users` rows cannot be created by SQL. Step 3 below.
- **Edge functions.** They live in `supabase/functions/` and are deployed with the
  CLI. Step 4. (Neither was ever deployed on the old project — the AI blog writer
  and the daily brief have never actually run in production.)
- **Secrets.** `ANTHROPIC_API_KEY` and friends. Step 5.
- **The project ref.** A new project gets a new one. Step 6.

## What was lost, and it does not matter

Nothing. At capture time the database had **zero** leads, quotes, jobs, customers,
invoices, contracts and posts. All three document counters were still at 1, so no
quote or invoice was ever issued. All 38 `site_content` rows had null values, meaning
the SiteEditor was never used and the public site renders entirely from hardcoded
defaults in `src/`. The storage bucket held 0 files. The only real content was the
19-row materials price list, and that is in `RESTORE.sql` verbatim — verified by
checksum against the live table.

---

## Steps

### 1. Create the project

New Supabase project. Note the region — the old one was `ca-central-1`, which is
fine, but `us-east-1` is closer to Central Florida and marginally faster.

### 2. Run the restore

Open the SQL Editor, paste the entire contents of `supabase/RESTORE.sql`, run it.

Watch for this line in the output:

    NOTICE:  Security check passed: anon cannot read supplier, cost, or zone notes.

If you see `SECURITY FIX FAILED` instead, stop and fix it before going further.
See the security note at the bottom of this file for why that matters.

### 3. Create the admin login

Authentication > Users > Add user. Use **finessemediapro@gmail.com**. That was the
only account on the old project — Cesar never had a login.

Copy the new user's UUID, then run this in the SQL Editor:

```sql
insert into public.admin_users (user_id, email, full_name, role, is_super_admin)
values ('PASTE-THE-NEW-UUID-HERE', 'finessemediapro@gmail.com', 'Angel Gerena', 'admin', true);
```

The old UUID was `b72238f1-aed8-4873-8b85-d8b2625dbf4b`. It will not work. You need
the new one.

### 4. Deploy the edge functions

```bash
supabase link --project-ref <new-ref>
supabase functions deploy generate-post
supabase functions deploy daily-brief
```

### 5. Set the secrets

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

Optional: `CRON_SECRET` for scheduled daily-brief runs, `RESEND_API_KEY` for the
morning email.

### 6. Point the app at the new project

Two places, and missing either one breaks the build or the site:

1. **Netlify** > Site settings > Environment variables: update `VITE_SUPABASE_URL`
   and `VITE_SUPABASE_ANON_KEY`.
2. **`.env.example`** in this repo hardcodes the old ref
   `https://llpcthsgihfdkqtuurge.supabase.co`. Update it so the next person does not
   copy a dead URL.

Then redeploy. Netlify does not pick up env var changes without one.

### 7. Check it worked

- Public site loads, footer shows the phone and hours (reads `business_settings`)
- `/admin` login works with the account from step 3
- Portal > What you sell > Stone shows 19 materials with prices
- Assistant page does **not** say "one last piece of setup is waiting"
- Submit the public quote form, then confirm a row landed in Leads and that an
  `agent_events` row was created by the trigger

---

## Security note — do not undo this

The old database leaked the suppliers. The `anon` role — whose key ships inside the
public JavaScript bundle — had SELECT on **every column** of `materials`, including
`supplier` and `cost`. RLS filters rows, not columns. So anyone could hit the public
REST API and get back the supplier names and Cesar's cost basis on every line item.

That defeats the whole point of the house-collection naming, the scrubbed code
comments and the robots.txt rule on `/specs/`.

Section 8 of `RESTORE.sql` fixes it, and it is written the long way round on purpose.
The obvious one-liner:

```sql
revoke select (supplier, cost) on public.materials from anon;   -- DOES NOTHING
```

silently has no effect while the role still holds a table-level SELECT grant, which
Supabase grants by default. The table grant has to be revoked first and the safe
columns granted back individually. This was tested both ways: the short version
leaves both columns readable.

The admin portal is unaffected — it runs as `authenticated`, which keeps full access,
so the Catalog module still shows supplier and cost.

## Still outstanding on the client side

- **Florida licence number** is blank in `business_settings`. It is required in
  advertising and is wired to print in the footer and on contracts.
- **Google review URL** is blank.
- **Granite job photos** — nine of the ten photos on file are quartz.
- **Written permission for supplier catalogue imagery** — roughly 30 catalog images
  and two spec PDFs came from a supplier catalogue. Presenting them under house names
  solves the customer-routing problem, not the copyright one. A dealer media-kit
  request is drafted and unsent.
