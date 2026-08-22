# Component patterns

Concrete guidance per component. Always via `var(--token)` from `palette-tokens.md` — no hardcoded hex here or in the actual CSS.

## Login page

Current: generic centered white card, blue radial gradient blob, Bootstrap Icons badge. Keep the centered-card structure (it's fine for a login page) but:
- Background: `var(--bg-sunken)` with a very subtle, single soft gradient using `--accent-soft` at low opacity — not a bright radial blob.
- Card: `var(--bg-elevated)`, 1px `var(--border)`, `var(--shadow)` (this is one of the few places elevation shadow is earned — it's a modal-like focal object on an otherwise empty page).
- Logo mark: keep it simple and geometric, not a Bootstrap Icon glyph in a colored square — a small inline SVG monogram works well and is the first thing that signals "not a template."
- Add the theme switcher here too (top-right corner) — it's the first thing a returning user sees, and it should already reflect their saved preference.
- Role badges (Faculty / Mentor / Student / Admin, once role-based UAC is added per `changes_or_issues.txt` item 1): small monospace pill using the role's designated token, not a Bootstrap `badge-primary`.

## Quick demo logins card (login page)

Current version uses 👑/📚/⭐/👤/⚠️ emoji next to each role, magenta monospace credentials, and a light purple card — this is the single most visible "unfinished prototype" signal in the app, since it's the first interactive thing a judge or new user sees. Fix:

- Card: `background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px;` — no purple tint, matches the rest of the app's card style.
- Header ("Quick demo logins"): small-caps or uppercase, `--text-muted`, with a plain `chevron-down`/`info` SVG icon instead of the current hand-drawn arrow glyph.
- Each row: replace the emoji with the icon from the table above, 18px, `stroke="currentColor"`, colored `--text-soft` at rest. Role name stays `--font-body` semibold; the parenthetical description (e.g. "DR. RAMESH — DBMS, OS") stays `--text-muted`, smaller.
- Credentials (`admin / admin123`): keep them monospace — that part is already right — but pull the color from `var(--accent)` instead of a hardcoded magenta/pink, so it themes correctly across soft-white/sepia/dark instead of staying one fixed color regardless of theme.
- High-risk student row: this is the one place in this card where color should carry meaning — use `var(--risk-high)` for the `triangle-alert` icon specifically, while every other row's icon stays neutral `--text-soft`. Don't color-code the other rows by role; only risk level gets a semantic color.

## Sidebar

Current: white, thin border, blue square logo, Bootstrap-ish nav items. Keep the collapse behavior (it works), but:
- `background: var(--sidebar-bg)` (deliberately distinct from `--bg` in dark/sepia — gives structure without a shadow).
- Active nav item: left border-accent (2–3px, `var(--accent)`) + `var(--accent-soft)` background tint. Not a filled pill/rounded-full button — that's a very common default that reads as templated.
- Icons: 18–20px inline SVG, `stroke="currentColor"`, so they inherit `--text-soft` at rest and `--accent` when active — no icon font.
- Nav labels stay `--font-body`; nothing in the sidebar needs monospace.

## Cards / stat tiles

Current: Bootstrap `.card` with border-radius + `box-shadow` on every single one. Instead:
- Default resting state: `background: var(--bg-elevated); border: 1px solid var(--border);` — no shadow.
- Corner radius: pick one value (e.g. 8px) and use it everywhere; don't mix radii.
- Big stat numbers (e.g. "at-risk count", "average score"): `--font-mono`, tabular-nums, larger weight; label above in small-caps `--text-muted` `--font-body`.
- Trend indicator (up/down vs last period): small inline arrow SVG + `--risk-low`/`--risk-high` text color, not a colored badge chip.

## Severity / risk badges

This is the one place color should carry real meaning, so keep it consistent everywhere a risk level appears (dashboard, students list, student 360, reports):
- High risk: `color: var(--risk-high); background: var(--risk-high-soft);`
- Medium: `var(--risk-medium)` / `var(--risk-medium-soft)`
- Low: `var(--risk-low)` / `var(--risk-low-soft)`
- Shape: small rounded rectangle (not a full pill), monospace label ("HIGH" / "MED" / "LOW" or a numeric score), never combined with the general `--accent` color — a mentor should be able to scan a table by color and never confuse "clickable" with "at risk."

## Tables (students list, reports)

`changes_or_issues.txt` item 4 asks for no text wrapping — horizontal scroll instead. Implement with a wrapping `.table-scroll { overflow-x: auto; }` container, `white-space: nowrap` on cells, and a subtle `--border-soft` bottom-border-only row style (no zebra striping, which tends to fight with three different theme backgrounds) — striping in particular is easy to get wrong across sepia/dark and often reads as template default. Row hover: `background: var(--bg-sunken)`. Numeric columns (IDs, scores, attendance %) get `--font-mono` and right-aligned or tabular-nums.

## Buttons

- Primary: `background: var(--accent); color: var(--accent-contrast);` solid, no gradient.
- Secondary: `background: transparent; border: 1px solid var(--border); color: var(--text);`
- Destructive (e.g. remove student, end intervention): use `--danger`, but only for the button itself when the action is genuinely destructive — don't tint every "close" or "cancel" button red.
- No Bootstrap-style `btn-outline-*` rainbow of one button per accent color. Two button styles (primary, secondary) plus one destructive variant is enough for this whole app.

## Explainable risk factor breakdown (signature component)

Wherever the AI shows *why* a student is flagged (student 360, anomalies section, reports) — this is the component worth the most design attention, since it's the feature that differentiates the product.

Pattern: a stacked list of factors (e.g. "Attendance", "Assignment completion", "LMS activity", "Assessment trend"), each row:
```
Attendance        ███████░░░  72%   ↓ 12% vs last month
```
- Factor name: `--font-body`, `--text-soft`.
- Bar: thin (6–8px tall), `--bg-sunken` track, filled with the risk-tier color for that specific factor's contribution (not one single accent color for all bars).
- Percentage + trend: `--font-mono`.
- No gradient fills, no drop shadow, no rounded pill container around the whole thing — let it sit directly on the card background like a terminal readout.

## Charts (Chart.js)

- Grid lines: `var(--border-soft)`, very low opacity.
- Axis/tick text: `var(--text-muted)`, small size, `--font-mono` for numeric axes.
- Line/bar colors: pull from the risk tokens when the chart is about risk/engagement trend; use `--accent` + one or two neutral grays for anything that's just a general metric (don't rainbow every series).
- Tooltip: `background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text);` — match the card style, not Chart.js's default dark tooltip (which will look wrong specifically in sepia/light themes).
- Re-apply all of the above from `js/chart-theme.js` on every theme switch — see SKILL.md.

## Modals / dropdowns / notification panel

These are the legitimate places for `var(--shadow)` and slightly higher elevation (`--bg-elevated` on top of a scrim `rgba(0,0,0,.4)` regardless of theme, since it's covering the whole viewport). Keep entrance animation to a single, quick (150–200ms) fade + 4px translate — no bounce, no multi-stage sequences.

## Focus states (accessibility, all three themes)

`:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }` on every interactive element, in all three themes — check it's visible against `--bg-elevated` in sepia and dark specifically, since a low-contrast accent can disappear on a busy background. Respect `prefers-reduced-motion` by disabling the modal transition and any hover-lift effects.
