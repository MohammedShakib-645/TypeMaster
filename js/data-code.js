/**
 * TypeMaster - Code Data Repository
 * Real code snippets for 9 programming languages.
 */

const CODE_DATA = {
    html: [
        '<div class="card glass-effect">\n  <h2 class="title">TypeMaster</h2>\n  <p>Practice Faster. Type Smarter.</p>\n  <button class="btn btn-primary" onclick="startTest()">Start Typing</button>\n</div>',
        '<header class="navbar">\n  <a href="#" class="logo">⚡ TypeMaster</a>\n  <nav>\n    <ul class="nav-links">\n      <li><a href="#stats">Stats</a></li>\n      <li><a href="#settings">Settings</a></li>\n    </ul>\n  </nav>\n</header>',
        '<form id="settings-form" class="form-grid">\n  <label for="theme">Select Theme:</label>\n  <select id="theme" name="theme">\n    <option value="dark">Dark Space</option>\n    <option value="cyber">Cyber Blue</option>\n  </select>\n</form>'
    ],
    css: [
        '.glass-card {\n  background: rgba(15, 23, 42, 0.75);\n  backdrop-filter: blur(12px);\n  border: 1px solid rgba(255, 255, 255, 0.1);\n  border-radius: 16px;\n  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);\n}',
        '@keyframes caretPulse {\n  0%, 100% { opacity: 1; transform: scaleY(1); }\n  50% { opacity: 0.2; transform: scaleY(0.85); }\n}\n.caret-line {\n  width: 2.5px;\n  background: var(--primary-color);\n  animation: caretPulse 1s infinite;\n}',
        ':root {\n  --bg-color: #0F172A;\n  --primary-color: #3B82F6;\n  --success-color: #22C55E;\n  --error-color: #EF4444;\n  --text-main: #FFFFFF;\n  --text-muted: #94A3B8;\n}'
    ],
    javascript: [
        'function calculateWPM(correctChars, seconds) {\n  if (seconds <= 0) return 0;\n  const minutes = seconds / 60;\n  const words = correctChars / 5;\n  return Math.round(words / minutes);\n}',
        'const observeIntersection = (elements, callback) => {\n  const observer = new IntersectionObserver((entries) => {\n    entries.forEach(entry => callback(entry));\n  }, { threshold: 0.1 });\n  elements.forEach(el => observer.observe(el));\n};',
        'async function fetchLeaderboardData(apiEndpoint) {\n  try {\n    const response = await fetch(apiEndpoint);\n    const data = await response.json();\n    return data.sort((a, b) => b.wpm - a.wpm);\n  } catch (err) {\n    console.error("Failed to load scores:", err);\n  }\n}'
    ],
    python: [
        'def calculate_accuracy(correct_chars: int, total_chars: int) -> float:\n    if total_chars == 0:\n        return 100.0\n    return round((correct_chars / total_chars) * 100, 2)',
        'class TypingSession:\n    def __init__(self, mode: str, duration: int):\n        self.mode = mode\n        self.duration = duration\n        self.history = []\n\n    def add_sample(self, wpm: int, accuracy: float):\n        self.history.append({"wpm": wpm, "acc": accuracy})',
        'import json\n\ndef save_user_stats(file_path: str, data: dict) -> bool:\n    with open(file_path, "w", encoding="utf-8") as f:\n        json.dump(data, f, indent=4)\n    return True'
    ],
    java: [
        'public class TypeMasterStats {\n    private final int wpm;\n    private final double accuracy;\n\n    public TypeMasterStats(int wpm, double accuracy) {\n        this.wpm = wpm;\n        this.accuracy = accuracy;\n    }\n\n    public String getFormattedResult() {\n        return String.format("WPM: %d | Accuracy: %.1f%%", wpm, accuracy);\n    }\n}',
        'import java.util.ArrayList;\nimport java.util.List;\n\npublic class Leaderboard {\n    private List<Integer> scores = new ArrayList<>();\n\n    public void addScore(int score) {\n        scores.add(score);\n        scores.sort((a, b) -> b - a);\n    }\n}'
    ],
    c: [
        '#include <stdio.h>\n#include <stdlib.h>\n\ntypedef struct {\n    int wpm;\n    float accuracy;\n    long timestamp;\n} TestResult;\n\nvoid print_result(TestResult res) {\n    printf("Final Score: %d WPM (%.1f%% Acc)\\n", res.wpm, res.accuracy);\n}',
        '#include <string.h>\n\nint calculate_raw_wpm(int total_typed, float minutes) {\n    if (minutes <= 0.0f) return 0;\n    return (int)((total_typed / 5.0f) / minutes);\n}'
    ],
    cpp: [
        '#include <iostream>\n#include <vector>\n#include <algorithm>\n\nclass TypingTracker {\nprivate:\n    std::vector<int> wpm_history;\npublic:\n    void record(int wpm) {\n        wpm_history.push_back(wpm);\n    }\n    double average() const {\n        if (wpm_history.empty()) return 0.0;\n        int sum = 0;\n        for (int val : wpm_history) sum += val;\n        return static_cast<double>(sum) / wpm_history.size();\n    }\n};',
        '#include <memory>\n#include <string>\n\nstruct UserProfile {\n    std::string username;\n    int highest_wpm{0};\n    int total_tests{0};\n};'
    ],
    sql: [
        'SELECT u.username, MAX(s.wpm) AS best_wpm, AVG(s.accuracy) AS avg_accuracy\nFROM users u\nJOIN test_results s ON u.id = s.user_id\nWHERE s.created_at >= NOW() - INTERVAL 30 DAY\nGROUP BY u.id, u.username\nHAVING COUNT(s.id) >= 10\nORDER BY best_wpm DESC\nLIMIT 100;',
        'CREATE TABLE typing_sessions (\n    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    user_id UUID NOT NULL,\n    wpm INT NOT NULL,\n    raw_wpm INT NOT NULL,\n    accuracy DECIMAL(5,2) NOT NULL,\n    mode VARCHAR(50) NOT NULL,\n    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP\n);'
    ],
    json: [
        '{\n  "app": "TypeMaster",\n  "version": "2.0.0",\n  "settings": {\n    "theme": "cyber-blue",\n    "fontSize": 20,\n    "caretStyle": "line",\n    "soundEnabled": true,\n    "volume": 0.8\n  },\n  "user": {\n    "bestWpm": 124,\n    "avgWpm": 98,\n    "testsCompleted": 342\n  }\n}'
    ]
};
