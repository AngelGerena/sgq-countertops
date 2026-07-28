-- 03_ai.sql — AI writer support
-- Run in the Supabase SQL Editor after 01 and 02.

-- Every AI generation is logged here so cost stays visible.
create table if not exists public.ai_runs (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null,                 -- 'blog_post' for now
  created_by     uuid references auth.users(id) on delete set null,
  input_tokens   int,
  output_tokens  int,
  created_at     timestamptz not null default now()
);

alter table public.ai_runs enable row level security;

drop policy if exists ai_runs_admin on public.ai_runs;
create policy ai_runs_admin on public.ai_runs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

notify pgrst, 'reload schema';
