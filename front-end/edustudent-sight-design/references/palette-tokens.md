# Palette tokens

Semantic variable names stay identical across all three themes — only the values change per `[data-theme="..."]` block. Never reference a raw hex value in `base.css`, `components.css`, `pages.css`, or `style.css`; always go through `css/tokens.css`.

**Sources — every hex value below is pulled directly from the flavor's official repo, not approximated:**
- Catppuccin (Latte, Mocha, Macchiato): [`catppuccin/palette` → `palette.json`](https://github.com/catppuccin/palette/blob/main/palette.json) — the canonical source the whole Catppuccin ecosystem generates ports from.
- Tokyo Night (Storm): [`folke/tokyonight.nvim` → `extras/lua/tokyonight_storm.lua`](https://github.com/folke/tokyonight.nvim/blob/main/extras/lua/tokyonight_storm.lua) — the `colors` table at the top of that file.
- Gruvbox (Light): [`morhetz/gruvbox`](https://github.com/morhetz/gruvbox) — `light0_hard`/`light0`/`light1`/`dark1-4` family, cross-checked against `morhetz/gruvbox-contrib`'s `color.table`.
- Rose Pine (Dawn) and Nord are given as-is from [rosepinetheme.com](https://rosepinetheme.com/palette/) and [nordtheme.com](https://www.nordtheme.com/docs/colors-and-palettes) respectively, for the alt-light-scheme section — verify there directly if you switch to one of these as your primary.

If you ever add a flavor not listed here, pull it from the project's own repo/site the same way rather than eyeballing a screenshot — Catppuccin and Tokyo Night in particular have near-duplicate community forks with slightly shifted values floating around, and mixing a fork's numbers with the official ones is how you end up with a palette that's subtly off.

Drop this whole block into `css/tokens.css`, loaded before every other stylesheet.

```css
/* =====================================================
   TOKENS — semantic variables, three themes
   ===================================================== */

/* ---------- SOFT WHITE (default light) — Catppuccin Latte ---------- */
:root,
[data-theme="soft-white"] {
    --bg: #eff1f5;
    --bg-elevated: #ffffff;
    --bg-sunken: #e6e9ef;
    --border: #ccd0da;
    --border-soft: #dce0e8;

    --text: #4c4f69;
    --text-soft: #5c5f77;
    --text-muted: #8c8fa1;

    --accent: #1e66f5;
    --accent-soft: #dce4fb;
    --accent-contrast: #ffffff;

    --link: #7287fd;

    --risk-high: #d20f39;
    --risk-high-soft: #f6dadf;
    --risk-medium: #fe640b;
    --risk-medium-soft: #fde4d3;
    --risk-low: #40a02b;
    --risk-low-soft: #ddf1d8;

    --success: #40a02b;
    --danger: #d20f39;
    --warning: #df8e1d;
    --info: #209fb5;

    --sidebar-bg: #ffffff;
    --code-bg: #e6e9ef;
    --shadow: 0 2px 10px rgba(76, 79, 105, 0.08);
}

/* ---------- SEPIA (warm reading mode) — Gruvbox Light ---------- */
[data-theme="sepia"] {
    --bg: #fbf1c7;
    --bg-elevated: #f9f5d7;
    --bg-sunken: #ebdbb2;
    --border: #d5c4a1;
    --border-soft: #e2d4b0;

    --text: #3c3836;
    --text-soft: #504945;
    --text-muted: #7c6f64;

    --accent: #af3a03;
    --accent-soft: #f2d9b8;
    --accent-contrast: #fbf1c7;

    --link: #b16286;

    --risk-high: #9d0006;
    --risk-high-soft: #f2d3ce;
    --risk-medium: #d65d0e;
    --risk-medium-soft: #f5e0c8;
    --risk-low: #79740e;
    --risk-low-soft: #e6e6ba;

    --success: #79740e;
    --danger: #9d0006;
    --warning: #b57614;
    --info: #427b58;

    --sidebar-bg: #f9f5d7;
    --code-bg: #ebdbb2;
    --shadow: 0 2px 10px rgba(60, 56, 54, 0.10);
}

/* ---------- DARK — Catppuccin Mocha (default dark) ---------- */
[data-theme="dark"] {
    --bg: #1e1e2e;
    --bg-elevated: #232336;
    --bg-sunken: #181825;
    --border: #313244;
    --border-soft: #292c3c;

    --text: #cdd6f4;
    --text-soft: #bac2de;
    --text-muted: #9399b2;

    --accent: #89b4fa;
    --accent-soft: #2a3654;
    --accent-contrast: #1e1e2e;

    --link: #b4befe;

    --risk-high: #f38ba8;
    --risk-high-soft: #3a2530;
    --risk-medium: #fab387;
    --risk-medium-soft: #3a2f24;
    --risk-low: #a6e3a1;
    --risk-low-soft: #223225;

    --success: #a6e3a1;
    --danger: #f38ba8;
    --warning: #f9e2af;
    --info: #74c7ec;

    --sidebar-bg: #181825;
    --code-bg: #11111b;
    --shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}
```

## Dark alternates (swap-in, same variable names)

Offer these as extra options inside the theme switcher's dark slot (e.g. a small "scheme" sub-picker), or just pick one as the single dark theme instead of Mocha — keep the variable names identical either way so no other CSS needs to change.

### Catppuccin Macchiato (softer contrast than Mocha)

```css
[data-theme="dark"][data-scheme="macchiato"] {
    --bg: #24273a;
    --bg-elevated: #292c3c;
    --bg-sunken: #1e2030;
    --border: #363a4f;
    --text: #cad3f5;
    --text-soft: #b8c0e0;
    --text-muted: #939ab7;
    --accent: #8aadf4;
    --accent-soft: #2e3a56;
    --link: #b7bdf8;
    --risk-high: #ed8796;
    --risk-medium: #f5a97f;
    --risk-low: #a6da95;
    --sidebar-bg: #1e2030;
    --code-bg: #181926;
}
```

### Tokyo Night (Storm)

```css
[data-theme="dark"][data-scheme="tokyonight"] {
    --bg: #24283b;
    --bg-elevated: #292e42;
    --bg-sunken: #1f2335;
    --border: #3b4261;
    --text: #c0caf5;
    --text-soft: #a9b1d6;
    --text-muted: #737aa2;
    --accent: #7aa2f7;
    --accent-soft: #2a3457;
    --link: #bb9af7;
    --risk-high: #f7768e;
    --risk-medium: #ff9e64;
    --risk-low: #9ece6a;
    --sidebar-bg: #1f2335;
    --code-bg: #16161e;
}
```

## Alternate light schemes (if you want to swap the default later)

Same idea — drop in as `[data-theme="soft-white"][data-scheme="..."]` overrides.

### Rose Pine Dawn

```css
[data-theme="soft-white"][data-scheme="rosepine"] {
    --bg: #faf4ed;
    --bg-elevated: #fffaf3;
    --bg-sunken: #f2e9e1;
    --border: #dfdad9;
    --text: #575279;
    --text-soft: #797593;
    --text-muted: #9893a5;
    --accent: #286983;
    --accent-soft: #dbe4ea;
    --link: #907aa9;
    --risk-high: #b4637a;
    --risk-medium: #ea9d34;
    --risk-low: #56949f;
    --sidebar-bg: #fffaf3;
}
```

### Nord (Snow Storm)

```css
[data-theme="soft-white"][data-scheme="nord"] {
    --bg: #eceff4;
    --bg-elevated: #ffffff;
    --bg-sunken: #e5e9f0;
    --border: #d8dee9;
    --text: #2e3440;
    --text-soft: #3b4252;
    --text-muted: #4c566a;
    --accent: #5e81ac;
    --accent-soft: #dce5f0;
    --link: #81a1c1;
    --risk-high: #bf616a;
    --risk-medium: #d08770;
    --risk-low: #a3be8c;
    --sidebar-bg: #ffffff;
}
```

## Typography tokens

```css
:root {
    --font-body: "Inter", -apple-system, sans-serif;
    --font-mono: "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}
```

- `--font-body` for all prose, labels, nav, buttons.
- `--font-mono` for: student IDs, timestamps, risk scores/percentages, table numeric columns, code-like output (AI agent responses that include data), the risk-factor breakdown component. This is the main typographic personality choice — it's what stops the UI reading as an anonymous Inter-on-white template, and it ties the product back to a developer-tool aesthetic that suits an "explainable AI" pitch.
- Keep Inter for body/UI text rather than swapping to another humanist sans — the mono/sans contrast is the distinctive choice here, not a display-font swap. Don't add a third typeface.
