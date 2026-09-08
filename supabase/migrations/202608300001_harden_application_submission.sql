-- A professional may only apply to a currently published future shift.
-- The API checks this for a clear response; RLS remains the final boundary.

drop policy if exists applications_insert on public.applications;

create policy applications_insert
on public.applications
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and status = 'applied'
  and public.is_professional()
  and exists (
    select 1
    from public.shifts
    where id = shift_id
      and status = 'published'
      and starts_at > now()
  )
);
