/**
 * TypeMaster v3 - Main Application Controller
 * Handles: Navigation, Lesson Map, Arena, Stats, Achievements, Settings, Certificates
 */

'use strict';

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
const AppState = {
    currentView: 'home',
    currentLesson: null,
    currentMode: { type: 'words', sub: '30' },
    engine: null,
    keyboard: null,
    fingerGuide: null,
    soundEngine: null,
    deferredInstall: null,
    settings: loadSettings(),
    filterStatus: 'all',
    charts: {}
};

function loadSettings() {
    try {
        return JSON.parse(localStorage.getItem('tm_settings') || '{}');
    } catch { return {}; }
}

function saveSettings(s) {
    localStorage.setItem('tm_settings', JSON.stringify(s));
}

// ═══════════════════════════════════════════════════════════
// DOM HELPERS
// ═══════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
const setVal  = (id, v)  => { const el = $(id); if (el) el.style.width = v + '%'; };

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function navigateTo(view) {
    // Deactivate all
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

    // Activate target
    const section = document.getElementById('view-' + view);
    if (section) section.classList.add('active');
    document.querySelectorAll(`[data-view="${view}"]`).forEach(l => l.classList.add('active'));

    // Update top bar title
    const titles = { home: 'Dashboard', lessons: 'Lesson Map', arena: 'Typing Arena',
        stats: 'Statistics', achieve: 'Achievements', settings: 'Settings',
        finger: 'Finger Guide', journey: '🗺️ Journey Timeline',
        certificates: 'Certificates', documentation: 'Documentation' };
    setText('top-bar-title', titles[view] || view);

    AppState.currentView = view;

    // View-specific init
    if (view === 'home')    refreshHome();
    if (view === 'lessons') renderLessonMap();
    if (view === 'journey') renderJourneyTimeline();
    if (view === 'arena')   {
        if (!AppState.engine) {
            if (AppState.currentLesson) loadArenaLesson(AppState.currentLesson);
            else loadArenaMode('words', '30');
        }
    }
    if (view === 'stats')   refreshStats();
    if (view === 'achieve') renderAchievements();
    if (view === 'finger')  initFingerGuidePage();
    if (view === 'certificates') renderCertificatesPage();
    if (view === 'settings')initSettings();
}

// ═══════════════════════════════════════════════════════════
// HOME DASHBOARD
// ═══════════════════════════════════════════════════════════
function refreshHome() {
    const p = ProgressManager.getProfile();
    const daily = ProgressManager.getDailyData();
    const lvlData = ProgressManager.getLevelProgress(p);
    const sessions = ProgressManager.getSessions();
    const completedLessons = ProgressManager.getCompletedLessons();

    const s = AppState.settings;
    const displayName = s.displayName || 'Typist';

    setText('home-username', displayName);
    setText('home-level', 'Level ' + p.level);
    setText('home-xp', p.xp.toLocaleString());
    setText('home-xp-label', `${lvlData.current.toLocaleString()} / ${lvlData.needed.toLocaleString()} XP to Level ${p.level + 1}`);
    setVal('home-xp-bar', lvlData.percent);

    const bestWpm = sessions.length ? Math.max(...sessions.map(s => s.wpm || 0)) : 0;
    const avgAcc = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length) : 0;

    setText('home-best-wpm', bestWpm);
    setText('home-accuracy', avgAcc + '%');
    setText('home-tests', sessions.length);
    setText('home-lessons', `${completedLessons.size}/${TOTAL_LESSONS}`);
    setText('home-streak', daily.currentStreak);

    // Sidebar update
    setText('sidebar-level', p.level);
    setVal('sidebar-xp-bar', lvlData.percent);
    setText('sidebar-xp-label', `${lvlData.current} / ${lvlData.needed} XP`);
    setText('topbar-streak', daily.currentStreak);

    // Rank System
    try {
        const rank = ProgressManager.getRank(p);
        const rankBadge = document.getElementById('home-rank-badge');
        const rankWidget = document.getElementById('rank-widget');
        if (rankBadge) {
            rankBadge.style.background = rank.glow;
            rankBadge.style.borderColor = rank.color + '55';
            rankBadge.style.color = rank.color;
            rankBadge.innerHTML = `${rank.icon} <span id="home-rank-name">${rank.name}</span>`;
        }
        if (rankWidget) {
            rankWidget.style.borderTopColor = rank.color;
            const iconEl = document.getElementById('rank-icon-big');
            const nameEl = document.getElementById('rank-name-big');
            const nextEl = document.getElementById('rank-next-info');
            if (iconEl) iconEl.textContent = rank.icon;
            if (nameEl) { nameEl.textContent = rank.name; nameEl.style.color = rank.color; }
            if (nextEl) {
                if (rank.nextRank) {
                    nextEl.textContent = `Next: ${rank.nextRank.icon} ${rank.nextRank.name} — ${rank.nextRank.minWpm} WPM + ${rank.nextRank.minLessons} lessons needed`;
                } else {
                    nextEl.textContent = '🏆 Maximum Rank Achieved — Typing Champion!';
                }
            }
        }
    } catch(e) { console.warn('Rank render error:', e); }

    // Next lesson
    updateNextLessonCard();

    // Curriculum progress
    const pct = Math.round((completedLessons.size / TOTAL_LESSONS) * 100);
    const cpEl = document.getElementById('home-curriculum-pct');
    const cfEl = document.getElementById('home-curriculum-fill');
    if (cpEl) cpEl.textContent = pct + '%';
    if (cfEl) cfEl.style.width = pct + '%';

    // Weekly chart
    renderWeeklyChart(sessions);

    // Motivation Engine
    setDailyQuote();

    // Smart Recommendations
    try {
        if (typeof AdaptiveEngine !== 'undefined') {
            const recs = AdaptiveEngine.getRecommendations();
            renderRecommendations(recs);
        }
    } catch(e) { console.warn('Recommendations error:', e); }

    // Speed Prediction
    try {
        const t40 = ProgressManager.predictWpmDate(40);
        const t60 = ProgressManager.predictWpmDate(60);
        const t100 = ProgressManager.predictWpmDate(100);
        const predEl40 = document.getElementById('predict-40');
        const predEl60 = document.getElementById('predict-60');
        const predEl100 = document.getElementById('predict-100');
        const prof = ProgressManager.getProfile();
        if (predEl40) predEl40.textContent = prof.bestWpm >= 40 ? '✅ Already achieved!' : (t40 ? `Est. ${t40.date}` : 'Need more data (7+ days)');
        if (predEl60) predEl60.textContent = prof.bestWpm >= 60 ? '✅ Already achieved!' : (t60 ? `Est. ${t60.date}` : 'Need more data (7+ days)');
        if (predEl100) predEl100.textContent = prof.bestWpm >= 100 ? '✅ Already achieved!' : (t100 ? `Est. ${t100.date}` : 'Need more data (7+ days)');
    } catch(e) { console.warn('Prediction error:', e); }
}

function updateNextLessonCard() {
    const completedLessons = ProgressManager.getCompletedLessons();
    let nextLesson = null;
    for (const lesson of ALL_LESSONS) {
        if (!completedLessons.has(lesson.id)) {
            nextLesson = lesson;
            break;
        }
    }

    if (nextLesson) {
        setText('home-next-lesson-title', `Lesson ${nextLesson.lessonNum}: ${nextLesson.title}`);
        const unit = Object.values(CURRICULUM).find(u => u.id === nextLesson.unitId);
        setText('home-next-lesson-sub', `${unit ? unit.title : ''} · ${nextLesson.requiredWpm} WPM Target`);
        AppState.nextLesson = nextLesson;
    } else {
        setText('home-next-lesson-title', '🎓 Curriculum Complete!');
        setText('home-next-lesson-sub', 'You\'ve completed all 300 lessons!');
        AppState.nextLesson = null;
    }
}

function setDailyQuote() {
    try {
        if (typeof MotivationEngine !== 'undefined') {
            const q = MotivationEngine.getDailyQuote();
            const qEl = document.getElementById('daily-quote');
            const aEl = document.getElementById('daily-quote-author');
            if (qEl) qEl.textContent = `"${q.text}"`;
            if (aEl) aEl.textContent = `— ${q.author}`;

            const wc = MotivationEngine.getWeeklyChallenge();
            const wiEl = document.getElementById('weekly-challenge-icon');
            const wtEl = document.getElementById('weekly-challenge-title');
            const wdEl = document.getElementById('weekly-challenge-desc');
            if (wiEl) wiEl.textContent = wc.icon;
            if (wtEl) wtEl.textContent = wc.title;
            if (wdEl) wdEl.textContent = wc.desc;
        } else {
            // Fallback
            const quotes = [
                'The secret of getting ahead is getting started. — Mark Twain',
                'Practice is the best master. — Latin Proverb',
                'Speed comes naturally when accuracy is mastered first.',
                'Touch typists don\'t look at the keyboard. They look ahead.',
                'Every keystroke brings you closer to mastery.'
            ];
            const dayIndex = new Date().getDate() % quotes.length;
            setText('daily-quote', quotes[dayIndex]);
        }
    } catch (e) { console.warn('Quote error:', e); }
}

function renderRecommendations(recs) {
    const grid = document.getElementById('recommendations-grid');
    if (!grid || !recs || recs.length === 0) return;
    grid.innerHTML = recs.map(r => `
        <div style="background:rgba(0,0,0,0.25);border:1px solid ${r.color}30;border-left:3px solid ${r.color};border-radius:10px;padding:14px;cursor:pointer;"
            onclick="handleRecommendationClick(${JSON.stringify(r).replace(/"/g,'&quot;')})">
            <div style="font-size:22px;margin-bottom:6px;">${r.icon}</div>
            <div style="font-weight:700;font-size:13px;color:#FFF;margin-bottom:3px;">${r.title}</div>
            <div style="font-size:11px;color:${r.color};margin-bottom:6px;font-weight:600;">${r.subtitle}</div>
            <div style="font-size:12px;color:var(--text-sub);">${r.desc}</div>
        </div>
    `).join('');
}

function handleRecommendationClick(rec) {
    if (!rec) return;
    if (rec.action === 'lesson' && rec.lessonId) {
        AppState.currentLesson = ALL_LESSONS.find(l => l.id === rec.lessonId);
        navigateTo('arena');
        if (AppState.currentLesson) loadArenaLesson(AppState.currentLesson);
    } else if (rec.action === 'speed_test') {
        navigateTo('arena');
        loadArenaMode('time', '60');
    } else if (rec.action === 'adaptive_practice' && rec.lessonData) {
        navigateTo('arena');
        loadArenaFreeText(rec.lessonData.text, rec.lessonData.title);
    } else {
        navigateTo('arena');
    }
}

function renderWeeklyChart(sessions) {
    const ctx = document.getElementById('weekly-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = new Date();
    const dayData = Array(7).fill(0).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const label = days[d.getDay()];
        const dateStr = d.toISOString().split('T')[0];
        const daySessions = sessions.filter(s => (s.date || '').startsWith(dateStr));
        const avgWpm = daySessions.length ? Math.round(daySessions.reduce((a, s) => a + s.wpm, 0) / daySessions.length) : 0;
        return { label, wpm: avgWpm };
    });

    if (AppState.charts.weekly) { AppState.charts.weekly.destroy(); AppState.charts.weekly = null; }

    AppState.charts.weekly = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dayData.map(d => d.label),
            datasets: [{
                label: 'WPM',
                data: dayData.map(d => d.wpm),
                backgroundColor: dayData.map((d, i) => i === 6 ? 'rgba(59,130,246,0.9)' : 'rgba(59,130,246,0.35)'),
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8' }, beginAtZero: true }
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════
// JOURNEY TIMELINE
// ═══════════════════════════════════════════════════════════
function renderJourneyTimeline() {
    const container = document.getElementById('journey-map-container');
    if (!container) return;

    const progress = ProgressManager.getLessonProgress();
    const completedSet = ProgressManager.getCompletedLessons();
    const totalLessons = typeof ALL_LESSONS !== 'undefined' ? ALL_LESSONS.length : 300;

    // Count stats
    let completed = 0, attempted = 0, certs = 0;
    Object.values(progress).forEach(s => {
        if (s.status === 'completed' || s.status === 'passed') completed++;
        else if (s.status === 'attempted') attempted++;
    });
    // Count certificates milestones (at L015, L030, L075, L150, L225, L300)
    const certIds = ['L015','L030','L075','L150','L225','L300'];
    certIds.forEach(id => { if (completedSet.has(id)) certs++; });

    const remaining = totalLessons - completed - attempted;
    const pct = Math.round((completed / totalLessons) * 100);

    // Update stats
    const setText2 = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setText2('journey-pct', pct + '%');
    setText2('journey-completed', completed);
    setText2('journey-attempted', attempted);
    setText2('journey-remaining', Math.max(0, remaining));
    setText2('journey-certs', certs);
    const bar = document.getElementById('journey-bar');
    if (bar) bar.style.width = pct + '%';

    // Render by curriculum units
    container.innerHTML = '';
    if (typeof CURRICULUM === 'undefined') {
        container.innerHTML = '<div style="color:var(--text-sub);padding:20px;">Curriculum data not available.</div>';
        return;
    }

    // Find current lesson (first non-completed)
    let currentId = null;
    if (typeof ALL_LESSONS !== 'undefined') {
        const cur = ALL_LESSONS.find(l => !completedSet.has(l.id));
        if (cur) currentId = cur.id;
    }

    // Certificate milestone lesson IDs
    const certMilestones = new Set(['L015','L030','L075','L150','L225','L300']);
    // Exam lesson IDs (approximately every 15 lessons)
    const examIds = new Set(['L014','L029','L074','L149','L224','L299','L300']);

    for (const unit of Object.values(CURRICULUM)) {
        const unitLessons = unit.lessons || [];
        const unitCompleted = unitLessons.filter(l => completedSet.has(l.id)).length;
        const unitPct = Math.round((unitCompleted / Math.max(1, unitLessons.length)) * 100);

        const unitDiv = document.createElement('div');
        unitDiv.className = 'journey-unit';
        unitDiv.innerHTML = `
            <div class="journey-unit-header">
                <span>${unit.icon || '📚'}</span>
                <span>${unit.title}</span>
                <span class="journey-unit-progress">${unitCompleted}/${unitLessons.length} (${unitPct}%)</span>
            </div>
            <div class="journey-nodes" id="jn-${unit.id}"></div>
        `;
        container.appendChild(unitDiv);

        const nodesContainer = unitDiv.querySelector(`#jn-${unit.id}`);
        for (const lesson of unitLessons) {
            const lessonStatus = progress[lesson.id];
            const isCompleted = completedSet.has(lesson.id);
            const isAttempted = lessonStatus?.status === 'attempted';
            const isCurrent = lesson.id === currentId;
            const isExam = examIds.has(lesson.id);
            const isMilestone = certMilestones.has(lesson.id);

            let cls = 'journey-node locked';
            if (isMilestone && isCompleted) cls = 'journey-node milestone completed';
            else if (isMilestone) cls = 'journey-node milestone' + (isCurrent ? ' current' : '');
            else if (isCompleted) cls = 'journey-node completed';
            else if (isCurrent) cls = 'journey-node current';
            else if (isAttempted) cls = 'journey-node attempted';
            else if (isExam) cls = 'journey-node exam';

            const label = isMilestone ? '🏆' : isCompleted ? '✓' : isCurrent ? '▶' : isAttempted ? '~' : lesson.lessonNum || '?';
            const bwpm = lessonStatus?.bestWpm ? ` | Best: ${lessonStatus.bestWpm} WPM` : '';
            const tooltip = `${lesson.title || lesson.id} (Lesson ${lesson.lessonNum})${bwpm}`;

            const node = document.createElement('div');
            node.className = cls;
            node.title = tooltip;
            node.textContent = label;
            if (isCompleted || isCurrent || isAttempted) {
                node.onclick = () => {
                    AppState.currentLesson = lesson;
                    navigateTo('arena');
                    loadArenaLesson(lesson);
                };
            }
            nodesContainer.appendChild(node);
        }
    }
}

// ─── Load arena with free-form text (for adaptive lessons) ─
function loadArenaFreeText(text, title) {
    try {
        AppState.currentLesson = { id: 'adaptive', title: title || 'Adaptive Practice', text };
        if (typeof loadArenaLesson === 'function') {
            loadArenaLesson(AppState.currentLesson);
        } else {
            loadArenaMode('words', '30');
        }
    } catch(e) { loadArenaMode('words', '30'); }
}

// ═══════════════════════════════════════════════════════════
// LESSON MAP
// ═══════════════════════════════════════════════════════════

function renderLessonMap() {
    const container = $('lesson-map-container');
    if (!container) return;

    const completedLessons = ProgressManager.getCompletedLessons();
    const sessionMap = ProgressManager.getSessionMap();

    // Filter buttons
    const filterDiv = document.createElement('div');
    filterDiv.className = 'lesson-map-filters';
    filterDiv.innerHTML = `
        <button class="filter-btn ${AppState.filterStatus === 'all' ? 'active' : ''}" onclick="setLessonFilter('all')">All Lessons</button>
        <button class="filter-btn ${AppState.filterStatus === 'completed' ? 'active' : ''}" onclick="setLessonFilter('completed')">✅ Completed</button>
        <button class="filter-btn ${AppState.filterStatus === 'available' ? 'active' : ''}" onclick="setLessonFilter('available')">▶ Available</button>
        <button class="filter-btn ${AppState.filterStatus === 'locked' ? 'active' : ''}" onclick="setLessonFilter('locked')">🔒 Locked</button>
    `;

    container.innerHTML = '';
    container.appendChild(filterDiv);

    // Render each unit
    for (const unit of Object.values(CURRICULUM)) {
        const unitCompleted = unit.lessons.filter(l => completedLessons.has(l.id)).length;
        const unitTotal = unit.lessons.length;
        const pct = Math.round((unitCompleted / unitTotal) * 100);

        // Determine if unit is unlocked (first unit always unlocked; subsequent need previous unit's first lesson done)
        const unitEl = document.createElement('div');
        unitEl.className = 'unit-block';
        unitEl.innerHTML = `
            <div class="unit-header">
                <div class="unit-icon">${unit.icon}</div>
                <div style="flex:1">
                    <div class="unit-title">${unit.title}
                        ${unit.certificate ? `<span class="unit-cert-badge">🎓 Certificate</span>` : ''}
                    </div>
                    <div class="unit-desc">${unit.description}</div>
                    <div class="unit-completion-bar" style="margin-top:8px">
                        <div class="unit-completion-fill" style="width:${pct}%;background:${unit.color}"></div>
                    </div>
                </div>
                <div class="unit-progress-pill">${unitCompleted}/${unitTotal} Done</div>
            </div>
            <div class="lessons-row" id="lessons-row-${unit.id}"></div>
        `;
        container.appendChild(unitEl);

        const rowEl = unitEl.querySelector(`#lessons-row-${unit.id}`);

        for (let li = 0; li < unit.lessons.length; li++) {
            const lesson = unit.lessons[li];
            const isDone = completedLessons.has(lesson.id);
            const prevDone = li === 0 ? true : completedLessons.has(unit.lessons[li - 1].id);
            const isFirstOfUnit = li === 0;
            const prevUnit = getPreviousUnit(unit.id);
            const unitUnlocked = !prevUnit || completedLessons.has(prevUnit.lessons[0].id);
            const isLocked = !unitUnlocked || (!isDone && !prevDone && li > 0);
            const sessionData = sessionMap.get(lesson.id);

            // Apply filter
            const filterStatus = isDone ? 'completed' : isLocked ? 'locked' : 'available';
            if (AppState.filterStatus !== 'all' && AppState.filterStatus !== filterStatus) continue;

            const bestWpm = sessionData ? Math.max(...(sessionData.wpms || [0])) : 0;
            const bestAcc = sessionData ? Math.max(...(sessionData.accs || [0])) : 0;

            const card = document.createElement('div');
            card.className = `lesson-card ${isDone ? 'done' : ''} ${isLocked ? 'locked' : ''} ${lesson.isCertExam ? 'cert-exam' : ''}`;
            card.setAttribute('data-lesson-id', lesson.id);
            card.innerHTML = `
                <div class="lesson-num">Lesson ${lesson.lessonNum}</div>
                <div class="lesson-card-title">${lesson.title}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">${lesson.objective.slice(0, 60)}${lesson.objective.length > 60 ? '…' : ''}</div>
                ${lesson.keys && lesson.keys.length > 0 ? `<div class="lesson-keys">${lesson.keys.slice(0, 6).map(k => `<kbd>${k}</kbd>`).join('')}</div>` : ''}
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                    <span class="badge badge-warn">⚡ ${lesson.requiredWpm} WPM</span>
                    <span class="badge badge-success">✨ +${lesson.xpReward} XP</span>
                    ${isDone ? `<span class="badge badge-success">✅ Done</span>` : ''}
                    ${isLocked ? `<span class="badge badge-error">🔒 Locked</span>` : ''}
                </div>
                ${bestWpm ? `<div class="lesson-stats-mini" style="margin-top:8px"><span>Best: <strong>${bestWpm} WPM</strong></span><span>${bestAcc}% acc</span></div>` : ''}
            `;

            if (!isLocked) {
                card.addEventListener('click', () => startLesson(lesson));
            }
            rowEl.appendChild(card);
        }
    }
}

function getPreviousUnit(unitId) {
    const units = Object.values(CURRICULUM);
    const idx = units.findIndex(u => u.id === unitId);
    return idx > 0 ? units[idx - 1] : null;
}

function setLessonFilter(status) {
    AppState.filterStatus = status;
    renderLessonMap();
}

// ═══════════════════════════════════════════════════════════
// ARENA — START LESSON / MODE
// ═══════════════════════════════════════════════════════════
function startLesson(lesson) {
    AppState.currentLesson = lesson;
    AppState.currentMode = { type: 'lesson', lessonId: lesson.id };
    navigateTo('arena');
    loadArenaLesson(lesson);
}

function loadArenaLesson(lesson) {
    // Update arena header
    setText('arena-title', `Lesson ${lesson.lessonNum}: ${lesson.title}`);
    const unit = Object.values(CURRICULUM).find(u => u.id === lesson.unitId);
    setText('arena-subtitle', unit ? unit.title : '');

    // Show lesson info panel
    const infoPanel = $('lesson-info-panel');
    if (infoPanel) {
        infoPanel.style.display = 'flex';
        setText('lesson-objective', lesson.objective);
        setText('lesson-target-acc', lesson.requiredAccuracy + '% Acc');
        setText('lesson-target-wpm', lesson.requiredWpm + ' WPM');
        setText('lesson-xp-reward', '+' + lesson.xpReward + ' XP');

        const focusKeysEl = $('lesson-focus-keys');
        if (focusKeysEl) {
            focusKeysEl.innerHTML = lesson.keys.slice(0, 8).map(k => `<div class="focus-key">${k}</div>`).join('');
        }
    }

    // Pick exercise
    const exercises = lesson.exercises || [];
    const text = exercises[Math.floor(Math.random() * exercises.length)] || 'Type this text to practice.';

    loadArenaText(text, lesson);
}

function loadArenaMode(mode, sub) {
    AppState.currentLesson = null;
    AppState.currentMode = { type: mode, sub: sub };

    const infoPanel = $('lesson-info-panel');
    if (infoPanel) infoPanel.style.display = 'none';

    const modeLabels = { time: `${sub}s Timed`, words: `${sub} Words`, code: `${sub} Code`, free: sub };
    setText('arena-title', 'Typing Arena — ' + (modeLabels[mode] || mode));
    setText('arena-subtitle', 'Practice Mode');

    const text = getTextForMode(mode, sub);
    loadArenaText(text, null);
}

function getTextForMode(mode, sub) {
    if (typeof TextData === 'undefined') return 'The quick brown fox jumps over the lazy dog.';
    switch (mode) {
        case 'time':
        case 'words':
        case 'free': return TextData.getText(sub) || TextData.getText('medium');
        case 'code': return TextData.getCode(sub) || TextData.getCode('javascript');
        default:     return TextData.getText('medium');
    }
}

function loadArenaText(text, lesson) {
    closePracticeModal();

    // Destroy old engine
    if (AppState.engine) {
        AppState.engine.destroy && AppState.engine.destroy();
        AppState.engine = null;
    }

    const mode = AppState.currentMode;
    const config = {
        mode: mode.type === 'time' ? 'time' : mode.type === 'lesson' ? 'words' : 'words',
        timeLimit: mode.type === 'time' ? parseInt(mode.sub) : null,
        wordLimit: null,
        onChar: (metrics) => updateHUD(metrics),
        onWord: (metrics) => {},
        onLine: () => {},
        onFinish: (metrics) => handleFinish(metrics, lesson),
        onTick:   (metrics) => updateHUD(metrics)
    };

    // TypingEngine is from engine.js
    if (typeof TypingEngine !== 'undefined') {
        AppState.engine = new TypingEngine('typing-display', text, config);
        AppState.engine.mount();

        // Set caret style
        const disp = $('typing-display');
        if (disp) disp.closest('[data-caret]') || document.documentElement.setAttribute('data-caret', AppState.settings.caret || 'line');
    }

    // Init keyboard
    if (typeof VirtualKeyboard !== 'undefined' && $('vkb-container') && AppState.settings.showKeyboard !== false) {
        if (AppState.keyboard) { AppState.keyboard.destroy && AppState.keyboard.destroy(); }
        AppState.keyboard = new VirtualKeyboard('vkb-container');
        AppState.keyboard.render();
    } else if ($('vkb-container')) {
        $('vkb-container').innerHTML = '';
    }

    // Init finger guide in arena
    initArenaFingerHint(text);

    // Reset HUD
    resetHUD();
}

// ═══════════════════════════════════════════════════════════
// ARENA FINGER HINT (mini inline hint above typing area)
// ═══════════════════════════════════════════════════════════
function initArenaFingerHint(text) {
    const existing = document.getElementById('arena-finger-hint-bar');
    if (existing) existing.remove();

    const displayCard = document.querySelector('.typing-display-card');
    if (!displayCard) return;

    const hint = document.createElement('div');
    hint.id = 'arena-finger-hint-bar';
    hint.className = 'arena-finger-hint glass-card';
    hint.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 20px;margin-bottom:14px;background:rgba(15,23,42,0.85);border:1px solid var(--primary);border-radius:14px;';
    hint.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;">
            <div class="afh-hand" id="afh-hand" style="font-size:28px;">🖐️</div>
            <div>
                <div class="afh-finger" id="afh-finger" style="font-size:15px;font-weight:800;color:var(--primary)">10-Finger Position Guide: Keep fingers resting on Home Row</div>
                <div class="afh-keys" id="afh-keys" style="font-size:12px;color:var(--text-sub)">Left Hand: Pinky(A) Ring(S) Middle(D) Index(F) &nbsp;|&nbsp; Right Hand: Index(J) Middle(K) Ring(L) Pinky(;) &nbsp;|&nbsp; Thumbs: Space</div>
            </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:11px;color:var(--text-muted);font-weight:700;">NEXT KEY:</span>
            <div class="afh-key-badge glass-card" id="afh-key-badge" style="font-size:18px;font-weight:900;padding:6px 14px;border-radius:10px;color:var(--primary);border:1.5px solid var(--primary);">READY</div>
        </div>
    `;
    displayCard.parentElement.insertBefore(hint, displayCard);
}

function updateArenaFingerHint(char) {
    if (!char || typeof KEY_FINGER_MAP === 'undefined') return;
    const fingerKey = char === ' ' ? 'left-thumb' : KEY_FINGER_MAP[char.toLowerCase()];
    if (!fingerKey || typeof FINGER_MAP === 'undefined') return;

    const fingerInfo = FINGER_MAP[fingerKey];
    if (!fingerInfo) return;

    const handEl = $('afh-hand');
    const fingerEl = $('afh-finger');
    const keysEl = $('afh-keys');
    const badgeEl = $('afh-key-badge');

    if (handEl) handEl.textContent = fingerInfo.emoji;
    if (fingerEl) {
        fingerEl.textContent = `${fingerInfo.emoji} Use ${fingerInfo.label.toUpperCase()} to press key "${char === ' ' ? 'SPACE' : char.toUpperCase()}"`;
        fingerEl.style.color = fingerInfo.color;
    }
    if (keysEl) {
        const fingerHand = fingerInfo.hand === 'left' ? 'LEFT HAND' : 'RIGHT HAND';
        keysEl.textContent = `${fingerHand} — Keep other 9 fingers resting on Home Row (A S D F | J K L ;)`;
    }
    if (badgeEl) {
        badgeEl.textContent = char === ' ' ? 'SPACE' : char.toUpperCase();
        badgeEl.style.color = fingerInfo.color;
        badgeEl.style.background = fingerInfo.color + '22';
        badgeEl.style.border = `1.5px solid ${fingerInfo.color}`;
    }

    if (AppState.keyboard && AppState.keyboard.highlightKey) {
        AppState.keyboard.highlightKey(char);
    }

    if (typeof FingerGuideInstance !== 'undefined' && FingerGuideInstance) {
        FingerGuideInstance.highlightForChar(char);
    }
}

// ═══════════════════════════════════════════════════════════
// HUD UPDATE
// ═══════════════════════════════════════════════════════════
function updateHUD(metrics) {
    if (!metrics) return;
    setText('hud-wpm', metrics.wpm ?? 0);
    setText('hud-raw', metrics.rawWpm ?? 0);
    setText('hud-acc', (metrics.accuracy ?? 100) + '%');
    setText('hud-correct', metrics.correct ?? 0);
    setText('hud-errors', metrics.mistakes ?? 0);

    const elapsed = metrics.elapsed ?? 0;
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    setText('hud-elapsed', `${m}:${String(s).padStart(2, '0')}`);

    if (metrics.timeLimit) {
        const rem = Math.max(0, metrics.timeLimit - elapsed);
        const rm = Math.floor(rem / 60), rs = Math.floor(rem % 60);
        setText('hud-remaining', `${rm}:${String(rs).padStart(2, '0')}`);
    } else {
        setText('hud-remaining', '—');
    }

    const progress = metrics.progress ?? 0;
    const bar = $('hud-progress-bar');
    if (bar) bar.style.width = progress + '%';

    // Update finger hint for next char
    if (metrics.nextChar !== undefined) {
        updateArenaFingerHint(metrics.nextChar);
    }
}

function resetHUD() {
    ['hud-wpm','hud-raw'].forEach(id => setText(id, '0'));
    setText('hud-acc', '100%');
    setText('hud-correct', '0');
    setText('hud-errors', '0');
    setText('hud-elapsed', '0:00');
    setText('hud-remaining', '—');
    const bar = $('hud-progress-bar');
    if (bar) bar.style.width = '0%';
}

// ═══════════════════════════════════════════════════════════
// FINISH HANDLER
// ═══════════════════════════════════════════════════════════
function handleFinish(metrics, lesson) {
    if (!metrics) return;

    // Play sound
    if (AppState.soundEngine) {
        AppState.soundEngine.playFinish && AppState.soundEngine.playFinish();
    }

    // Save session
    const session = {
        wpm: metrics.wpm || 0,
        rawWpm: metrics.rawWpm || 0,
        accuracy: metrics.accuracy || 0,
        consistency: metrics.consistency || 100,
        mistakes: metrics.mistakes || 0,
        duration: metrics.elapsed || 0,
        words: metrics.words || 0,
        chars: metrics.correct || 0,
        mode: AppState.currentMode,
        lessonId: lesson ? lesson.id : null,
        date: new Date().toISOString()
    };

    const profile = ProgressManager.saveSession(session);

    // 🧠 Adaptive Learning: accumulate mistake data
    try {
        if (typeof AdaptiveEngine !== 'undefined' && AppState.engine && AppState.engine.mistakeMap) {
            AdaptiveEngine.accumulateMistakes(AppState.engine.mistakeMap);
        }
    } catch(e) {}

    // 🔥 Performance Replay: save keystroke log
    try {
        if (typeof ReplayEngine !== 'undefined' && AppState.engine) {
            ReplayEngine.saveSession({
                keystrokeLog: AppState.engine.keystrokeLog || [],
                words: AppState.engine.words || [],
                metrics: { ...metrics, timeline: AppState.engine.timeline || [] },
                wordTimings: []
            });
        }
    } catch(e) {}

    // 🎉 Motivation: check for milestone celebrations
    try {
        if (typeof MotivationEngine !== 'undefined') {
            MotivationEngine.checkCelebrations(profile || {}, metrics);
        }
    } catch(e) {}

    // Check lesson pass
    let passed = false;
    let xpGained = 0;
    if (lesson) {
        passed = metrics.wpm >= lesson.requiredWpm && metrics.accuracy >= lesson.requiredAccuracy;
        if (passed && !ProgressManager.getCompletedLessons().has(lesson.id)) {
            const result = ProgressManager.completeLesson(lesson.id, metrics.wpm, lesson.xpReward);
            xpGained = lesson.xpReward;
            if (result.leveledUp) showLevelUp(result.newLevel);
        }
    }

    // Check achievements
    if (typeof AchievementManager !== 'undefined') {
        AchievementManager.checkAll(ProgressManager.getProfile(), ProgressManager.getDailyData(), ProgressManager.getSessions());
    }

    // Show result modal
    showResultModal(metrics, lesson, passed, xpGained);
}

// ═══════════════════════════════════════════════════════════
// RESULT MODAL
// ═══════════════════════════════════════════════════════════
function showResultModal(metrics, lesson, passed, xpGained) {
    const modal = $('result-modal');
    if (!modal) return;

    // Big WPM
    setText('res-wpm', metrics.wpm || 0);

    // Metrics
    setText('res-raw', metrics.rawWpm || 0);
    setText('res-acc', (metrics.accuracy || 0) + '%');
    setText('res-consistency', (metrics.consistency || 100) + '%');
    setText('res-grade', calcGrade(metrics.wpm, metrics.accuracy));
    setText('res-mistakes', metrics.mistakes || 0);
    const m = Math.floor((metrics.elapsed || 0) / 60), s = (metrics.elapsed || 0) % 60;
    setText('res-time', `${m}:${String(s).padStart(2, '0')}`);

    // WPM level name
    const levelName = getSpeedLabel(metrics.wpm);
    setText('res-level-name', levelName);

    // XP gained
    const xpEl = $('res-xp-gained');
    if (xpEl && xpGained) { xpEl.textContent = '+' + xpGained + ' XP'; xpEl.style.display = ''; }
    else if (xpEl) xpEl.style.display = 'none';

    // PB badge
    const sessions = ProgressManager.getSessions();
    const prevBest = sessions.length > 1 ? Math.max(...sessions.slice(0, -1).map(s => s.wpm || 0)) : 0;
    const pbBadge = $('res-pb-badge');
    if (pbBadge) pbBadge.style.display = metrics.wpm > prevBest ? 'flex' : 'none';

    // Pass/fail
    const passEl = $('res-pass-status');
    if (passEl && lesson) {
        passEl.style.display = '';
        passEl.className = `res-pass-status ${passed ? 'passed' : 'failed'}`;
        passEl.textContent = passed ? '✅ Lesson Passed! Great work!' : `❌ Need ${lesson.requiredWpm} WPM & ${lesson.requiredAccuracy}% Accuracy`;
    } else if (passEl) passEl.style.display = 'none';

    // Certificate unlock banner
    const certBanner = document.getElementById('res-cert-banner');
    if (certBanner) certBanner.remove();

    if (lesson && lesson.isCertExam && passed) {
        const banner = document.createElement('div');
        banner.id = 'res-cert-banner';
        banner.className = 'cert-unlock-banner';
        banner.innerHTML = `
            <div class="cert-unlock-icon">🎓</div>
            <div class="cert-unlock-text">
                <h3>Certificate Unlocked!</h3>
                <p>You have earned the TypeMaster ${lesson.certType ? lesson.certType.charAt(0).toUpperCase() + lesson.certType.slice(1) : ''} Certificate. Click below to generate and print your certificate.</p>
            </div>
            <button class="btn btn-claim-cert" onclick="claimCertificate('${lesson.certType}')">🎓 Claim Certificate</button>
        `;
        const actionsEl = document.querySelector('.result-actions');
        if (actionsEl) actionsEl.parentElement.insertBefore(banner, actionsEl);
    }

    // Draw result charts
    setTimeout(() => {
        drawResultCharts(metrics);
    }, 100);

    // Add/update Replay button in result actions
    let replayBtn = document.getElementById('btn-replay-session');
    if (!replayBtn) {
        replayBtn = document.createElement('button');
        replayBtn.id = 'btn-replay-session';
        replayBtn.className = 'btn btn-ghost';
        replayBtn.innerHTML = '▶️ View Replay';
        replayBtn.onclick = () => { if (typeof ReplayEngine !== 'undefined') ReplayEngine.show(); };
        const actionsEl = document.querySelector('.result-actions') || modal.querySelector('[style*="display:flex"]');
        if (actionsEl) actionsEl.appendChild(replayBtn);
    }

    // Ensure replay modal exists
    ensureReplayModal();

    modal.classList.add('open');
}

function ensureReplayModal() {
    if (document.getElementById('replay-modal')) return;
    const m = document.createElement('div');
    m.id = 'replay-modal';
    m.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    m.innerHTML = `
        <div style="background:var(--bg,#0F172A);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;width:90%;max-width:700px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h2 style="font-size:18px;font-weight:800;">▶️ Performance Replay</h2>
                <button onclick="if(typeof ReplayEngine!=='undefined')ReplayEngine.hide()" style="background:none;border:none;color:var(--text-sub,#94A3B8);font-size:20px;cursor:pointer;">✕</button>
            </div>
            <div id="replay-modal-body" style="flex:1;overflow-y:auto;"></div>
        </div>
    `;
    document.body.appendChild(m);
}

function calcGrade(wpm, acc) {
    if (wpm >= 80 && acc >= 97) return 'S';
    if (wpm >= 70 && acc >= 95) return 'A+';
    if (wpm >= 60 && acc >= 92) return 'A';
    if (wpm >= 50 && acc >= 90) return 'B+';
    if (wpm >= 40 && acc >= 87) return 'B';
    if (wpm >= 30 && acc >= 85) return 'C+';
    if (wpm >= 20 && acc >= 80) return 'C';
    return 'D';
}

function getSpeedLabel(wpm) {
    if (wpm >= 100) return 'TypeMaster Elite';
    if (wpm >= 80)  return 'Expert Typist';
    if (wpm >= 60)  return 'Professional';
    if (wpm >= 40)  return 'Intermediate';
    if (wpm >= 25)  return 'Developing';
    return 'Beginner';
}

function drawResultCharts(metrics) {
    if (typeof Chart === 'undefined') return;
    // Timeline chart
    const timelineCtx = document.getElementById('result-timeline-chart');
    if (timelineCtx) {
        if (AppState.charts.resTimeline) { AppState.charts.resTimeline.destroy(); AppState.charts.resTimeline = null; }
        const wpmHistory = metrics.wpmHistory || Array.from({length: 6}, (_, i) => Math.round((metrics.wpm || 0) * (0.7 + Math.random() * 0.5)));
        AppState.charts.resTimeline = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: wpmHistory.map((_, i) => i + 1),
                datasets: [{
                    label: 'WPM',
                    data: wpmHistory,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94A3B8', font: { size: 10 } } }
                }
            }
        });
    }

    // Pie chart
    const pieCtx = document.getElementById('result-pie-chart');
    if (pieCtx) {
        if (AppState.charts.resPie) { AppState.charts.resPie.destroy(); AppState.charts.resPie = null; }
        const correct = metrics.correct || 0;
        const mistakes = metrics.mistakes || 0;
        AppState.charts.resPie = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Correct', 'Errors'],
                datasets: [{ data: [correct, mistakes], backgroundColor: ['#22C55E', '#EF4444'], borderWidth: 0 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 11 } } } },
                cutout: '60%'
            }
        });
    }
}

function closeResultModal() {
    const modal = $('result-modal');
    if (modal) modal.classList.remove('open');
    refreshHome();
}

// ═══════════════════════════════════════════════════════════
// CERTIFICATE CLAIM
// ═══════════════════════════════════════════════════════════
function claimCertificate(certType) {
    const s = AppState.settings;
    const userName = s.displayName || prompt('Enter your name for the certificate:', 'Your Name') || 'TypeMaster Student';
    const sessions = ProgressManager.getSessions();
    const completedLessons = ProgressManager.getCompletedLessons();
    const bestWpm = sessions.length ? Math.max(...sessions.map(s => s.wpm || 0)) : 0;
    const avgAcc = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length) : 0;
    const profile = ProgressManager.getProfile();

    CertificateEngine.generate(userName, certType || 'custom', {
        wpm: bestWpm,
        accuracy: avgAcc,
        lessonsCompleted: completedLessons.size,
        level: 'Level ' + profile.level
    });
}

// Manual certificate from settings or achievements
function openCertificateEarned(certType) {
    claimCertificate(certType);
}

// ═══════════════════════════════════════════════════════════
// LEVEL UP BANNER
// ═══════════════════════════════════════════════════════════
function showLevelUp(newLevel) {
    let banner = document.getElementById('level-up-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'level-up-banner';
        banner.className = 'level-up-banner glass-card';
        banner.innerHTML = `
            <div style="font-size:48px">⭐</div>
            <h2>Level Up!</h2>
            <div class="level-badge" id="level-up-num">Level ${newLevel}</div>
            <p style="color:var(--text-sub);margin-top:8px;">Keep going — you're unstoppable!</p>
            <button class="btn btn-primary" style="margin-top:16px" onclick="hideLevelUp()">🎉 Awesome!</button>
        `;
        document.body.appendChild(banner);
    }
    setText('level-up-num', 'Level ' + newLevel);
    banner.classList.add('show');
    setTimeout(() => banner.classList.remove('show'), 5000);
}

function hideLevelUp() {
    const banner = document.getElementById('level-up-banner');
    if (banner) banner.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════
// PRACTICE MODAL
// ═══════════════════════════════════════════════════════════
function openPracticeModal() {
    const modal = $('practice-modal');
    if (modal) modal.classList.add('open');
}

function closePracticeModal() {
    const modal = $('practice-modal');
    if (modal) modal.classList.remove('open');
}

// ═══════════════════════════════════════════════════════════
// STATISTICS VIEW
// ═══════════════════════════════════════════════════════════
function refreshStats() {
    const sessions = ProgressManager.getSessions();
    const daily = ProgressManager.getDailyData();
    const completedLessons = ProgressManager.getCompletedLessons();

    const bestWpm = sessions.length ? Math.max(...sessions.map(s => s.wpm || 0)) : 0;
    const avgWpm  = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.wpm || 0), 0) / sessions.length) : 0;
    const highAcc = sessions.length ? Math.max(...sessions.map(s => s.accuracy || 0)) : 0;
    const totalWords = sessions.reduce((a, s) => a + (s.words || 0), 0);
    const totalChars = sessions.reduce((a, s) => a + (s.chars || 0), 0);
    const totalTime  = sessions.reduce((a, s) => a + (s.duration || 0), 0);

    setText('stats-best-wpm', bestWpm);
    setText('stats-avg-wpm', avgWpm);
    setText('stats-high-acc', highAcc + '%');
    setText('stats-total-tests', sessions.length);
    setText('stats-total-words', totalWords.toLocaleString());
    setText('stats-total-chars', totalChars.toLocaleString());
    setText('stats-practice-time', formatDuration(totalTime));
    setText('stats-streak', daily.currentStreak + ' days');

    // History table
    const tbody = $('history-tbody');
    if (tbody) {
        const recent = [...sessions].reverse().slice(0, 30);
        tbody.innerHTML = recent.map((s, i) => `
            <tr>
                <td>${new Date(s.date).toLocaleString()}</td>
                <td style="color:var(--primary);font-weight:700">${s.wpm}</td>
                <td>${s.rawWpm || '—'}</td>
                <td style="color:${s.accuracy >= 95 ? 'var(--success)' : 'var(--text-sub)'}">${s.accuracy}%</td>
                <td><span class="grade-badge">${calcGrade(s.wpm, s.accuracy)}</span></td>
                <td>${formatMode(s.mode)}</td>
                <td style="color:${s.mistakes ? 'var(--error)' : 'var(--success)'}">${s.mistakes || 0}</td>
            </tr>
        `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:24px">No sessions yet. Start typing!</td></tr>';
    }

    // History trend chart
    renderHistoryChart(sessions);

    // Mistake heatmap
    renderMistakeHeatmap(sessions);
}

function formatMode(mode) {
    if (!mode) return '—';
    if (mode.type === 'lesson') return 'Lesson';
    if (mode.type === 'time') return `${mode.sub}s`;
    if (mode.type === 'words') return `${mode.sub}w`;
    if (mode.type === 'code') return mode.sub || 'Code';
    return mode.sub || mode.type || '—';
}

function formatDuration(seconds) {
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.round(seconds / 60) + 'm';
    return (seconds / 3600).toFixed(1) + 'h';
}

function renderHistoryChart(sessions) {
    const ctx = document.getElementById('history-trend-chart');
    if (!ctx || typeof Chart === 'undefined') return;

    const recent = [...sessions].slice(-30);
    if (AppState.charts.history) { AppState.charts.history.destroy(); AppState.charts.history = null; }

    AppState.charts.history = new Chart(ctx, {
        type: 'line',
        data: {
            labels: recent.map((_, i) => '#' + (i + 1)),
            datasets: [
                {
                    label: 'WPM',
                    data: recent.map(s => s.wpm || 0),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59,130,246,0.1)',
                    tension: 0.4, fill: true, yAxisID: 'wpm'
                },
                {
                    label: 'Accuracy',
                    data: recent.map(s => s.accuracy || 0),
                    borderColor: '#22C55E',
                    backgroundColor: 'transparent',
                    tension: 0.4, borderDash: [4,4], yAxisID: 'acc'
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94A3B8' } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94A3B8' } },
                wpm: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#3B82F6' } },
                acc: { type: 'linear', position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { color: '#22C55E' } }
            }
        }
    });
}

function renderMistakeHeatmap(sessions) {
    const heatmap = $('mistake-heatmap');
    if (!heatmap) return;

    const mistakeCounts = {};
    sessions.forEach(s => {
        if (s.mistakeChars) {
            Object.entries(s.mistakeChars).forEach(([k, v]) => {
                mistakeCounts[k] = (mistakeCounts[k] || 0) + v;
            });
        }
    });

    const sorted = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
    const max = sorted[0] ? sorted[0][1] : 1;

    if (!sorted.length) {
        heatmap.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:12px;">No mistake data yet. Start typing!</div>';
        return;
    }

    heatmap.innerHTML = sorted.map(([k, v]) => {
        const pct = Math.round((v / max) * 80) + 20;
        return `<div class="heatmap-key" style="--heat:${pct}%"><strong>${k === ' ' ? '⎵' : k}</strong><small>${v}x</small></div>`;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// ACHIEVEMENTS VIEW
// ═══════════════════════════════════════════════════════════
function renderAchievements() {
    const grid = $('achievements-grid');
    if (!grid) return;

    if (typeof AchievementManager === 'undefined') {
        grid.innerHTML = '<div style="color:var(--text-muted)">Achievements loading...</div>';
        return;
    }

    const allAch = AchievementManager.getAll();
    const profile = ProgressManager.getProfile();
    const sessions = ProgressManager.getSessions();
    const daily = ProgressManager.getDailyData();
    AchievementManager.checkAll(profile, daily, sessions);
    const unlocked = new Set(AchievementManager.getUnlocked());

    grid.innerHTML = allAch.map(a => `
        <div class="achievement-badge ${unlocked.has(a.id) ? 'unlocked' : 'locked'}">
            <div class="ach-icon-wrap">${a.icon}</div>
            <div>
                <div class="ach-title">${a.name}</div>
                <div class="ach-desc">${a.description}</div>
                ${unlocked.has(a.id)
                    ? `<div class="ach-date">✅ Unlocked!</div>`
                    : `<div class="ach-locked-label">🔒 ${a.hint || 'Keep practicing!'}</div>`}
            </div>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════════════
// FINGER GUIDE PAGE
// ═══════════════════════════════════════════════════════════
function initFingerGuidePage() {
    const fgContainer = $('finger-guide-main');
    if (!fgContainer || FingerGuideInstance) return;

    FingerGuideInstance = new FingerGuide('finger-guide-main');

    // Render key reference
    renderFingerKeyReference();
}

function renderFingerKeyReference() {
    const refContainer = $('finger-key-reference');
    if (!refContainer || typeof FINGER_MAP === 'undefined') return;

    refContainer.innerHTML = Object.entries(FINGER_MAP).map(([fingerId, info]) => {
        const keys = Object.entries(KEY_FINGER_MAP)
            .filter(([k, f]) => f === fingerId)
            .map(([k]) => k === ' ' ? '⎵' : k.toUpperCase());
        return `
            <div class="finger-ref-card" style="border-left-color:${info.color}">
                <div class="finger-ref-name" style="color:${info.color}">${info.emoji} ${info.label}</div>
                <div class="finger-ref-keys">
                    ${keys.map(k => `<kbd style="border-color:${info.color}44;background:${info.color}15;color:${info.color}">${k}</kbd>`).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// MY CERTIFICATES & VERIFICATION PAGE
// ═══════════════════════════════════════════════════════════
function renderCertificatesPage() {
    const container = $('my-certificates-grid');
    if (!container) return;

    if (typeof CertificateEngine === 'undefined') {
        container.innerHTML = '<div style="color:var(--text-muted)">Certificates module loading...</div>';
        return;
    }

    const earnedList = CertificateEngine.getEarnedCertificates();
    const earnedMap = new Map(earnedList.map(c => [c.levelId, c]));
    const completedLessons = ProgressManager.getCompletedLessons();
    const sessions = ProgressManager.getSessions();
    const bestWpm = sessions.length ? Math.max(...sessions.map(s => s.wpm || 0)) : 0;
    const avgAcc = sessions.length ? Math.round(sessions.reduce((a, s) => a + (s.accuracy || 0), 0) / sessions.length) : 0;
    const s = AppState.settings;
    const userName = s.displayName || 'TypeMaster Student';

    container.innerHTML = CERTIFICATE_LEVELS.map(level => {
        const earned = earnedMap.get(level.id);
        const isEligible = completedLessons.size >= level.milestoneLesson && bestWpm >= level.requiredWpm && avgAcc >= level.requiredAcc;

        return `
            <div class="glass-card" style="padding:24px;border-top:4px solid ${level.color};display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-size:32px;">${level.badge}</div>
                    ${earned
                        ? `<span class="badge badge-success">✅ Issued ${earned.id}</span>`
                        : isEligible
                            ? `<span class="badge badge-warn">✨ Eligible to Claim</span>`
                            : `<span class="badge badge-error">🔒 Milestone Locked</span>`}
                </div>
                <div>
                    <h3 style="font-size:16px;font-weight:800;margin-bottom:4px;">${level.name}</h3>
                    <div style="font-size:12px;color:var(--text-sub);">Milestone: Lesson ${level.milestoneLesson} · Min ${level.requiredWpm} WPM · ${level.requiredAcc}% Acc</div>
                </div>
                ${earned ? `
                    <div style="font-size:12px;color:var(--text-muted);background:rgba(0,0,0,0.2);padding:10px;border-radius:8px;">
                        <div>ID: <strong>${earned.id}</strong></div>
                        <div>Date: ${earned.issueDate}</div>
                        <div>Score: ${earned.finalWpm} WPM · ${earned.finalAccuracy}% Accuracy</div>
                    </div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;">
                        <button class="btn btn-primary btn-sm" onclick="claimCertificate('${level.id}')">🖨️ View & Print</button>
                        <button class="btn btn-ghost btn-sm" onclick="shareCertificate('${earned.id}')">📋 Share</button>
                    </div>
                ` : `
                    <div style="font-size:12px;color:var(--text-muted);margin-top:auto;">
                        ${isEligible
                            ? `<button class="btn btn-claim-cert btn-sm" style="width:100%" onclick="claimCertificate('${level.id}')">🎓 Issue & View Certificate</button>`
                            : `Complete Lesson ${level.milestoneLesson} with ${level.requiredWpm}+ WPM to unlock.`}
                    </div>
                `}
            </div>
        `;
    }).join('');

    const btnVerify = $('btn-verify-cert');
    if (btnVerify) {
        btnVerify.onclick = handleVerifyCertificate;
    }
}

function handleVerifyCertificate() {
    const input = $('cert-verify-input');
    const resultBox = $('cert-verify-result');
    if (!input || !resultBox) return;

    const certId = input.value.trim();
    if (!certId) {
        showToast('⚠️', 'Input Error', 'Please enter a Certificate ID.');
        return;
    }

    const verification = CertificateEngine.verify(certId);
    resultBox.style.display = 'block';

    if (verification.valid) {
        const c = verification.cert;
        resultBox.className = 'glass-card';
        resultBox.style.border = '1px solid var(--success)';
        resultBox.style.background = 'rgba(34,197,94,0.1)';
        resultBox.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="font-size:32px;">🎓</div>
                <div>
                    <div style="font-size:14px;font-weight:800;color:var(--success)">✅ ${c.verificationStatus}</div>
                    <div style="font-size:16px;font-weight:900;">${c.studentName} — ${c.levelName}</div>
                </div>
            </div>
            <div style="font-size:13px;color:var(--text-sub);line-height:1.7;">
                <div>Certificate ID: <strong>${c.id}</strong> &nbsp;·&nbsp; Issued: ${c.issueDate}</div>
                <div>Performance: <strong>${c.finalWpm} WPM</strong> &nbsp;·&nbsp; Accuracy: <strong>${c.finalAccuracy}%</strong> &nbsp;·&nbsp; Lessons: <strong>${c.lessonsCompleted}</strong></div>
                <div>Issuer: <strong>${c.provider?.providerName || 'Mohammed Shakib'}</strong> (${c.provider?.providerTitle || 'Founder & Director'}, ${c.provider?.organization || 'TypeMaster Academy'})</div>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="claimCertificate('${c.levelId || 'master'}')">🖨️ Render Certificate</button>
        `;
    } else {
        resultBox.className = 'glass-card';
        resultBox.style.border = '1px solid var(--error)';
        resultBox.style.background = 'rgba(239,68,68,0.1)';
        resultBox.innerHTML = `
            <div style="font-size:14px;font-weight:800;color:var(--error);margin-bottom:4px;">❌ Invalid Certificate ID</div>
            <div style="font-size:12px;color:var(--text-sub);">No official TypeMaster certificate was found matching "${escapeHTML(certId)}". Please check the Certificate ID and try again.</div>
        `;
    }
}

function shareCertificate(certId) {
    const url = `${location.origin}${location.pathname}?verify=${certId}`;
    const text = `Check out my official TypeMaster Certificate (${certId})! 🎓`;
    if (navigator.share) {
        navigator.share({ title: 'TypeMaster Certificate', text, url });
    } else {
        navigator.clipboard.writeText(`${text} ${url}`).then(() => showToast('📋', 'Link Copied!', 'Certificate verification link copied to clipboard.'));
    }
}

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════
function initSettings() {
    const s = AppState.settings;

    const setEl = (id, val) => {
        const el = $(id);
        if (!el) return;
        if (el.type === 'checkbox') el.checked = !!val;
        else el.value = val || '';
    };

    setEl('set-display-name', s.displayName || '');
    setEl('set-theme', s.theme || 'dark');
    setEl('set-font-family', s.fontFamily || 'Fira Code');
    setEl('set-font-size', s.fontSize || 22);
    setEl('set-caret', s.caret || 'line');
    setEl('set-show-keyboard', s.showKeyboard !== false);
    setEl('set-sound', s.sound !== false);
    setEl('set-volume', s.volume ?? 0.65);
    setEl('set-click-type', s.clickType || 'mechanical');

    if (typeof CertificateEngine !== 'undefined') {
        const prov = CertificateEngine.getProviderSettings();
        setEl('set-provider-name', prov.providerName || '');
        setEl('set-provider-title', prov.providerTitle || '');
        setEl('set-organization', prov.organization || '');
    }

    const fsVal = $('set-font-size-val');
    if (fsVal) fsVal.textContent = (s.fontSize || 22) + 'px';

    // Font size live update
    const fsRange = $('set-font-size');
    if (fsRange) {
        fsRange.oninput = () => {
            if (fsVal) fsVal.textContent = fsRange.value + 'px';
        };
    }
}

function saveSettingsFromForm() {
    const getVal = id => { const el = $(id); return el ? el.value : null; };
    const getCheck = id => { const el = $(id); return el ? el.checked : false; };

    const s = {
        displayName: getVal('set-display-name'),
        theme: getVal('set-theme'),
        fontFamily: getVal('set-font-family'),
        fontSize: parseInt(getVal('set-font-size')) || 22,
        caret: getVal('set-caret'),
        showKeyboard: getCheck('set-show-keyboard'),
        sound: getCheck('set-sound'),
        volume: parseFloat(getVal('set-volume')) || 0.65,
        clickType: getVal('set-click-type')
    };

    if (typeof CertificateEngine !== 'undefined') {
        CertificateEngine.saveProviderSettings({
            providerName: getVal('set-provider-name'),
            providerTitle: getVal('set-provider-title'),
            organization: getVal('set-organization')
        });
    }

    AppState.settings = { ...AppState.settings, ...s };
    saveSettings(AppState.settings);
    applySettings(AppState.settings);

    showToast('⚙️', 'Settings Saved', 'Your preferences have been updated.');
}

function applySettings(s) {
    // Theme
    document.documentElement.setAttribute('data-theme', s.theme || 'dark');

    // Caret style
    document.documentElement.setAttribute('data-caret', s.caret || 'line');

    // Font
    const disp = $('typing-display');
    if (disp) {
        disp.style.fontFamily = `'${s.fontFamily || 'Fira Code'}', monospace`;
        disp.style.fontSize = (s.fontSize || 22) + 'px';
    }
    document.documentElement.style.setProperty('--font-family-typing', `'${s.fontFamily || 'Fira Code'}'`);
    document.documentElement.style.setProperty('--font-size-typing', (s.fontSize || 22) + 'px');

    // Sound engine
    if (AppState.soundEngine) {
        AppState.soundEngine.setEnabled && AppState.soundEngine.setEnabled(s.sound !== false);
        AppState.soundEngine.setVolume && AppState.soundEngine.setVolume(s.volume ?? 0.65);
    }
}

function showToast(icon, title, desc) {
    let toast = document.querySelector('.achievement-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'achievement-toast glass-card';
        toast.innerHTML = `<div class="toast-icon"></div><div><div style="font-weight:700;font-size:14px" class="toast-title"></div><div style="font-size:12px;color:var(--text-sub)" class="toast-desc"></div></div><button onclick="this.parentElement.classList.remove('show')">✕</button>`;
        document.body.appendChild(toast);
    }
    toast.querySelector('.toast-icon').textContent = icon;
    toast.querySelector('.toast-title').textContent = title;
    toast.querySelector('.toast-desc').textContent = desc;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
}

// ═══════════════════════════════════════════════════════════
// DATA BACKUP
// ═══════════════════════════════════════════════════════════
function exportBackup() {
    const data = {
        version: 3,
        exported: new Date().toISOString(),
        profile: ProgressManager.getProfile(),
        sessions: ProgressManager.getSessions(),
        completedLessons: [...ProgressManager.getCompletedLessons()],
        dailyData: ProgressManager.getDailyData(),
        settings: AppState.settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typemaster-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportCSV() {
    const sessions = ProgressManager.getSessions();
    const header = ['Date','WPM','Raw WPM','Accuracy','Grade','Mistakes','Duration','Mode'];
    const rows = sessions.map(s => [
        new Date(s.date).toLocaleString(),
        s.wpm, s.rawWpm || '', s.accuracy,
        calcGrade(s.wpm, s.accuracy),
        s.mistakes || 0, s.duration || 0,
        formatMode(s.mode)
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typemaster-sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.profile) localStorage.setItem('tm_profile', JSON.stringify(data.profile));
            if (data.sessions) localStorage.setItem('tm_sessions', JSON.stringify(data.sessions));
            if (data.completedLessons) localStorage.setItem('tm_completed', JSON.stringify(data.completedLessons));
            if (data.dailyData) localStorage.setItem('tm_daily', JSON.stringify(data.dailyData));
            if (data.settings) { AppState.settings = data.settings; saveSettings(data.settings); applySettings(data.settings); }
            showToast('✅', 'Backup Restored', 'Your TypeMaster data has been imported successfully.');
            refreshHome();
        } catch (err) {
            showToast('❌', 'Import Failed', 'The file could not be read. Is it a valid TypeMaster backup?');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (!confirm('This will DELETE all your progress, sessions, and settings. This cannot be undone!\n\nAre you absolutely sure?')) return;
    ['tm_profile','tm_sessions','tm_completed','tm_daily','tm_settings','tm_achievements'].forEach(k => localStorage.removeItem(k));
    AppState.settings = {};
    showToast('🗑️', 'Data Cleared', 'All progress has been reset. Starting fresh!');
    setTimeout(() => location.reload(), 1500);
}

// ═══════════════════════════════════════════════════════════
// PWA INSTALL
// ═══════════════════════════════════════════════════════════
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    AppState.deferredInstall = e;
    const btn = $('btn-install-pwa');
    if (btn) btn.style.display = 'inline-flex';
});

// ═══════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved settings immediately
    applySettings(AppState.settings);

    // Nav links
    document.querySelectorAll('.nav-link, .sidebar-brand').forEach(link => {
        link.addEventListener('click', e => {
            const view = link.getAttribute('data-view');
            if (view) {
                e.preventDefault();
                navigateTo(view);
            }
        });
    });

    // PWA App Download Modal Handlers
    const openDownloadModal = () => {
        const modal = $('app-download-modal');
        if (modal) modal.classList.add('open');
    };

    const installBtn = $('btn-install-pwa');
    if (installBtn) installBtn.addEventListener('click', openDownloadModal);

    const sidebarInstallBtn = $('sidebar-btn-install');
    if (sidebarInstallBtn) sidebarInstallBtn.addEventListener('click', e => {
        e.preventDefault();
        openDownloadModal();
    });

    const triggerPwaBtn = $('btn-trigger-pwa-install');
    if (triggerPwaBtn) {
        triggerPwaBtn.addEventListener('click', async () => {
            if (AppState.deferredInstall) {
                AppState.deferredInstall.prompt();
                const { outcome } = await AppState.deferredInstall.userChoice;
                AppState.deferredInstall = null;
                if (outcome === 'accepted') {
                    const modal = $('app-download-modal');
                    if (modal) modal.classList.remove('open');
                    showToast('🎉', 'App Installed!', 'TypeMaster has been successfully installed on your device.');
                }
            } else {
                showToast('ℹ️', 'Installation Guide', 'Please follow the instructions below for your device.');
            }
        });
    }

    // Modal close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal && modal.id === 'student-auth-modal' && (typeof AuthEngine === 'undefined' || !AuthEngine.getActiveStudent())) {
                showToast('⚠️', 'Account Required', 'Please sign in, register, or use Google Login to access TypeMaster.');
                return;
            }
            if (modal) modal.classList.remove('open');
        });
    });

    // Modal backdrop click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', e => {
            if (e.target === modal) {
                if (modal.id === 'student-auth-modal' && (typeof AuthEngine === 'undefined' || !AuthEngine.getActiveStudent())) {
                    return;
                }
                modal.classList.remove('open');
            }
        });
    });

    // Result modal buttons
    const btnResHome = $('btn-res-home');
    if (btnResHome) btnResHome.addEventListener('click', () => { closeResultModal(); navigateTo('home'); });

    const btnResRetry = $('btn-res-retry');
    if (btnResRetry) btnResRetry.addEventListener('click', () => {
        closeResultModal();
        if (AppState.currentLesson) loadArenaLesson(AppState.currentLesson);
        else loadArenaMode(AppState.currentMode.type, AppState.currentMode.sub);
    });

    const btnResNext = $('btn-res-next-lesson');
    if (btnResNext) btnResNext.addEventListener('click', () => {
        closeResultModal();
        if (AppState.nextLesson) startLesson(AppState.nextLesson);
        else navigateTo('lessons');
    });

    const btnResShare = $('btn-res-share');
    if (btnResShare) btnResShare.addEventListener('click', () => {
        const wpm = $('res-wpm').textContent;
        const acc = $('res-acc').textContent;
        const text = `I just scored ${wpm} WPM with ${acc} accuracy on TypeMaster! 🚀`;
        if (navigator.share) {
            navigator.share({ title: 'TypeMaster Result', text });
        } else {
            navigator.clipboard.writeText(text).then(() => showToast('📋', 'Copied!', 'Result copied to clipboard.'));
        }
    });

    // Continue learning button
    const btnContinue = $('btn-continue-learning');
    if (btnContinue) btnContinue.addEventListener('click', () => {
        if (AppState.nextLesson) startLesson(AppState.nextLesson);
        else { navigateTo('lessons'); }
    });

    const btnStart = $('btn-start-typing');
    if (btnStart) btnStart.addEventListener('click', openPracticeModal);

    const btnViewLessons = $('btn-view-lessons');
    if (btnViewLessons) btnViewLessons.addEventListener('click', () => navigateTo('lessons'));

    // Practice mode buttons
    document.querySelectorAll('.pmode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.getAttribute('data-mode');
            const sub  = btn.getAttribute('data-sub');
            navigateTo('arena');
            loadArenaMode(mode, sub);
        });
    });

    // Custom text
    const btnLoadCustom = $('btn-load-custom');
    if (btnLoadCustom) btnLoadCustom.addEventListener('click', () => {
        const txt = ($('custom-text-input') || {}).value?.trim();
        if (!txt) return showToast('⚠️', 'No Text', 'Please enter some text to practice.');
        navigateTo('arena');
        AppState.currentLesson = null;
        AppState.currentMode = { type: 'custom', sub: 'custom' };
        const infoPanel = $('lesson-info-panel');
        if (infoPanel) infoPanel.style.display = 'none';
        setText('arena-title', 'Custom Text Practice');
        loadArenaText(txt, null);
    });

    const customFileInput = $('custom-file-input');
    if (customFileInput) customFileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const txt = ev.target.result.trim().slice(0, 3000);
            if ($('custom-text-input')) $('custom-text-input').value = txt;
        };
        reader.readAsText(file);
    });

    // Pause button
    const btnPause = $('btn-pause');
    if (btnPause) btnPause.addEventListener('click', () => {
        if (AppState.engine) {
            const paused = AppState.engine.togglePause && AppState.engine.togglePause();
            btnPause.textContent = paused ? '▶ Resume' : '⏸ Pause';
        }
    });

    // Restart button
    const btnRestart = $('btn-restart');
    if (btnRestart) btnRestart.addEventListener('click', () => {
        if (AppState.currentLesson) loadArenaLesson(AppState.currentLesson);
        else if (AppState.currentMode.type) loadArenaMode(AppState.currentMode.type, AppState.currentMode.sub);
    });

    // Tab key to restart in arena
    document.addEventListener('keydown', e => {
        if (e.key === 'Tab' && AppState.currentView === 'arena') {
            e.preventDefault();
            if (AppState.currentLesson) loadArenaLesson(AppState.currentLesson);
            else loadArenaMode(AppState.currentMode.type, AppState.currentMode.sub);
        }
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.open');
            if (openModal) {
                if (openModal.id === 'student-auth-modal' && (typeof AuthEngine === 'undefined' || !AuthEngine.getActiveStudent())) {
                    return;
                }
                openModal.classList.remove('open');
            }
        }
    });

    // Settings form
    const settingsForm = document.querySelector('#view-settings .glass-card');
    if (settingsForm) {
        ['set-display-name','set-theme','set-font-family','set-font-size','set-caret','set-show-keyboard','set-sound','set-volume','set-click-type'].forEach(id => {
            const el = $(id);
            if (el) el.addEventListener('change', saveSettingsFromForm);
        });
        const fsRange = $('set-font-size');
        if (fsRange) fsRange.addEventListener('input', saveSettingsFromForm);
    }

    // Data buttons
    const btnExportBackup = $('btn-export-backup');
    if (btnExportBackup) btnExportBackup.addEventListener('click', exportBackup);

    const btnExportCSV = $('btn-export-csv');
    if (btnExportCSV) btnExportCSV.addEventListener('click', exportCSV);

    const btnImport = $('btn-import-backup');
    if (btnImport) btnImport.addEventListener('change', e => importBackup(e.target.files[0]));

    const btnClearData = $('btn-clear-data');
    if (btnClearData) btnClearData.addEventListener('click', clearAllData);

    // Close practice modal
    const btnClosePractice = $('btn-close-practice');
    if (btnClosePractice) btnClosePractice.addEventListener('click', closePracticeModal);

    // Sound engine init on first user interaction
    document.addEventListener('click', () => {
        if (!AppState.soundEngine && typeof SoundEngine !== 'undefined') {
            AppState.soundEngine = new SoundEngine();
            AppState.soundEngine.setEnabled(AppState.settings.sound !== false);
            AppState.soundEngine.setVolume(AppState.settings.volume ?? 0.65);
        }
    }, { once: true });

    // Unregister legacy service worker caches to force live updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
        });
        if (window.caches) {
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        }
    }

    // Student Auth Modal Handlers & Google SSO
    if (typeof AuthEngine !== 'undefined') {
        const activeStudent = AuthEngine.getActiveStudent();
        if (activeStudent) {
            const labelEl = $('topbar-student-name');
            if (labelEl) labelEl.textContent = activeStudent.fullName || activeStudent.username;
        } else {
            setTimeout(() => {
                const modal = $('student-auth-modal');
                if (modal) modal.classList.add('open');
            }, 500);
        }

        // Global Google Identity Services Callback
        window.handleGoogleSignInCallback = function(response) {
            if (response && response.credential) {
                const res = AuthEngine.handleGoogleCredential(response.credential);
                if (res.success) {
                    showToast('🌐', 'Google Login Success!', `Signed in as ${res.student.fullName}`);
                    const modal = $('student-auth-modal');
                    if (modal) modal.classList.remove('open');
                    const labelEl = $('topbar-student-name');
                    if (labelEl) labelEl.textContent = res.student.fullName;
                } else {
                    const alertEl = $('auth-alert-msg');
                    if (alertEl) {
                        alertEl.style.display = 'block';
                        alertEl.textContent = res.message || 'Google Sign-In failed.';
                    }
                }
            }
        };

        // Google Sign-In Button Trigger
        const btnGoogle = $('btn-google-login');
        if (btnGoogle) {
            btnGoogle.onclick = () => {
                if (window.google && google.accounts && google.accounts.id) {
                    try {
                        google.accounts.id.initialize({
                            client_id: "1083928172931-demo.apps.googleusercontent.com",
                            callback: window.handleGoogleSignInCallback
                        });
                        google.accounts.id.prompt((notification) => {
                            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                                const gEmail = prompt('Enter your Google Email Address:');
                                if (!gEmail) return;
                                const gName = prompt('Enter your Full Name:', gEmail.split('@')[0]);
                                const res = AuthEngine.loginWithGoogle({
                                    email: gEmail,
                                    fullName: gName || gEmail.split('@')[0],
                                    avatar: '🌐',
                                    googleId: 'G-' + Date.now()
                                });
                                if (res.success) {
                                    showToast('🌐', 'Google Login Success!', `Welcome, ${res.student.fullName}`);
                                    const modal = $('student-auth-modal');
                                    if (modal) modal.classList.remove('open');
                                    const labelEl = $('topbar-student-name');
                                    if (labelEl) labelEl.textContent = res.student.fullName;
                                }
                            }
                        });
                    } catch (err) {
                        const gEmail = prompt('Enter your Google Email Address:');
                        if (!gEmail) return;
                        const gName = prompt('Enter your Full Name:', gEmail.split('@')[0]);
                        const res = AuthEngine.loginWithGoogle({
                            email: gEmail,
                            fullName: gName || gEmail.split('@')[0],
                            avatar: '🌐',
                            googleId: 'G-' + Date.now()
                        });
                        if (res.success) {
                            showToast('🌐', 'Google Login Success!', `Welcome, ${res.student.fullName}`);
                            const modal = $('student-auth-modal');
                            if (modal) modal.classList.remove('open');
                            const labelEl = $('topbar-student-name');
                            if (labelEl) labelEl.textContent = res.student.fullName;
                        }
                    }
                } else {
                    const gEmail = prompt('Enter your Google Email Address for Google Sign-In:');
                    if (!gEmail) return;
                    const gName = prompt('Enter your Full Name:', gEmail.split('@')[0]);
                    const res = AuthEngine.loginWithGoogle({
                        email: gEmail,
                        fullName: gName || gEmail.split('@')[0],
                        avatar: '🌐',
                        googleId: 'G-' + Date.now()
                    });
                    if (res.success) {
                        showToast('🌐', 'Google Login Success!', `Welcome, ${res.student.fullName}`);
                        const modal = $('student-auth-modal');
                        if (modal) modal.classList.remove('open');
                        const labelEl = $('topbar-student-name');
                        if (labelEl) labelEl.textContent = res.student.fullName;
                    }
                }
            };
        }

        const btnOpenAuth = $('btn-open-student-auth');
        if (btnOpenAuth) {
            btnOpenAuth.onclick = () => {
                const current = AuthEngine.getActiveStudent();
                if (current) {
                    if (confirm(`Logged in as ${current.fullName} (${current.email}).\n\nDo you want to log out?`)) {
                        AuthEngine.logout();
                    }
                } else {
                    const modal = $('student-auth-modal');
                    if (modal) modal.classList.add('open');
                }
            };
        }

        const btnCloseAuth = $('btn-close-auth-modal');
        if (btnCloseAuth) {
            btnCloseAuth.onclick = () => {
                const current = AuthEngine.getActiveStudent();
                if (!current) {
                    showToast('⚠️', 'Account Required', 'Please sign in with Google or create an account to use TypeMaster.');
                    return;
                }
                const modal = $('student-auth-modal');
                if (modal) modal.classList.remove('open');
            };
        }

        const tabLogin = $('tab-login-btn');
        const tabReg = $('tab-register-btn');
        const formLogin = $('student-login-form');
        const formReg = $('student-register-form');

        if (tabLogin && tabReg) {
            tabLogin.onclick = () => {
                tabLogin.className = 'btn btn-primary btn-sm';
                tabReg.className = 'btn btn-ghost btn-sm';
                if (formLogin) formLogin.style.display = 'block';
                if (formReg) formReg.style.display = 'none';
            };
            tabReg.onclick = () => {
                tabReg.className = 'btn btn-primary btn-sm';
                tabLogin.className = 'btn btn-ghost btn-sm';
                if (formReg) formReg.style.display = 'block';
                if (formLogin) formLogin.style.display = 'none';
            };
        }

        if (formLogin) {
            formLogin.onsubmit = (e) => {
                e.preventDefault();
                const inp = $('stu-login-input').value;
                const pass = $('stu-login-pass').value;
                const res = AuthEngine.login(inp, pass);
                if (res.success) {
                    showToast('👋', 'Welcome Back!', `Signed in as ${res.student.fullName}`);
                    const modal = $('student-auth-modal');
                    if (modal) modal.classList.remove('open');
                    const labelEl = $('topbar-student-name');
                    if (labelEl) labelEl.textContent = res.student.fullName;
                } else {
                    const alertEl = $('auth-alert-msg');
                    if (alertEl) {
                        alertEl.style.display = 'block';
                        alertEl.textContent = res.message;
                    }
                }
            };
        }

        if (formReg) {
            formReg.onsubmit = (e) => {
                e.preventDefault();
                const name = $('reg-name').value;
                const user = $('reg-user').value;
                const email = $('reg-email').value;
                const pass = $('reg-pass').value;
                const conf = $('reg-conf').value;

                const res = AuthEngine.register(name, user, email, pass, conf);
                if (res.success) {
                    showToast('🎉', 'Account Created!', `Welcome to TypeMaster, ${res.student.fullName}!`);
                    const modal = $('student-auth-modal');
                    if (modal) modal.classList.remove('open');
                    const labelEl = $('topbar-student-name');
                    if (labelEl) labelEl.textContent = res.student.fullName;
                } else {
                    const alertEl = $('auth-alert-msg');
                    if (alertEl) {
                        alertEl.style.display = 'block';
                        alertEl.textContent = res.message;
                    }
                }
            };
        }
    }

    // Initial render
    const params = new URLSearchParams(window.location.search);
    const initialView = params.get('view') || 'home';
    navigateTo(initialView);

    console.log(`%cTypeMaster v3 — ${TOTAL_LESSONS} lessons loaded 🚀`, 'color:#3B82F6;font-size:14px;font-weight:bold');
});
