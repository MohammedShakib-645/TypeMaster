/**
 * TypeMaster - Professional Typing Engine v3
 * Live cursor, WPM, accuracy, error detection, backspace, timer, pause, finish.
 */

class TypingEngine {
    constructor() {
        this.reset();
        // Callbacks
        this.onTick     = null; // (metrics) called every second
        this.onChar     = null; // (isCorrect, metrics) called on every keypress
        this.onFinish   = null; // (metrics) called when test completes
        this.onRestart  = null; // () called on restart
    }

    reset() {
        this.targetText     = '';
        this.words          = [];
        this.userInput      = [];      // per-word array of char objects
        this.wordIdx        = 0;
        this.charIdx        = 0;

        this.isActive       = false;
        this.isPaused       = false;
        this.isFinished     = false;
        this.startTime      = null;
        this.pauseStart     = null;
        this.totalPausedMs  = 0;
        this.elapsedSec     = 0;
        this._interval      = null;

        // Mode config
        this.mode           = 'lesson'; // lesson | time | words | free
        this.timeLimitSec   = 60;
        this.wordLimit      = null;

        // Telemetry
        this.correctChars   = 0;
        this.totalKeystrokes= 0;
        this.incorrectChars = 0;
        this.extraChars     = 0;
        this.mistakes       = 0;
        this.mistakeMap     = {};
        this.timeline       = [];   // [{second, wpm, rawWpm, errors}]
    }

    loadText(text) {
        this.reset();
        this.targetText = text.trim().replace(/\r\n/g, '\n');
        this.words = this.targetText.split(' ').filter(w => w.length > 0);
        this.userInput = this.words.map(() => []);
    }

    get elapsedMinutes() {
        return Math.max(0.001, this.elapsedSec / 60);
    }

    computeMetrics() {
        const minutes = this.elapsedMinutes;
        const wpm = Math.round((this.correctChars / 5) / minutes);
        const rawWpm = Math.round((this.totalKeystrokes / 5) / minutes);
        const totalTyped = this.correctChars + this.incorrectChars + this.extraChars;
        const accuracy = totalTyped > 0 ? Math.min(100, (this.correctChars / totalTyped) * 100) : 100;

        let consistency = 100;
        if (this.timeline.length > 3) {
            const wpms = this.timeline.map(t => t.wpm);
            const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
            if (avg > 0) {
                const variance = wpms.reduce((s, v) => s + (v - avg) ** 2, 0) / wpms.length;
                consistency = Math.max(0, Math.min(100, Math.round((1 - Math.sqrt(variance) / avg) * 100)));
            }
        }

        let grade = 'D';
        if (accuracy >= 98 && wpm >= 90) grade = 'S+';
        else if (accuracy >= 95 && wpm >= 70) grade = 'S';
        else if (accuracy >= 92 && wpm >= 50) grade = 'A';
        else if (accuracy >= 85 && wpm >= 35) grade = 'B';
        else if (accuracy >= 75) grade = 'C';

        let level = 'Beginner';
        if (wpm >= 120) level = 'Master';
        else if (wpm >= 90) level = 'Professional';
        else if (wpm >= 65) level = 'Advanced';
        else if (wpm >= 45) level = 'Fast';
        else if (wpm >= 25) level = 'Intermediate';

        return {
            wpm: Math.max(0, wpm),
            rawWpm: Math.max(0, rawWpm),
            accuracy: Math.round(accuracy * 10) / 10,
            consistency,
            mistakes: this.mistakes,
            correctChars: this.correctChars,
            incorrectChars: this.incorrectChars,
            totalChars: totalTyped,
            timeSeconds: this.elapsedSec,
            grade, level,
            timeline: this.timeline,
            mistakeMap: this.mistakeMap,
            mode: this.mode
        };
    }

    _startTimer() {
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(() => {
            if (this.isPaused || !this.isActive) return;
            this.elapsedSec++;
            const m = this.computeMetrics();
            this.timeline.push({ second: this.elapsedSec, wpm: m.wpm, rawWpm: m.rawWpm, errors: this.mistakes });
            if (this.onTick) this.onTick(m);

            // Time limit check
            if (this.mode === 'time' && this.elapsedSec >= this.timeLimitSec) {
                this._finish();
            }
        }, 1000);
    }

    _start() {
        if (this.isActive || this.isFinished) return;
        this.isActive = true;
        this.startTime = Date.now();
        this._startTimer();
    }

    pause() {
        if (!this.isActive || this.isPaused || this.isFinished) return;
        this.isPaused = true;
        this.pauseStart = Date.now();
    }

    resume() {
        if (!this.isPaused) return;
        this.totalPausedMs += Date.now() - this.pauseStart;
        this.isPaused = false;
        this.pauseStart = null;
    }

    restart() {
        clearInterval(this._interval);
        const text = this.targetText;
        const mode = this.mode;
        const timeLimit = this.timeLimitSec;
        const wordLimit = this.wordLimit;
        this.reset();
        this.targetText = text;
        this.words = text.split(' ').filter(w => w.length > 0);
        this.userInput = this.words.map(() => []);
        this.mode = mode;
        this.timeLimitSec = timeLimit;
        this.wordLimit = wordLimit;
        if (this.onRestart) this.onRestart();
    }

    _finish() {
        if (this.isFinished) return;
        clearInterval(this._interval);
        this.isActive = false;
        this.isFinished = true;
        const metrics = this.computeMetrics();
        if (this.onFinish) this.onFinish(metrics);
    }

    handleKey(key, ctrlKey = false, altKey = false) {
        if (this.isFinished || this.isPaused) return;
        if (ctrlKey || altKey) return;

        // Lazy start
        if (!this.isActive) this._start();

        const word = this.words[this.wordIdx] || '';
        const chars = this.userInput[this.wordIdx] || [];

        if (key === 'Backspace') {
            if (chars.length > 0) {
                const popped = chars.pop();
                if (popped.status === 'correct') this.correctChars--;
                else if (popped.status === 'incorrect') this.incorrectChars--;
                else if (popped.status === 'extra') this.extraChars--;
                this.charIdx = chars.length;
            } else if (this.wordIdx > 0) {
                // Allow going back to previous word if it had errors
                const prevUser = this.userInput[this.wordIdx - 1];
                const prevTarget = this.words[this.wordIdx - 1];
                const hasErrors = prevUser.some(c => c.status !== 'correct') || prevUser.length !== prevTarget.length;
                if (hasErrors) {
                    this.wordIdx--;
                    this.charIdx = this.userInput[this.wordIdx].length;
                }
            }
            if (this.onChar) this.onChar(null, this.computeMetrics());
            return;
        }

        if (key === ' ') {
            if (chars.length === 0) return; // Prevent leading spaces
            this.totalKeystrokes++;
            if (this.wordIdx < this.words.length - 1) {
                this.wordIdx++;
                this.charIdx = 0;

                // Word count finish check
                if (this.mode === 'words' && this.wordLimit && this.wordIdx >= this.wordLimit) {
                    this._finish(); return;
                }
            } else {
                this._finish(); return;
            }
            SoundEngine.playKeyClick(true);
            if (this.onChar) this.onChar(true, this.computeMetrics());
            return;
        }

        if (key.length === 1) {
            this.totalKeystrokes++;

            if (this.charIdx < word.length) {
                const expected = word[this.charIdx];
                const correct = key === expected;
                chars.push({ char: key, expected, status: correct ? 'correct' : 'incorrect' });
                if (correct) {
                    this.correctChars++;
                    SoundEngine.playKeyClick(false);
                } else {
                    this.incorrectChars++;
                    this.mistakes++;
                    this.mistakeMap[expected] = (this.mistakeMap[expected] || 0) + 1;
                    SoundEngine.playError();
                }
            } else if (chars.length < word.length + 8) {
                // Extra characters
                chars.push({ char: key, expected: '', status: 'extra' });
                this.extraChars++;
                this.mistakes++;
                SoundEngine.playError();
            }

            this.charIdx = chars.length;

            // Auto-finish on last word typed completely
            if (this.wordIdx === this.words.length - 1 && chars.length >= word.length) {
                const allDone = this.words.every((w, i) => this.userInput[i].length >= w.length);
                if (allDone) { this._finish(); return; }
            }

            if (this.onChar) this.onChar(key === (word[this.charIdx - 1] || ''), this.computeMetrics());
        }
    }

    getCurrentTargetChar() {
        const word = this.words[this.wordIdx] || '';
        if (this.charIdx < word.length) return word[this.charIdx];
        return ' ';
    }
}
