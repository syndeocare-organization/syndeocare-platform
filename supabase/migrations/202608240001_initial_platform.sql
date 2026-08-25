-- SyndeoCare platform foundation.
-- Authentication identities stay in auth.users; business data stays in public.

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('professional', 'organization', 'admin');
create type public.verification_status as enum ('not_started', 'pending', 'verified', 'rejected');
create type public.organization_type as enum ('hospital', 'clinic', 'home_care', 'other');
create type public.organization_status as enum ('pending', 'active', 'suspended');
create type public.organization_member_role as enum ('owner', 'manager', 'recruiter', 'viewer');
create type public.shift_status as enum ('draft', 'published', 'filled', 'cancelled', 'completed');
create type public.application_status as enum ('applied', 'shortlisted', 'accepted', 'rejected', 'withdrawn', 'cancelled', 'completed');
create type public.document_status as enum ('pending', 'approved', 'rejected', 'expired');
create type public.document_type as enum ('identity', 'professional_license', 'certificate', 'insurance', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'professional',
  full_name text check (full_name is null or char_length(full_name) between 2 and 100),
  phone text check (phone is null or phone ~ '^\\+?[0-9 ()-]{7,20}$'),
  city text check (city is null or char_length(city) between 2 and 80),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  avatar_path text,
  verification_status public.verification_status not null default 'not_started',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  type public.organization_type not null,
  license_number text not null,
  city text not null,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  logo_path text,
  status public.organization_status not null default 'pending',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index organizations_license_country_key
  on public.organizations (country_code, lower(license_number));

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.professional_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  specialty text not null check (char_length(specialty) between 2 and 100),
  license_number text not null check (char_length(license_number) between 3 and 100),
  years_experience smallint not null default 0 check (years_experience between 0 and 70),
  bio text check (bio is null or char_length(bio) <= 2000),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index professional_license_key on public.professional_profiles (lower(license_number));

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 3 and 120),
  specialty text not null,
  city text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  needed_count smallint not null default 1 check (needed_count between 1 and 100),
  hourly_rate numeric(12, 2) check (hourly_rate is null or hourly_rate > 0),
  currency char(3) not null default 'SAR',
  requirements text[] not null default '{}',
  status public.shift_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shifts_valid_times check (ends_at > starts_at)
);

create index shifts_discovery_idx on public.shifts (status, city, starts_at);
create index shifts_organization_idx on public.shifts (organization_id, created_at desc);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  note text check (note is null or char_length(note) <= 1000),
  status public.application_status not null default 'applied',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (shift_id, professional_id)
);

create index applications_professional_idx on public.applications (professional_id, created_at desc);
create index applications_shift_idx on public.applications (shift_id, status);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.document_type not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  expires_on date,
  status public.document_status not null default 'pending',
  reviewer_id uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index documents_owner_idx on public.documents (owner_id, status);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid references public.shifts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, read_at, created_at desc);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  email text not null check (char_length(email) between 3 and 254),
  subject text not null check (char_length(subject) between 3 and 140),
  message text not null check (char_length(message) between 10 and 5000),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_resource_idx on public.audit_events (resource_type, resource_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger professional_profiles_set_updated_at before update on public.professional_profiles for each row execute function public.set_updated_at();
create trigger shifts_set_updated_at before update on public.shifts for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents for each row execute function public.set_updated_at();
create trigger conversations_set_updated_at before update on public.conversations for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case new.raw_user_meta_data ->> 'role'
    when 'organization' then 'organization'::public.user_role
    else 'professional'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, locale)
  values (
    new.id,
    requested_role,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'ar' end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_organization_member(target_organization uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization and user_id = auth.uid()
  );
$$;

create or replace function public.has_organization_role(target_organization uuid, allowed_roles public.organization_member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.is_conversation_member(target_conversation uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation and user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.has_organization_role(uuid, public.organization_member_role[]) from public;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_member_role[]) to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.id and not public.is_admin() and coalesce(current_setting('app.onboarding', true), '') <> 'true' then
    if new.role <> old.role
      or new.verification_status <> old.verification_status
      or new.onboarding_complete <> old.onboarding_complete then
      raise exception 'privileged profile fields cannot be changed by the profile owner';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_privileged_fields
  before update on public.profiles
  for each row execute function public.protect_profile_privileged_fields();

create or replace function public.protect_organization_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status <> old.status and not public.is_admin() then
    raise exception 'organization status can only be changed by an administrator';
  end if;
  return new;
end;
$$;

create trigger organizations_protect_status
  before update on public.organizations
  for each row execute function public.protect_organization_status();

create or replace function public.protect_document_review_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() = old.owner_id and not public.is_admin() then
    if new.status <> old.status
      or new.reviewer_id is distinct from old.reviewer_id
      or new.review_note is distinct from old.review_note then
      raise exception 'document review fields can only be changed by an administrator';
    end if;
  end if;
  return new;
end;
$$;

create trigger documents_protect_review_fields
  before update on public.documents
  for each row execute function public.protect_document_review_fields();

create or replace function public.cleanup_owned_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.organizations o
  where o.created_by = old.id
    and not exists (
      select 1 from public.organization_members om
      where om.organization_id = o.id and om.user_id <> old.id and om.role = 'owner'
    );
  return old;
end;
$$;

create trigger profiles_cleanup_owned_organization
  before delete on public.profiles
  for each row execute function public.cleanup_owned_organization();

create or replace function public.protect_application_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.shift_id <> old.shift_id or new.professional_id <> old.professional_id then
    raise exception 'application identity is immutable';
  end if;
  return new;
end;
$$;

create trigger applications_protect_identity
  before update on public.applications
  for each row execute function public.protect_application_identity();

create or replace function public.complete_professional_onboarding(
  full_name_input text,
  phone_input text,
  city_input text,
  country_code_input text,
  locale_input text,
  specialty_input text,
  license_number_input text,
  years_experience_input smallint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'professional') then
    raise exception 'professional account required';
  end if;

  perform set_config('app.onboarding', 'true', true);

  insert into public.professional_profiles (user_id, specialty, license_number, years_experience)
  values (auth.uid(), specialty_input, license_number_input, years_experience_input)
  on conflict (user_id) do update set
    specialty = excluded.specialty,
    license_number = excluded.license_number,
    years_experience = excluded.years_experience;

  update public.profiles set
    full_name = full_name_input,
    phone = phone_input,
    city = city_input,
    country_code = upper(country_code_input),
    locale = case when locale_input = 'en' then 'en' else 'ar' end,
    onboarding_complete = true,
    verification_status = case when verification_status = 'not_started' then 'pending' else verification_status end
  where id = auth.uid();

  insert into public.audit_events (actor_id, action, resource_type, resource_id)
  values (auth.uid(), 'onboarding.completed', 'professional', auth.uid()::text);
end;
$$;

create or replace function public.complete_organization_onboarding(
  full_name_input text,
  phone_input text,
  city_input text,
  country_code_input text,
  locale_input text,
  organization_name_input text,
  organization_type_input public.organization_type,
  license_number_input text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_organization_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'organization') then
    raise exception 'organization account required';
  end if;

  perform set_config('app.onboarding', 'true', true);

  select organization_id into new_organization_id
  from public.organization_members
  where user_id = auth.uid() and role = 'owner'
  limit 1;

  if new_organization_id is null then
    insert into public.organizations (name, type, license_number, city, country_code, created_by)
    values (organization_name_input, organization_type_input, license_number_input, city_input, upper(country_code_input), auth.uid())
    returning id into new_organization_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (new_organization_id, auth.uid(), 'owner');
  else
    update public.organizations set
      name = organization_name_input,
      type = organization_type_input,
      license_number = license_number_input,
      city = city_input,
      country_code = upper(country_code_input)
    where id = new_organization_id;
  end if;

  update public.profiles set
    full_name = full_name_input,
    phone = phone_input,
    city = city_input,
    country_code = upper(country_code_input),
    locale = case when locale_input = 'en' then 'en' else 'ar' end,
    onboarding_complete = true,
    verification_status = case when verification_status = 'not_started' then 'pending' else verification_status end
  where id = auth.uid();

  insert into public.audit_events (actor_id, action, resource_type, resource_id)
  values (auth.uid(), 'onboarding.completed', 'organization', new_organization_id::text);

  return new_organization_id;
end;
$$;

revoke all on function public.complete_professional_onboarding(text, text, text, text, text, text, text, smallint) from public;
revoke all on function public.complete_organization_onboarding(text, text, text, text, text, text, public.organization_type, text) from public;
grant execute on function public.complete_professional_onboarding(text, text, text, text, text, text, text, smallint) to authenticated;
grant execute on function public.complete_organization_onboarding(text, text, text, text, text, text, public.organization_type, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.professional_profiles enable row level security;
alter table public.shifts enable row level security;
alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin() or exists (
    select 1 from public.applications a
    join public.shifts s on s.id = a.shift_id
    where a.professional_id = profiles.id and public.is_organization_member(s.organization_id)
  )
);
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy organizations_select on public.organizations for select to authenticated using (status = 'active' or public.is_organization_member(id) or public.is_admin());
create policy organizations_update on public.organizations for update to authenticated using (public.has_organization_role(id, array['owner','manager']::public.organization_member_role[]) or public.is_admin()) with check (public.has_organization_role(id, array['owner','manager']::public.organization_member_role[]) or public.is_admin());

create policy organization_members_select on public.organization_members for select to authenticated using (user_id = auth.uid() or public.is_organization_member(organization_id) or public.is_admin());
create policy organization_members_insert on public.organization_members for insert to authenticated with check (public.has_organization_role(organization_id, array['owner','manager']::public.organization_member_role[]) or public.is_admin());
create policy organization_members_update on public.organization_members for update to authenticated using (public.has_organization_role(organization_id, array['owner']::public.organization_member_role[]) or public.is_admin()) with check (public.has_organization_role(organization_id, array['owner']::public.organization_member_role[]) or public.is_admin());
create policy organization_members_delete on public.organization_members for delete to authenticated using (public.has_organization_role(organization_id, array['owner']::public.organization_member_role[]) or public.is_admin());

create policy professional_profiles_select on public.professional_profiles for select to authenticated using (
  user_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.applications a
    join public.shifts s on s.id = a.shift_id
    where a.professional_id = professional_profiles.user_id and public.is_organization_member(s.organization_id)
  )
);
create policy professional_profiles_update_self on public.professional_profiles for update to authenticated using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy shifts_select on public.shifts for select to authenticated using (status = 'published' or public.is_organization_member(organization_id) or public.is_admin());
create policy shifts_insert on public.shifts for insert to authenticated with check (
  created_by = auth.uid()
  and public.has_organization_role(organization_id, array['owner','manager','recruiter']::public.organization_member_role[])
  and (status <> 'published' or exists (select 1 from public.organizations o where o.id = organization_id and o.status = 'active'))
);
create policy shifts_update on public.shifts for update to authenticated using (public.has_organization_role(organization_id, array['owner','manager','recruiter']::public.organization_member_role[]) or public.is_admin()) with check (
  (public.has_organization_role(organization_id, array['owner','manager','recruiter']::public.organization_member_role[]) or public.is_admin())
  and (status <> 'published' or exists (select 1 from public.organizations o where o.id = organization_id and o.status = 'active'))
);
create policy shifts_delete on public.shifts for delete to authenticated using (public.has_organization_role(organization_id, array['owner','manager']::public.organization_member_role[]) or public.is_admin());

create policy applications_select on public.applications for select to authenticated using (
  professional_id = auth.uid() or public.is_admin() or exists (
    select 1 from public.shifts s where s.id = applications.shift_id and public.is_organization_member(s.organization_id)
  )
);
create policy applications_insert on public.applications for insert to authenticated with check (professional_id = auth.uid() and status = 'applied' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'professional'));
create policy applications_withdraw on public.applications for update to authenticated using (professional_id = auth.uid() and status in ('applied','shortlisted')) with check (professional_id = auth.uid() and status = 'withdrawn');
create policy applications_manage on public.applications for update to authenticated using (public.is_admin() or exists (select 1 from public.shifts s where s.id = applications.shift_id and public.has_organization_role(s.organization_id, array['owner','manager','recruiter']::public.organization_member_role[]))) with check (public.is_admin() or exists (select 1 from public.shifts s where s.id = applications.shift_id and public.has_organization_role(s.organization_id, array['owner','manager','recruiter']::public.organization_member_role[])));

create policy documents_select on public.documents for select to authenticated using (owner_id = auth.uid() or public.is_admin());
create policy documents_insert on public.documents for insert to authenticated with check (owner_id = auth.uid() and status = 'pending' and reviewer_id is null);
create policy documents_update on public.documents for update to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid() or public.is_admin());
create policy documents_delete on public.documents for delete to authenticated using (owner_id = auth.uid() or public.is_admin());

create policy conversations_select on public.conversations for select to authenticated using (public.is_admin() or public.is_conversation_member(id));
create policy conversation_members_select on public.conversation_members for select to authenticated using (user_id = auth.uid() or public.is_admin() or public.is_conversation_member(conversation_id));
create policy messages_select on public.messages for select to authenticated using (public.is_admin() or public.is_conversation_member(conversation_id));
create policy messages_insert on public.messages for insert to authenticated with check (author_id = auth.uid() and public.is_conversation_member(conversation_id));

create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy notifications_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy contact_messages_insert on public.contact_messages for insert to anon, authenticated with check (char_length(message) between 10 and 5000);
create policy contact_messages_admin on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy audit_events_admin on public.audit_events for select to authenticated using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('verification-documents', 'verification-documents', false, 10485760, array['application/pdf','image/jpeg','image/png']),
  ('organization-assets', 'organization-assets', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid()::text);
create policy avatars_delete on storage.objects for delete to authenticated using (bucket_id = 'avatars' and owner_id = auth.uid()::text);

create policy verification_documents_read on storage.objects for select to authenticated using (bucket_id = 'verification-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy verification_documents_write on storage.objects for insert to authenticated with check (bucket_id = 'verification-documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verification_documents_update on storage.objects for update to authenticated using (bucket_id = 'verification-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
create policy verification_documents_delete on storage.objects for delete to authenticated using (bucket_id = 'verification-documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

create policy organization_assets_read on storage.objects for select using (bucket_id = 'organization-assets');
create policy organization_assets_write on storage.objects for insert to authenticated with check (bucket_id = 'organization-assets' and public.is_organization_member(((storage.foldername(name))[1])::uuid));
create policy organization_assets_update on storage.objects for update to authenticated using (bucket_id = 'organization-assets' and public.is_organization_member(((storage.foldername(name))[1])::uuid));
create policy organization_assets_delete on storage.objects for delete to authenticated using (bucket_id = 'organization-assets' and public.has_organization_role(((storage.foldername(name))[1])::uuid, array['owner','manager']::public.organization_member_role[]));

alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
