-- Data required by the existing Expo client, kept inside the same secured model.

alter table public.profiles
  add column if not exists region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.professional_profiles
  add column if not exists headline text,
  add column if not exists languages text[] not null default array['ar']::text[],
  add column if not exists location_radius_km integer not null default 25 check (location_radius_km between 1 and 500),
  add column if not exists rating numeric(3, 2) not null default 0 check (rating between 0 and 5);

alter table public.organizations
  add column if not exists description text,
  add column if not exists contact_phone text,
  add column if not exists website_url text,
  add column if not exists services text[] not null default '{}'::text[],
  add column if not exists region text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists rating numeric(3, 2) not null default 0 check (rating between 0 and 5);

alter table public.applications
  add column if not exists confirmed_at timestamptz,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.messages
  add column if not exists file_path text,
  add column if not exists file_type text,
  add column if not exists file_name text,
  add column if not exists file_size bigint check (file_size is null or file_size between 0 and 26214400);

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  provider text not null check (provider in ('expo')),
  platform text not null check (platform in ('android', 'ios', 'web')),
  device_id text,
  device_name text,
  app_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;

create policy push_tokens_select_self on public.push_tokens for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy push_tokens_insert_self on public.push_tokens for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy push_tokens_update_self on public.push_tokens for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy push_tokens_delete_self on public.push_tokens for delete to authenticated
  using (user_id = (select auth.uid()));

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

create or replace function public.is_organization_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('organization', 'admin')
  );
$$;

revoke execute on function public.is_organization_user() from public, anon;
grant execute on function public.is_organization_user() to authenticated;

create policy profiles_browse_verified_professionals
  on public.profiles for select to authenticated
  using (role = 'professional' and verification_status = 'verified' and public.is_organization_user());

create policy professional_profiles_browse_verified
  on public.professional_profiles for select to authenticated
  using (
    public.is_organization_user()
    and exists (
      select 1 from public.profiles
      where id = professional_profiles.user_id
        and role = 'professional'
        and verification_status = 'verified'
    )
  );

create policy messages_update_own
  on public.messages for update to authenticated
  using (author_id = (select auth.uid()) and public.is_conversation_member(conversation_id))
  with check (author_id = (select auth.uid()) and public.is_conversation_member(conversation_id));

create policy messages_delete_own
  on public.messages for delete to authenticated
  using (author_id = (select auth.uid()) and public.is_conversation_member(conversation_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-media', 'chat-media', false, 26214400, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

create policy chat_media_read on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-media'
    and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
  );
create policy chat_media_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-media'
    and public.is_conversation_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] = (select auth.uid())::text
  );
create policy chat_media_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-media'
    and owner_id = (select auth.uid())::text
  );
