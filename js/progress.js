/**
 * TypeMaster - User Progress & XP Manager
 * Handles lessons progress, XP, levels, streaks, achievements, and personal bests.
 */

const STORAGE_KEYS = {
    PROFILE: 'tm_profile_v3',
    PROGRESS: 'tm_progress_v3',
    HISTORY: 'tm_history_v3',
    DAILY: 'tm_daily_v3',
    ACHIEVEMENTS: 'tm_achievements_v3',
    SETTINGS: 'tm_settings_v3',
    CUSTOM_TEXTS: 'tm_custom_v3'
};

// XP needed to reach each level (level = index + 1)
const XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000, 5000, 6200, 7600, 9200, 11000];

const DEFAULT_SETTINGS = {
    theme: 'dark',
    fontSize: 22,
    fontFamily: 'Fira Code',
    caretStyle: 'line',
    soundEnabled: true,
    volume: 0.65,
    clickSound: 'mechanical',
    showKeyboard: true,
    liveWpm: true,
    liveAccuracy: true,
    minimalMode: false,
    animationSpeed: 'normal'
};

const DEFAULT_PROFILE = {
    displayName: 'TypeMaster User',
    xp: 0,
    level: 1,
    createdAt: null,
    totalPracticeSeconds: 0,
    testsCompleted: 0,
    bestWpm: 0,
    avgWpm: 0,
    highestAccuracy: 0,
    totalWordsTyped: 0,
    totalCharsTyped: 0
};

const ProgressManager = {
    getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
        } catch { return { ...DEFAULT_SETTINGS }; }
    },

    saveSettings(patch) {
        try {
            const current = this.getSettings();
            const updated = { ...current, ...patch };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
            return updated;
        } catch { return null; }
    },

    getProfile() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
            if (data) return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
            const profile = { ...DEFAULT_PROFILE, createdAt: Date.now() };
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            return profile;
        } catch { return { ...DEFAULT_PROFILE }; }
    },

    saveProfile(patch) {
        try {
            const profile = { ...this.getProfile(), ...patch };
            localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            return profile;
        } catch { return null; }
    },

    getLessonProgress() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
            return data ? JSON.parse(data) : {};
        } catch { return {}; }
    },

    getLessonStatus(lessonId) {
        const progress = this.getLessonProgress();
        return progress[lessonId] || { status: 'locked', bestWpm: 0, bestAccuracy: 0, completions: 0, xpEarned: 0 };
    },

    isLessonUnlocked(lessonId) {
        const lesson = ALL_LESSONS.find(l => l.id === lessonId);
        if (!lesson) return false;
        const lessonIndex = ALL_LESSONS.findIndex(l => l.id === lessonId);
        if (lessonIndex === 0) return true; // First lesson always unlocked
        const prevLesson = ALL_LESSONS[lessonIndex - 1];
        const prevStatus = this.getLessonStatus(prevLesson.id);
        return prevStatus.status === 'completed' || prevStatus.status === 'passed';
    },

    completeLessonAttempt(lessonId, result) {
        try {
            const progress = this.getLessonProgress();
            const lesson = ALL_LESSONS.find(l => l.id === lessonId);
            if (!lesson) return null;

            const existing = progress[lessonId] || { status: 'locked', bestWpm: 0, bestAccuracy: 0, completions: 0, xpEarned: 0 };
            const passed = result.wpm >= lesson.requiredWpm && result.accuracy >= lesson.requiredAccuracy;
            
            const isNewBestWpm = result.wpm > (existing.bestWpm || 0);
            const isNewBestAcc = result.accuracy > (existing.bestAccuracy || 0);

            const updated = {
                ...existing,
                status: passed ? 'completed' : 'attempted',
                bestWpm: Math.max(existing.bestWpm || 0, result.wpm),
                bestAccuracy: Math.max(existing.bestAccuracy || 0, result.accuracy),
                completions: (existing.completions || 0) + 1,
                lastAttempt: Date.now()
            };

            // Grant XP on first pass only
            let xpGained = 0;
            if (passed && existing.status !== 'completed') {
                xpGained = lesson.xpReward;
                updated.xpEarned = lesson.xpReward;
                this.addXP(xpGained);
            } else if (passed) {
                // Bonus XP for improvement
                xpGained = Math.floor(lesson.xpReward * 0.1);
                this.addXP(xpGained);
            }

            progress[lessonId] = updated;
            localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));

            // Update global profile stats
            this.recordTestResult({ ...result, lessonId });

            return { passed, xpGained, isNewBestWpm, isNewBestAcc, updatedStatus: updated };
        } catch (e) {
            console.error('Error completing lesson:', e);
            return null;
        }
    },

    addXP(amount) {
        try {
            const profile = this.getProfile();
            const oldLevel = profile.level;
            profile.xp += amount;
            
            // Level up logic
            let newLevel = 1;
            for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
                if (profile.xp >= XP_LEVELS[i]) { newLevel = i + 1; break; }
            }
            profile.level = Math.max(oldLevel, newLevel);
            this.saveProfile(profile);

            return { oldLevel, newLevel: profile.level, leveledUp: newLevel > oldLevel };
        } catch { return { oldLevel: 1, newLevel: 1, leveledUp: false }; }
    },

    getXPForNextLevel(currentLevel) {
        const nextIdx = currentLevel;
        if (nextIdx >= XP_LEVELS.length) return null;
        return XP_LEVELS[nextIdx];
    },

    getLevelProgress(profile) {
        const currentLevelXP = XP_LEVELS[profile.level - 1] || 0;
        const nextLevelXP = XP_LEVELS[profile.level] || null;
        if (!nextLevelXP) return { percent: 100, current: profile.xp, needed: 0, max: profile.xp };
        const relativeXP = profile.xp - currentLevelXP;
        const needed = nextLevelXP - currentLevelXP;
        return { percent: Math.round((relativeXP / needed) * 100), current: relativeXP, needed, max: needed };
    },

    recordTestResult(result) {
        try {
            const profile = this.getProfile();
            const history = this.getHistory();

            const entry = {
                id: 'test_' + Date.now(),
                timestamp: Date.now(),
                date: new Date().toISOString().split('T')[0],
                wpm: Math.round(result.wpm || 0),
                rawWpm: Math.round(result.rawWpm || 0),
                accuracy: Math.round((result.accuracy || 100) * 10) / 10,
                mistakes: result.mistakes || 0,
                correctChars: result.correctChars || 0,
                totalChars: result.totalChars || 0,
                timeSeconds: result.timeSeconds || 0,
                consistency: result.consistency || 100,
                mode: result.mode || 'lesson',
                lessonId: result.lessonId || null,
                grade: result.grade || 'B',
                level: result.level || 'Intermediate'
            };

            history.unshift(entry);
            if (history.length > 500) history.pop();
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

            // Update profile aggregate stats
            const allWpms = history.map(h => h.wpm).filter(w => w > 0);
            profile.testsCompleted = history.length;
            profile.bestWpm = Math.max(...allWpms, 0);
            profile.avgWpm = allWpms.length > 0 ? Math.round(allWpms.reduce((a, b) => a + b, 0) / allWpms.length) : 0;
            profile.highestAccuracy = Math.max(...history.map(h => h.accuracy), 0);
            profile.totalWordsTyped = history.reduce((s, h) => s + Math.round(h.correctChars / 5), 0);
            profile.totalCharsTyped = history.reduce((s, h) => s + h.correctChars, 0);
            profile.totalPracticeSeconds += result.timeSeconds || 0;

            this.saveProfile(profile);
            this.updateStreak();
        } catch (e) { console.error('Error recording test:', e); }
    },

    getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    updateStreak() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const daily = this.getDailyData();
            
            if (daily.lastPracticeDate !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (daily.lastPracticeDate === yesterday) {
                    daily.currentStreak += 1;
                } else if (daily.lastPracticeDate !== today) {
                    daily.currentStreak = 1;
                }
                daily.longestStreak = Math.max(daily.longestStreak || 0, daily.currentStreak);
                daily.lastPracticeDate = today;
                localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(daily));
            }
            return daily;
        } catch { return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null }; }
    },

    getDailyData() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.DAILY);
            const defaults = { currentStreak: 0, longestStreak: 0, lastPracticeDate: null };
            if (!data) return defaults;
            const parsed = { ...defaults, ...JSON.parse(data) };
            
            // Reset streak if missed a day
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            if (parsed.lastPracticeDate && parsed.lastPracticeDate !== today && parsed.lastPracticeDate !== yesterday) {
                parsed.currentStreak = 0;
            }
            return parsed;
        } catch { return { currentStreak: 0, longestStreak: 0, lastPracticeDate: null }; }
    },

    getAchievements() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            return data ? JSON.parse(data) : {};
        } catch { return {}; }
    },

    unlockAchievement(id) {
        try {
            const unlocked = this.getAchievements();
            if (!unlocked[id]) {
                unlocked[id] = Date.now();
                localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));
                return true;
            }
            return false;
        } catch { return false; }
    },

    getCustomTexts() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEXTS);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    saveCustomText(title, content) {
        try {
            const list = this.getCustomTexts();
            const item = { id: 'ct_' + Date.now(), title, content, createdAt: Date.now() };
            list.unshift(item);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(list));
            return item;
        } catch { return null; }
    },

    clearAllData() {
        Object.values(STORAGE_KEYS).forEach(k => {
            try { localStorage.removeItem(k); } catch {}
        });
    },

    exportBackup() {
        const data = {
            version: '3.0',
            exportedAt: new Date().toISOString(),
            profile: this.getProfile(),
            progress: this.getLessonProgress(),
            history: this.getHistory(),
            daily: this.getDailyData(),
            achievements: this.getAchievements(),
            settings: this.getSettings(),
            customTexts: this.getCustomTexts()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TypeMaster_Backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importBackup(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
            if (data.progress) localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
            if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
            if (data.daily) localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(data.daily));
            if (data.achievements) localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(data.achievements));
            if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
            if (data.customTexts) localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(data.customTexts));
            return true;
        } catch { return false; }
    },

    getSessions() {
        return this.getHistory();
    },

    getCompletedLessons() {
        const progress = this.getLessonProgress();
        const set = new Set();
        Object.entries(progress).forEach(([id, data]) => {
            if (data.status === 'completed' || data.status === 'passed') set.add(id);
        });
        return set;
    },

    getSessionMap() {
        const map = new Map();
        const history = this.getHistory();
        history.forEach(h => {
            if (h.lessonId) {
                if (!map.has(h.lessonId)) map.set(h.lessonId, { wpms: [], accs: [] });
                const item = map.get(h.lessonId);
                item.wpms.push(h.wpm);
                item.accs.push(h.accuracy);
            }
        });
        return map;
    },

    saveSession(session) {
        this.recordTestResult({
            wpm: session.wpm,
            rawWpm: session.rawWpm,
            accuracy: session.accuracy,
            mistakes: session.mistakes,
            correctChars: session.chars,
            totalChars: session.chars + session.mistakes,
            timeSeconds: session.duration,
            consistency: session.consistency,
            mode: session.mode,
            lessonId: session.lessonId
        });
        return this.getProfile();
    },

    completeLesson(lessonId, wpm, xpReward) {
        return this.completeLessonAttempt(lessonId, { wpm, accuracy: 100 }) || { leveledUp: false, newLevel: 1 };
    }
};
