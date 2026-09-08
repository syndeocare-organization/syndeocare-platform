# UX & IA Audit — SyndeoCare Platform (Web)

## Scope and method
- Repository paths reviewed: `apps/web/src/app/[locale]/**`, shared shells and UI primitives in `apps/web/src/components/**`, and data loaders in `apps/web/src/lib/data/**`.
- Verified journeys in code (not runtime-claimed): auth → onboarding → dashboard → shifts/applications/messages/notifications → profile/verification/team/admin.
- Roles verified in code: `professional`, `organization`, `admin` (`apps/web/src/lib/auth/dal.ts`).

## Route and role map (verified)
- Public/auth: locale landing, login/register, password recovery, support, privacy, terms, delete-account.
- Authenticated core: dashboard, shifts, applications, messages, notifications, profile, verification.
- Role-gated:
  - `team` for `organization`/`admin`
  - `admin` for `admin` only

## Observed UX issues (verified from code)
1. **Design token gap**: multiple components hard-code light surfaces and slate text, reducing consistency and dark-mode readiness (e.g., `ui/field.tsx`, page-level cards/forms).
2. **No persisted appearance preference**: layout was fixed to light color-scheme (`[locale]/layout.tsx`).
3. **Inconsistent page framing**: repeated custom page headings/empty states with varied spacing and copy quality across key routes.
4. **Dashboard next-step clarity**: existing home emphasized counts but gave weaker explicit “what to do next” pathways for each role.
5. **Filter/form clarity**: shifts filter inputs relied on placeholder-first clarity more than persistent labels.
6. **Arabic mixed-content readability**: dates/counts in several places lacked bidirectional isolation, which can reduce legibility in RTL mixed text.
7. **Notifications empty-state actionability**: clear empty text existed, but lacked direct next action.

## Hypotheses (not runtime-verified in this audit)
- Mobile keyboard + fixed bottom nav may still need runtime checks on very small screens for all forms.
- Some untouched pages/components may still have minor contrast/state inconsistencies in dark mode.

## Prioritized implementation checklist
- [x] Introduce semantic visual tokens (surface/text/border/primary/status) with dark theme values.
- [x] Add persisted light/dark/system appearance preference without sensitive data storage.
- [x] Update shared primitives (`Button`, `Card`, `Field`) to consume semantic tokens.
- [x] Add reusable page patterns (`PageHeader`, `EmptyState`, actionable row pattern).
- [x] Improve role-aware dashboard “next action” guidance for professional/organization/admin.
- [x] Improve key core pages (`notifications`, `shifts`, `applications`, `messages`) for consistency/actionability.
- [x] Apply bidi isolation to key date/number mixed RTL content touched by this change.
- [ ] Extend same polish to remaining less-used/edge pages after runtime QA pass.
