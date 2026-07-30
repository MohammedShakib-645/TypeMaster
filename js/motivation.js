/**
 * TypeMaster — Motivation Engine
 * Daily quotes, weekly challenges, confetti celebrations.
 */

const TYPING_QUOTES = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Every keystroke brings you closer to mastery.", author: "TypeMaster" },
    { text: "Your fingers know the way — trust the muscle memory.", author: "TypeMaster" },
    { text: "A smooth sea never made a skilled typist.", author: "TypeMaster" },
    { text: "Speed follows accuracy. Always.", author: "TypeMaster" },
    { text: "Practice doesn't make perfect. Perfect practice makes perfect.", author: "Vince Lombardi" },
    { text: "Mastery is not about being perfect. It's about being consistent.", author: "TypeMaster" },
    { text: "One lesson a day keeps the slow WPM away.", author: "TypeMaster" },
    { text: "The difference between ordinary and extraordinary is practice.", author: "TypeMaster" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
    { text: "Your keyboard is your instrument. Learn to play it fluently.", author: "TypeMaster" },
    { text: "Progress, not perfection, is the goal today.", author: "TypeMaster" },
    { text: "10 fingers. 26 letters. Infinite possibilities.", author: "TypeMaster" },
    { text: "Touch typing is a superpower. You are learning it.", author: "TypeMaster" },
    { text: "Every mistake is data. Every session is growth.", author: "TypeMaster" },
    { text: "Never look at the keyboard. Trust your hands.", author: "TypeMaster" },
    { text: "First be accurate. Then be fast. The order matters.", author: "TypeMaster" },
    { text: "Habits are the compound interest of self-improvement.", author: "James Clear" },
    { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
    { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
    { text: "The journey of a thousand lessons begins with a single keystroke.", author: "TypeMaster" },
    { text: "Strength does not come from physical capacity. It comes from indomitable will.", author: "Gandhi" },
    { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
    { text: "Do not wait to strike till the iron is hot; make it hot by striking.", author: "W.B. Yeats" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Typing faster is not the goal. Typing better is.", author: "TypeMaster" },
    { text: "Your fingers will remember what your mind forgets.", author: "TypeMaster" },
    { text: "Each correct keystroke is a step toward fluency.", author: "TypeMaster" },
    { text: "Accuracy is a habit. Make it yours.", author: "TypeMaster" },
    { text: "Focus on the process, not just the result.", author: "TypeMaster" },
    { text: "Today's practice is tomorrow's speed.", author: "TypeMaster" },
    { text: "The home row is your home. Always return to it.", author: "TypeMaster" },
    { text: "Never look down. Keep your eyes on the screen and your fingers on the keys.", author: "TypeMaster" },
    { text: "Consistency is more valuable than intensity.", author: "TypeMaster" },
    { text: "You are faster than you were yesterday. That's what matters.", author: "TypeMaster" },
    { text: "Every day is a new opportunity to improve your WPM.", author: "TypeMaster" },
    { text: "The pain of discipline is far less than the pain of regret.", author: "Jim Rohn" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "TypeMaster" },
    { text: "Great things never come from comfort zones.", author: "TypeMaster" },
    { text: "Dream big. Start small. Act now.", author: "Robin Sharma" },
    { text: "Your current situation is not your final destination.", author: "TypeMaster" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Churchill" }
];

const WEEKLY_CHALLENGES = [
    { title: "Speed Sprint",      desc: "Complete 5 speed tests this week",         goal: 5,  unit: "tests",    icon: "⚡" },
    { title: "Accuracy Week",     desc: "Achieve 95%+ accuracy in 10 sessions",     goal: 10, unit: "sessions", icon: "🎯" },
    { title: "Lesson Streak",     desc: "Complete at least 1 lesson every day",     goal: 7,  unit: "days",     icon: "🔥" },
    { title: "Word Storm",        desc: "Type 5,000 total words this week",         goal: 5000, unit: "words",  icon: "📝" },
    { title: "30 WPM Challenge",  desc: "Reach 30+ WPM in any session",            goal: 1,  unit: "session",  icon: "🚀" },
    { title: "Perfect Practice",  desc: "Complete 3 lessons without any mistakes",  goal: 3,  unit: "lessons",  icon: "💎" },
    { title: "Early Bird",        desc: "Practice before 9 AM for 5 days",          goal: 5,  unit: "days",     icon: "🌅" },
    { title: "Night Owl",         desc: "Complete 5 sessions after 9 PM",           goal: 5,  unit: "sessions", icon: "🌙" },
    { title: "Lesson Hunter",     desc: "Complete 10 new lessons this week",        goal: 10, unit: "lessons",  icon: "📚" },
    { title: "Consistency King",  desc: "Practice for at least 15 minutes daily",  goal: 7,  unit: "days",     icon: "👑" },
    { title: "100-Key Workout",   desc: "Type at least 2,000 keystrokes total",    goal: 2000, unit: "keys",   icon: "⌨️" },
    { title: "No-Look Challenge", desc: "Complete 3 sessions without errors",       goal: 3,  unit: "sessions", icon: "🙈" }
];

const MotivationEngine = {
    getDailyQuote() {
        // Rotate quotes based on day of year so everyone sees same quote each day
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        return TYPING_QUOTES[dayOfYear % TYPING_QUOTES.length];
    },

    getWeeklyChallenge() {
        const weekOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (86400000 * 7));
        return WEEKLY_CHALLENGES[weekOfYear % WEEKLY_CHALLENGES.length];
    },

    // Confetti burst animation
    launchConfetti(duration = 3000) {
        const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#FDE047', '#67E8F9'];
        const container = document.createElement('div');
        container.id = 'confetti-container';
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;overflow:hidden;';
        document.body.appendChild(container);

        const count = 120;
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 6;
            const isCircle = Math.random() > 0.5;
            piece.style.cssText = `
                position:absolute;
                width:${size}px;height:${size}px;
                background:${color};
                border-radius:${isCircle ? '50%' : '2px'};
                left:${Math.random() * 100}%;
                top:-20px;
                opacity:1;
                transform:rotate(${Math.random() * 360}deg);
                animation: confettiFall ${Math.random() * 2 + 1.5}s ease-in ${Math.random() * 0.8}s forwards;
            `;
            container.appendChild(piece);
        }

        // Inject keyframe if not present
        if (!document.getElementById('confetti-style')) {
            const style = document.createElement('style');
            style.id = 'confetti-style';
            style.textContent = `
                @keyframes confettiFall {
                    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
                    80%  { opacity: 1; }
                    100% { transform: translateY(110vh) rotate(${Math.random() * 720}deg); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => { if (container.parentNode) container.remove(); }, duration + 1000);
    },

    // Show milestone celebration
    celebrateMilestone(title, message, icon = '🎉') {
        this.launchConfetti();
        if (typeof showToast === 'function') {
            showToast(icon, title, message);
        }
    },

    // Check and show relevant celebration after a session
    checkCelebrations(profile, sessionResult) {
        const wpm = sessionResult.wpm || 0;
        const milestones = [
            { wpm: 20,  msg: "You hit 20 WPM! You're officially typing!", icon: '🐢' },
            { wpm: 30,  msg: "30 WPM! Getting comfortable now!", icon: '🚶' },
            { wpm: 40,  msg: "40 WPM! You're a solid typist!", icon: '🏃' },
            { wpm: 50,  msg: "50 WPM! Impressive speed!", icon: '🚀' },
            { wpm: 60,  msg: "60 WPM! You're beating most people!", icon: '⚡' },
            { wpm: 80,  msg: "80 WPM! You're in the top 10%!", icon: '🏆' },
            { wpm: 100, msg: "100 WPM! You're a Speed DEMON!", icon: '👑' },
            { wpm: 120, msg: "120 WPM! LEGENDARY! Typing Champion!", icon: '🌟' }
        ];
        const prevBest = (profile.bestWpm || 0) - (wpm > profile.bestWpm ? wpm - profile.bestWpm : 0);
        milestones.forEach(m => {
            if (wpm >= m.wpm && prevBest < m.wpm) {
                this.celebrateMilestone('New Speed Milestone!', m.msg, m.icon);
            }
        });
    }
};
