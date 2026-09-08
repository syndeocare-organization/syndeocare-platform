-- Narrow user-owned operations used by the mobile client.

create policy notifications_delete_self
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

create policy applications_attendance_self
  on public.applications for update to authenticated
  using (professional_id = (select auth.uid()) and status = 'accepted')
  with check (professional_id = (select auth.uid()) and status in ('accepted', 'completed'));

create or replace function public.protect_professional_attendance_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.professional_id
    and old.status = 'accepted'
    and not public.is_admin() then
    if new.shift_id <> old.shift_id
      or new.professional_id <> old.professional_id
      or new.note is distinct from old.note
      or new.created_at is distinct from old.created_at
      or new.status not in ('accepted', 'completed') then
      raise exception 'professionals can only update attendance fields for accepted applications';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_protect_attendance on public.applications;
create trigger applications_protect_attendance
  before update on public.applications
  for each row execute function public.protect_professional_attendance_update();

revoke execute on function public.protect_professional_attendance_update() from public, anon, authenticated;
