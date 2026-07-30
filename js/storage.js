/**
 * TypeMaster - Storage & Persistence Engine
 * Unified wrapper for LocalStorage operations, fallback defaults, and schema management.
 */

const STORAGE_KEYS = {
    SETTINGS: 'typemaster_settings_v2',
    HISTORY: 'typemaster_history_v2',
    DAILY: 'typemaster_daily_v2',
    ACHIEVEMENTS: 'typemaster_achievements_v2',
    CUSTOM_TEXTS: 'typemaster_custom_texts_v2',
    FAVORITES: 'typemaster_favorites_v2'
};

const DEFAULT_SETTINGS = {
    theme: 'dark', // dark, light, midnight, cyber, hacker, purple, ocean, sunset
    fontSize: 22, // 16 to 32 px
    fontFamily: 'Fira Code', // Fira Code, JetBrains Mono, Inter, Roboto Mono, Courier New
    caretStyle: 'line', // line, block, underline, hidden
    soundEnabled: true,
    volume: 0.7,
    clickSound: 'mechanical', // mechanical, typewriter, soft, digital
    liveWpm: true,
    liveAccuracy: true,
    minimalMode: false,
    showKeyboard: true,
    animationSpeed: 'normal', // fast, normal, slow, off
    fullscreen: false
};

const StorageManager = {
    getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return { ...DEFAULT_SETTINGS };
        }
    },

    saveSettings(settings) {
        try {
            const current = this.getSettings();
            const updated = { ...current, ...settings };
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return null;
        }
    },

    getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    },

    saveTestResult(result) {
        try {
            const history = this.getHistory();
            const entry = {
                id: 'test_' + Date.now(),
                timestamp: Date.now(),
                dateStr: new Date().toLocaleDateString(),
                timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                wpm: Math.round(result.wpm),
                rawWpm: Math.round(result.rawWpm),
                accuracy: Math.round(result.accuracy * 10) / 10,
                mistakes: result.mistakes || 0,
                totalChars: result.totalChars || 0,
                correctChars: result.correctChars || 0,
                timeSeconds: result.timeSeconds || 0,
                consistency: Math.round(result.consistency || 100),
                mode: result.mode || 'time',
                subMode: result.subMode || '30',
                difficulty: result.difficulty || 'medium',
                language: result.language || 'english',
                grade: result.grade || 'A',
                level: result.level || 'Intermediate',
                timeline: result.timeline || [],
                mistakeMap: result.mistakeMap || {}
            };
            history.unshift(entry);
            // Cap history at 500 records to keep LocalStorage lightweight
            if (history.length > 500) history.pop();
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));

            // Check & Update Daily Streak if applicable
            this.updateDailyStreak();

            return entry;
        } catch (e) {
            console.error('Failed to save test result:', e);
            return null;
        }
    },

    getAggregateStats() {
        const history = this.getHistory();
        if (!history || history.length === 0) {
            return {
                bestWpm: 0,
                avgWpm: 0,
                highestAccuracy: 0,
                totalTests: 0,
                totalWordsTyped: 0,
                totalCharacters: 0,
                totalPracticeTime: 0, // seconds
                dailyStreak: this.getDailyStreak().currentStreak
            };
        }

        let totalWpm = 0;
        let bestWpm = 0;
        let highestAccuracy = 0;
        let totalChars = 0;
        let totalTimeSec = 0;

        history.forEach(item => {
            if (item.wpm > bestWpm) bestWpm = item.wpm;
            if (item.accuracy > highestAccuracy) highestAccuracy = item.accuracy;
            totalWpm += item.wpm;
            totalChars += item.correctChars || (item.wpm * 5 * (item.timeSeconds / 60));
            totalTimeSec += item.timeSeconds || 0;
        });

        return {
            bestWpm,
            avgWpm: Math.round(totalWpm / history.length),
            highestAccuracy: Math.round(highestAccuracy * 10) / 10,
            totalTests: history.length,
            totalWordsTyped: Math.round(totalChars / 5),
            totalCharacters: Math.round(totalChars),
            totalPracticeTime: Math.round(totalTimeSec),
            dailyStreak: this.getDailyStreak().currentStreak
        };
    },

    getDailyStreak() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.DAILY);
            const defaultDaily = { currentStreak: 0, lastDate: null, dailyScores: {} };
            if (!data) return defaultDaily;
            const parsed = JSON.parse(data);
            
            // Check streak freshness
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            if (parsed.lastDate !== today && parsed.lastDate !== yesterday && parsed.lastDate !== null) {
                // Streak broken
                parsed.currentStreak = 0;
                localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(parsed));
            }
            return parsed;
        } catch (e) {
            return { currentStreak: 0, lastDate: null, dailyScores: {} };
        }
    },

    updateDailyStreak() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const daily = this.getDailyStreak();
            
            if (daily.lastDate !== today) {
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                if (daily.lastDate === yesterday) {
                    daily.currentStreak += 1;
                } else {
                    daily.currentStreak = 1;
                }
                daily.lastDate = today;
                localStorage.setItem(STORAGE_KEYS.DAILY, JSON.stringify(daily));
            }
            return daily;
        } catch (e) {
            console.error('Error updating streak:', e);
        }
    },

    getAchievements() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    unlockAchievement(id) {
        try {
            const unlocked = this.getAchievements();
            if (!unlocked[id]) {
                unlocked[id] = Date.now();
                localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlocked));
                return true; // Freshly unlocked
            }
            return false;
        } catch (e) {
            return false;
        }
    },

    getCustomTexts() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_TEXTS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveCustomText(title, content) {
        try {
            const list = this.getCustomTexts();
            const newItem = { id: 'custom_' + Date.now(), title, content, createdAt: Date.now() };
            list.unshift(newItem);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(list));
            return newItem;
        } catch (e) {
            return null;
        }
    },

    deleteCustomText(id) {
        try {
            let list = this.getCustomTexts();
            list = list.filter(item => item.id !== id);
            localStorage.setItem(STORAGE_KEYS.CUSTOM_TEXTS, JSON.stringify(list));
        } catch (e) {}
    },

    clearAllData() {
        try {
            localStorage.removeItem(STORAGE_KEYS.HISTORY);
            localStorage.removeItem(STORAGE_KEYS.DAILY);
            localStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS);
            localStorage.removeItem(STORAGE_KEYS.CUSTOM_TEXTS);
            localStorage.removeItem(STORAGE_KEYS.FAVORITES);
            return true;
        } catch (e) {
            return false;
        }
    }
};
