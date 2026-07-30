/**
 * TypeMaster - Chart Manager Component
 * Handles Chart.js integration for real-time test progress graphs, historical trend charts,
 * mode distributions, and character accuracy pie charts.
 */

const ChartManager = {
    testResultChart: null,
    historyChart: null,
    modeChart: null,
    accuracyPieChart: null,

    // Primary palette colors
    colors: {
        primary: '#3B82F6',
        primaryGlow: 'rgba(59, 130, 246, 0.25)',
        secondary: '#94A3B8',
        success: '#22C55E',
        successGlow: 'rgba(34, 197, 94, 0.25)',
        error: '#EF4444',
        errorGlow: 'rgba(239, 68, 68, 0.25)',
        accent: '#8B5CF6',
        cardBg: 'rgba(15, 23, 42, 0.75)',
        gridColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#94A3B8'
    },

    renderTestResultChart(canvasId, timelineData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        if (this.testResultChart) {
            this.testResultChart.destroy();
        }

        const labels = timelineData.map(d => `${d.second}s`);
        const wpms = timelineData.map(d => d.wpm);
        const rawWpms = timelineData.map(d => d.rawWpm);
        const errors = timelineData.map(d => d.errors);

        const ctx = canvas.getContext('2d');
        const gradientWpm = ctx.createLinearGradient(0, 0, 0, 300);
        gradientWpm.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradientWpm.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

        this.testResultChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'WPM',
                        data: wpms,
                        borderColor: this.colors.primary,
                        backgroundColor: gradientWpm,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 7
                    },
                    {
                        label: 'Raw WPM',
                        data: rawWpms,
                        borderColor: this.colors.secondary,
                        borderWidth: 2,
                        borderDash: [4, 4],
                        fill: false,
                        tension: 0.35,
                        pointRadius: 2
                    },
                    {
                        label: 'Errors',
                        data: errors,
                        borderColor: this.colors.error,
                        borderWidth: 2,
                        yAxisID: 'y1',
                        fill: false,
                        tension: 0.1,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        labels: { color: '#F8FAFC', font: { family: 'Fira Code', size: 12 } }
                    },
                    tooltip: {
                        backgroundColor: '#1E293B',
                        titleColor: '#F8FAFC',
                        bodyColor: '#CBD5E1',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: this.colors.gridColor },
                        ticks: { color: this.colors.textColor }
                    },
                    y: {
                        grid: { color: this.colors.gridColor },
                        ticks: { color: this.colors.textColor },
                        title: { display: true, text: 'Words Per Minute', color: this.colors.textColor }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: this.colors.error, precision: 0 },
                        title: { display: true, text: 'Errors', color: this.colors.error }
                    }
                }
            }
        });
    },

    renderDashboardHistoryChart(canvasId, historyData) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        if (this.historyChart) {
            this.historyChart.destroy();
        }

        const recent = historyData.slice(0, 30).reverse(); // Last 30 tests
        const labels = recent.map((item, idx) => `#${idx + 1}`);
        const wpms = recent.map(item => item.wpm);
        const accuracies = recent.map(item => item.accuracy);

        const ctx = canvas.getContext('2d');
        this.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'WPM',
                        data: wpms,
                        borderColor: this.colors.primary,
                        backgroundColor: this.colors.primaryGlow,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Accuracy %',
                        data: accuracies,
                        borderColor: this.colors.success,
                        borderWidth: 2,
                        yAxisID: 'y1',
                        fill: false,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#F8FAFC' } }
                },
                scales: {
                    x: { grid: { color: this.colors.gridColor }, ticks: { color: this.colors.textColor } },
                    y: { grid: { color: this.colors.gridColor }, ticks: { color: this.colors.textColor }, title: { display: true, text: 'WPM', color: this.colors.textColor } },
                    y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: this.colors.success }, title: { display: true, text: 'Accuracy %', color: this.colors.success }, max: 100 }
                }
            }
        });
    },

    renderAccuracyPieChart(canvasId, correct, incorrect, extra) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;

        if (this.accuracyPieChart) {
            this.accuracyPieChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        this.accuracyPieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Incorrect', 'Extra'],
                datasets: [{
                    data: [correct, incorrect, extra],
                    backgroundColor: [this.colors.success, this.colors.error, '#F59E0B'],
                    borderWidth: 2,
                    borderColor: '#0F172A'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#F8FAFC' } }
                }
            }
        });
    }
};
