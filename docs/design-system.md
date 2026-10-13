# HMP dashboard design system

One system for every logged-in screen — the user dashboard (`app/(dashboard)`) and the Admin
Panel (`app/(admin)`). The public marketplace does not use it and is unaffected by it.

## Files

| What | Where |
|---|---|
| Tokens (colour, type, spacing, radius, elevation, motion, layout) | `app/_tokens.scss` |
| Component styles (`ha-*` classes) | `app/_ui-kit.scss` |
| User dashboard shell + template compatibility layer | `app/_dashboard.scss` |
| Admin Panel shell (dark sidebar) | `app/_admin-panel.scss` |
| React components | `components/ui/kit.tsx` (the Admin Panel re-exports it from `components/admin/ui.tsx`) |
| Page frame | `components/dashboard/DashboardPage.tsx` |

Everything is scoped under `.hmp-ui`. The dashboard root also carries `.hmp-dash`; the Admin
Panel root carries `.hmp-admin`.

## Tokens

- **Colour.** Neutral base (`--hmp-bg`, `--hmp-surface`, `--hmp-surface-2/3`, `--hmp-border`,
  `--hmp-text`, `--hmp-text-2`, `--hmp-text-3`) plus one accent, `--hmp-primary`, used only for
  actions, focus and selection. Status colours (`--hmp-success|warning|danger` and `-soft`
  tints) carry meaning only — never decoration. Every text pair meets WCAG 2.2 AA (contrast is
  noted next to each token); form-control borders use `--hmp-input-border` (3:1, WCAG 1.4.11).
- **Type.** Inter, 12/13/14/16/20/24/32 (`--hmp-fs-*`), tabular numbers for figures (`.ha-num`),
  running text capped at `--hmp-measure` (68ch).
- **Space.** 4-pt grid, `--hmp-space-1` (4px) to `--hmp-space-12` (48px).
- **Shape.** Radius 6/8/12, three elevations (`--hmp-elev-1..3`).
- **Motion.** 120–180 ms, only for state changes (menus, hover, progress). All motion is removed
  under `prefers-reduced-motion`.

## Components (`components/ui/kit.tsx`)

| Component | Use it for |
|---|---|
| `DashboardPage` | Every page: one `h1`, a one-line description, primary actions top-right, optional breadcrumb (`eyebrow`). |
| `Card`, `CardBody`, `Stats`/`StatCard`, `Tile` | Surfaces, headline numbers, navigation tiles. |
| `DataTable` | Tables: hidden caption, `th scope`, rows stack into labelled cards on phones (give each `td` a `data-label`). |
| `useListControls` + `DataToolbar` | Client-side search, filters and sort over a list already on screen, with active-filter chips, "Clear all" and a live result count. |
| `FilterChips` | Active-filter chips for server-side filters. |
| `NoMatches`, `EmptyState`, `LoadingTable`, `LoadingRows`, `ErrorNotice`, `Notice` | Empty, loading, error and success states. Errors use `role="alert"`, the rest `role="status"`. |
| `StatusBadge` / `Badge` | Status as text plus a dot, toned by meaning (`statusTone`). Never colour alone. |
| `ActionMenu` | Secondary row actions behind "More", so each row has one clear primary action. |
| `Tabs`, `Pager`, `Modal`, `Select`, `useToast` | Segmented filters (arrow-key navigation), pagination, focus-trapped dialogs, a native select with NiceSelect's props, toasts. |
| `formatMoney`, `formatDate`, `humanize` | Consistent £, en-GB dates and readable status names. |

Buttons are `ha-btn` with one modifier: `is-primary` (one per area), default (secondary),
`is-ghost`, `is-danger` / `is-danger-solid`, sizes `is-sm`, `is-block`, `is-icon`. Set
`aria-busy` while an action is in flight.

## Rules of thumb

1. One primary action per area. Everything else is secondary, ghost or in an `ActionMenu`.
2. Lists get `DataToolbar` (or `FilterChips` when filtering happens on the server).
3. Every list has all four states: loading skeleton, error, empty (with the way forward), results.
4. Labels on every control: a visible `<label htmlFor>` in forms, `aria-label` in dense rows.
5. Tokens only — no hex values or inline font sizes in components.
