-- Patch Fund: parent attribution on ledger entries
-- Run in Supabase Dashboard → SQL Editor if you already applied 001_household_schema.sql

-- Household members can read each other's display names (for "Logged by …" on entries).
create policy "profiles_select_household_members" on public.profiles
  for select using (
    exists (
      select 1
      from public.household_members hm_self
      join public.household_members hm_other
        on hm_self.household_id = hm_other.household_id
      where hm_self.user_id = auth.uid()
        and hm_other.user_id = profiles.id
    )
  );

-- Ensure created_by is always set to the authenticated user on insert.
create or replace function public.set_ledger_entry_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists ledger_entries_set_created_by on public.ledger_entries;
create trigger ledger_entries_set_created_by
  before insert on public.ledger_entries
  for each row execute function public.set_ledger_entry_created_by();
