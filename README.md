# Santiago's Granite & Quartz

React + Vite + TypeScript on Supabase. Deployed to Netlify from GitHub.

## Local

    npm install
    cp .env.example .env      # fill in the anon key
    npm run dev

## Netlify

Connect this repo. Build settings come from `netlify.toml` (`npm run build`, publish `dist`).

Before the first deploy, add these under Site settings, Environment variables:

    VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY

`.env` is gitignored, so the build fails without them.

## Database

Migrations 01 (foundation), 02 (sales and jobs), 03 (AI writer log) and 04 (agent layer) are applied in the Supabase SQL Editor.
Admin access is granted by inserting into `admin_users` after a user accepts their invite.

## AI blog writer

The blog editor has a "Let AI write it for you" panel. It calls the Supabase Edge Function
`generate-post` (in `supabase/functions/generate-post/`), which holds the Anthropic key
server-side — the key never reaches the browser. One-time setup:

    supabase functions deploy generate-post
    supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

Also run `supabase/migrations/03_ai.sql` in the SQL Editor (creates the `ai_runs` usage log).
See `SETUP-AI-WRITER.md` for the click-by-click dashboard version. Generated posts always land
as drafts — nothing publishes without a human pressing Publish.

## Your assistant (agent layer)

The "Your assistant" page is the first agent from the Finesse OS agent layer: the Office Manager,
running at Level 0 (watch and report). The Supabase Edge Function `daily-brief`
(in `supabase/functions/daily-brief/`) reads leads, quotes, jobs and posts, records what it noticed
in `agent_events`, narrates every run in plain English in `agent_runs`, and returns a short bilingual
brief with at most three asks. It works with or without the Anthropic key (falls back to a mechanical
brief). One-time setup:

    supabase functions deploy daily-brief

Also run `supabase/migrations/04_agents.sql` in the SQL Editor. Optional scheduled morning email via
`CRON_SECRET` + `RESEND_API_KEY` secrets and a pg_cron job — see `SETUP-ASSISTANT.md` for the
click-by-click version. The agent never contacts customers, never edits records, never touches money;
the `agents.enabled` column is the kill switch.

## Conventions

- Bilingual content is paired columns on one row (`value_en`, `value_es`), never one row per language.
- Site content is override-with-fallback: a null value renders the hardcoded default, so clearing
  a field in the admin restores the original wording instead of blanking the page.
- RLS is enforced through the `is_admin()` and `is_super_admin()` helpers.
- Every migration ends with `notify pgrst, 'reload schema';`.
