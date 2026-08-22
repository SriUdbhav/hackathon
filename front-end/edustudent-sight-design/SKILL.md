---
name: edustudent-sight-design
description: Visual design system and frontend conventions for the EduStudent Sight academic-intelligence platform (faculty/mentor/student risk dashboard). Use this whenever writing or refactoring any HTML/CSS/JS under front-end/, adding a new page, panel, card, chart, badge, or modal, or when the user asks to "improve the UI", "fix the styling", "add dark mode / light mode / sepia mode", "add a theme switcher", "replace the emoji/icons", or says the UI "looks like AI slop" / "looks generic" / "needs to look professional". Enforces no JS UI frameworks (React/Angular/Vue are out; Bootstrap, Tailwind, or raw CSS are all fine), zero emoji used as functional icons anywhere in the UI, a three-theme token system (soft white, sepia, dark) built on Linux-ricing color schemes sourced from their official repos (Catppuccin, Tokyo Night, Gruvbox), and a calm, data-forward, non-templated visual identity appropriate for faculty-facing academic software. Do not use this skill for backend logic, API, or database work — it is styling/markup only.
---

# EduStudent Sight — Frontend Design

Approach this like the design lead brought in to give a real product its own identity — not another hackathon dashboard that looks like it was scaffolded from a Bootstrap admin template. EduStudent Sight is software a faculty mentor opens between classes to decide who needs help this week. It has to read as calm, precise, evidence-based tooling — closer to a well-themed terminal, Grafana, or Linear than a marketing-y "AI-powered!" SaaS landing page. Judges and real users should feel this was designed on purpose, by someone with taste, not generated.

## Non-negotiable constraints

- **No JS UI frameworks.** No React, Angular, Vue, Svelte, or any component framework — this stays plain HTML with the existing vanilla-JS structure (`js/pages/*.js`). Bootstrap and Tailwind are both fine to use for layout/utilities, and so is raw hand-written CSS — the constraint is "no JS framework," not "no CSS framework." Chart.js and marked.js also stay; they're functional libraries (charting, markdown rendering), not UI frameworks.
- **If keeping Bootstrap, re-skin it — don't leave it default.** Bootstrap's own component look (the default blue, default card shadow, default badge pills) is what currently reads as generic. Load `css/tokens.css` after `bootstrap.min.css` and override `.btn-primary`, `.card`, `.badge`, `.navbar`, etc. to pull from the theme tokens below, so nothing on the page is still wearing stock Bootstrap styling.
- **No emoji as UI icons, anywhere.** This is the one that's actually urgent (see the demo-logins card) — see "Icons: kill the emoji" below for the replacement and exact icon picks.
- **Three themes, not two.** Soft white (light), sepia (warm reading mode), dark. See "The theme system" below. All three must exist before this is considered done — don't ship just dark mode.
- **One source of truth for tokens.** Right now `--primary`, `--text`, `--border` etc. are declared identically in both `style.css` and `css/base.css`. Consolidate into a single `css/tokens.css` loaded first (after Bootstrap, if you keep it), and delete the duplicate `:root` blocks. Every other CSS file should only ever reference `var(--token-name)`, never a hardcoded hex.

## Ground it in the subject

The product combines attendance, assessments, LMS activity, and mentor notes into an explainable risk profile. The UI's job is to make a mentor trust a number they didn't calculate themselves. That means:

- Numbers, IDs, timestamps, and risk scores get a monospace treatment — it reads as precise and engineering-grade, and it's a deliberate nod to the terminal/IDE aesthetic rather than a decorative flourish.
- Color communicates severity and state, and nothing else. Don't decorate with the accent color; reserve it for things the mentor actually needs to notice.
- Whitespace is generous but not wasted — this is a data-dense operational tool, not a hero-image landing page. Don't add hero sections, big marketing headlines, or scroll-triggered reveal animations to the dashboard itself (those belong on a marketing page, if you ever build one — not the app).

## The theme system

Three themes, same CSS variable names, different values, switched via `data-theme="soft-white" | "sepia" | "dark"` on `<html>`. Persist the choice in `localStorage`; on first load, default `dark` if `prefers-color-scheme: dark` else `soft-white`. Read exact hex tokens from `references/palette-tokens.md` — don't invent new ones ad hoc.

1. **Soft white (default light)** — built on **Catppuccin Latte**. Not stark `#ffffff`-on-`#ffffff`; a slightly cool, muted off-white base with a soft blue/lavender accent. This is what most users see first, so it carries the "professional" read.
2. **Sepia** — built on **Gruvbox Light**. Warm cream/amber base, low blue-light, meant for long analytics/report-reading sessions — the same instinct as an e-reader's sepia mode or Zathura's sepia colorscheme. This is the theme that most differentiates the product from a generic dashboard, so don't skip it or treat it as an afterthought.
3. **Dark** — built on **Catppuccin Mocha** by default, with **Catppuccin Macchiato** and **Tokyo Night (Storm)** as drop-in alternates (same variable names — see reference file). Soft pastel dark, never pure black (`#000`) and never a harsh near-black-with-neon-accent combo — that combo is one of the current AI-generated-design clichés, and it reads as trend-chasing rather than considered.

Build a small theme switcher — a segmented control with 3 states (sun / book / moon icons, inline SVG), placed in the header next to the notification bell. It's plain CSS + `localStorage`, no framework, no dependency.

**Chart.js must be re-themed on theme change.** Chart.js doesn't read CSS variables automatically — on theme switch, re-read the active token values via `getComputedStyle(document.documentElement)` and update `Chart.defaults` (grid line color, tick color, tooltip background) before re-rendering, or charts will stay light-themed inside a dark page. Put this in one shared helper (e.g. `js/chart-theme.js`) that every `js/pages/*.js` chart call goes through, instead of re-implementing it per page.

## Icons: kill the emoji

The demo-logins card (👑 Admin, 📚 Faculty, ⭐ Mentor, 👤 Student, ⚠️ High risk) is the clearest "AI slop" tell in the current build — emoji as functional UI icons reads as unfinished/prototype, not as a product. Replace every one of them with a real SVG icon set. Pick one of these and use it consistently everywhere in the app, not just this card:

1. **Lucide** (recommended) — MIT-licensed, minimal stroke icons, the same set used across most modern dev tools (Linear, GitHub-adjacent products). Fits the terminal/dev-tool identity this product is going for. Grab raw SVGs from lucide.dev or the `lucide-static` package and vendor them locally — no React needed, just copy the `<svg>` markup.
2. **Heroicons** — Tailwind's own icon set, same idea, slightly more rounded. Equally good, use if you're leaning on Tailwind elsewhere.
3. **Bootstrap Icons** — already loaded in this project (`bootstrap-icons@1.11.3`). Fine to keep using if you're keeping Bootstrap — it's a legitimate, well-made set. The requirement is "no emoji," not "no Bootstrap Icons."

Whichever set you pick, size icons 16–20px, `stroke="currentColor"` so they inherit the active theme's text/accent color, and never mix two icon sets on the same screen.

Exact replacements for the demo-logins card (Lucide names given; look up the equivalent in your chosen set if different):

| Role | Current emoji | Replace with |
|---|---|---|
| Admin (full system access) | 👑 | `crown` or `shield-check` |
| Faculty | 📚 | `graduation-cap` |
| Mentor | ⭐ | `compass` (guidance) or `star` |
| Student (own stats) | 👤 | `user` |
| Student — high risk | ⚠️ | `triangle-alert`, paired with `--risk-high` color |

See `references/component-patterns.md` for how this card should be restyled beyond just the icon swap.

## Avoiding "AI slop"

Calibration for what to avoid, since the current build already exhibits some of this: rounded-pill badges on everything, `box-shadow: 0 0 5px rgba(0,0,0,.1)` on every card regardless of whether it needs to float, Bootstrap's exact 8px spacing scale used unquestioningly, one blue accent used for buttons *and* links *and* active nav *and* chart bars *and* the logo (dilutes the color until it stops meaning anything). Also avoid the more general 2026 AI-generated-design tells: warm cream background + high-contrast serif + terracotta accent; pure-black background + single neon accent; broadsheet-style hairline-rule newspaper columns. None of those fit an academic risk dashboard anyway — but call them out explicitly so you don't drift into one by default.

Instead:
- Use the accent color (per active theme, see reference file) only for: the primary action button, the active sidebar item, and links. Everything else is neutral surface + text tokens.
- Severity/risk gets its **own** small token set (`--risk-high`, `--risk-medium`, `--risk-low`) distinct from the general accent — defined per theme in the reference file — so "this button is clickable" and "this student is high-risk" are never the same color doing two jobs.
- Cards: thin 1px border (`--border` token) instead of a drop shadow as the default resting state; reserve shadow/elevation for genuine overlays (modals, dropdowns, the notification panel).
- Signature element: style the "explainable risk factor breakdown" (wherever the AI shows *why* a student is flagged) like a terminal diff or an `htop`-style horizontal bar readout — monospace labels, thin bars, no drop shadows, no gradient fills. This is the one place it's worth spending real design effort, precisely because it's the feature that makes this product different from a generic dashboard, and it should look different from every other card on the page.

## Copy and microcopy

Faculty are the audience, not consumers — cut marketing language. "AI-Powered Insights!" becomes "Risk factors" or "Why this student is flagged." Buttons say exactly what happens: "Start intervention," not "Get started." Empty states explain what to do next ("No interventions yet — add one from a student's profile") rather than a vague illustration. Errors state what happened and how to fix it, in plain terms, never an apology.

## Process for this specific refactor

Since this is an existing, working app (don't break the JS logic in `js/pages/*.js` while restyling):

1. **Audit first.** Grep the CSS files for hardcoded hex values and any emoji characters in the HTML/JS (`grep -rP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" front-end/`) before touching markup, so you know the real scope.
2. **Build `css/tokens.css`** with all three themes' variables (from `references/palette-tokens.md`), loaded after `bootstrap.min.css` (if kept) and before `base.css`.
3. **Migrate one CSS file at a time** (`base.css` → `components.css` → `pages.css` → `style.css`), replacing hardcoded colors with `var(--token)` and overriding any default Bootstrap component styling that's still showing through. Re-check the page in the browser after each file.
4. **Swap emoji for the chosen icon set** everywhere they appear — the demo-logins card first (it's the most visible), then sweep the rest of the app.
5. **Add the theme switcher and `js/chart-theme.js` last**, once the static theming works, since it depends on the tokens existing everywhere.
6. **Self-critique before calling it done:** check all three themes on the login page, dashboard, students table (mentioned as needing horizontal scroll, not wrapping), and at least one chart. Check keyboard focus is visible in all three themes. Confirm no emoji remain anywhere in the UI. Don't ship a theme that only looks right in dark mode.

For exact hex values, semantic token names, and ready-to-paste CSS blocks for all three themes (plus the Macchiato/Tokyo Night dark alternates), read `references/palette-tokens.md`. For concrete before/after guidance on specific components (sidebar, login page, badges, tables, buttons, modals), read `references/component-patterns.md`.

## Decision tree

- Task mentions "theme", "dark mode", "sepia", "light mode", or a switcher → `references/palette-tokens.md`, then wire up `data-theme` + the switcher described above.
- Task is "add/redesign a page or component" → `references/component-patterns.md` first, reuse existing tokens, don't invent new one-off colors.
- Task is "make it look less generic / more professional / not AI slop" → re-read "Avoiding AI slop" above; usually the fix is removing decoration (extra shadows, gradients, redundant accent color use), not adding more.
- Task is a **bug fix** unrelated to visuals (e.g. the risk-threshold settings not propagating, remember-me not working, search box not working — see `changes_or_issues.txt`) → that's application logic, not a styling task. Fix the JS/data flow; don't restyle the page while you're in there unless asked.
