-- ============================================================
-- Hometown Ops – Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to initialise the database
-- ============================================================

-- ENUMS
create type user_role as enum ('corporate_admin', 'field_manager', 'auditor');
create type service_line as enum (
  'urgent_care','occupational_health','primary_care',
  'clinical_research','vibrance_wellness','telehealth'
);
create type ohio_region as enum (
  'akron','cleveland','columbus','cincinnati','dayton','ne_ohio'
);
create type checklist_item_type as enum (
  'pass_fail','yes_no','number','text','photo','signature','temperature'
);
create type inspection_status as enum ('pending','in_progress','completed','failed');
create type action_status as enum ('open','in_progress','resolved','overdue');

-- USERS (extends Supabase auth.users)
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  role          user_role not null default 'field_manager',
  assigned_location_ids uuid[] default '{}',
  avatar_url    text,
  created_at    timestamptz default now()
);
alter table public.users enable row level security;
create policy "Users read own" on public.users for select using (auth.uid() = id);
create policy "Admins read all" on public.users for select
  using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'corporate_admin'));

-- LOCATIONS
create table public.locations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  address       text not null,
  region        ohio_region not null,
  service_lines service_line[] not null default '{}',
  health_score  int not null default 100 check (health_score between 0 and 100),
  manager_id    uuid references public.users(id),
  phone         text,
  created_at    timestamptz default now()
);
alter table public.locations enable row level security;
create policy "All read locations" on public.locations for select using (auth.role() = 'authenticated');

-- CHECKLISTS
create table public.checklists (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  service_line service_line not null,
  version      int not null default 1,
  is_active    boolean not null default true,
  created_by   uuid references public.users(id),
  created_at   timestamptz default now()
);

-- CHECKLIST ITEMS
create table public.checklist_items (
  id                    uuid primary key default gen_random_uuid(),
  checklist_id          uuid references public.checklists(id) on delete cascade,
  "order"               int not null,
  label                 text not null,
  type                  checklist_item_type not null default 'pass_fail',
  required              boolean not null default true,
  requires_photo_on_fail boolean not null default false,
  conditional_on        jsonb,
  standard_refs         text[] default '{}'
);

-- INSPECTIONS
create table public.inspections (
  id            uuid primary key default gen_random_uuid(),
  location_id   uuid references public.locations(id),
  checklist_id  uuid references public.checklists(id),
  inspector_id  uuid references public.users(id),
  status        inspection_status not null default 'pending',
  started_at    timestamptz default now(),
  completed_at  timestamptz,
  pdf_url       text,
  signature_url text,
  score         int,
  risk_briefing text
);

-- INSPECTION RESPONSES
create table public.inspection_responses (
  id            uuid primary key default gen_random_uuid(),
  inspection_id uuid references public.inspections(id) on delete cascade,
  item_id       uuid references public.checklist_items(id),
  value         text,
  passed        boolean not null default true,
  photo_url     text,
  notes         text
);

-- CORRECTIVE ACTIONS
create table public.corrective_actions (
  id                 uuid primary key default gen_random_uuid(),
  inspection_id      uuid references public.inspections(id),
  location_id        uuid references public.locations(id),
  item_id            uuid references public.checklist_items(id),
  description        text not null,
  status             action_status not null default 'open',
  assigned_to        uuid references public.users(id),
  due_date           date not null,
  evidence_photo_url text,
  created_at         timestamptz default now(),
  resolved_at        timestamptz
);

-- TRAINING MODULES
create table public.training_modules (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  service_lines     service_line[] default '{}',
  content_url       text not null,
  content_type      text not null check (content_type in ('video','pdf','slides')),
  cert_validity_days int not null default 365,
  qr_code           text,
  created_at        timestamptz default now()
);

-- TRAINING COMPLETIONS
create table public.training_completions (
  id                 uuid primary key default gen_random_uuid(),
  module_id          uuid references public.training_modules(id),
  location_id        uuid references public.locations(id),
  completed_by_name  text not null,
  completed_at       timestamptz default now(),
  cert_expires_at    timestamptz not null,
  score              int
);

-- HEALTH SCORES (materialised snapshot, refreshed by edge function)
create table public.health_scores (
  location_id           uuid primary key references public.locations(id),
  score                 int not null default 100,
  inspection_pass_rate  numeric(5,2) default 100,
  open_actions_count    int default 0,
  overdue_training_count int default 0,
  missed_rounds_count   int default 0,
  trend                 jsonb default '[]',
  calculated_at         timestamptz default now()
);
