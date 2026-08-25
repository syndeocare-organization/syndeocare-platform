# Architecture decision: Vercel-first modular platform

Status: accepted on 2026-08-24.

## Decision

SyndeoCare uses a modular monolith for the first production platform:

- Next.js App Router on Vercel for the public site, authenticated web app, and
  `/api/v1` backend-for-frontend.
- Supabase Auth for identities, PostgreSQL for business data, Storage for files,
  and Realtime for messages and notifications.
- Resend for transactional email.
- Expo clients consume the same versioned API contracts as the web app.

## Why

The previous repository split an early-stage product across an API gateway,
identity, profile, clinic, scheduling, messaging, notification, NATS, Redis,
Keycloak, ECS, RDS, and S3 infrastructure. That topology created operational
cost before traffic justified it.

The new boundary keeps domain modules separate in code and data while deploying
one stateless Next.js application. It can later extract a module only when load,
team ownership, or compliance provides evidence that a separate service is useful.

## Data and authorization

`auth.users` contains identity records. `public.profiles` and domain tables
contain business records. Every user-facing table has RLS enabled. Security-definer
functions are narrowly scoped, validate `auth.uid()`, set an explicit search path,
and expose only onboarding transactions.

The API accepts either Supabase cookies for the web app or a validated Bearer
token for Expo. Server responses use minimal DTOs rather than returning complete
database rows.

## Runtime boundaries

- Static marketing and policy pages are prerendered.
- Authenticated pages render dynamically on the server.
- Vercel Functions are stateless; no workflow depends on process memory.
- Database and Vercel functions should use nearby regions.
- Long-running or regulated workflows must be evaluated separately before launch.
