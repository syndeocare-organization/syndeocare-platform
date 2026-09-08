-- Complete the cross-surface workflows shared by web and mobile clients.

alter table public.conversations
  add column if not exists application_id uuid references public.applications(id) on delete set null;

create unique index if not exists conversations_application_key
  on public.conversations (application_id)
  where application_id is not null;

create policy conversation_members_update_self
  on public.conversation_members
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy notifications_insert_admin
  on public.notifications
  for insert
  to authenticated
  with check (public.is_admin());

create policy audit_events_insert_admin
  on public.audit_events
  for insert
  to authenticated
  with check (public.is_admin());

create or replace function public.complete_organization_member_onboarding(
  full_name_input text,
  phone_input text,
  city_input text,
  country_code_input text,
  locale_input text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists (
    select 1 from public.organization_members
    where user_id = auth.uid()
  ) then raise exception 'organization membership required'; end if;

  perform set_config('app.onboarding', 'true', true);
  update public.profiles set
    full_name = full_name_input,
    phone = phone_input,
    city = city_input,
    country_code = upper(country_code_input),
    locale = case when locale_input = 'en' then 'en' else 'ar' end,
    onboarding_complete = true,
    verification_status = 'verified'
  where id = auth.uid() and role = 'organization';

  insert into public.audit_events (actor_id, action, resource_type, resource_id)
  values (auth.uid(), 'onboarding.completed', 'organization_member', auth.uid()::text);
end;
$$;

revoke all on function public.complete_organization_member_onboarding(text, text, text, text, text) from public;
grant execute on function public.complete_organization_member_onboarding(text, text, text, text, text) to authenticated;

create or replace function public.enforce_application_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  capacity smallint;
  accepted_count integer;
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
    (old.status = 'applied' and new.status in ('shortlisted', 'accepted', 'rejected', 'withdrawn', 'cancelled'))
    or (old.status = 'shortlisted' and new.status in ('accepted', 'rejected', 'withdrawn', 'cancelled'))
    or (old.status = 'accepted' and new.status in ('completed', 'cancelled'))
  ) then
    raise exception 'invalid application status transition from % to %', old.status, new.status
      using errcode = '23514';
  end if;

  if new.status = 'accepted' and old.status <> 'accepted' then
    select needed_count into capacity
    from public.shifts
    where id = new.shift_id
    for update;

    select count(*) into accepted_count
    from public.applications
    where shift_id = new.shift_id
      and status = 'accepted'
      and id <> new.id;

    if accepted_count >= capacity then
      raise exception 'shift capacity has already been reached'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists applications_enforce_transition on public.applications;
create trigger applications_enforce_transition
  before update of status on public.applications
  for each row execute function public.enforce_application_transition();

create or replace function public.handle_application_workflow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization uuid;
  target_shift_title text;
  conversation_record uuid;
begin
  select organization_id, title
    into target_organization, target_shift_title
  from public.shifts
  where id = new.shift_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, kind, title, body, data)
    select
      member.user_id,
      'application.received',
      'New shift application',
      'A professional applied to ' || target_shift_title,
      jsonb_build_object('applicationId', new.id, 'shiftId', new.shift_id)
    from public.organization_members member
    where member.organization_id = target_organization;

    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.notifications (user_id, kind, title, body, data)
    values (
      new.professional_id,
      'application.status_changed',
      'Application updated',
      'Your application for ' || target_shift_title || ' is now ' || new.status::text,
      jsonb_build_object('applicationId', new.id, 'shiftId', new.shift_id, 'status', new.status)
    );

    if new.status = 'accepted' then
      insert into public.conversations (application_id, shift_id)
      values (new.id, new.shift_id)
      on conflict (application_id) where application_id is not null
      do update set shift_id = excluded.shift_id, updated_at = now()
      returning id into conversation_record;

      insert into public.conversation_members (conversation_id, user_id)
      values (conversation_record, new.professional_id)
      on conflict do nothing;

      insert into public.conversation_members (conversation_id, user_id)
      select conversation_record, member.user_id
      from public.organization_members member
      where member.organization_id = target_organization
        and member.role in ('owner', 'manager', 'recruiter')
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists applications_workflow on public.applications;
create trigger applications_workflow
  after insert or update of status on public.applications
  for each row execute function public.handle_application_workflow();

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_name text;
begin
  update public.conversations
  set updated_at = now()
  where id = new.conversation_id;

  select coalesce(full_name, 'SyndeoCare member') into author_name
  from public.profiles
  where id = new.author_id;

  insert into public.notifications (user_id, kind, title, body, data)
  select
    member.user_id,
    'message.received',
    'New message',
    author_name || ': ' || left(new.body, 160),
    jsonb_build_object('conversationId', new.conversation_id, 'messageId', new.id)
  from public.conversation_members member
  where member.conversation_id = new.conversation_id
    and member.user_id <> new.author_id;

  return new;
end;
$$;

drop trigger if exists messages_workflow on public.messages;
create trigger messages_workflow
  after insert on public.messages
  for each row execute function public.handle_new_message();

revoke all on function public.enforce_application_transition() from public;
revoke all on function public.handle_application_workflow() from public;
revoke all on function public.handle_new_message() from public;

-- Bring existing accepted applications into the new conversation workflow.
insert into public.conversations (application_id, shift_id)
select application.id, application.shift_id
from public.applications application
where application.status = 'accepted'
on conflict (application_id) where application_id is not null do nothing;

insert into public.conversation_members (conversation_id, user_id)
select conversation.id, application.professional_id
from public.conversations conversation
join public.applications application on application.id = conversation.application_id
on conflict do nothing;

insert into public.conversation_members (conversation_id, user_id)
select conversation.id, member.user_id
from public.conversations conversation
join public.applications application on application.id = conversation.application_id
join public.shifts shift on shift.id = application.shift_id
join public.organization_members member on member.organization_id = shift.organization_id
where member.role in ('owner', 'manager', 'recruiter')
on conflict do nothing;
