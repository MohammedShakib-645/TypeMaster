/**
 * TypeMaster - Export & Import System
 * Enables exporting history records as CSV, generating printable PDF score certificates,
 * and importing/exporting JSON data backups.
 */

const ExportImportManager = {
    exportToCSV() {
        const history = StorageManager.getHistory();
        if (!history || history.length === 0) {
            alert('No test history available to export.');
            return;
        }

        const headers = ['Date', 'Time', 'WPM', 'Raw WPM', 'Accuracy %', 'Consistency %', 'Mistakes', 'Mode', 'SubMode', 'Grade', 'Level'];
        const rows = history.map(item => [
            `"${item.dateStr}"`,
            `"${item.timeStr}"`,
            item.wpm,
            item.rawWpm,
            item.accuracy,
            item.consistency,
            item.mistakes,
            `"${item.mode}"`,
            `"${item.subMode}"`,
            `"${item.grade}"`,
            `"${item.level}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `TypeMaster_Scores_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    },

    exportToPDF(testResult) {
        if (!testResult) return;

        const printWindow = window.open('', '_blank');
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>TypeMaster Test Certificate</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #ffffff; padding: 40px; }
                    .card { border: 2px solid #3b82f6; padding: 30px; border-radius: 16px; background: #1e293b; text-align: center; max-width: 600px; margin: auto; }
                    h1 { color: #3b82f6; margin-bottom: 5px; }
                    .wpm { font-size: 64px; font-weight: bold; color: #22c55e; margin: 10px 0; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; text-align: left; background: #0f172a; padding: 20px; border-radius: 8px; }
                    .label { color: #94a3b8; font-size: 14px; }
                    .value { font-weight: bold; font-size: 18px; }
                    .grade-badge { font-size: 40px; font-weight: bold; color: #3b82f6; }
                    .footer { margin-top: 20px; font-size: 12px; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>⚡ TypeMaster Certificate</h1>
                    <p>Official Typing Speed & Precision Report</p>
                    <div class="wpm">${testResult.wpm} <span style="font-size: 24px; color: #94a3b8;">WPM</span></div>
                    <div class="grade-badge">Grade ${testResult.grade} (${testResult.level})</div>

                    <div class="grid">
                        <div><div class="label">Raw WPM</div><div class="value">${testResult.rawWpm}</div></div>
                        <div><div class="label">Accuracy</div><div class="value">${testResult.accuracy}%</div></div>
                        <div><div class="label">Consistency</div><div class="value">${testResult.consistency}%</div></div>
                        <div><div class="label">Mistakes</div><div class="value">${testResult.mistakes}</div></div>
                        <div><div class="label">Mode</div><div class="value">${testResult.mode.toUpperCase()} (${testResult.subMode})</div></div>
                        <div><div class="label">Date</div><div class="value">${new Date().toLocaleDateString()}</div></div>
                    </div>
                    <div class="footer">Verified by TypeMaster Web Engine</div>
                </div>
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    },

    exportJSONBackup() {
        const backup = {
            version: '2.0.0',
            exportedAt: new Date().toISOString(),
            settings: StorageManager.getSettings(),
            history: StorageManager.getHistory(),
            daily: StorageManager.getDailyStreak(),
            achievements: StorageManager.getAchievements(),
            customTexts: StorageManager.getCustomTexts()
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `TypeMaster_Backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    importJSONBackup(fileEvent) {
        const file = fileEvent.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
                if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
                if (data.daily) localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(data.daily));
                if (data.achievements) localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements));
                if (data.customTexts) localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(data.customTexts));

                alert('Data backup imported successfully! Reloading application...');
                window.location.reload();
            } catch (err) {
                alert('Invalid backup JSON file.');
            }
        };
        reader.readAsText(file);
    }
};
