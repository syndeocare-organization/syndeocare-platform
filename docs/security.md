# Security baseline

## Implemented

- Supabase SSR cookies with server-side claim/user validation.
- Bearer-token validation for native clients.
- Row Level Security on every user-facing domain table.
- Private verification-document bucket and user-scoped storage paths.
- Service-role and Resend modules marked server-only.
- Shared Zod request contracts with size and format limits.
- Origin checks on all state-changing API routes.
- CSP, frame denial, MIME sniffing prevention, referrer policy, and restrictive
  browser permissions.
- Minimal profile DTOs and no client exposure of admin credentials.
- Account deletion endpoint requiring authentication and explicit confirmation.
- Auditable onboarding events and immutable application identity fields.

## Before production

- Test policies against real Supabase roles using negative access cases.
- Add rate limiting at Vercel Firewall or a durable store for contact, auth, and
  application submission endpoints.
- Enable breached-password protection, MFA for administrators, and mandatory MFA
  for infrastructure owners.
- Use separate Preview and Production secrets and projects.
- Rotate any credential that was previously exposed or shared outside a secret store.
- Add centralized error tracking with health-data scrubbing.
- Confirm data residency, retention, consent, and vendor agreements with counsel.
- Complete a threat model before enabling uploads or clinical/health information.
