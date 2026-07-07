-- Patch Fund: household sharing schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text,
  invite_code text not null unique,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  weekly_starting_amount numeric(10, 2) not null default 10,
  week_started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  amount_delta numeric(10, 2) not null,
  reason text not null,
  category text,
  source text not null default 'manual' check (source in ('manual', 'siri', 'ai')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table if not exists public.week_summaries (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  weekly_starting_amount numeric(10, 2) not null,
  ending_balance numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists children_household_id_idx on public.children (household_id);
create index if not exists ledger_entries_child_id_idx on public.ledger_entries (child_id);
create index if not exists ledger_entries_created_at_idx on public.ledger_entries (created_at desc);
create index if not exists week_summaries_child_id_idx on public.week_summaries (child_id);
create index if not exists household_members_user_id_idx on public.household_members (user_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create or replace function public.child_household_id(target_child_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select c.household_id from public.children c where c.id = target_child_id;
$$;

create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.create_household(household_name text default null)
returns table (household_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  new_code text;
  attempts int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  loop
    attempts := attempts + 1;
    new_code := public.generate_invite_code();
    exit when not exists (select 1 from public.households h where h.invite_code = new_code);
    if attempts > 20 then
      raise exception 'Could not generate invite code';
    end if;
  end loop;

  insert into public.households (name, invite_code, created_by)
  values (household_name, new_code, auth.uid())
  returning id into new_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_id, auth.uid(), 'owner');

  return query select new_id, new_code;
end;
$$;

create or replace function public.join_household_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  normalized text := upper(trim(code));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select h.id into hid
  from public.households h
  where h.invite_code = normalized;

  if hid is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (hid, auth.uid(), 'member')
  on conflict do nothing;

  return hid;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Parent')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.children enable row level security;
alter table public.ledger_entries enable row level security;
alter table public.week_summaries enable row level security;

-- profiles
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- households
create policy "households_select_member" on public.households
  for select using (public.is_household_member(id));

-- household_members
create policy "members_select_same_household" on public.household_members
  for select using (public.is_household_member(household_id));

-- children
create policy "children_select" on public.children
  for select using (public.is_household_member(household_id));
create policy "children_insert" on public.children
  for insert with check (public.is_household_member(household_id));
create policy "children_update" on public.children
  for update using (public.is_household_member(household_id));
create policy "children_delete" on public.children
  for delete using (public.is_household_member(household_id));

-- ledger_entries
create policy "entries_select" on public.ledger_entries
  for select using (public.is_household_member(public.child_household_id(child_id)));
create policy "entries_insert" on public.ledger_entries
  for insert with check (public.is_household_member(public.child_household_id(child_id)));
create policy "entries_delete" on public.ledger_entries
  for delete using (public.is_household_member(public.child_household_id(child_id)));

-- week_summaries
create policy "summaries_select" on public.week_summaries
  for select using (public.is_household_member(public.child_household_id(child_id)));
create policy "summaries_insert" on public.week_summaries
  for insert with check (public.is_household_member(public.child_household_id(child_id)));
create policy "summaries_delete" on public.week_summaries
  for delete using (public.is_household_member(public.child_household_id(child_id)));

-- ---------------------------------------------------------------------------
-- Realtime (enable in Dashboard → Database → Replication if needed)
-- ---------------------------------------------------------------------------
-- alter publication supabase_realtime add table public.children;
-- alter publication supabase_realtime add table public.ledger_entries;
-- alter publication supabase_realtime add table public.week_summaries;
