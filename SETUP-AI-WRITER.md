# Switching on the AI Blog Writer — Setup Guide

This is a one-time setup, done by Angel (not Cesar). It takes about 10 minutes.
After this, Cesar's Blog editor gets a working "Let AI write it for you" button.

**How it works:** the browser never sees the AI key. The button calls a small
Supabase Edge Function (`generate-post`) that lives next to the database. The
function checks the caller is a signed-in admin, sends the job facts to
Anthropic (Claude), and returns a complete bilingual post — title, summary,
story, SEO fields, English and Spanish. It always lands as a **draft**.
Nothing publishes until a human presses Publish.

**Cost:** roughly $0.02–0.04 per generated post on the Anthropic API
(pay-as-you-go). Every run is logged to the `ai_runs` table so you can see usage.

---

## Step 1 — Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in (or create an account).
2. Add a small amount of credit under **Billing** ($5 lasts a long time at ~3 posts/week).
3. Go to **API Keys** → **Create Key**. Name it `sgq-blog-writer`. Copy the key (starts with `sk-ant-`).

## Step 2 — Run migration 03 in Supabase

1. Open the SGQ project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** → **New query**.
3. Paste the entire contents of `supabase/migrations/03_ai.sql` and press **Run**.
   This creates the `ai_runs` usage log with admin-only access.

## Step 3 — Deploy the Edge Function

### Option A — Supabase CLI (recommended, 2 commands)

From the project folder on your machine:

    npx supabase login
    npx supabase link --project-ref llpcthsgihfdkqtuurge
    npx supabase functions deploy generate-post
    npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-YOUR-KEY-HERE

### Option B — Dashboard (no CLI)

1. In the Supabase dashboard, go to **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Name it exactly: `generate-post`
3. Paste the entire contents of `supabase/functions/generate-post/index.ts` and deploy.
4. Go to **Edge Functions** → **Secrets** (or Project Settings → Edge Functions) and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your `sk-ant-...` key

## Step 4 — Test it

1. Deploy the site as usual (push to GitHub, Netlify builds).
2. Sign in to `/admin`, go to **Blog** → **Write a post**.
3. The gold "Let AI write it for you" panel appears. Fill in:
   - Where was the job? → `DeBary`
   - What did you install? → `Calacatta Gold quartz kitchen countertops`
4. Press **Write it for me**. In ~20–30 seconds the whole post fills in —
   check the Write, Preview and SEO tabs, then Save draft or Publish.

---

## What Cesar sees (the guard rails)

- Opening "Write a post" shows the AI panel **first** — he answers 2 questions
  (town + what was installed), optionally adds details, and taps one gold button.
- The AI fills in everything: bilingual title, summary, full story, SEO
  description, web address, town/county, and materials.
- The post is a **draft** — he reads it, changes anything, and presses Publish.
  The AI can never publish on its own.
- If he'd rather write himself, "I'll write it myself" closes the panel.
- If the function isn't deployed yet, the button shows a friendly
  "the writer isn't switched on yet — ask Angel" message instead of breaking.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "The AI writer is not switched on yet" | The `ANTHROPIC_API_KEY` secret is missing — do Step 3's secret step. |
| "Not authorized" | The signed-in user isn't in `admin_users`. |
| "The writer is unavailable right now" | Anthropic API error — check billing/credit on console.anthropic.com. |
| Button does nothing / network error | Function not deployed, or named something other than `generate-post`. |
| Want to see usage | Table Editor → `ai_runs` — one row per generation with token counts. |
