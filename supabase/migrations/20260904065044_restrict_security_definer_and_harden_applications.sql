-- Keep SECURITY DEFINER helpers inaccessible to anonymous API callers.
-- Trigger functions are never directly callable; authenticated users only keep
-- access to the helpers and onboarding RPCs that are intentionally used by RLS
-- and the application onboarding flow.

revoke execute on function public.cleanup_owned_organization()
from public, anon, authenticated;

revoke execute on function public.handle_new_user()
from public, anon, authenticated;

revoke execute on function public.complete_organization_onboarding(
  text, text, text, text, text, text, public.organization_type, text
)
from public, anon, authenticated;

revoke execute on function public.complete_professional_onboarding(
  text, text, text, text, text, text, text, smallint
)
from public, anon, authenticated;

revoke execute on function public.has_organization_role(
  uuid, public.organization_member_role[]
)
from public, anon, authenticated;

revoke execute on function public.is_admin()
from public, anon, authenticated;

revoke execute on function public.is_conversation_member(uuid)
from public, anon, authenticated;

revoke execute on function public.is_organization_member(uuid)
from public, anon, authenticated;

revoke execute on function public.is_professional()
from public, anon, authenticated;

grant execute on function public.complete_organization_onboarding(
  text, text, text, text, text, text, public.organization_type, text
)
to authenticated;

grant execute on function public.complete_professional_onboarding(
  text, text, text, text, text, text, text, smallint
)
to authenticated;

grant execute on function public.has_organization_role(
  uuid, public.organization_member_role[]
)
to authenticated;

grant execute on function public.is_admin()
to authenticated;

grant execute on function public.is_conversation_member(uuid)
to authenticated;

grant execute on function public.is_organization_member(uuid)
to authenticated;

grant execute on function public.is_professional()
to authenticated;

drop policy if exists applications_insert on public.applications;

create policy applications_insert
on public.applications
for insert
to authenticated
with check (
  professional_id = (select auth.uid())
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
