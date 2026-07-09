-- Allow household members to edit ledger entry amount and reason
create policy "entries_update" on public.ledger_entries
  for update using (public.is_household_member(public.child_household_id(child_id)));
