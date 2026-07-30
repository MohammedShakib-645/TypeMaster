/**
 * TypeMaster - Achievement System
 * Defines all badges and tracks unlock conditions.
 */

const ACHIEVEMENTS_DATA = [
    // Beginner Milestones
    { id: 'first_lesson',    icon: '🎯', title: 'First Steps',        desc: 'Complete your first lesson.',                   check: (p, prog) => Object.values(prog).some(s => s.status === 'completed') },
    { id: 'home_row_master', icon: '🏠', title: 'Home Row Master',    desc: 'Complete all Unit 1 (Home Row) lessons.',        check: (p, prog) => ['L1','L2','L3','L4','L5'].every(id => prog[id]?.status === 'completed') },
    { id: 'ten_lessons',     icon: '📚', title: 'Dedicated Student',  desc: 'Complete 10 lessons.',                          check: (p, prog) => Object.values(prog).filter(s => s.status === 'completed').length >= 10 },
    { id: 'all_lessons',     icon: '🎓', title: 'Curriculum Complete',desc: 'Complete all 33 lessons.',                      check: (p, prog) => Object.values(prog).filter(s => s.status === 'completed').length >= 33 },
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
    { id: 'streak_3',        icon: '🔥', title: '3 Day Streak',       desc: 'Practice for 3 consecutive days.',              check: (p, prog, daily) => daily.currentStreak >= 3 },
    { id: 'streak_7',        icon: '🔥', title: 'Week Warrior',       desc: 'Practice for 7 consecutive days.',              check: (p, prog, daily) => daily.currentStreak >= 7 },
    { id: 'streak_30',       icon: '🏆', title: 'Month Master',       desc: 'Practice for 30 consecutive days.',             check: (p, prog, daily) => daily.currentStreak >= 30 },
    // Level Milestones
    { id: 'level_5',         icon: '⭐', title: 'Level 5',            desc: 'Reach Level 5.',                                check: (p) => p.level >= 5 },
    { id: 'level_10',        icon: '🌟', title: 'Level 10',           desc: 'Reach Level 10.',                               check: (p) => p.level >= 10 },
    { id: 'typing_master',   icon: '🎯', title: 'Typing Master',      desc: 'Reach Level 15 with 80+ WPM.',                  check: (p) => p.level >= 15 && p.bestWpm >= 80 },
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

    renderGallery(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const unlocked = ProgressManager.getAchievements();
        container.innerHTML = '';

        ACHIEVEMENTS_DATA.forEach(ach => {
            const isUnlocked = !!unlocked[ach.id];
            const card = document.createElement('div');
            card.className = `achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="ach-icon-wrap">${ach.icon}</div>
                <div class="ach-info">
                    <div class="ach-title">${ach.title}</div>
                    <div class="ach-desc">${ach.desc}</div>
                    ${isUnlocked ? `<div class="ach-date">Unlocked ${new Date(unlocked[ach.id]).toLocaleDateString()}</div>` : '<div class="ach-locked-label">🔒 Locked</div>'}
                </div>
            `;
            container.appendChild(card);
        });
    },

    showToast(achievement) {
        const existing = document.getElementById('achievement-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = 'achievement-toast';
        toast.className = 'achievement-toast glass-card';
        toast.innerHTML = `
            <div class="toast-glow"></div>
            <span class="toast-icon">${achievement.icon}</span>
            <div class="toast-body">
                <strong>Achievement Unlocked!</strong>
                <div>${achievement.title}</div>
            </div>
            <button onclick="this.parentElement.remove()">✕</button>
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 500); }, 4500);
    },

    fireConfetti() {
        const canvas = document.createElement('canvas');
        canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
        document.body.appendChild(canvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        const colors = ['#3B82F6','#8B5CF6','#22C55E','#F59E0B','#EF4444','#EC4899','#06B6D4'];
        const particles = Array.from({length: 150}, () => ({
            x: canvas.width / 2 + (Math.random() - 0.5) * 200,
            y: canvas.height * 0.4,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.9) * 14,
            size: Math.random() * 9 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 12,
            opacity: 1
        }));

        let frame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.vy += 0.3;
                p.opacity -= 0.01; p.rotation += p.rotSpeed;
                ctx.save();
                ctx.globalAlpha = Math.max(0, p.opacity);
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            });
            if (++frame < 150) requestAnimationFrame(animate);
            else canvas.remove();
        };
        animate();
    }
};
