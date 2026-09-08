-- Supabase grants routine execution to API roles by default. Trigger-only
-- functions must never be reachable through PostgREST RPC endpoints.

revoke execute on function public.enforce_application_transition() from anon, authenticated;
revoke execute on function public.handle_application_workflow() from anon, authenticated;
revoke execute on function public.handle_new_message() from anon, authenticated;

-- This RPC is intentionally available only after authentication; the body
-- additionally verifies an existing organization membership for auth.uid().
revoke execute on function public.complete_organization_member_onboarding(text, text, text, text, text) from anon;
grant execute on function public.complete_organization_member_onboarding(text, text, text, text, text) to authenticated;

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id, conversation_id);

create index if not exists audit_events_actor_idx
  on public.audit_events (actor_id, created_at desc);
