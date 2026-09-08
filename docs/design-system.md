# SyndeoCare Design System Conventions

## Foundations
- Brand identity remains teal-first (`brand-*`) with semantic tokens layered for UI behavior.
- Semantic variables live in `apps/web/src/app/globals.css`:
  - Surfaces: `--background`, `--surface`, `--surface-muted`
  - Text: `--foreground`, `--text-muted`
  - Interaction: `--primary`, `--primary-foreground`, `--ring`
  - Status: `--success`, `--warning`, `--danger`, `--info`
  - Structure: `--border`, `--shadow`

## Theming
- Appearance modes: `light`, `dark`, `system`.
- Persisted key: `localStorage["syndeocare:appearance"]` (non-sensitive preference only).
- Initial no-flash resolution script in locale layout sets `document.documentElement.dataset.theme`.

## Shared primitives
- `Button` variants now resolve against semantic tokens.
- `Card` uses unified semantic surface/border/shadow.
- `Field` primitives use semantic border/surface/ring and include `FieldHint`.

## Shared UX patterns
- `PageHeader`: consistent eyebrow/title/description/action framing for route headers.
- `EmptyState`: consistent icon/title/description/action for no-data cases.
- `ActionRow`: full-width actionable row pattern for “next step” lists.

## Accessibility and bidi conventions
- Keep explicit page `<h1>` per route for clear route announcements.
- Maintain visible focus rings via semantic `--ring`.
- Use `.bidi-isolate` for mixed RTL/LTR strings (dates, numbers, identifiers) in Arabic contexts.

## Usage guidance
- Prefer semantic classes (`app-surface`, `app-text`, `app-border`, etc.) for new UI work.
- Avoid introducing page-specific one-off color tokens unless needed for a clear product state.
