create or replace function public.is_professional()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'professional'
  );
$$;

revoke all on function public.is_professional() from public;
grant execute on function public.is_professional() to authenticated;

drop policy if exists applications_insert on public.applications;
create policy applications_insert
  on public.applications
  for insert
  to authenticated
  with check (
    professional_id = auth.uid()
    and status = 'applied'
    and public.is_professional()
  );
