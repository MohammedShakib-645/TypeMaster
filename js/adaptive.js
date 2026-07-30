/**
 * TypeMaster — Adaptive Learning Engine
 * Analyzes weak keys, weak fingers, and generates personalized lesson recommendations.
 */

// Maps every keyboard key to its assigned finger
const KEY_FINGER_MAP = {
    // Left Pinky
    '`':true,'~':true,'1':true,'!':true,'q':true,'Q':true,'a':true,'A':true,'z':true,'Z':true,
    '\t':true,'Caps':true,
    // Left Ring
    '2':true,'@':true,'w':true,'W':true,'s':true,'S':true,'x':true,'X':true,
    // Left Middle
    '3':true,'#':true,'e':true,'E':true,'d':true,'D':true,'c':true,'C':true,
    // Left Index (F + G)
    '4':true,'$':true,'5':true,'%':true,'r':true,'R':true,'t':true,'T':true,
    'f':true,'F':true,'g':true,'G':true,'v':true,'V':true,'b':true,'B':true,
    // Right Index (J + H)
    '6':true,'^':true,'7':true,'&':true,'y':true,'Y':true,'u':true,'U':true,
    'h':true,'H':true,'j':true,'J':true,'n':true,'N':true,'m':true,'M':true,
    // Right Middle (K)
    '8':true,'*':true,'i':true,'I':true,'k':true,'K':true,',':true,'<':true,
    // Right Ring (L)
    '9':true,'(':true,'o':true,'O':true,'l':true,'L':true,'.':true,'>':true,
    // Right Pinky
    '0':true,')':true,'-':true,'_':true,'=':true,'+':true,'p':true,'P':true,
    '[':true,'{':true,']':true,'}':true,';':true,':':true,"'":true,'"':true,
    '/':true,'?':true,'\\':true,'|':true,
    // Thumbs
    ' ':true
};

const KEY_TO_FINGER = {
    '`':'Left Pinky','~':'Left Pinky','1':'Left Pinky','!':'Left Pinky','q':'Left Pinky','Q':'Left Pinky',
    'a':'Left Pinky','A':'Left Pinky','z':'Left Pinky','Z':'Left Pinky',
    '2':'Left Ring','@':'Left Ring','w':'Left Ring','W':'Left Ring','s':'Left Ring','S':'Left Ring','x':'Left Ring','X':'Left Ring',
    '3':'Left Middle','#':'Left Middle','e':'Left Middle','E':'Left Middle','d':'Left Middle','D':'Left Middle','c':'Left Middle','C':'Left Middle',
    '4':'Left Index','$':'Left Index','5':'Left Index','%':'Left Index','r':'Left Index','R':'Left Index','t':'Left Index','T':'Left Index',
    'f':'Left Index','F':'Left Index','g':'Left Index','G':'Left Index','v':'Left Index','V':'Left Index','b':'Left Index','B':'Left Index',
    '6':'Right Index','^':'Right Index','7':'Right Index','&':'Right Index','y':'Right Index','Y':'Right Index','u':'Right Index','U':'Right Index',
    'h':'Right Index','H':'Right Index','j':'Right Index','J':'Right Index','n':'Right Index','N':'Right Index','m':'Right Index','M':'Right Index',
    '8':'Right Middle','*':'Right Middle','i':'Right Middle','I':'Right Middle','k':'Right Middle','K':'Right Middle',',':'Right Middle','<':'Right Middle',
    '9':'Right Ring','(':'Right Ring','o':'Right Ring','O':'Right Ring','l':'Right Ring','L':'Right Ring','.':'Right Ring','>':'Right Ring',
    '0':'Right Pinky',')':'Right Pinky','-':'Right Pinky','_':'Right Pinky','=':'Right Pinky','+':'Right Pinky','p':'Right Pinky','P':'Right Pinky',
    ';':'Right Pinky',':':'Right Pinky',"'":'Right Pinky','"':'Right Pinky','/':'Right Pinky','?':'Right Pinky',
    ' ':'Both Thumbs'
};

// Word lists for targeting specific keys
const KEY_PRACTICE_WORDS = {
    'a': ['all','add','and','ask','act','age','air','ant','app','art','ant','asap','atlas','avid'],
    's': ['see','set','sky','sit','six','sea','sun','sum','sad','say','soft','such','soon','size'],
    'd': ['day','dog','did','dig','dry','dip','dot','dim','den','due','desk','dark','done','deal'],
    'f': ['for','fan','fun','fit','fly','few','fix','far','fog','fad','fast','fold','find','fill'],
    'g': ['get','got','gap','gas','gig','gnu','gab','gem','gym','god','grow','give','good','gate'],
    'h': ['how','hot','hat','hit','hey','him','her','hip','hub','hug','help','home','hand','hold'],
    'j': ['job','joy','jar','jet','jot','jab','jam','jig','jot','jaw','just','join','jump','jail'],
    'k': ['key','kit','kid','kin','keg','kick','kind','keep','knew','know','king','kiss','knit','knee'],
    'l': ['let','log','lip','lot','law','lay','led','lid','lie','low','life','line','like','love'],
    ';': ['type','there','price','place','prove','these','those','write','where'],
    'q': ['quit','quiz','quite','quick','quiet','quill','quote','quake','queen','quest'],
    'w': ['way','win','war','web','wet','wow','was','why','who','will','with','word','well','wide'],
    'e': ['end','eat','egg','ego','ear','era','eve','easy','each','else','even','ever','edge','earn'],
    'r': ['run','row','raw','rob','rug','rub','rim','rod','rid','rig','read','real','road','role'],
    't': ['top','tip','tie','tan','tap','tag','tab','tin','try','ton','time','take','tell','turn'],
    'y': ['yes','yet','you','yak','yam','yap','yaw','yard','year','yell','your','yore','yogi','yoke'],
    'u': ['use','urn','urge','unit','upon','urban','usual','until','under','upper','upset','unique'],
    'i': ['ice','ill','ink','inn','ion','iron','idea','into','inch','item','isle','idle','itch','iris'],
    'o': ['odd','oil','old','one','own','oak','oat','off','orb','ore','open','over','only','once'],
    'p': ['put','pop','pan','pet','pie','pin','pig','pit','pod','pot','page','play','pull','push'],
    'z': ['zip','zap','zen','zit','zero','zone','zeal','zoom','zany','zest','zinc','zoned'],
    'x': ['fix','mix','box','fox','tax','wax','hex','vex','axe','exam','exit','next','text','flux'],
    'c': ['can','car','cut','cup','cap','cat','cry','cod','cog','cob','call','came','care','city'],
    'v': ['van','vet','via','vow','vim','void','vile','vine','vain','vast','view','vote','veil'],
    'b': ['big','bit','bug','bus','but','buy','bad','bag','ban','bar','back','ball','band','base'],
    'n': ['new','nor','now','nod','nip','nil','nag','nab','nab','nap','name','near','next','nice'],
    'm': ['map','men','met','mix','mob','mom','mud','mug','mum','may','make','many','more','must']
};

const AdaptiveEngine = {
    // Analyze mistake map from engine to find weakest keys
    analyzeWeakKeys(mistakeMap = {}) {
        if (!mistakeMap || Object.keys(mistakeMap).length === 0) return [];
        const sorted = Object.entries(mistakeMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([key, count]) => ({ key: key.toLowerCase(), count, finger: KEY_TO_FINGER[key.toLowerCase()] || 'Unknown' }));
        return sorted;
    },

    // Accumulate mistakes into persistent weak key map
    accumulateMistakes(mistakeMap = {}) {
        if (typeof ProgressManager === 'undefined') return;
        const existing = ProgressManager.getWeakKeyMap();
        Object.entries(mistakeMap).forEach(([key, count]) => {
            const k = key.toLowerCase();
            existing[k] = (existing[k] || 0) + count;
        });
        ProgressManager.saveWeakKeyMap(existing);
    },

    // Get persistent weak keys sorted by frequency
    getPersistedWeakKeys() {
        if (typeof ProgressManager === 'undefined') return [];
        const map = ProgressManager.getWeakKeyMap();
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([key, count]) => ({ key, count, finger: KEY_TO_FINGER[key] || 'Unknown' }));
    },

    // Generate a personalized practice text targeting weak keys
    generatePersonalizedLesson(weakKeys = []) {
        if (weakKeys.length === 0) return null;
        const targetKeys = weakKeys.map(w => w.key).slice(0, 4);
        let wordPool = [];
        targetKeys.forEach(key => {
            const words = KEY_PRACTICE_WORDS[key] || [];
            wordPool.push(...words);
        });
        // Remove duplicates and shuffle
        wordPool = [...new Set(wordPool)];
        for (let i = wordPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [wordPool[i], wordPool[j]] = [wordPool[j], wordPool[i]];
        }
        // Build a ~40-word practice text
        const selected = wordPool.slice(0, 40);
        return {
            text: selected.join(' '),
            targetKeys,
            title: `Weak Key Practice: ${targetKeys.map(k => k.toUpperCase()).join(', ')}`,
            description: `Personalized drill focusing on your most-missed keys.`
        };
    },

    // Get 3 smart recommendations for the dashboard
    getRecommendations() {
        const recommendations = [];
        if (typeof ProgressManager === 'undefined') return recommendations;

        const profile = ProgressManager.getProfile();
        const progress = ProgressManager.getLessonProgress();
        const history = ProgressManager.getHistory();
        const weakKeys = this.getPersistedWeakKeys();
        const completedCount = Object.values(progress).filter(s => s.status === 'completed' || s.status === 'passed').length;

        // 1. Next Recommended Lesson
        let nextLesson = null;
        if (typeof ALL_LESSONS !== 'undefined') {
            nextLesson = ALL_LESSONS.find(l => {
                const s = progress[l.id];
                return !s || s.status === 'locked' || s.status === 'attempted';
            });
        }
        if (nextLesson) {
            recommendations.push({
                type: 'next_lesson',
                icon: '📚',
                title: 'Continue Your Journey',
                subtitle: nextLesson.title || `Lesson ${nextLesson.id}`,
                desc: `Lesson ${completedCount + 1} of 300 — keep your streak going!`,
                action: 'lesson',
                lessonId: nextLesson.id,
                color: '#3B82F6'
            });
        }

        // 2. Weak Key Practice
        if (weakKeys.length >= 2) {
            const personalizedLesson = this.generatePersonalizedLesson(weakKeys);
            if (personalizedLesson) {
                recommendations.push({
                    type: 'weak_key',
                    icon: '⌨️',
                    title: 'Weak Key Drill',
                    subtitle: `Keys: ${weakKeys.slice(0, 4).map(w => w.key.toUpperCase()).join(', ')}`,
                    desc: `You make the most mistakes on these keys. Practice now!`,
                    action: 'adaptive_practice',
                    lessonData: personalizedLesson,
                    color: '#EF4444'
                });
            }
        } else {
            recommendations.push({
                type: 'weak_key',
                icon: '⌨️',
                title: 'Build Accuracy',
                subtitle: 'Complete more lessons to detect weak keys',
                desc: 'Your adaptive profile is building. Keep practicing!',
                action: 'lesson',
                lessonId: nextLesson?.id,
                color: '#EF4444'
            });
        }

        // 3. Speed Drill recommendation
        const avgWpm = profile.avgWpm || 0;
        const bestWpm = profile.bestWpm || 0;
        const speedGap = bestWpm - avgWpm;
        recommendations.push({
            type: 'speed_drill',
            icon: '⚡',
            title: 'Speed Drill',
            subtitle: speedGap > 5 ? `Close your ${speedGap} WPM gap` : 'Push your speed limit',
            desc: speedGap > 5
                ? `Your best is ${bestWpm} WPM but avg is ${avgWpm}. Be more consistent!`
                : `Current best: ${bestWpm} WPM. Can you beat it today?`,
            action: 'speed_test',
            mode: 'time',
            timeLimit: 60,
            color: '#F59E0B'
        });

        return recommendations;
    },

    // Analyze slow words from a session's replay data
    analyzeSlowWords(keystrokeLog, words) {
        if (!keystrokeLog || !words || keystrokeLog.length < 2) return [];
        const wordTimings = [];
        let wordStart = keystrokeLog[0]?.ts || 0;
        let wordIdx = 0;

        keystrokeLog.forEach((k, i) => {
            if (k.key === ' ' || i === keystrokeLog.length - 1) {
                const wordEnd = k.ts;
                const duration = (wordEnd - wordStart) / 1000;
                const word = words[wordIdx] || '';
                const wpm = word.length > 0 ? Math.round((word.length / 5) / (duration / 60)) : 0;
                wordTimings.push({ word, duration: Math.round(duration * 100) / 100, wpm, wordIdx });
                wordStart = k.ts;
                wordIdx++;
            }
        });

        // Return bottom 5 slowest words
        return wordTimings.sort((a, b) => a.wpm - b.wpm).slice(0, 5);
    }
};
