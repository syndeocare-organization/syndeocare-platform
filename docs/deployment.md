# Deployment runbook

## Resource ownership

| Resource | Required owner |
|---|---|
| GitHub repository | SyndeoCare |
| Supabase organization and projects | SyndeoCare |
| Resend team and sending domain | SyndeoCare |
| DNS and `syndeocare.ai` | SyndeoCare |
| Vercel project and deployments | Designated deployment account |

Never copy service-role keys, SMTP/API keys, database passwords, or recovery codes
into GitHub, issue comments, chat messages, or client-side environment variables.

## Preview setup

1. Create `syndeocare-dev` in the SyndeoCare Supabase organization.
2. Apply all files in `supabase/migrations` to the development project.
3. Configure Auth site URL and redirect URLs for localhost and the Vercel Preview.
4. Import the repository in Vercel with root directory `apps/web`.
5. Add the variables in `.env.example` to the Preview environment.
6. Deploy without a custom domain.
7. Run unit, contract, production-build, accessibility, desktop, and mobile tests.
8. Test both user roles from registration through onboarding and account deletion.

## Production promotion gate

- [ ] A separate production Supabase project exists and migrations pass cleanly.
- [ ] Database backups and point-in-time recovery match the launch risk.
- [ ] RLS tests cover professional, organization, admin, and anonymous access.
- [ ] Resend sending subdomain is verified and a scoped production API key is used.
- [ ] Support, privacy, and deletion pages are public and monitored.
- [ ] Apple and Google reviewer accounts and instructions are ready.
- [ ] Current Route 53/GoDaddy DNS, including all MX and TXT records, is exported.
- [ ] Preview smoke tests and mobile API tests are green.
- [ ] Error monitoring, runtime logs, and an incident owner are configured.
- [ ] No protected health data is accepted until the legal/compliance design is approved.

Only after the gate passes should `app.syndeocare.ai`, `api.syndeocare.ai`, and
the apex domain be attached. DNS changes must not remove email records.

## Rollback

Use Vercel deployment promotion to restore the last healthy application version.
Database changes must be backward-compatible during a release; destructive schema
changes require a separate data migration and verified backup. Do not roll back
the application to a version that cannot read the current schema.
