-- 04_agents.sql — The agent layer (Sprint 1: Office Manager + Daily Brief)
-- Run in the Supabase SQL Editor after 01, 02 and 03.
--
-- One chassis, many roles. An agent is a config row: a charter, the events
-- that wake it, a whitelisted toolbox, and an autonomy level (0 = observer).
-- Every decision it makes is narrated in plain English in agent_runs.

-- The staff roster ---------------------------------------------------------
create table if not exists public.agents (
  id         uuid primary key default gen_random_uuid(),
  role       text not null unique,     -- 'office_manager' | 'receptionist' | ...
  display_en text not null,
  display_es text not null,
  charter    jsonb not null default '{}'::jsonb,
  triggers   jsonb not null default '[]'::jsonb,
  toolbox    jsonb not null default '[]'::jsonb,
  autonomy   int  not null default 0 check (autonomy between 0 and 3),
  enabled    boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Things the staff noticed -------------------------------------------------
create table if not exists public.agent_events (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,            -- 'lead_created' | 'lead_waiting' | 'quote_stale' | 'balance_outstanding' | ...
  source_id  uuid,                     -- the record that fired it
  payload    jsonb,
  handled_by uuid references public.agents(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists agent_events_open_idx
  on public.agent_events (kind, created_at) where handled_at is null;

-- What the staff did, and why — in plain English ---------------------------
create table if not exists public.agent_runs (
  id         uuid primary key default gen_random_uuid(),
  agent_id   uuid not null references public.agents(id) on delete cascade,
  event_id   uuid references public.agent_events(id) on delete set null,
  decision   text not null check (decision in ('acted','drafted','escalated','ignored')),
  narrative  text not null,            -- the trust product: owner-readable
  detail     jsonb,                    -- structured extras (the brief JSON lives here)
  tokens_in  int,
  tokens_out int,
  created_at timestamptz not null default now()
);
create index if not exists agent_runs_recent_idx on public.agent_runs (created_at desc);

-- RLS: admin-only, same posture as ai_runs ----------------------------------
alter table public.agents       enable row level security;
alter table public.agent_events enable row level security;
alter table public.agent_runs   enable row level security;

drop policy if exists agents_admin on public.agents;
create policy agents_admin on public.agents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists agent_events_admin on public.agent_events;
create policy agent_events_admin on public.agent_events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists agent_runs_admin on public.agent_runs;
create policy agent_runs_admin on public.agent_runs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Perception: a new request fires an event the moment it lands --------------
create or replace function public.agent_on_lead_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.agent_events (kind, source_id, payload)
  values ('lead_created', new.id, jsonb_build_object(
    'name', new.name, 'city', new.city, 'source', new.source
  ));
  return new;
end $$;

drop trigger if exists trg_agent_lead_created on public.leads;
create trigger trg_agent_lead_created
  after insert on public.leads
  for each row execute function public.agent_on_lead_created();

-- Seed the first hire: the Office Manager, at Level 0 (observer) ------------
insert into public.agents (role, display_en, display_es, charter, triggers, toolbox, autonomy, enabled)
values (
  'office_manager',
  'Office Manager',
  'Gerente de oficina',
  '{"goal":"Watch the whole business and hand the owner one short daily brief: what happened, what needs a decision. Never more than three asks. Plain language, never technical.","register":"one_to_one","hard_limits":["never touches money","never contacts customers","report only"]}',
  '["daily_schedule","lead_created"]',
  '["compose_brief"]',
  0,
  true
)
on conflict (role) do nothing;

notify pgrst, 'reload schema';
