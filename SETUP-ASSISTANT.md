# Setting up "Your assistant" (the Office Manager + Daily Brief)

This guide switches on the agent layer for the SGQ portal. It takes about ten minutes and
follows the same pattern as the AI writer setup — if you already completed `SETUP-AI-WRITER.md`,
steps 1 and 2 will feel familiar and the Anthropic key is already in place.

**What Cesar gets:** a new "Your assistant" page in the sidebar. One button — *Get today's brief* —
and the assistant reads the whole business (new requests, quotes going cold, installs coming up,
money still owed, blog drafts waiting) and hands him a short plain-English brief with at most three
asks, in English and Spanish. Every run is logged on the page in plain language. The assistant is
at **Level 0 (watch and report)**: it never contacts customers, never changes records, never touches money.

## Step 1 — Run the database migration (2 minutes)

Open the Supabase dashboard for the SGQ project, go to **SQL Editor**, paste the entire contents of
`supabase/migrations/04_agents.sql`, and press **Run**. This creates three small tables (`agents`,
`agent_events`, `agent_runs`), locks them down so only signed-in admins can read them, and hires the
first staff member: the Office Manager, enabled, at Level 0.

## Step 2 — Deploy the edge function (3 minutes)

Using the Supabase CLI from the project folder:

```bash
supabase functions deploy daily-brief
```

Or without the CLI: in the dashboard go to **Edge Functions → Deploy a new function**, name it
`daily-brief`, and paste the contents of `supabase/functions/daily-brief/index.ts`.

The function reuses the `ANTHROPIC_API_KEY` secret you set for the AI writer. If that key is missing
the assistant still works — it just writes a plainer, mechanical brief instead of a warm one, so
nothing breaks either way.

## Step 3 — (Optional) The automatic morning email

If you want the brief to arrive in Cesar's inbox every morning without him pressing anything:

1. Set two more secrets:

   ```bash
   supabase secrets set CRON_SECRET=<any-long-random-string>
   supabase secrets set RESEND_API_KEY=re_...   # free tier at resend.com is plenty
   ```

2. In the Supabase dashboard, go to **Database → Cron Jobs** (the `pg_cron` integration) and create a
   job that runs daily at 7:00 AM Eastern (11:00 or 12:00 UTC depending on daylight saving) with:

   ```sql
   select net.http_post(
     url     := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/daily-brief',
     headers := jsonb_build_object(
       'Content-Type', 'application/json',
       'x-cron-secret', '<the same CRON_SECRET value>'
     ),
     body := '{}'::jsonb
   );
   ```

   (Enable the `pg_net` extension under **Database → Extensions** if it is not already on.)

The email goes to the business email saved in **Settings** inside the portal. If `RESEND_API_KEY` is
not set, scheduled runs still happen and still show up in the portal — the email is simply skipped.

## What to tell Cesar

"There's a new page called **Your assistant**. Open it in the morning and press the gold button.
It reads everything in the portal and tells you the two or three things worth your time today —
in English or Spanish, your pick. It can't touch anything, it only reports. If it ever says something
confusing, call me."

## Cost

Each brief costs roughly $0.01–0.02 in Anthropic usage. A daily automatic run plus a few manual
refreshes is well under **$1 per month**. Every run is logged in the `ai_runs` table (kind
`daily_brief`) alongside the blog writer, so usage stays visible in one place.

## Guard rails built in

The assistant refuses to run for anyone who is not a signed-in admin (or the cron secret). The
Office Manager row in the `agents` table has a master `enabled` switch — set it to `false` in the
Table Editor and the assistant goes dark instantly, with a friendly message in the portal instead of
an error. Its autonomy column is `0` and nothing in the code lets it act above its level; raising
autonomy in future sprints will always be a deliberate code-plus-config change, never a drift.
