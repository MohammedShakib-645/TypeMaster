/**
 * TypeMaster - Statistics & Analytics Component
 * Processes test history, mistake frequency maps, key accuracy heatmaps,
 * and renders detailed statistics summaries for the user dashboard.
 */

const StatsAnalyzer = {
    renderDashboard() {
        const stats = StorageManager.getAggregateStats();
        const history = StorageManager.getHistory();

        // Update Overview Cards
        this.setTextContent('stat-best-wpm', stats.bestWpm);
        this.setTextContent('stat-avg-wpm', stats.avgWpm);
        this.setTextContent('stat-highest-acc', `${stats.highestAccuracy}%`);
        this.setTextContent('stat-total-tests', stats.totalTests);
        this.setTextContent('stat-total-words', stats.totalWordsTyped.toLocaleString());
        this.setTextContent('stat-total-chars', stats.totalCharacters.toLocaleString());
        this.setTextContent('stat-practice-time', this.formatTime(stats.totalPracticeTime));
        this.setTextContent('stat-daily-streak', `${stats.dailyStreak} Days`);

        // Render Charts
        if (history.length > 0) {
            ChartManager.renderDashboardHistoryChart('history-trend-chart', history);
            this.renderMistakeAnalysis(history);
            this.renderHistoryTable(history);
        }
    },

    renderMistakeAnalysis(history) {
        const aggregatedMistakes = {};
        let totalMistakesCount = 0;

        history.forEach(item => {
            if (item.mistakeMap) {
                Object.entries(item.mistakeMap).forEach(([char, count]) => {
                    const cleanChar = char === ' ' ? 'Space' : char;
                    aggregatedMistakes[cleanChar] = (aggregatedMistakes[cleanChar] || 0) + count;
                    totalMistakesCount += count;
                });
            }
        });

        const sortedMistakes = Object.entries(aggregatedMistakes)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 missed keys

        const container = document.getElementById('top-missed-keys-container');
        if (container) {
            container.innerHTML = '';
            if (sortedMistakes.length === 0) {
                container.innerHTML = '<p class="text-muted">No mistake data logged yet. Complete tests to see analytics.</p>';
                return;
            }

            sortedMistakes.forEach(([keyChar, count]) => {
                const percent = Math.round((count / totalMistakesCount) * 100);
                const item = document.createElement('div');
                item.className = 'missed-key-card';
                item.innerHTML = `
                    <div class="key-badge">${keyChar}</div>
                    <div class="key-info">
                        <div class="key-count">${count} errors (${percent}%)</div>
                        <div class="progress-bar-bg">
                            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                `;
                container.appendChild(item);
            });
        }
    },

    renderHistoryTable(history) {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const displayList = history.slice(0, 25); // Show latest 25

        displayList.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.dateStr} ${item.timeStr}</td>
                <td><strong class="text-primary">${item.wpm}</strong></td>
                <td>${item.rawWpm}</td>
                <td><span class="badge ${item.accuracy >= 95 ? 'badge-success' : 'badge-warning'}">${item.accuracy}%</span></td>
                <td><span class="badge badge-grade">${item.grade}</span></td>
                <td>${item.mode.toUpperCase()} (${item.subMode})</td>
                <td>${item.mistakes}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    setTextContent(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    formatTime(seconds) {
        if (seconds < 60) return `${seconds}s`;
        const mins = Math.floor(seconds / 60);
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        if (hrs > 0) return `${hrs}h ${remMins}m`;
        return `${mins}m ${seconds % 60}s`;
    }
};
