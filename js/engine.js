/**
 * TypeMaster - Professional Typing Engine v3
 * Connects typing state, DOM rendering, timer, WPM calculations, and keypress handling.
 */

class TypingEngine {
    constructor(containerId, text, config = {}) {
        this.container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        this.rawText = (text || '').trim().replace(/\r\n/g, '\n');
        this.config = config;

        // Callbacks
        this.onTick    = config.onTick || null;
        this.onChar    = config.onChar || null;
        this.onFinish  = config.onFinish || null;
        this.onLine    = config.onLine || null;

        // Config
        this.mode        = config.mode || 'lesson'; // lesson | time | words | free
        this.timeLimitSec= config.timeLimit || null;
        this.wordLimit   = config.wordLimit || null;

        // Keydown listener ref
        this._boundKeyDown = this._handleKeyDown.bind(this);

        this.reset();
    }

    reset() {
        if (this._interval) clearInterval(this._interval);

        this.words          = this.rawText.split(' ').filter(w => w.length > 0);
        this.userInput      = this.words.map(() => []); // per-word array of char objects

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

        // Telemetry
        this.correctChars   = 0;
        this.totalKeystrokes= 0;
        this.incorrectChars = 0;
        this.extraChars     = 0;
        this.mistakes       = 0;
        this.mistakeMap     = {};
        this.timeline       = [];

        // Performance Replay: per-keystroke log
        this.keystrokeLog   = [];
    }

    mount() {
        this.reset();
        this._renderDOM();
        document.removeEventListener('keydown', this._boundKeyDown);
        document.addEventListener('keydown', this._boundKeyDown);
    }

    destroy() {
        if (this._interval) clearInterval(this._interval);
        document.removeEventListener('keydown', this._boundKeyDown);
    }

    togglePause() {
        if (!this.isActive || this.isFinished) return false;
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    get elapsedMinutes() {
        return Math.max(0.001, this.elapsedSec / 60);
    }

    computeMetrics() {
        const minutes = this.elapsedMinutes;
        const wpm = Math.round((this.correctChars / 5) / minutes);
        const rawWpm = Math.round((this.totalKeystrokes / 5) / minutes);
        const totalTyped = this.correctChars + this.incorrectChars + this.extraChars;
        const accuracy = totalTyped > 0 ? Math.min(100, Math.round((this.correctChars / totalTyped) * 100)) : 100;

        let consistency = 100;
        if (this.timeline.length > 3) {
            const wpms = this.timeline.map(t => t.wpm);
            const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
            if (avg > 0) {
                const variance = wpms.reduce((s, v) => s + (v - avg) ** 2, 0) / wpms.length;
                consistency = Math.max(0, Math.min(100, Math.round((1 - Math.sqrt(variance) / avg) * 100)));
            }
        }

        const progress = this.words.length > 0 ? Math.min(100, Math.round((this.wordIdx / this.words.length) * 100)) : 0;
        const nextChar = this.getCurrentTargetChar();

        return {
            wpm: Math.max(0, wpm),
            rawWpm: Math.max(0, rawWpm),
            accuracy,
            consistency,
            mistakes: this.mistakes,
            correct: this.correctChars,
            incorrect: this.incorrectChars,
            totalTyped,
            elapsed: this.elapsedSec,
            timeLimit: this.timeLimitSec,
            progress,
            nextChar,
            words: this.wordIdx
        };
    }

    getCurrentTargetChar() {
        const word = this.words[this.wordIdx] || '';
        if (this.charIdx < word.length) return word[this.charIdx];
        return ' ';
    }

    _startTimer() {
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(() => {
            if (this.isPaused || !this.isActive || this.isFinished) return;
            this.elapsedSec++;
            const m = this.computeMetrics();
            this.timeline.push({ second: this.elapsedSec, wpm: m.wpm, rawWpm: m.rawWpm, errors: this.mistakes });
            if (this.onTick) this.onTick(m);

            if (this.mode === 'time' && this.timeLimitSec && this.elapsedSec >= this.timeLimitSec) {
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

    _finish() {
        if (this.isFinished) return;
        if (this._interval) clearInterval(this._interval);
        this.isActive = false;
        this.isFinished = true;
        const metrics = this.computeMetrics();
        metrics.progress = 100;
        if (this.onFinish) this.onFinish(metrics);
    }

    _handleKeyDown(e) {
        // Ignore modifiers, shortcuts, tab, escape
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === 'Tab' || e.key === 'Escape') return;

        // If target element is an input or textarea, ignore
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

        if (this.isFinished || this.isPaused) return;

        // Prevent space bar scrolling
        if (e.key === ' ') e.preventDefault();

        // Start timer on first printable keypress
        if (!this.isActive && e.key.length === 1) {
            this._start();
        }

        const key = e.key;
        const word = this.words[this.wordIdx] || '';
        const userChars = this.userInput[this.wordIdx] || [];

        if (key === 'Backspace') {
            if (userChars.length > 0) {
                const popped = userChars.pop();
                if (popped.status === 'correct') this.correctChars--;
                else if (popped.status === 'incorrect') this.incorrectChars--;
                else if (popped.status === 'extra') this.extraChars--;
                this.charIdx = userChars.length;
            } else if (this.wordIdx > 0) {
                const prevUser = this.userInput[this.wordIdx - 1];
                const prevTarget = this.words[this.wordIdx - 1];
                const hasErrors = prevUser.some(c => c.status !== 'correct') || prevUser.length !== prevTarget.length;
                if (hasErrors) {
                    this.wordIdx--;
                    this.charIdx = this.userInput[this.wordIdx].length;
                }
            }
            this._updateDOMWord(this.wordIdx);
            this._updateDOMWord(this.wordIdx + 1);
            this._scrollToActiveWord();
            if (this.onChar) this.onChar(this.computeMetrics());
            return;
        }

        if (key === ' ') {
            if (userChars.length === 0) return; // Prevent empty spaces
            this.totalKeystrokes++;
            if (this.wordIdx < this.words.length - 1) {
                this.wordIdx++;
                this.charIdx = 0;
                if (typeof SoundEngine !== 'undefined' && AppState.soundEngine) {
                    AppState.soundEngine.playKeyClick(true);
                }
                if (this.mode === 'words' && this.wordLimit && this.wordIdx >= this.wordLimit) {
                    this._finish(); return;
                }
            } else {
                this._finish(); return;
            }
            this._renderDOM();
            this._scrollToActiveWord();
            if (this.onChar) this.onChar(this.computeMetrics());
            return;
        }

        if (key.length === 1) {
            this.totalKeystrokes++;
            let isCorrect = false;

            if (this.charIdx < word.length) {
                const expected = word[this.charIdx];
                isCorrect = key === expected;
                userChars.push({ char: key, expected, status: isCorrect ? 'correct' : 'incorrect' });

                // Log keystroke for Performance Replay
                this.keystrokeLog.push({ ts: Date.now(), key, expected, correct: isCorrect, wordIdx: this.wordIdx });

                if (isCorrect) {
                    this.correctChars++;
                    if (typeof SoundEngine !== 'undefined' && AppState.soundEngine) {
                        AppState.soundEngine.playKeyClick(false);
                    }
                } else {
                    this.incorrectChars++;
                    this.mistakes++;
                    this.mistakeMap[expected] = (this.mistakeMap[expected] || 0) + 1;
                    if (typeof SoundEngine !== 'undefined' && AppState.soundEngine) {
                        AppState.soundEngine.playErrorSound();
                    }
                }
            } else if (userChars.length < word.length + 6) {
                // Extra characters beyond word length
                userChars.push({ char: key, expected: '', status: 'extra' });
                this.keystrokeLog.push({ ts: Date.now(), key, expected: '', correct: false, wordIdx: this.wordIdx });
                this.extraChars++;
                this.mistakes++;
                if (typeof SoundEngine !== 'undefined' && AppState.soundEngine) {
                    AppState.soundEngine.playErrorSound();
                }
            }

            this.charIdx = userChars.length;
            this._updateDOMWord(this.wordIdx);

            // Check test completion
            if (this.wordIdx === this.words.length - 1 && userChars.length >= word.length) {
                const allDone = this.words.every((w, i) => (this.userInput[i] || []).length >= w.length);
                if (allDone) { this._finish(); return; }
            }

            this._scrollToActiveWord();
            if (this.onChar) this.onChar(this.computeMetrics());
        }
    }

    _renderDOM() {
        if (!this.container) return;
        this.container.innerHTML = this.words.map((word, wIdx) => {
            const isActiveWord = wIdx === this.wordIdx;
            const userChars = this.userInput[wIdx] || [];
            const charsHTML = this._buildWordCharsHTML(word, userChars, isActiveWord);
            return `<span class="word ${isActiveWord ? 'word-active' : ''}" id="tm-w-${wIdx}">${charsHTML}</span>`;
        }).join(' ');

        this._scrollToActiveWord();
    }

    _updateDOMWord(wIdx) {
        if (wIdx < 0 || wIdx >= this.words.length) return;
        const wordEl = document.getElementById(`tm-w-${wIdx}`);
        if (!wordEl) return;
        const word = this.words[wIdx];
        const userChars = this.userInput[wIdx] || [];
        const isActiveWord = wIdx === this.wordIdx;
        wordEl.className = `word ${isActiveWord ? 'word-active' : ''}`;
        wordEl.innerHTML = this._buildWordCharsHTML(word, userChars, isActiveWord);
    }

    _buildWordCharsHTML(word, userChars, isActiveWord) {
        let html = '';
        const maxLen = Math.max(word.length, userChars.length);

        for (let cIdx = 0; cIdx < maxLen; cIdx++) {
            const userChar = userChars[cIdx];
            const targetChar = word[cIdx];
            const isActiveChar = isActiveWord && cIdx === this.charIdx;

            if (userChar) {
                const cls = userChar.status === 'correct' ? 'ch-correct' : userChar.status === 'incorrect' ? 'ch-incorrect' : 'ch-extra';
                const displayChar = escapeHTML(userChar.char);
                html += `<span class="ch ${cls} ${isActiveChar ? 'ch-active' : ''}">${displayChar}</span>`;
            } else if (targetChar !== undefined) {
                const displayChar = escapeHTML(targetChar);
                html += `<span class="ch ${isActiveChar ? 'ch-active' : ''}">${displayChar}</span>`;
            }
        }
        return html;
    }

    _scrollToActiveWord() {
        if (!this.container) return;
        const activeWordEl = document.getElementById(`tm-w-${this.wordIdx}`);
        if (activeWordEl) {
            const containerTop = this.container.scrollTop;
            const containerHeight = this.container.clientHeight;
            const wordTop = activeWordEl.offsetTop - this.container.offsetTop;
            if (wordTop > containerTop + containerHeight - 60 || wordTop < containerTop) {
                this.container.scrollTop = wordTop - 30;
            }
        }
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
