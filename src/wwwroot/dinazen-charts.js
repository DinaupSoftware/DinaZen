// ============================================
// DinaZen Charts — Chart.js Interop
// ============================================

window.DinaZen = window.DinaZen || {};
window.DinaZen.Charts = window.DinaZen.Charts || {};

(function (ns) {
    const _instances = new Map();

    const DEFAULT_COLORS = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
    ];

    function getColors(count) {
        const out = [];
        for (let i = 0; i < count; i++) out.push(DEFAULT_COLORS[i % DEFAULT_COLORS.length]);
        return out;
    }

    function createGradient(ctx, color, vertical) {
        const g = vertical
            ? ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
            : ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
        g.addColorStop(0, color + 'CC');
        g.addColorStop(1, color + '44');
        return g;
    }

    function buildConfig(ctx, type, labels, datasets, options) {
        const isDoughnut = type === 'doughnut';
        const isPolar = type === 'polarArea';
        const isRadar = type === 'radar';
        const isLine = type === 'line';
        const isBar = type === 'bar';
        const isHorizontal = options.indexAxis === 'y';
        const isStacked = options.stacked === true;
        const multiSeries = datasets.length > 1;

        const chartDatasets = datasets.map((ds, i) => {
            const color = ds.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            const base = {
                label: ds.label || ('Serie ' + (i + 1)),
                data: ds.data
            };

            if (isDoughnut || isPolar) {
                base.backgroundColor = ds.backgroundColors || getColors(labels.length).map(c => c + 'CC');
                base.borderWidth = 2;
                base.borderColor = 'rgba(255,255,255,0.8)';
                base.hoverOffset = 8;
                base.hoverBorderWidth = 3;
            } else if (isRadar) {
                base.backgroundColor = color + '25';
                base.borderColor = color;
                base.borderWidth = 2;
                base.pointBackgroundColor = color;
                base.pointBorderColor = '#fff';
                base.pointBorderWidth = 2;
                base.pointRadius = 4;
                base.pointHoverRadius = 6;
            } else if (isLine) {
                base.borderColor = color;
                base.backgroundColor = createGradient(ctx, color, true);
                base.borderWidth = 3;
                base.tension = 0.4;
                base.pointRadius = 4;
                base.pointHoverRadius = 7;
                base.pointBackgroundColor = '#fff';
                base.pointBorderColor = color;
                base.pointBorderWidth = 2;
                base.fill = true;
            } else if (isBar) {
                base.backgroundColor = createGradient(ctx, color, !isHorizontal);
                base.borderColor = color;
                base.borderWidth = 0;
                base.borderRadius = 6;
                base.borderSkipped = false;
                base.maxBarThickness = 50;
            }

            return base;
        });

        const staggerDelay = (ctx) => ctx.dataIndex * 50 + ctx.datasetIndex * 100;

        const config = {
            type: isDoughnut ? 'doughnut' : (isPolar ? 'polarArea' : (isRadar ? 'radar' : (isLine ? 'line' : 'bar'))),
            data: { labels, datasets: chartDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 600,
                    easing: 'easeOutQuart',
                    delay: staggerDelay
                },
                interaction: {
                    mode: isDoughnut || isPolar ? 'nearest' : 'index',
                    intersect: isDoughnut || isPolar
                },
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: (isDoughnut || isPolar) ? 'right' : 'bottom',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 16,
                            font: { size: 12, family: 'inherit' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15,23,42,0.9)',
                        titleFont: { size: 13, weight: '600' },
                        bodyFont: { size: 12 },
                        padding: { x: 14, y: 10 },
                        cornerRadius: 8,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {}
                    }
                }
            }
        };

        // Tooltip format callback
        if (options.formatType) {
            config.options.plugins.tooltip.callbacks.label = function (ctx) {
                let val = ctx.parsed;
                if (typeof val === 'object') val = val.y ?? val.r ?? val;
                const label = ctx.dataset.label || '';
                switch (options.formatType) {
                    case 'money': return label + ': ' + new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
                    case 'integer': return label + ': ' + new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(val);
                    case 'percent': return label + ': ' + val.toFixed(1) + '%';
                    default: return label + ': ' + new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(val);
                }
            };
        }

        if (isDoughnut) config.options.cutout = '60%';
        if (isPolar) config.options.scales = { r: { ticks: { display: false }, grid: { color: 'rgba(0,0,0,0.05)' } } };

        if (isHorizontal) config.options.indexAxis = 'y';

        if (isBar || isLine) {
            config.options.scales = {
                x: {
                    stacked: isStacked,
                    grid: { display: false },
                    ticks: { font: { size: 11 }, maxRotation: 45, color: '#8b95a5' },
                    border: { display: false }
                },
                y: {
                    stacked: isStacked,
                    grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                    ticks: { font: { size: 11 }, color: '#8b95a5', padding: 8 },
                    border: { display: false },
                    beginAtZero: true
                }
            };

            if (isHorizontal) {
                config.options.scales.x.grid = { color: 'rgba(0,0,0,0.04)', drawBorder: false };
                config.options.scales.x.beginAtZero = true;
                config.options.scales.x.border = { display: false };
                config.options.scales.y.grid = { display: false };
                delete config.options.scales.y.beginAtZero;
            }
        }

        return config;
    }

    ns.renderChart = function (canvasId, type, labels, datasets, options) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (_instances.has(canvasId)) {
            _instances.get(canvasId).destroy();
            _instances.delete(canvasId);
        }

        const config = buildConfig(ctx, type, labels, datasets, options || {});

        // Click callback
        if (options && options.dotnetRef) {
            config.options.onClick = function (evt, elements) {
                if (elements.length > 0) {
                    const idx = elements[0].index;
                    const dsIdx = elements[0].datasetIndex;
                    options.dotnetRef.invokeMethodAsync('OnChartClick', idx, dsIdx, labels[idx] || '');
                }
            };
        }

        const chart = new Chart(ctx, config);
        _instances.set(canvasId, chart);
    };

    ns.destroyChart = function (canvasId) {
        if (_instances.has(canvasId)) {
            _instances.get(canvasId).destroy();
            _instances.delete(canvasId);
        }
    };

})(window.DinaZen.Charts);
