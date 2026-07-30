/**
 * TypeMaster - Charts Module
 * Chart.js rendering for test results, progress history, and accuracy breakdown.
 */

const Charts = {
    resultChart: null,
    historyChart: null,
    pieChart: null,

    palette: {
        primary: '#3B82F6',
        primaryAlpha: 'rgba(59,130,246,0.2)',
        success: '#22C55E',
        successAlpha: 'rgba(34,197,94,0.15)',
        error: '#EF4444',
        warning: '#F59E0B',
        purple: '#8B5CF6',
        grid: 'rgba(255,255,255,0.07)',
        text: '#94A3B8'
    },

    _baseOptions(extra = {}) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#F8FAFC', font: { family: 'Fira Code', size: 12 } } },
                tooltip: { backgroundColor: '#1E293B', titleColor: '#F8FAFC', bodyColor: '#CBD5E1', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
            },
            scales: {
                x: { grid: { color: this.palette.grid }, ticks: { color: this.palette.text } },
                y: { grid: { color: this.palette.grid }, ticks: { color: this.palette.text }, beginAtZero: true }
            },
            ...extra
        };
    },

    renderResultTimeline(canvasId, timeline) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined' || !timeline?.length) return;
        if (this.resultChart) { this.resultChart.destroy(); this.resultChart = null; }

        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 300);
        grad.addColorStop(0, 'rgba(59,130,246,0.4)');
        grad.addColorStop(1, 'rgba(59,130,246,0)');

        this.resultChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeline.map(d => `${d.second}s`),
                datasets: [
                    { label: 'WPM', data: timeline.map(d => d.wpm), borderColor: this.palette.primary, backgroundColor: grad, borderWidth: 2.5, fill: true, tension: 0.35, pointRadius: 3 },
                    { label: 'Raw WPM', data: timeline.map(d => d.rawWpm), borderColor: this.palette.purple, borderWidth: 1.5, borderDash: [4,3], fill: false, tension: 0.35, pointRadius: 0 },
                    { label: 'Errors', data: timeline.map(d => d.errors), borderColor: this.palette.error, borderWidth: 1.5, fill: false, tension: 0.1, pointRadius: 2, yAxisID: 'y1' }
                ]
            },
            options: { ...this._baseOptions({ interaction: { mode: 'index', intersect: false } }), scales: {
                x: { grid: { color: this.palette.grid }, ticks: { color: this.palette.text } },
                y: { grid: { color: this.palette.grid }, ticks: { color: this.palette.text }, title: { display: true, text: 'WPM', color: this.palette.text } },
                y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: this.palette.error, precision: 0 }, title: { display: true, text: 'Errors', color: this.palette.error } }
            }}
        });
    },

    renderHistoryTrend(canvasId, history) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.historyChart) { this.historyChart.destroy(); this.historyChart = null; }

        const recent = [...history].reverse().slice(-30);
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, 250);
        grad.addColorStop(0, 'rgba(59,130,246,0.35)');
        grad.addColorStop(1, 'rgba(59,130,246,0)');

        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: recent.map((_, i) => `#${i + 1}`),
                datasets: [
                    { label: 'WPM', data: recent.map(h => h.wpm), borderColor: this.palette.primary, backgroundColor: grad, borderWidth: 2.5, fill: true, tension: 0.35, pointRadius: 3 },
                    { label: 'Accuracy %', data: recent.map(h => h.accuracy), borderColor: this.palette.success, borderWidth: 2, fill: false, tension: 0.3, yAxisID: 'y1', pointRadius: 2 }
                ]
            },
            options: { ...this._baseOptions(), scales: {
                x: { grid: { color: this.palette.grid }, ticks: { color: this.palette.text } },
                y: { grid: { color: this.palette.grid }, ticks: { color: this.palette.text }, title: { display: true, text: 'WPM', color: this.palette.text }, beginAtZero: true },
                y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: this.palette.success }, max: 100, min: 0, title: { display: true, text: 'Accuracy %', color: this.palette.success } }
            }}
        });
    },

    renderAccuracyPie(canvasId, correct, incorrect, extra) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;
        if (this.pieChart) { this.pieChart.destroy(); this.pieChart = null; }
        const ctx = canvas.getContext('2d');
        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect', 'Extra'],
                datasets: [{ data: [correct, incorrect, extra], backgroundColor: [this.palette.success, this.palette.error, this.palette.warning], borderWidth: 2, borderColor: '#0F172A' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#F8FAFC', padding: 12 } } } }
        });
    }
};
