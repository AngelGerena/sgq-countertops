-- ============================================================================
-- SGQ — complete Supabase restore
-- Captured 2026-10-26 from project llpcthsgihfdkqtuurge before deletion.
--
-- Paste this whole file into the SQL Editor of a NEW Supabase project and run
-- it once. It rebuilds the entire database: 21 tables, 9 functions, 12
-- triggers, 14 indexes, 32 RLS policies, and all seed data.
--
-- This file exists because migrations 01 (foundation) and 02 (sales and jobs)
-- were never committed to the repo. They only ever existed in the SQL Editor
-- of the live project. Everything they created is reproduced below.
--
-- It also FIXES a live data leak that existed in the original project.
-- See section 8. Do not remove that section.
--
-- AFTER running this you still need to, by hand:
--   1. Create an auth user (Authentication > Users > Add user) and then run
--      the INSERT in section 10 with that user's UUID.
--   2. Deploy the two edge functions from the repo (never deployed in the
--      original project: supabase/functions/daily-brief, generate-post).
--   3. Set secrets: ANTHROPIC_API_KEY, and optionally CRON_SECRET, RESEND_API_KEY.
--   4. Update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify env vars
--      and in .env.example (the old ref llpcthsgihfdkqtuurge is hardcoded there).
-- ============================================================================

set search_path = public;

-- ============================================================================
-- 1. TRIGGER FUNCTIONS (no table dependencies — safe to create first)
--
-- is_admin() and is_super_admin() are deliberately NOT here. They are
-- SQL-language functions, so Postgres validates their bodies the moment they
-- are created, and they read public.admin_users — which does not exist yet.
-- They are created in section 3, after the tables. Nothing before section 7
-- needs them.
-- ============================================================================

create or replace function public.touch_updated_at()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end $function$;

create or replace function public.next_doc_number(p_kind text)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare v_prefix text; v_num int;
begin
  update public.doc_counters
     set next_val = next_val + 1
   where kind = p_kind
   returning prefix, next_val - 1 into v_prefix, v_num;
  if v_prefix is null then raise exception 'Unknown document kind: %', p_kind; end if;
  return v_prefix || '-' || to_char(now(),'YY') || lpad(v_num::text, 4, '0');
end $function$;

-- ============================================================================
-- 2. TABLES — in foreign-key dependency order
-- ============================================================================

create table if not exists public.admin_users (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  email text not null,
  full_name text,
  role text default 'admin'::text not null,
  is_super_admin boolean default false not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint admin_users_pkey PRIMARY KEY (id),
  constraint admin_users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'staff'::text]))),
  constraint admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint admin_users_user_id_key UNIQUE (user_id)
);

create table if not exists public.business_settings (
  id boolean default true not null,
  legal_name text default 'Santiago''s Granite & Quartz LLC'::text not null,
  trade_name text default 'Santiago''s Granite & Quartz'::text not null,
  license_number text,
  address text default 'Deltona, FL'::text,
  phone text default '386-444-5290'::text,
  email text default 'info@sgqcountertops.com'::text,
  service_area text default 'Volusia, Seminole, Orange & surrounding'::text,
  hours text default 'Mon-Sat, 8am-6pm'::text,
  review_url text,
  deposit_pct numeric(5,2) default 50.00 not null,
  tax_rate numeric(5,2) default 6.50 not null,
  accept_card boolean default true not null,
  accept_ach boolean default true not null,
  ach_discount_pct numeric(5,2) default 3.00 not null,
  updated_at timestamp with time zone default now() not null,
  constraint business_settings_id_check CHECK (id),
  constraint business_settings_pkey PRIMARY KEY (id)
);

create table if not exists public.site_content (
  key text not null,
  section text not null,
  label text not null,
  hint text,
  kind text default 'text'::text not null,
  value_en text,
  value_es text,
  sort_order integer default 0 not null,
  updated_at timestamp with time zone default now() not null,
  constraint site_content_kind_check CHECK ((kind = ANY (ARRAY['text'::text, 'longtext'::text, 'image'::text, 'url'::text]))),
  constraint site_content_pkey PRIMARY KEY (key)
);

create table if not exists public.site_content_versions (
  id uuid default gen_random_uuid() not null,
  snapshot jsonb not null,
  label text,
  created_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint site_content_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint site_content_versions_pkey PRIMARY KEY (id)
);

create table if not exists public.media (
  id uuid default gen_random_uuid() not null,
  path text not null,
  category text default 'general'::text not null,
  alt_en text,
  alt_es text,
  width integer,
  height integer,
  bytes integer,
  uploaded_by uuid,
  created_at timestamp with time zone default now() not null,
  constraint media_path_key UNIQUE (path),
  constraint media_pkey PRIMARY KEY (id),
  constraint media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

create table if not exists public.materials (
  id uuid default gen_random_uuid() not null,
  kind text not null,
  name text not null,
  supplier text,
  tier text,
  unit text default 'sqft'::text not null,
  unit_price numeric(10,2) default 0 not null,
  cost numeric(10,2),
  description_en text,
  description_es text,
  swatch_path text,
  is_active boolean default true not null,
  sort_order integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  constraint materials_kind_check CHECK ((kind = ANY (ARRAY['stone'::text, 'cabinet'::text, 'edge'::text, 'adder'::text]))),
  constraint materials_pkey PRIMARY KEY (id),
  constraint materials_unit_check CHECK ((unit = ANY (ARRAY['sqft'::text, 'linear_ft'::text, 'each'::text])))
);

create table if not exists public.travel_zones (
  id uuid default gen_random_uuid() not null,
  name text not null,
  uplift_pct numeric(5,2) default 0 not null,
  notes text,
  is_active boolean default true not null,
  constraint travel_zones_name_key UNIQUE (name),
  constraint travel_zones_pkey PRIMARY KEY (id)
);

create table if not exists public.doc_counters (
  kind text not null,
  prefix text not null,
  next_val integer default 1 not null,
  constraint doc_counters_pkey PRIMARY KEY (kind)
);

create table if not exists public.onboarding_state (
  id boolean default true not null,
  tour_complete boolean default false not null,
  demo_seeded boolean default false not null,
  steps_done text[] default '{}'::text[] not null,
  updated_at timestamp with time zone default now() not null,
  constraint onboarding_state_id_check CHECK (id),
  constraint onboarding_state_pkey PRIMARY KEY (id)
);

create table if not exists public.customers (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text,
  phone text,
  address text,
  city text,
  zip text,
  lang text default 'en'::text not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  is_demo boolean default false not null,
  constraint customers_lang_check CHECK ((lang = ANY (ARRAY['en'::text, 'es'::text]))),
  constraint customers_pkey PRIMARY KEY (id)
);

create table if not exists public.leads (
  id uuid default gen_random_uuid() not null,
  customer_id uuid,
  name text not null,
  email text,
  phone text,
  city text,
  source text default 'website'::text not null,
  message text,
  status text default 'new'::text not null,
  lost_reason text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  is_demo boolean default false not null,
  constraint leads_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  constraint leads_pkey PRIMARY KEY (id),
  constraint leads_source_check CHECK ((source = ANY (ARRAY['website'::text, 'referral'::text, 'facebook'::text, 'google'::text, 'walk_in'::text, 'other'::text]))),
  constraint leads_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'measured'::text, 'quoted'::text, 'won'::text, 'lost'::text])))
);

create table if not exists public.quotes (
  id uuid default gen_random_uuid() not null,
  quote_number text,
  customer_id uuid,
  lead_id uuid,
  travel_zone_id uuid,
  status text default 'draft'::text not null,
  subtotal numeric(12,2) default 0 not null,
  travel_uplift numeric(12,2) default 0 not null,
  tax numeric(12,2) default 0 not null,
  total numeric(12,2) default 0 not null,
  deposit_due numeric(12,2) default 0 not null,
  valid_until date,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  is_demo boolean default false not null,
  constraint quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  constraint quotes_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL,
  constraint quotes_pkey PRIMARY KEY (id),
  constraint quotes_quote_number_key UNIQUE (quote_number),
  constraint quotes_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'accepted'::text, 'declined'::text, 'expired'::text]))),
  constraint quotes_travel_zone_id_fkey FOREIGN KEY (travel_zone_id) REFERENCES public.travel_zones(id)
);

create table if not exists public.jobs (
  id uuid default gen_random_uuid() not null,
  job_number text,
  customer_id uuid,
  quote_id uuid,
  status text default 'sold'::text not null,
  address text,
  city text,
  install_date date,
  contract_total numeric(12,2) default 0 not null,
  deposit_paid numeric(12,2) default 0 not null,
  balance_due numeric(12,2) default 0 not null,
  notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  is_demo boolean default false not null,
  constraint jobs_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  constraint jobs_job_number_key UNIQUE (job_number),
  constraint jobs_pkey PRIMARY KEY (id),
  constraint jobs_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE SET NULL,
  constraint jobs_status_check CHECK ((status = ANY (ARRAY['sold'::text, 'template'::text, 'fabrication'::text, 'scheduled'::text, 'installed'::text, 'complete'::text, 'on_hold'::text])))
);

create table if not exists public.quote_items (
  id uuid default gen_random_uuid() not null,
  quote_id uuid not null,
  material_id uuid,
  label text not null,
  qty numeric(10,2) default 1 not null,
  unit text default 'sqft'::text not null,
  unit_price numeric(10,2) default 0 not null,
  line_total numeric(12,2) default 0 not null,
  sort_order integer default 0 not null,
  constraint quote_items_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE SET NULL,
  constraint quote_items_pkey PRIMARY KEY (id),
  constraint quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.quotes(id) ON DELETE CASCADE
);

create table if not exists public.invoices (
  id uuid default gen_random_uuid() not null,
  invoice_number text,
  job_id uuid,
  customer_id uuid,
  kind text default 'deposit'::text not null,
  status text default 'draft'::text not null,
  subtotal numeric(12,2) default 0 not null,
  tax numeric(12,2) default 0 not null,
  total numeric(12,2) default 0 not null,
  amount_paid numeric(12,2) default 0 not null,
  due_date date,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  deleted_at timestamp with time zone,
  constraint invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  constraint invoices_invoice_number_key UNIQUE (invoice_number),
  constraint invoices_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL,
  constraint invoices_kind_check CHECK ((kind = ANY (ARRAY['deposit'::text, 'balance'::text, 'full'::text]))),
  constraint invoices_pkey PRIMARY KEY (id),
  constraint invoices_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'void'::text])))
);

create table if not exists public.contracts (
  id uuid default gen_random_uuid() not null,
  job_id uuid,
  customer_id uuid,
  status text default 'draft'::text not null,
  body text,
  signed_name text,
  signed_at timestamp with time zone,
  signed_ip text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint contracts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL,
  constraint contracts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE,
  constraint contracts_pkey PRIMARY KEY (id),
  constraint contracts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'sent'::text, 'signed'::text, 'void'::text])))
);

create table if not exists public.audit_log (
  id uuid default gen_random_uuid() not null,
  actor uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text,
  created_at timestamp with time zone default now() not null,
  constraint audit_log_actor_fkey FOREIGN KEY (actor) REFERENCES auth.users(id) ON DELETE SET NULL,
  constraint audit_log_pkey PRIMARY KEY (id)
);

create table if not exists public.posts (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  status text default 'draft'::text not null,
  title_en text default ''::text not null,
  title_es text,
  excerpt_en text,
  excerpt_es text,
  body_en text,
  body_es text,
  cover_path text,
  cover_alt_en text,
  cover_alt_es text,
  seo_title_en text,
  seo_title_es text,
  meta_description_en text,
  meta_description_es text,
  city text,
  county text,
  materials text[] default '{}'::text[] not null,
  job_id uuid,
  author text,
  published_at timestamp with time zone,
  is_demo boolean default false not null,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint posts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL,
  constraint posts_pkey PRIMARY KEY (id),
  constraint posts_slug_key UNIQUE (slug),
  constraint posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])))
);

create table if not exists public.agents (
  id uuid default gen_random_uuid() not null,
  role text not null,
  display_en text not null,
  display_es text not null,
  charter jsonb default '{}'::jsonb not null,
  triggers jsonb default '[]'::jsonb not null,
  toolbox jsonb default '[]'::jsonb not null,
  autonomy integer default 0 not null,
  enabled boolean default false not null,
  updated_at timestamp with time zone default now() not null,
  constraint agents_autonomy_check CHECK (((autonomy >= 0) AND (autonomy <= 3))),
  constraint agents_pkey PRIMARY KEY (id),
  constraint agents_role_key UNIQUE (role)
);

create table if not exists public.agent_events (
  id uuid default gen_random_uuid() not null,
  kind text not null,
  source_id uuid,
  payload jsonb,
  handled_by uuid,
  handled_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  constraint agent_events_handled_by_fkey FOREIGN KEY (handled_by) REFERENCES public.agents(id) ON DELETE SET NULL,
  constraint agent_events_pkey PRIMARY KEY (id)
);

create table if not exists public.agent_runs (
  id uuid default gen_random_uuid() not null,
  agent_id uuid not null,
  event_id uuid,
  decision text not null,
  narrative text not null,
  detail jsonb,
  tokens_in integer,
  tokens_out integer,
  created_at timestamp with time zone default now() not null,
  constraint agent_runs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  constraint agent_runs_decision_check CHECK ((decision = ANY (ARRAY['acted'::text, 'drafted'::text, 'escalated'::text, 'ignored'::text]))),
  constraint agent_runs_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.agent_events(id) ON DELETE SET NULL,
  constraint agent_runs_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 3. REMAINING FUNCTIONS (depend on the tables above)
-- ============================================================================

create or replace function public.is_admin()
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$function$;

create or replace function public.is_super_admin()
 returns boolean language sql stable security definer set search_path to 'public'
as $function$
  select exists (select 1 from public.admin_users
                 where user_id = auth.uid() and is_super_admin = true);
$function$;

create or replace function public.snapshot_site_content(p_label text default null::text)
 returns uuid language plpgsql security definer set search_path to 'public'
as $function$
declare v_id uuid; begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  insert into public.site_content_versions (snapshot, label, created_by)
  select jsonb_agg(to_jsonb(sc)), p_label, auth.uid() from public.site_content sc returning id into v_id;
  return v_id; end $function$;

create or replace function public.restore_site_content(p_version uuid)
 returns void language plpgsql security definer set search_path to 'public'
as $function$
declare rec jsonb; begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  perform public.snapshot_site_content('before restore');
  select snapshot into rec from public.site_content_versions where id = p_version;
  if rec is null then raise exception 'No such version'; end if;
  update public.site_content sc set value_en = x.value_en, value_es = x.value_es
  from jsonb_to_recordset(rec) as x(key text, value_en text, value_es text) where sc.key = x.key; end $function$;

create or replace function public.reset_site_content()
 returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.is_admin() then raise exception 'Admins only' using errcode = '42501'; end if;
  perform public.snapshot_site_content('before full reset');
  update public.site_content set value_en = null, value_es = null; end $function$;

create or replace function public.agent_on_lead_created()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  insert into public.agent_events (kind, source_id, payload)
  values ('lead_created', new.id, jsonb_build_object(
    'name', new.name, 'city', new.city, 'source', new.source
  ));
  return new;
end $function$;

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

create index if not exists agent_events_open_idx on public.agent_events using btree (kind, created_at) where (handled_at is null);
create index if not exists agent_runs_recent_idx on public.agent_runs using btree (created_at desc);
create index if not exists audit_log_recent_idx on public.audit_log using btree (created_at desc);
create index if not exists customers_name_idx on public.customers using btree (lower(name));
create index if not exists invoices_status_idx on public.invoices using btree (status, due_date);
create index if not exists jobs_status_idx on public.jobs using btree (status, install_date);
create index if not exists leads_status_idx on public.leads using btree (status, created_at desc);
create index if not exists materials_kind_idx on public.materials using btree (kind, is_active, sort_order);
create index if not exists media_category_idx on public.media using btree (category, created_at desc);
create index if not exists posts_city_idx on public.posts using btree (city) where (deleted_at is null);
create index if not exists posts_published_idx on public.posts using btree (status, published_at desc) where (deleted_at is null);
create index if not exists quote_items_quote_idx on public.quote_items using btree (quote_id, sort_order);
create index if not exists quotes_status_idx on public.quotes using btree (status, created_at desc);
create index if not exists site_content_section_idx on public.site_content using btree (section, sort_order);

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

drop trigger if exists admin_users_touch on public.admin_users;
create trigger admin_users_touch before update on public.admin_users for each row execute function public.touch_updated_at();

drop trigger if exists business_settings_touch on public.business_settings;
create trigger business_settings_touch before update on public.business_settings for each row execute function public.touch_updated_at();

drop trigger if exists contracts_touch on public.contracts;
create trigger contracts_touch before update on public.contracts for each row execute function public.touch_updated_at();

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();

drop trigger if exists invoices_touch on public.invoices;
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();

drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs for each row execute function public.touch_updated_at();

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();

drop trigger if exists materials_touch on public.materials;
create trigger materials_touch before update on public.materials for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

drop trigger if exists quotes_touch on public.quotes;
create trigger quotes_touch before update on public.quotes for each row execute function public.touch_updated_at();

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch before update on public.site_content for each row execute function public.touch_updated_at();

drop trigger if exists trg_agent_lead_created on public.leads;
create trigger trg_agent_lead_created after insert on public.leads for each row execute function public.agent_on_lead_created();

-- ----------------------------------------------------------------------------
-- 5b. RLS safety net: auto-enable RLS on any table added to public later.
-- This existed in the original project. A new Supabase project may already
-- ship it, so both the function and the event trigger are conditional, and the
-- whole thing is wrapped so a permissions error cannot abort the restore.
-- ----------------------------------------------------------------------------

create or replace function public.rls_auto_enable()
 returns event_trigger language plpgsql security definer set search_path to 'pg_catalog'
as $function$
declare cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO')
      and object_type in ('table','partitioned table')
  loop
    if cmd.schema_name = 'public' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end $function$;

do $$
begin
  if not exists (select 1 from pg_event_trigger where evtname = 'ensure_rls') then
    create event trigger ensure_rls on ddl_command_end execute function public.rls_auto_enable();
  end if;
exception when insufficient_privilege then
  raise notice 'Skipped the ensure_rls event trigger (needs elevated rights). Not fatal.';
end $$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY — enable on every table
-- ============================================================================

alter table public.admin_users           enable row level security;
alter table public.agent_events          enable row level security;
alter table public.agent_runs            enable row level security;
alter table public.agents                enable row level security;
alter table public.audit_log             enable row level security;
alter table public.business_settings     enable row level security;
alter table public.contracts             enable row level security;
alter table public.customers             enable row level security;
alter table public.doc_counters          enable row level security;
alter table public.invoices              enable row level security;
alter table public.jobs                  enable row level security;
alter table public.leads                 enable row level security;
alter table public.materials             enable row level security;
alter table public.media                 enable row level security;
alter table public.onboarding_state      enable row level security;
alter table public.posts                 enable row level security;
alter table public.quote_items           enable row level security;
alter table public.quotes                enable row level security;
alter table public.site_content          enable row level security;
alter table public.site_content_versions enable row level security;
alter table public.travel_zones          enable row level security;

-- ============================================================================
-- 7. RLS POLICIES — all 32, as they were
-- ============================================================================

drop policy if exists admin_users_select on public.admin_users;
create policy admin_users_select on public.admin_users for select to authenticated using (is_admin());
drop policy if exists admin_users_insert on public.admin_users;
create policy admin_users_insert on public.admin_users for insert to authenticated with check (is_super_admin());
drop policy if exists admin_users_update on public.admin_users;
create policy admin_users_update on public.admin_users for update to authenticated using (is_super_admin());
drop policy if exists admin_users_delete on public.admin_users;
create policy admin_users_delete on public.admin_users for delete to authenticated using (is_super_admin());

drop policy if exists agents_admin on public.agents;
create policy agents_admin on public.agents for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists agent_events_admin on public.agent_events;
create policy agent_events_admin on public.agent_events for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists agent_runs_admin on public.agent_runs;
create policy agent_runs_admin on public.agent_runs for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists audit_admin on public.audit_log;
create policy audit_admin on public.audit_log for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists settings_public_read on public.business_settings;
create policy settings_public_read on public.business_settings for select to anon, authenticated using (true);
drop policy if exists settings_admin_update on public.business_settings;
create policy settings_admin_update on public.business_settings for update to authenticated using (is_admin());

drop policy if exists contracts_admin_all on public.contracts;
create policy contracts_admin_all on public.contracts for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists customers_admin_all on public.customers;
create policy customers_admin_all on public.customers for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists counters_admin_all on public.doc_counters;
create policy counters_admin_all on public.doc_counters for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists invoices_admin_all on public.invoices;
create policy invoices_admin_all on public.invoices for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists jobs_admin_all on public.jobs;
create policy jobs_admin_all on public.jobs for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads for insert to anon with check (true);

drop policy if exists materials_admin_all on public.materials;
create policy materials_admin_all on public.materials for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists materials_public_read on public.materials;
create policy materials_public_read on public.materials for select to anon, authenticated using (is_active = true);

drop policy if exists media_admin_write on public.media;
create policy media_admin_write on public.media for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists media_public_read on public.media;
create policy media_public_read on public.media for select to anon, authenticated using (true);

drop policy if exists onboarding_admin on public.onboarding_state;
create policy onboarding_admin on public.onboarding_state for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists posts_admin_all on public.posts;
create policy posts_admin_all on public.posts for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select to anon, authenticated using (status = 'published' and deleted_at is null);

drop policy if exists quote_items_admin_all on public.quote_items;
create policy quote_items_admin_all on public.quote_items for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists quotes_admin_all on public.quotes;
create policy quotes_admin_all on public.quotes for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content for select to anon, authenticated using (true);

drop policy if exists versions_admin on public.site_content_versions;
create policy versions_admin on public.site_content_versions for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists zones_admin_all on public.travel_zones;
create policy zones_admin_all on public.travel_zones for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists zones_public_read on public.travel_zones;
create policy zones_public_read on public.travel_zones for select to anon, authenticated using (is_active = true);

-- ============================================================================
-- 8. SECURITY FIX — do not remove
--
-- In the ORIGINAL project the `anon` role (whose key ships inside the public
-- JavaScript bundle) could read EVERY column of `materials`, including
-- `supplier` and `cost`. RLS restricts which ROWS a role sees; it does nothing
-- about COLUMNS. So anyone could call the public REST API and receive the
-- supplier names and Cesar's cost basis on every line item.
--
-- That defeats the entire point of the house-collection naming, the scrubbed
-- code comments, and the robots.txt rule on /specs/.
--
-- The three columns below have no legitimate public use. Revoking them from
-- `anon` changes nothing for the admin portal, which runs as `authenticated`
-- and keeps full access.
-- ============================================================================

-- IMPORTANT, and the reason this is written the long way round:
-- "revoke select (supplier, cost) ... from anon" DOES NOT WORK on its own.
-- Postgres ignores column-level revokes while the role still holds a
-- table-level SELECT grant — and Supabase grants exactly that by default. So
-- the table grant has to go first, then the safe columns are granted back
-- one by one. (Verified: the short version leaves both columns readable.)

revoke select on public.materials from anon;
grant select (
  id, kind, name, tier, unit, unit_price,
  description_en, description_es, swatch_path,
  is_active, sort_order, created_at, updated_at, deleted_at
) on public.materials to anon;

revoke select on public.travel_zones from anon;
grant select (id, name, uplift_pct, is_active) on public.travel_zones to anon;

-- travel_zones.uplift_pct is left readable because the public quote wizard may
-- price a job client-side. If it does not read it, revoke that too — it exposes
-- the Tampa/Orlando markup:
--   revoke select on public.travel_zones from anon;
--   grant select (id, name, is_active) on public.travel_zones to anon;

-- Proof. Run this after the script finishes; neither query may return a row.
-- (Included here so it runs automatically as part of the restore.)
do $$
declare bad text;
begin
  select string_agg(column_name, ', ')
    into bad
    from information_schema.column_privileges
   where table_schema = 'public'
     and grantee = 'anon'
     and privilege_type = 'SELECT'
     and ( (table_name = 'materials'    and column_name in ('supplier','cost'))
        or (table_name = 'travel_zones' and column_name = 'notes') );
  if bad is not null then
    raise exception 'SECURITY FIX FAILED — anon can still read: %', bad;
  end if;
  raise notice 'Security check passed: anon cannot read supplier, cost, or zone notes.';
end $$;

-- ============================================================================
-- 9. SEED DATA
-- ============================================================================

-- singleton rows
insert into public.business_settings (id) values (true) on conflict (id) do nothing;
insert into public.onboarding_state  (id) values (true) on conflict (id) do nothing;

update public.business_settings set
  legal_name       = 'Santiago''s Granite & Quartz LLC',
  trade_name       = 'Santiago''s Granite & Quartz',
  license_number   = null,   -- STILL BLANK. Required in Florida advertising.
  address          = 'Deltona, FL',
  phone            = '386-444-5290',
  email            = 'info@sgqcountertops.com',
  service_area     = 'Volusia, Seminole, Orange & surrounding',
  hours            = 'Mon-Sat, 8am-6pm',
  review_url       = null,   -- still blank
  deposit_pct      = 50.00,
  tax_rate         = 6.50,
  accept_card      = true,
  accept_ach       = true,
  ach_discount_pct = 3.00
where id;

update public.onboarding_state set tour_complete = false, demo_seeded = false, steps_done = '{}'::text[] where id;

-- document numbering (all were still at 1 — nothing was ever issued)
insert into public.doc_counters (kind,prefix,next_val) values ('quote','Q',1)     on conflict (kind) do nothing;
insert into public.doc_counters (kind,prefix,next_val) values ('job','J',1)       on conflict (kind) do nothing;
insert into public.doc_counters (kind,prefix,next_val) values ('invoice','INV',1) on conflict (kind) do nothing;

-- travel zones
insert into public.travel_zones (name,uplift_pct,notes,is_active) values
  ('Local — Volusia', 0.00,  'Deltona, DeBary, Orange City, Deland, Sanford', true),
  ('Orlando metro',   8.00,  'Seminole and Orange',                           true),
  ('Tampa side',     14.00,  'Longer haul, fuel and time',                    true)
on conflict (name) do nothing;

-- materials: 19 rows, retail (unit_price) and cost basis.
-- Guarded by "if the table is empty", because materials has no unique key on
-- (kind, name) — so a plain INSERT would double every row if this script is
-- ever run twice. (Verified: it does.)
do $$
begin
if exists (select 1 from public.materials) then
  raise notice 'materials already seeded (% rows) — skipping.', (select count(*) from public.materials);
else
insert into public.materials (kind,name,supplier,tier,unit,unit_price,cost,is_active,sort_order) values
  ('stone','Calacatta Gold Quartz',  'Sharif Stone','Quartz L2',  'sqft', 68.00, 34.00, true, 10),
  ('stone','Calacatta Black Quartz', 'Sharif Stone','Quartz L2',  'sqft', 68.00, 34.00, true, 20),
  ('stone','White Sparkle Quartz',   'Sharif Stone','Quartz L1',  'sqft', 54.00, 27.00, true, 30),
  ('stone','Steel Grey Granite',     'Sharif Stone','Granite L1', 'sqft', 49.00, 24.00, true, 40),
  ('stone','Black Pearl Granite',    'Sharif Stone','Granite L1', 'sqft', 52.00, 26.00, true, 50),
  ('stone','Taj Mahal Quartzite',    'Sharif Stone','Quartzite',  'sqft', 94.00, 52.00, true, 60),
  ('cabinet','White Shaker',    'Woodex', null, 'linear_ft', 210.00, 128.00, true, 10),
  ('cabinet','Grey Shaker',     'Woodex', null, 'linear_ft', 215.00, 131.00, true, 20),
  ('cabinet','Espresso Shaker', 'Woodex', null, 'linear_ft', 225.00, 138.00, true, 30),
  ('edge','Eased edge',    null, null, 'linear_ft',  0.00, 0.00, true, 10),
  ('edge','Bullnose',      null, null, 'linear_ft',  9.00, 3.00, true, 20),
  ('edge','Ogee',          null, null, 'linear_ft', 14.00, 5.00, true, 30),
  ('edge','Mitered 2 inch',null, null, 'linear_ft', 22.00, 8.00, true, 40),
  ('adder','Undermount sink cutout',          null, null, 'each',      165.00, 40.00, true, 10),
  ('adder','Cooktop cutout',                  null, null, 'each',      145.00, 35.00, true, 20),
  ('adder','Full-height backsplash',          null, null, 'sqft',       58.00, 29.00, true, 30),
  ('adder','4 inch backsplash',               null, null, 'linear_ft',  16.00,  7.00, true, 40),
  ('adder','Tear-out and haul away',          null, null, 'sqft',        8.00,  2.00, true, 50),
  ('adder','Plumbing disconnect / reconnect', null, null, 'each',      250.00, 90.00, true, 60);
end if;
end $$;

-- the Office Manager agent, at autonomy 0
insert into public.agents (role,display_en,display_es,charter,triggers,toolbox,autonomy,enabled) values (
  'office_manager','Office Manager','Gerente de oficina',
  '{"goal": "Watch the whole business and hand the owner one short daily brief: what happened, what needs a decision. Never more than three asks. Plain language, never technical.", "register": "one_to_one", "hard_limits": ["never touches money", "never contacts customers", "report only"]}'::jsonb,
  '["daily_schedule", "lead_created"]'::jsonb,
  '["compose_brief"]'::jsonb,
  0, true)
on conflict (role) do nothing;

-- site_content scaffold: 38 keys. Every value_en/value_es was NULL in the
-- original project — the SiteEditor was never used, so the live site renders
-- entirely from hardcoded defaults in src/. Null here means "use the default".
insert into public.site_content (key,section,label,hint,kind,sort_order) values
  ('hero.kicker','Hero','Kicker line','Small line above the headline','text',5),
  ('hero.headline','Hero','Headline','Currently: Measured twice. Installed once.','text',10),
  ('hero.subhead','Hero','Sub-headline',null,'longtext',20),
  ('hero.cta','Hero','Button label',null,'text',30),
  ('hero.cta_secondary','Hero','Secondary button label',null,'text',35),
  ('hero.image','Hero','Background image',null,'image',40),
  ('services.title','Services','Section title',null,'text',10),
  ('services.intro','Services','Intro copy',null,'longtext',20),
  ('services.1.title','Services','Service 1 title',null,'text',30),
  ('services.1.body','Services','Service 1 copy',null,'longtext',31),
  ('services.2.title','Services','Service 2 title',null,'text',40),
  ('services.2.body','Services','Service 2 copy',null,'longtext',41),
  ('services.3.title','Services','Service 3 title',null,'text',50),
  ('services.3.body','Services','Service 3 copy',null,'longtext',51),
  ('choose.title','Choose','Section title',null,'text',10),
  ('choose.intro','Choose','Intro copy',null,'longtext',20),
  ('work.title','Work','Section title',null,'text',10),
  ('work.intro','Work','Intro copy',null,'longtext',20),
  ('process.title','Process','Section title',null,'text',10),
  ('process.intro','Process','Intro copy',null,'longtext',20),
  ('process.1.title','Process','Step 1 title',null,'text',30),
  ('process.1.body','Process','Step 1 copy',null,'longtext',31),
  ('process.2.title','Process','Step 2 title',null,'text',40),
  ('process.2.body','Process','Step 2 copy',null,'longtext',41),
  ('process.3.title','Process','Step 3 title',null,'text',50),
  ('process.3.body','Process','Step 3 copy',null,'longtext',51),
  ('process.4.title','Process','Step 4 title',null,'text',60),
  ('process.4.body','Process','Step 4 copy',null,'longtext',61),
  ('about.title','About','Section title',null,'text',10),
  ('about.body','About','Body copy','25+ years in the trade','longtext',20),
  ('about.image','About','Photo',null,'image',30),
  ('quote.title','Quote form','Section title',null,'text',10),
  ('quote.intro','Quote form','Intro copy',null,'longtext',20),
  ('quote.success','Quote form','Thank-you message','Shown after someone submits','longtext',30),
  ('contact.title','Contact','Section title',null,'text',10),
  ('contact.intro','Contact','Intro copy',null,'longtext',20),
  ('footer.tagline','Footer','Tagline',null,'text',10),
  ('footer.hours','Footer','Hours line',null,'text',20)
on conflict (key) do nothing;

-- ============================================================================
-- 9b. STORAGE — the "site-images" bucket and its four policies
--
-- The SiteEditor and Media modules upload here. The bucket was EMPTY at capture
-- time (0 objects), so there are no files to restore — but the bucket and its
-- policies must exist or every upload fails with a permissions error.
--
-- Note the public-read policy: it serves anything in the bucket EXCEPT paths
-- under a top-level "private" folder. Keep that carve-out.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
values ('site-images', 'site-images', true, null, null, false)
on conflict (id) do nothing;

drop policy if exists site_images_public_read on storage.objects;
create policy site_images_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-images' and (storage.foldername(name))[1] <> 'private');

drop policy if exists site_images_admin_insert on storage.objects;
create policy site_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'site-images' and public.is_admin());

drop policy if exists site_images_admin_update on storage.objects;
create policy site_images_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

drop policy if exists site_images_admin_delete on storage.objects;
create policy site_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-images' and public.is_admin());

-- ============================================================================
-- 10. ADMIN LOGIN — run this LAST, by hand
--
-- The original project had exactly ONE admin: finessemediapro@gmail.com
-- (super admin). Cesar never had a login.
--
-- auth.users rows cannot be recreated by SQL. Create the user in the dashboard
-- under Authentication > Users > Add user, copy its UUID, then run:
--
--   insert into public.admin_users (user_id, email, full_name, role, is_super_admin)
--   values ('PASTE-NEW-UUID-HERE', 'finessemediapro@gmail.com', 'Angel Gerena', 'admin', true);
--
-- (The old UUID was b72238f1-aed8-4873-8b85-d8b2625dbf4b — it will NOT work in
-- a new project. You need the new one.)
-- ============================================================================

-- ============================================================================
-- 11. RELOAD THE SCHEMA CACHE — without this PostgREST reports tables as missing
-- ============================================================================

notify pgrst, 'reload schema';
