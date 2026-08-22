/* =====================================================
   CHART-THEME.JS
   Central Chart.js theme integration.
   Reads CSS design tokens and applies them to Chart.js
   defaults. Call applyChartTheme() after creating a chart,
   and refreshAllCharts() on theme switch.
===================================================== */

// Registry of active Chart.js instances for theme refresh
const _chartRegistry = [];

/**
 * Register a chart instance so it can be refreshed on theme change.
 * Call this after every `new Chart(...)`.
 * @param {Chart} chart - Chart.js instance
 */
function registerChart(chart) {
    if (!chart) return;
    // Remove any destroyed charts from the registry
    for (let i = _chartRegistry.length - 1; i >= 0; i--) {
        if (!_chartRegistry[i].canvas || !_chartRegistry[i].canvas.isConnected) {
            _chartRegistry.splice(i, 1);
        }
    }
    _chartRegistry.push(chart);
}

/**
 * Apply theme tokens to a single Chart.js instance.
 * @param {Chart} chart - Chart.js instance
 */
function applyChartTheme(chart) {
    if (!chart || !chart.options) return;

    const tokens = typeof getThemeTokens === 'function' ? getThemeTokens() : {};
    if (!tokens.text) return;

    // Scales (axes)
    if (chart.options.scales) {
        Object.values(chart.options.scales).forEach(scale => {
            if (scale.grid) {
                scale.grid.color = tokens.borderSoft;
                scale.grid.borderColor = tokens.border;
            }
            if (scale.ticks) {
                scale.ticks.color = tokens.textMuted;
                if (tokens.fontMono) {
                    scale.ticks.font = scale.ticks.font || {};
                    scale.ticks.font.family = tokens.fontMono;
                }
            }
            if (scale.title) {
                scale.title.color = tokens.textSoft;
            }
        });
    }

    // Tooltip
    if (chart.options.plugins && chart.options.plugins.tooltip) {
        const tooltip = chart.options.plugins.tooltip;
        tooltip.backgroundColor = tokens.bgElevated;
        tooltip.borderColor = tokens.border;
        tooltip.borderWidth = 1;
        tooltip.titleColor = tokens.text;
        tooltip.bodyColor = tokens.textSoft;
        tooltip.titleFont = tooltip.titleFont || {};
        tooltip.titleFont.weight = '600';
    }

    // Legend
    if (chart.options.plugins && chart.options.plugins.legend && chart.options.plugins.legend.labels) {
        chart.options.plugins.legend.labels.color = tokens.textSoft;
    }

    chart.update('none'); // Update without animation to avoid flicker
}

/**
 * Get theme-aware color palette for chart datasets.
 * Returns colors appropriate for the current theme.
 */
function getChartColors() {
    const tokens = typeof getThemeTokens === 'function' ? getThemeTokens() : {};
    return {
        accent: tokens.accent || '#1e66f5',
        riskHigh: tokens.riskHigh || '#d20f39',
        riskMedium: tokens.riskMedium || '#fe640b',
        riskLow: tokens.riskLow || '#40a02b',
        success: tokens.success || '#40a02b',
        danger: tokens.danger || '#d20f39',
        warning: tokens.warning || '#df8e1d',
        info: tokens.info || '#209fb5',
        muted: tokens.textMuted || '#8c8fa1',
        border: tokens.border || '#ccd0da',
        borderSoft: tokens.borderSoft || '#dce0e8',
        bgSunken: tokens.bgSunken || '#e6e9ef',
        text: tokens.text || '#4c4f69',
        textSoft: tokens.textSoft || '#5c5f77',
        bgElevated: tokens.bgElevated || '#ffffff'
    };
}

/**
 * Apply default Chart.js global settings for the current theme.
 * Call once on page load and again on theme switch.
 */
function setChartDefaults() {
    const tokens = typeof getThemeTokens === 'function' ? getThemeTokens() : {};
    if (!tokens.text) return;

    Chart.defaults.color = tokens.textMuted;
    Chart.defaults.borderColor = tokens.borderSoft;

    // Default font
    Chart.defaults.font.family = tokens.fontMono || '"JetBrains Mono", "Fira Code", ui-monospace, monospace';

    // Default tooltip style
    if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
        Chart.defaults.plugins.tooltip.backgroundColor = tokens.bgElevated;
        Chart.defaults.plugins.tooltip.borderColor = tokens.border;
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.titleColor = tokens.text;
        Chart.defaults.plugins.tooltip.bodyColor = tokens.textSoft;
    }
}

/**
 * Refresh all registered Chart.js instances with current theme tokens.
 * Called automatically by theme.js on theme switch.
 */
function refreshAllCharts() {
    setChartDefaults();

    for (let i = _chartRegistry.length - 1; i >= 0; i--) {
        const chart = _chartRegistry[i];
        if (!chart.canvas || !chart.canvas.isConnected) {
            _chartRegistry.splice(i, 1);
            continue;
        }
        applyChartTheme(chart);
    }
}

// Set defaults on load
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure tokens.css is parsed
    requestAnimationFrame(() => setChartDefaults());
});
