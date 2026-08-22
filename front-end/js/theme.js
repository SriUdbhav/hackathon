/* =====================================================
   THEME.JS
   Three-theme switcher: soft-white, sepia, dark
   Persists to localStorage, respects prefers-color-scheme
===================================================== */

(function() {
    'use strict';

    const STORAGE_KEY = 'eduTheme';
    const VALID_THEMES = ['soft-white', 'sepia', 'dark'];

    /**
     * Detect the preferred theme on first visit.
     * Dark if prefers-color-scheme: dark, else soft-white.
     */
    function getDefaultTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'soft-white';
    }

    /**
     * Read stored theme or fall back to system preference.
     */
    function getSavedTheme() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && VALID_THEMES.includes(stored)) {
            return stored;
        }
        return getDefaultTheme();
    }

    /**
     * Apply theme to <html> element and update all switcher buttons.
     */
    function applyTheme(theme) {
        if (!VALID_THEMES.includes(theme)) theme = 'soft-white';

        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        // Update all theme switcher buttons (login page + topbar)
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.themeValue === theme);
        });

        // Re-theme Chart.js instances if the helper exists
        if (typeof refreshAllCharts === 'function') {
            // Small delay to let CSS vars propagate
            requestAnimationFrame(() => refreshAllCharts());
        }
    }

    /**
     * Get current computed CSS token values for Chart.js theming.
     * Call this after theme is applied.
     */
    window.getThemeTokens = function() {
        const style = getComputedStyle(document.documentElement);
        return {
            bg: style.getPropertyValue('--bg').trim(),
            bgElevated: style.getPropertyValue('--bg-elevated').trim(),
            bgSunken: style.getPropertyValue('--bg-sunken').trim(),
            border: style.getPropertyValue('--border').trim(),
            borderSoft: style.getPropertyValue('--border-soft').trim(),
            text: style.getPropertyValue('--text').trim(),
            textSoft: style.getPropertyValue('--text-soft').trim(),
            textMuted: style.getPropertyValue('--text-muted').trim(),
            accent: style.getPropertyValue('--accent').trim(),
            accentSoft: style.getPropertyValue('--accent-soft').trim(),
            riskHigh: style.getPropertyValue('--risk-high').trim(),
            riskMedium: style.getPropertyValue('--risk-medium').trim(),
            riskLow: style.getPropertyValue('--risk-low').trim(),
            success: style.getPropertyValue('--success').trim(),
            danger: style.getPropertyValue('--danger').trim(),
            warning: style.getPropertyValue('--warning').trim(),
            info: style.getPropertyValue('--info').trim(),
            fontMono: style.getPropertyValue('--font-mono').trim()
        };
    };

    /**
     * Expose applyTheme globally for programmatic use.
     */
    window.applyTheme = applyTheme;

    /**
     * Initialize: apply saved theme immediately (before DOM ready)
     * to avoid flash of unstyled content.
     */
    const savedTheme = getSavedTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);

    /**
     * Bind switcher buttons once DOM is ready.
     */
    document.addEventListener('DOMContentLoaded', function() {
        // Apply full theme (updates buttons)
        applyTheme(savedTheme);

        // Bind click handlers on all theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const theme = this.dataset.themeValue;
                if (theme) applyTheme(theme);
            });
        });

        // Listen for system preference changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                // Only auto-switch if user hasn't manually chosen
                const stored = localStorage.getItem(STORAGE_KEY);
                if (!stored) {
                    applyTheme(e.matches ? 'dark' : 'soft-white');
                }
            });
        }
    });
})();
