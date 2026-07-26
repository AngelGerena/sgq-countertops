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

Migrations 01 (foundation) and 02 (sales and jobs) are applied in the Supabase SQL Editor.
Admin access is granted by inserting into `admin_users` after a user accepts their invite.

## Conventions

- Bilingual content is paired columns on one row (`value_en`, `value_es`), never one row per language.
- Site content is override-with-fallback: a null value renders the hardcoded default, so clearing
  a field in the admin restores the original wording instead of blanking the page.
- RLS is enforced through the `is_admin()` and `is_super_admin()` helpers.
- Every migration ends with `notify pgrst, 'reload schema';`.
