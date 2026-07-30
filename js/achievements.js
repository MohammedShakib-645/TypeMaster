/**
 * TypeMaster - Achievement System
 * Defines all badges and tracks unlock conditions.
 */

const ACHIEVEMENTS_DATA = [
    // Beginner Milestones
    { id: 'first_lesson',    icon: '🎯', title: 'First Steps',        desc: 'Complete your first lesson.',                   check: (p, prog) => Object.values(prog).some(s => s.status === 'completed') },
    { id: 'home_row_master', icon: '🏠', title: 'Home Row Master',    desc: 'Complete all Unit 1 (Home Row) lessons.',        check: (p, prog) => ['L001','L002','L003','L004','L005'].every(id => prog[id]?.status === 'completed') },
    { id: 'ten_lessons',     icon: '📚', title: 'Dedicated Student',  desc: 'Complete 10 lessons.',                          check: (p, prog) => Object.values(prog).filter(s => s.status === 'completed').length >= 10 },
    { id: 'all_lessons',     icon: '🎓', title: 'Curriculum Complete',desc: 'Complete all 300 lessons.',                     check: (p, prog) => Object.values(prog).filter(s => s.status === 'completed').length >= 300 },
    // Speed Milestones
    { id: 'wpm_20',          icon: '🐢', title: 'Crawling Speed',     desc: 'Reach 20 WPM in any test.',                    check: (p) => p.bestWpm >= 20 },
    { id: 'wpm_40',          icon: '🚶', title: 'Walking Speed',      desc: 'Reach 40 WPM in any test.',                    check: (p) => p.bestWpm >= 40 },
    { id: 'wpm_60',          icon: '🏃', title: 'Jogging Speed',      desc: 'Reach 60 WPM in any test.',                    check: (p) => p.bestWpm >= 60 },
    { id: 'wpm_80',          icon: '🚀', title: 'Rocket Speed',       desc: 'Reach 80 WPM in any test.',                    check: (p) => p.bestWpm >= 80 },
    { id: 'wpm_100',         icon: '⚡', title: 'Speed Demon',        desc: 'Reach 100 WPM in any test.',                   check: (p) => p.bestWpm >= 100 },
    { id: 'wpm_120',         icon: '👑', title: 'Keyboard Royalty',   desc: 'Reach 120 WPM in any test.',                   check: (p) => p.bestWpm >= 120 },
    // Accuracy Milestones
    { id: 'acc_90',          icon: '🎯', title: 'Sharp Shooter',      desc: 'Achieve 90%+ accuracy in a test.',              check: (p) => p.highestAccuracy >= 90 },
    { id: 'acc_95',          icon: '💎', title: 'Diamond Precision',  desc: 'Achieve 95%+ accuracy in a test.',              check: (p) => p.highestAccuracy >= 95 },
    { id: 'acc_99',          icon: '🌟', title: 'Perfection',         desc: 'Achieve 99%+ accuracy in a test.',              check: (p) => p.highestAccuracy >= 99 },
    // Practice Milestones
    { id: 'words_1000',      icon: '📝', title: '1K Words',           desc: 'Type a total of 1,000 words.',                  check: (p) => p.totalWordsTyped >= 1000 },
    { id: 'words_10000',     icon: '📖', title: '10K Words',          desc: 'Type a total of 10,000 words.',                 check: (p) => p.totalWordsTyped >= 10000 },
    { id: 'tests_10',        icon: '🔄', title: '10 Tests',           desc: 'Complete 10 typing tests.',                     check: (p) => p.testsCompleted >= 10 },
    { id: 'tests_50',        icon: '🏋️', title: 'Heavy Trainer',      desc: 'Complete 50 typing tests.',                     check: (p) => p.testsCompleted >= 50 },
    { id: 'tests_100',       icon: '💪', title: 'Iron Fingers',       desc: 'Complete 100 typing tests.',                    check: (p) => p.testsCompleted >= 100 },
    // Streak Milestones
    { id: 'streak_3',        icon: '🔥', title: '3 Day Streak',       desc: 'Practice for 3 consecutive days.',              check: (p, prog, daily) => daily && daily.currentStreak >= 3 },
    { id: 'streak_7',        icon: '🔥', title: 'Week Warrior',       desc: 'Practice for 7 consecutive days.',              check: (p, prog, daily) => daily && daily.currentStreak >= 7 },
    { id: 'streak_30',       icon: '🏆', title: 'Month Master',       desc: 'Practice for 30 consecutive days.',             check: (p, prog, daily) => daily && daily.currentStreak >= 30 },
    // Level Milestones
    { id: 'level_5',         icon: '⭐', title: 'Level 5',            desc: 'Reach Level 5.',                                check: (p) => p.level >= 5 },
    { id: 'level_10',        icon: '🌟', title: 'Level 10',           desc: 'Reach Level 10.',                               check: (p) => p.level >= 10 },
    { id: 'typing_master',   icon: '👑', title: 'TypeMaster Certified',desc: 'Earn the Master Certification.',                 check: (p, prog) => prog['L300']?.status === 'completed' }
];

const AchievementsEngine = {
    checkAndUnlock() {
        const profile = ProgressManager.getProfile();
        const progress = ProgressManager.getLessonProgress();
        const daily = ProgressManager.getDailyData();
        const newlyUnlocked = [];

        ACHIEVEMENTS_DATA.forEach(ach => {
            try {
                if (ach.check(profile, progress, daily)) {
                    const isNew = ProgressManager.unlockAchievement(ach.id);
                    if (isNew) {
                        newlyUnlocked.push(ach);
                    }
                }
            } catch {}
        });

        return newlyUnlocked;
    },

    showToast(achievement) {
        if (typeof showToast === 'function') {
            showToast(achievement.icon, 'Achievement Unlocked!', achievement.title + ': ' + achievement.desc);
        }
    }
};

const AchievementManager = {
    getAll() {
        return ACHIEVEMENTS_DATA.map(a => ({
            id: a.id,
            name: a.title,
            description: a.desc,
            icon: a.icon,
            hint: 'Keep practicing to unlock!'
        }));
    },

    getUnlocked() {
        const unlocked = ProgressManager.getAchievements();
        return Object.keys(unlocked);
    },

    checkAll() {
        const newly = AchievementsEngine.checkAndUnlock();
        newly.forEach(ach => AchievementsEngine.showToast(ach));
        return newly;
    }
};
