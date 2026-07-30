/**
 * TypeMaster - Data Texts Repository
 */
const TEXT_DATA = {
    easy: [
        'the quick brown fox jumps over the lazy dog near the river bank',
        'simple words help build typing speed and accuracy with smooth rhythm',
        'keyboard practice is fun and rewarding when done every single day',
        'focus on correct finger placement to improve your typing precision',
        'stay calm and keep a steady tempo while typing each sentence carefully',
        'typing fast is great but typing without mistakes is even better',
        'learn to trust your fingers as they memorize each key location',
        'light blue sky bright sunshine cold water fresh air calm green tree',
        'practice every day and you will see your speed increase over time',
        'good habits formed early will serve you well for the rest of your life'
    ],
    medium: [
        'Mastering touch typing requires consistent daily practice, patience, and a comfortable posture.',
        'Programming is not just about writing code; it is about solving real problems elegantly.',
        'The fastest typists maintain a steady rhythm, rarely looking down at their keyboard.',
        'Modern web design combines glassmorphism, responsive layouts, and vibrant color palettes.',
        'Consistency in practice builds muscle memory faster than occasional intense training sessions.',
        'Technology empowers creative minds to transform abstract ideas into tangible digital solutions.',
        'Pay careful attention to punctuation and capitalization in professional communication at work.',
        'Algorithm design requires balancing time complexity with space efficiency for optimal results.',
        'Deep focus and flow state allow developers to solve intricate problems with real precision.',
        'The joy of touch typing comes from the effortless translation of thoughts onto the screen.'
    ],
    hard: [
        'Architectural decisions in distributed systems fundamentally dictate scalability, latency, and fault tolerance.',
        'Cryptographic primitives such as elliptic-curve signatures and hash functions secure modern financial systems.',
        'Asynchronous event loops handle thousands of concurrent connections without exhausting system memory resources.',
        'Precision in technical writing requires eliminating ambiguity, prioritizing active voice, and defining jargon.',
        'Quantum computing leverages superposition and entanglement to solve mathematical problems exponentially faster.',
        'Micro-frontend architectures decouple monolithic client-side interfaces into independently deployable modules.',
        'Sub-millisecond query responses rely on intelligent database indexing, query planning, and memory caching.',
        'Refactoring legacy codebases demands comprehensive test coverage to prevent unexpected regression defects.',
        'Continuous integration pipelines automatically build, lint, containerize, and test before production deployment.',
        'Neural networks learn mathematical representations of unstructured data through backpropagation and descent.'
    ],
    quotes: [
        'Talk is cheap. Show me the code. -- Linus Torvalds',
        'Simplicity is prerequisite for reliability. -- Edsger W. Dijkstra',
        'First, solve the problem. Then, write the code. -- John Johnson',
        'Any fool can write code that a computer can understand. Good programmers write code that humans understand. -- Martin Fowler',
        'Premature optimization is the root of all evil in programming. -- Donald Knuth',
        'Make it work, make it right, make it fast. -- Kent Beck',
        'The best code is the code you never have to write. -- Unknown',
        'A good programmer is someone who always looks both ways before crossing a one-way street. -- Doug Linder'
    ],
    numbers: [
        '1 2 3 4 5 6 7 8 9 0 10 20 30 40 50 60 70 80 90 100',
        '1024 2048 4096 8192 16384 32768 65536 131072 262144 1048576',
        '3.14159 2.71828 1.41421 1.61803 0.57721 6.28318 1.73205',
        '100 200 300 400 500 600 700 800 900 1000 2000 5000 10000',
        '1995 2000 2008 2012 2020 2024 2026 2030 2050 3000 9999'
    ],
    symbols: [
        '{ key: "value", count: 42, active: true, items: [1, 2, 3] }',
        'function sum(a, b) { return (a + b) * (a - b) / Math.sqrt(a); }',
        'SELECT * FROM users WHERE status = "ACTIVE" AND score >= 90;',
        '<div class="card" style="padding: 16px; border-radius: 8px;">Hello</div>',
        'if (user && user.isLoggedIn && !user.isBlocked) { redirect("/dashboard"); }',
        'const [state, setState] = useState<{ id: string; count: number } | null>(null);',
        'npm install --save-dev @types/node typescript eslint prettier jest'
    ]
};

const CODE_DATA = {
    javascript: [
        'const greet = (name) => `Hello, ${name}! Welcome to TypeMaster.`;\nconsole.log(greet("World"));',
        'function calculateWPM(correctChars, seconds) {\n  const minutes = seconds / 60;\n  return Math.round((correctChars / 5) / minutes);\n}',
        'const users = [\n  { id: 1, name: "Alice", wpm: 85 },\n  { id: 2, name: "Bob", wpm: 72 }\n];\nconst topUser = users.sort((a, b) => b.wpm - a.wpm)[0];',
        'async function fetchData(url) {\n  try {\n    const res = await fetch(url);\n    return await res.json();\n  } catch (err) {\n    console.error("Error:", err);\n  }\n}'
    ],
    python: [
        'def calculate_accuracy(correct, total):\n    if total == 0:\n        return 100.0\n    return round((correct / total) * 100, 2)',
        'class TypingSession:\n    def __init__(self, mode, duration):\n        self.mode = mode\n        self.duration = duration\n        self.results = []\n\n    def add_result(self, wpm, accuracy):\n        self.results.append({"wpm": wpm, "acc": accuracy})',
        'import json\n\ndef save_stats(path, data):\n    with open(path, "w", encoding="utf-8") as f:\n        json.dump(data, f, indent=4)\n    return True',
        'for i, word in enumerate(text.split()):\n    if word == expected[i]:\n        correct_words += 1\n    else:\n        errors.append((i, word, expected[i]))'
    ],
    html: [
        '<div class="card glass-effect">\n  <h2 class="title">TypeMaster</h2>\n  <p class="subtitle">Practice Faster. Type Smarter.</p>\n  <button class="btn btn-primary" id="start-btn">Start Typing</button>\n</div>',
        '<header class="navbar">\n  <a href="#" class="logo">⚡ TypeMaster</a>\n  <nav class="nav-links">\n    <a href="#lessons">Lessons</a>\n    <a href="#stats">Stats</a>\n    <a href="#settings">Settings</a>\n  </nav>\n</header>',
        '<form id="settings" class="settings-form">\n  <label for="theme">Theme:</label>\n  <select id="theme" name="theme">\n    <option value="dark">Dark Space</option>\n    <option value="cyber">Cyber Blue</option>\n  </select>\n</form>'
    ],
    css: [
        '.glass-card {\n  background: rgba(15, 23, 42, 0.75);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 16px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);\n}',
        '@keyframes caretBlink {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0; }\n}\n.caret-line {\n  width: 2px;\n  background: var(--primary);\n  animation: caretBlink 1s infinite;\n}',
        ':root {\n  --bg: #0F172A;\n  --primary: #3B82F6;\n  --success: #22C55E;\n  --error: #EF4444;\n  --text: #F8FAFC;\n  --muted: #94A3B8;\n}'
    ],
    sql: [
        'SELECT u.name, MAX(s.wpm) AS best_wpm, AVG(s.accuracy) AS avg_acc\nFROM users u\nJOIN sessions s ON u.id = s.user_id\nWHERE s.created_at >= NOW() - INTERVAL 30 DAY\nGROUP BY u.id\nORDER BY best_wpm DESC\nLIMIT 10;',
        'CREATE TABLE typing_sessions (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID NOT NULL,\n  wpm INT NOT NULL,\n  accuracy DECIMAL(5,2) NOT NULL,\n  mode VARCHAR(50),\n  completed_at TIMESTAMPTZ DEFAULT NOW()\n);'
    ]
};

const TextData = {
    getText(category = 'medium') {
        const cat = TEXT_DATA[category] || TEXT_DATA.medium || TEXT_DATA.easy;
        if (Array.isArray(cat) && cat.length > 0) {
            return cat[Math.floor(Math.random() * cat.length)];
        }
        return 'The quick brown fox jumps over the lazy dog.';
    },

    getCode(language = 'javascript') {
        const lang = CODE_DATA[language] || CODE_DATA.javascript;
        if (Array.isArray(lang) && lang.length > 0) {
            return lang[Math.floor(Math.random() * lang.length)];
        }
        return 'const greet = (name) => `Hello, ${name}!`;';
    }
};
