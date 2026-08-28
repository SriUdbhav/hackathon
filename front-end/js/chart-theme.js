/* =====================================================
   CHART-THEME.JS
   Central Chart.js theme integration.
   Reads CSS design tokens and applies them to Chart.js
   defaults and active instances.
   Auto-registers all charts and re-themes on switch.
===================================================== */

const _chartRegistry = [];

function registerChart(chart) {
    if (!chart) return;
    for (let i = _chartRegistry.length - 1; i >= 0; i--) {
        if (!_chartRegistry[i].canvas || !_chartRegistry[i].canvas.isConnected) {
            _chartRegistry.splice(i, 1);
        }
    }
    if (!_chartRegistry.includes(chart)) {
        _chartRegistry.push(chart);
    }
}
window.registerChart = registerChart;

function applyChartTheme(chart) {
    if (!chart || !chart.options) return;

    try {
        const tokens = typeof getThemeTokens === 'function' ? getThemeTokens() : {};
        if (!tokens.text) return;

        // Ensure scales configuration object exists on chart.options
        if (!chart.options.scales) chart.options.scales = {};

        // 1. Cartesian Scales & Radial Scales
        if (chart.scales) {
            Object.keys(chart.scales).forEach(scaleKey => {
                const scale = chart.scales[scaleKey];
                const optScale = chart.options.scales[scaleKey] || (chart.options.scales[scaleKey] = {});

                if (scaleKey === 'r') {
                    // Radial / Radar scale
                    if (!optScale.grid) optScale.grid = {};
                    if (!optScale.angleLines) optScale.angleLines = {};
                    if (!optScale.pointLabels) optScale.pointLabels = {};
                    if (!optScale.ticks) optScale.ticks = {};

                    optScale.grid.color = tokens.borderSoft || '#e2e8f0';
                    optScale.angleLines.color = tokens.borderSoft || '#e2e8f0';
                    optScale.pointLabels.color = tokens.text || '#0f172a';
                    optScale.pointLabels.font = { family: 'Inter, sans-serif', size: 12, weight: '600' };
                    optScale.ticks.display = false;
                    optScale.ticks.showLabelBackdrop = false;
                    optScale.ticks.backdropColor = 'transparent';

                    if (scale.options) {
                        if (scale.options.grid) scale.options.grid.color = tokens.borderSoft || '#e2e8f0';
                        if (scale.options.angleLines) scale.options.angleLines.color = tokens.borderSoft || '#e2e8f0';
                        if (scale.options.pointLabels) {
                            scale.options.pointLabels.color = tokens.text || '#0f172a';
                            scale.options.pointLabels.font = { family: 'Inter, sans-serif', size: 12, weight: '600' };
                        }
                        if (scale.options.ticks) {
                            scale.options.ticks.display = false;
                            scale.options.ticks.showLabelBackdrop = false;
                            scale.options.ticks.backdropColor = 'transparent';
                        }
                    }
                } else {
                    if (!optScale.grid) optScale.grid = {};
                    if (!optScale.border) optScale.border = {};
                    if (!optScale.ticks) optScale.ticks = {};

                    optScale.grid.color = tokens.borderSoft || '#e2e8f0';
                    optScale.border.color = tokens.border || '#cbd5e1';
                    optScale.ticks.color = tokens.textMuted || '#64748b';

                    if (scale.options) {
                        if (scale.options.grid) scale.options.grid.color = tokens.borderSoft || '#e2e8f0';
                        if (scale.options.border) scale.options.border.color = tokens.border || '#cbd5e1';
                        if (scale.options.ticks) {
                            scale.options.ticks.color = tokens.textMuted || '#64748b';
                            scale.options.ticks.font = { family: 'Inter, sans-serif', size: 11 };
                        }
                        if (scale.options.title) {
                            scale.options.title.color = tokens.textSoft || '#334155';
                        }
                    }
                }
            });
        }

        // 2. Legend Labels
        if (!chart.options.plugins) chart.options.plugins = {};
        if (!chart.options.plugins.legend) chart.options.plugins.legend = {};
        if (!chart.options.plugins.legend.labels) chart.options.plugins.legend.labels = {};
        chart.options.plugins.legend.labels.color = tokens.text || '#0f172a';
        chart.options.plugins.legend.labels.font = { family: 'Inter, sans-serif', size: 12, weight: '500' };

        // 3. Tooltip Theme
        if (!chart.options.plugins.tooltip) chart.options.plugins.tooltip = {};
        chart.options.plugins.tooltip.backgroundColor = tokens.bgElevated || '#ffffff';
        chart.options.plugins.tooltip.borderColor = tokens.border || '#cbd5e1';
        chart.options.plugins.tooltip.borderWidth = 1;
        chart.options.plugins.tooltip.titleColor = tokens.text || '#0f172a';
        chart.options.plugins.tooltip.bodyColor = tokens.textSoft || '#334155';
        chart.options.plugins.tooltip.padding = 10;
        chart.options.plugins.tooltip.cornerRadius = 8;

        // 4. Doughnut / Pie Border Colors
        if (chart.data && chart.data.datasets) {
            chart.data.datasets.forEach(ds => {
                if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
                    ds.borderColor = tokens.bgElevated || '#ffffff';
                }
            });
        }

        chart.update('none');
    } catch (e) {
        console.warn('applyChartTheme safely handled:', e);
    }
}
window.applyChartTheme = applyChartTheme;

function getChartColors() {
    const tokens = typeof getThemeTokens === 'function' ? getThemeTokens() : {};
    return {
        accent: tokens.accent || '#2563eb',
        accentSoft: tokens.accentSoft || 'rgba(37, 99, 235, 0.15)',
        riskHigh: tokens.riskHigh || '#dc2626',
        riskMedium: tokens.riskMedium || '#ea580c',
        riskLow: tokens.riskLow || '#16a34a',
        success: tokens.success || '#16a34a',
        danger: tokens.danger || '#dc2626',
        warning: tokens.warning || '#d97706',
        info: tokens.info || '#0284c7',
        muted: tokens.textMuted || '#64748b',
        border: tokens.border || '#cbd5e1',
        borderSoft: tokens.borderSoft || '#e2e8f0',
        bgSunken: tokens.bgSunken || '#f1f5f9',
        bgElevated: tokens.bgElevated || '#ffffff',
        text: tokens.text || '#0f172a',
        textSoft: tokens.textSoft || '#334155'
    };
}
window.getChartColors = getChartColors;

function setChartDefaults() {
    if (!window.Chart) return;
    const tokens = typeof getThemeTokens === 'function' ? getThemeTokens() : {};
    if (!tokens.text) return;

    Chart.defaults.color = tokens.textMuted || '#64748b';
    Chart.defaults.borderColor = tokens.borderSoft || '#e2e8f0';
    Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Global Radial Linear Scale (Radar charts) defaults
    if (Chart.defaults.scales && Chart.defaults.scales.radialLinear) {
        if (!Chart.defaults.scales.radialLinear.ticks) Chart.defaults.scales.radialLinear.ticks = {};
        if (!Chart.defaults.scales.radialLinear.pointLabels) Chart.defaults.scales.radialLinear.pointLabels = {};
        if (!Chart.defaults.scales.radialLinear.grid) Chart.defaults.scales.radialLinear.grid = {};
        if (!Chart.defaults.scales.radialLinear.angleLines) Chart.defaults.scales.radialLinear.angleLines = {};

        Chart.defaults.scales.radialLinear.ticks.display = false;
        Chart.defaults.scales.radialLinear.ticks.showLabelBackdrop = false;
        Chart.defaults.scales.radialLinear.ticks.backdropColor = 'transparent';
        Chart.defaults.scales.radialLinear.pointLabels.color = tokens.text || '#0f172a';
        Chart.defaults.scales.radialLinear.pointLabels.font = { family: 'Inter, sans-serif', size: 12, weight: '600' };
        Chart.defaults.scales.radialLinear.grid.color = tokens.borderSoft || '#e2e8f0';
        Chart.defaults.scales.radialLinear.angleLines.color = tokens.borderSoft || '#e2e8f0';
    }

    if (Chart.defaults.plugins && Chart.defaults.plugins.tooltip) {
        Chart.defaults.plugins.tooltip.backgroundColor = tokens.bgElevated || '#ffffff';
        Chart.defaults.plugins.tooltip.borderColor = tokens.border || '#cbd5e1';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.titleColor = tokens.text || '#0f172a';
        Chart.defaults.plugins.tooltip.bodyColor = tokens.textSoft || '#334155';
    }
}
window.setChartDefaults = setChartDefaults;

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
window.refreshAllCharts = refreshAllCharts;

// Auto-wrap Chart constructor to automatically register and theme every new Chart
(function() {
    if (window.Chart) {
        const OriginalChart = window.Chart;
        function ThemedChart(...args) {
            const instance = new OriginalChart(...args);
            registerChart(instance);
            applyChartTheme(instance);
            return instance;
        }
        ThemedChart.prototype = OriginalChart.prototype;
        Object.setPrototypeOf(ThemedChart, OriginalChart);
        Object.assign(ThemedChart, OriginalChart);
        window.Chart = ThemedChart;
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    requestAnimationFrame(() => setChartDefaults());
});
