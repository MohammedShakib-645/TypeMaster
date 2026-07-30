/**
 * TypeMaster — Performance Replay Engine
 * Replays a typing session showing mistakes, speed heatmap, and slow words.
 */

const ReplayEngine = {
    _lastSession: null,

    // Save session data for replay
    saveSession(data) {
        // data: { keystrokeLog, words, userInput, timeline, metrics }
        this._lastSession = data;
        try {
            sessionStorage.setItem('tm_last_replay', JSON.stringify({
                keystrokeLog: data.keystrokeLog || [],
                words: data.words || [],
                metrics: data.metrics || {},
                wordTimings: data.wordTimings || []
            }));
        } catch {}
    },

    // Load last session
    loadSession() {
        if (this._lastSession) return this._lastSession;
        try {
            const d = sessionStorage.getItem('tm_last_replay');
            return d ? JSON.parse(d) : null;
        } catch { return null; }
    },

    // Build the replay modal content
    buildReplayModal(session) {
        if (!session) return '<div style="padding:20px;text-align:center;color:var(--text-sub);">No session data available. Complete a typing test first.</div>';

        const { keystrokeLog = [], words = [], metrics = {}, wordTimings = [] } = session;

        // Calculate word-level timings
        const wordStats = this._buildWordStats(keystrokeLog, words);

        // Build mistake heatmap
        const mistakeMap = {};
        keystrokeLog.forEach(k => {
            if (!k.correct && k.key && k.key !== 'Backspace') {
                const lk = k.key.toLowerCase();
                mistakeMap[lk] = (mistakeMap[lk] || 0) + 1;
            }
        });
        const maxMistakes = Math.max(...Object.values(mistakeMap), 1);

        return `
<div style="max-height:70vh;overflow-y:auto;padding:4px;">
    <!-- Session Summary -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#3B82F6;">${metrics.wpm || 0}</div>
            <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">WPM</div>
        </div>
        <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#22C55E;">${metrics.accuracy || 0}%</div>
            <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Accuracy</div>
        </div>
        <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#EF4444;">${metrics.mistakes || 0}</div>
            <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Mistakes</div>
        </div>
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#8B5CF6;">${metrics.consistency || 100}%</div>
            <div style="font-size:11px;color:var(--text-sub);margin-top:2px;">Consistency</div>
        </div>
    </div>

    ${Object.keys(mistakeMap).length > 0 ? `
    <!-- Mistake Heatmap -->
    <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-weight:700;font-size:13px;color:#FFF;margin-bottom:12px;">🔴 Mistake Heatmap — Most-Missed Keys</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${Object.entries(mistakeMap).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([key, count]) => {
                const intensity = Math.round((count / maxMistakes) * 100);
                const r = Math.round(239 + (intensity / 100) * 16);
                const color = intensity > 66 ? '#EF4444' : intensity > 33 ? '#F59E0B' : '#22C55E';
                return `<div style="background:${color}20;border:1px solid ${color};border-radius:6px;padding:6px 10px;text-align:center;min-width:40px;">
                    <div style="font-size:16px;font-weight:900;color:${color};">${key.toUpperCase()}</div>
                    <div style="font-size:10px;color:${color};">${count}×</div>
                </div>`;
            }).join('')}
        </div>
    </div>
    ` : '<div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:10px;padding:12px;margin-bottom:20px;text-align:center;color:#22C55E;font-weight:700;">🎯 Perfect! No mistakes in this session!</div>'}

    <!-- Word Speed Replay -->
    ${wordStats.length > 0 ? `
    <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:16px;margin-bottom:20px;">
        <div style="font-weight:700;font-size:13px;color:#FFF;margin-bottom:12px;">⚡ Word-by-Word Speed Replay</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${wordStats.slice(0, 30).map(ws => {
                const speed = ws.wpm;
                const color = speed > 50 ? '#22C55E' : speed > 30 ? '#3B82F6' : speed > 15 ? '#F59E0B' : '#EF4444';
                const bgColor = speed > 50 ? 'rgba(34,197,94,0.15)' : speed > 30 ? 'rgba(59,130,246,0.15)' : speed > 15 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)';
                return `<div style="background:${bgColor};border:1px solid ${color}50;border-radius:6px;padding:4px 8px;cursor:default;"
                    title="${ws.word}: ${speed} WPM (${ws.errors} mistake${ws.errors !== 1 ? 's' : ''})">
                    <span style="color:${color};font-size:12px;font-weight:600;">${ws.word || '·'}</span>
                    <span style="color:${color};font-size:9px;margin-left:4px;">${speed}</span>
                </div>`;
            }).join('')}
        </div>
        <div style="display:flex;gap:16px;margin-top:12px;font-size:11px;color:var(--text-sub);">
            <span><span style="color:#22C55E;">■</span> Fast (50+)</span>
            <span><span style="color:#3B82F6;">■</span> Good (30-50)</span>
            <span><span style="color:#F59E0B;">■</span> Slow (15-30)</span>
            <span><span style="color:#EF4444;">■</span> Very Slow (&lt;15)</span>
        </div>
    </div>
    ` : ''}

    <!-- Timeline Graph -->
    ${metrics.timeline && metrics.timeline.length > 2 ? `
    <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:16px;">
        <div style="font-weight:700;font-size:13px;color:#FFF;margin-bottom:12px;">📈 WPM Over Time</div>
        <div style="display:flex;align-items:flex-end;gap:3px;height:60px;">
            ${metrics.timeline.map(t => {
                const h = Math.max(4, Math.min(100, Math.round((t.wpm / Math.max(1, Math.max(...metrics.timeline.map(x=>x.wpm)))) * 100)));
                const color = t.errors > 0 ? '#EF4444' : '#3B82F6';
                return `<div style="flex:1;background:${color};border-radius:2px 2px 0 0;height:${h}%;min-width:4px;" title="${t.second}s: ${t.wpm} WPM"></div>`;
            }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-sub);margin-top:6px;">
            <span>0s</span><span>${metrics.elapsed || 0}s</span>
        </div>
    </div>
    ` : ''}
</div>`;
    },

    // Build word-level stats from keystroke log
    _buildWordStats(keystrokeLog, words) {
        if (!keystrokeLog || keystrokeLog.length < 2) return [];
        const stats = [];
        let wordStart = keystrokeLog[0]?.ts || 0;
        let wordIdx = 0;
        let wordErrors = 0;

        keystrokeLog.forEach((k, i) => {
            if (!k.correct && k.key !== 'Backspace' && k.key !== ' ') wordErrors++;

            if (k.key === ' ' || i === keystrokeLog.length - 1) {
                const wordEnd = k.ts;
                const duration = Math.max(0.01, (wordEnd - wordStart) / 1000);
                const word = words[wordIdx] || '';
                const wpm = word.length > 0 ? Math.min(999, Math.round((word.length / 5) / (duration / 60))) : 0;
                stats.push({ word, wpm, duration: Math.round(duration * 100) / 100, errors: wordErrors });
                wordStart = k.ts;
                wordIdx++;
                wordErrors = 0;
            }
        });
        return stats;
    },

    // Show replay modal
    show(containerId) {
        const session = this.loadSession();
        const modal = document.getElementById('replay-modal');
        const body = document.getElementById('replay-modal-body');
        if (!modal || !body) return;
        body.innerHTML = this.buildReplayModal(session);
        modal.style.display = 'flex';
    },

    hide() {
        const modal = document.getElementById('replay-modal');
        if (modal) modal.style.display = 'none';
    }
};
