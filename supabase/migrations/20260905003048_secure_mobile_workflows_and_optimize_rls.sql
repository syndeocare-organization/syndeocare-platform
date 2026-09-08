-- Close the remaining mobile workflow gaps and prepare RLS for production load.

create index if not exists conversations_shift_idx
  on public.conversations (shift_id)
  where shift_id is not null;
create index if not exists documents_reviewer_idx
  on public.documents (reviewer_id)
  where reviewer_id is not null;
create index if not exists messages_author_idx
  on public.messages (author_id)
  where author_id is not null;
create index if not exists organization_members_user_idx
  on public.organization_members (user_id);
create index if not exists organizations_created_by_idx
  on public.organizations (created_by)
  where created_by is not null;
create index if not exists shifts_created_by_idx
  on public.shifts (created_by)
  where created_by is not null;

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
  'video/webm'
]
where id = 'chat-media';

create or replace function public.is_organization_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and (
        profile.role = 'admin'
        or (
          profile.role = 'organization'
          and profile.onboarding_complete
          and profile.verification_status = 'verified'
          and exists (
            select 1
            from public.organization_members member
            join public.organizations organization
              on organization.id = member.organization_id
            where member.user_id = profile.id
              and organization.status = 'active'
          )
        )
      )
  );
$$;

revoke execute on function public.is_organization_user() from public, anon;
grant execute on function public.is_organization_user() to authenticated;

create or replace function public.protect_organization_privileged_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_admin()
    and coalesce(current_setting('app.onboarding', true), '') <> 'true'
    and (
      new.status is distinct from old.status
      or new.license_number is distinct from old.license_number
      or new.country_code is distinct from old.country_code
      or new.created_by is distinct from old.created_by
    ) then
    raise exception 'organization verification fields can only be changed by an administrator';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_protect_status on public.organizations;
drop trigger if exists organizations_protect_privileged_fields on public.organizations;
create trigger organizations_protect_privileged_fields
  before update on public.organizations
  for each row execute function public.protect_organization_privileged_fields();
revoke execute on function public.protect_organization_privileged_fields() from public, anon, authenticated;

create or replace function public.protect_professional_license()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.user_id
    and not public.is_admin()
    and coalesce(current_setting('app.onboarding', true), '') <> 'true'
    and new.license_number is distinct from old.license_number then
    raise exception 'professional license changes require administrator review';
  end if;
  return new;
end;
$$;

drop trigger if exists professional_profiles_protect_license on public.professional_profiles;
create trigger professional_profiles_protect_license
  before update on public.professional_profiles
  for each row execute function public.protect_professional_license();
revoke execute on function public.protect_professional_license() from public, anon, authenticated;

create or replace function public.enforce_published_shift_schedule()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published'
    and new.starts_at <= now()
    and (
      tg_op = 'INSERT'
      or old.status is distinct from new.status
      or old.starts_at is distinct from new.starts_at
    ) then
    raise exception 'a published shift must start in the future'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists shifts_enforce_published_schedule on public.shifts;
create trigger shifts_enforce_published_schedule
  before insert or update on public.shifts
  for each row execute function public.enforce_published_shift_schedule();
revoke execute on function public.enforce_published_shift_schedule() from public, anon, authenticated;

create or replace function public.protect_professional_application_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() = old.professional_id and not public.is_admin() then
    if old.status in ('applied', 'shortlisted') then
      if new.status <> 'withdrawn'
        or new.note is distinct from old.note
        or new.confirmed_at is distinct from old.confirmed_at
        or new.checked_in_at is distinct from old.checked_in_at
        or new.checked_out_at is distinct from old.checked_out_at
        or new.completed_at is distinct from old.completed_at then
        raise exception 'professionals can only withdraw a pending application';
      end if;
    elsif old.status = 'accepted' then
      if new.status not in ('accepted', 'completed')
        or new.note is distinct from old.note then
        raise exception 'professionals can only update attendance for accepted applications';
      end if;
      if old.confirmed_at is not null and new.confirmed_at is null
        or old.checked_in_at is not null and new.checked_in_at is null
        or old.checked_out_at is not null and new.checked_out_at is null
        or old.completed_at is not null and new.completed_at is null then
        raise exception 'attendance timestamps cannot be cleared';
      end if;
      if new.checked_in_at is not null and new.confirmed_at is null
        or new.checked_out_at is not null and new.checked_in_at is null
        or new.completed_at is not null and new.checked_out_at is null
        or new.status = 'completed' and new.completed_at is null then
        raise exception 'attendance steps must be completed in order';
      end if;
      if new.confirmed_at > now() + interval '5 minutes'
        or new.checked_in_at > now() + interval '5 minutes'
        or new.checked_out_at > now() + interval '5 minutes'
        or new.completed_at > now() + interval '5 minutes' then
        raise exception 'attendance timestamps cannot be in the future';
      end if;
      if new.checked_in_at < new.confirmed_at
        or new.checked_out_at < new.checked_in_at
        or new.completed_at < new.checked_out_at then
        raise exception 'attendance timestamps must be chronological';
      end if;
    else
      raise exception 'this application can no longer be changed by the professional';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists applications_protect_attendance on public.applications;
drop trigger if exists applications_protect_professional_update on public.applications;
create trigger applications_protect_professional_update
  before update on public.applications
  for each row execute function public.protect_professional_application_update();
revoke execute on function public.protect_professional_application_update() from public, anon, authenticated;

create or replace function public.create_direct_conversation(
  actor_id_input uuid,
  organization_id_input uuid,
  professional_id_input uuid
)
returns table (conversation_id uuid, updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role public.user_role;
  actor_verified public.verification_status;
  actor_onboarded boolean;
  result_conversation_id uuid;
  result_updated_at timestamptz;
begin
  if actor_id_input is null
    or organization_id_input is null
    or professional_id_input is null
    or actor_id_input = professional_id_input then
    raise exception 'invalid conversation participants';
  end if;

  select role, verification_status, onboarding_complete
    into actor_role, actor_verified, actor_onboarded
  from public.profiles
  where id = actor_id_input;

  if actor_role = 'organization' then
    if not actor_onboarded or actor_verified <> 'verified' then
      raise exception 'verified organization account required';
    end if;
    if not exists (
      select 1
      from public.organization_members member
      join public.organizations organization
        on organization.id = member.organization_id
      where member.user_id = actor_id_input
        and member.organization_id = organization_id_input
        and member.role in ('owner', 'manager', 'recruiter')
        and organization.status = 'active'
    ) then
      raise exception 'managed active organization required';
    end if;
  elsif actor_role = 'admin' then
    if not exists (
      select 1 from public.organizations
      where id = organization_id_input and status = 'active'
    ) then
      raise exception 'active organization required';
    end if;
  else
    raise exception 'organization access required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = professional_id_input
      and role = 'professional'
      and onboarding_complete
      and verification_status = 'verified'
  ) then
    raise exception 'verified professional required';
  end if;

  perform id from public.profiles where id = actor_id_input for update;

  select conversation.id, conversation.updated_at
    into result_conversation_id, result_updated_at
  from public.conversations conversation
  where conversation.shift_id is null
    and conversation.application_id is null
    and exists (
      select 1 from public.conversation_members member
      where member.conversation_id = conversation.id
        and member.user_id = actor_id_input
    )
    and exists (
      select 1 from public.conversation_members member
      where member.conversation_id = conversation.id
        and member.user_id = professional_id_input
    )
    and 2 = (
      select count(*) from public.conversation_members member
      where member.conversation_id = conversation.id
    )
  order by conversation.updated_at desc
  limit 1;

  if result_conversation_id is null then
    insert into public.conversations as inserted default values
    returning inserted.id, inserted.updated_at
      into result_conversation_id, result_updated_at;

    insert into public.conversation_members (conversation_id, user_id)
    values
      (result_conversation_id, actor_id_input),
      (result_conversation_id, professional_id_input);

    insert into public.audit_events (actor_id, action, resource_type, resource_id, metadata)
    values (
      actor_id_input,
      'conversation.created',
      'conversation',
      result_conversation_id::text,
      jsonb_build_object(
        'organizationId', organization_id_input,
        'professionalId', professional_id_input
      )
    );
  end if;

  return query select result_conversation_id, result_updated_at;
end;
$$;

revoke execute on function public.create_direct_conversation(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_direct_conversation(uuid, uuid, uuid) to service_role;

drop policy if exists profiles_browse_verified_professionals on public.profiles;
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or public.is_admin()
  or (role = 'professional' and verification_status = 'verified' and public.is_organization_user())
  or exists (
    select 1 from public.applications application
    join public.shifts shift on shift.id = application.shift_id
    where application.professional_id = profiles.id
      and public.is_organization_member(shift.organization_id)
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

drop policy if exists professional_profiles_browse_verified on public.professional_profiles;
drop policy if exists professional_profiles_select on public.professional_profiles;
create policy professional_profiles_select on public.professional_profiles for select to authenticated using (
  user_id = (select auth.uid())
  or public.is_admin()
  or (
    public.is_organization_user()
    and exists (
      select 1 from public.profiles profile
      where profile.id = professional_profiles.user_id
        and profile.role = 'professional'
        and profile.verification_status = 'verified'
    )
  )
  or exists (
    select 1 from public.applications application
    join public.shifts shift on shift.id = application.shift_id
    where application.professional_id = professional_profiles.user_id
      and public.is_organization_member(shift.organization_id)
  )
);

drop policy if exists professional_profiles_update_self on public.professional_profiles;
create policy professional_profiles_update_self on public.professional_profiles for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());

drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members for select to authenticated using (
  user_id = (select auth.uid())
  or public.is_organization_member(organization_id)
  or public.is_admin()
);

drop policy if exists shifts_insert on public.shifts;
create policy shifts_insert on public.shifts for insert to authenticated with check (
  created_by = (select auth.uid())
  and public.has_organization_role(organization_id, array['owner','manager','recruiter']::public.organization_member_role[])
  and (
    status <> 'published'
    or exists (
      select 1 from public.organizations organization
      where organization.id = organization_id and organization.status = 'active'
    )
  )
);

drop policy if exists applications_select on public.applications;
create policy applications_select on public.applications for select to authenticated using (
  professional_id = (select auth.uid())
  or public.is_admin()
  or exists (
    select 1 from public.shifts shift
    where shift.id = applications.shift_id
      and public.is_organization_member(shift.organization_id)
  )
);

drop policy if exists applications_withdraw on public.applications;
drop policy if exists applications_manage on public.applications;
drop policy if exists applications_attendance_self on public.applications;
drop policy if exists applications_update_authorized on public.applications;
create policy applications_update_authorized on public.applications for update to authenticated
  using (
    professional_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.shifts shift
      where shift.id = applications.shift_id
        and public.has_organization_role(
          shift.organization_id,
          array['owner','manager','recruiter']::public.organization_member_role[]
        )
    )
  )
  with check (
    professional_id = (select auth.uid())
    or public.is_admin()
    or exists (
      select 1 from public.shifts shift
      where shift.id = applications.shift_id
        and public.has_organization_role(
          shift.organization_id,
          array['owner','manager','recruiter']::public.organization_member_role[]
        )
    )
  );

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());
drop policy if exists documents_insert on public.documents;
create policy documents_insert on public.documents for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'pending' and reviewer_id is null);
drop policy if exists documents_update on public.documents;
create policy documents_update on public.documents for update to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin())
  with check (owner_id = (select auth.uid()) or public.is_admin());
drop policy if exists documents_delete on public.documents;
create policy documents_delete on public.documents for delete to authenticated
  using (owner_id = (select auth.uid()) or public.is_admin());

drop policy if exists conversation_members_select on public.conversation_members;
create policy conversation_members_select on public.conversation_members for select to authenticated using (
  user_id = (select auth.uid())
  or public.is_admin()
  or public.is_conversation_member(conversation_id)
);
drop policy if exists conversation_members_update_self on public.conversation_members;
create policy conversation_members_update_self on public.conversation_members for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_conversation_member(conversation_id));

drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists contact_messages_admin on public.contact_messages;
drop policy if exists contact_messages_admin_select on public.contact_messages;
drop policy if exists contact_messages_admin_update on public.contact_messages;
drop policy if exists contact_messages_admin_delete on public.contact_messages;
create policy contact_messages_admin_select on public.contact_messages for select to authenticated
  using (public.is_admin());
create policy contact_messages_admin_update on public.contact_messages for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy contact_messages_admin_delete on public.contact_messages for delete to authenticated
  using (public.is_admin());

drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists verification_documents_update on storage.objects;
create policy verification_documents_update on storage.objects for update to authenticated
  using (
    bucket_id = 'verification-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  )
  with check (
    bucket_id = 'verification-documents'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

drop policy if exists organization_assets_update on storage.objects;
create policy organization_assets_update on storage.objects for update to authenticated
  using (
    bucket_id = 'organization-assets'
    and public.has_organization_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner','manager']::public.organization_member_role[]
    )
  )
  with check (
    bucket_id = 'organization-assets'
    and public.has_organization_role(
      ((storage.foldername(name))[1])::uuid,
      array['owner','manager']::public.organization_member_role[]
    )
  );
