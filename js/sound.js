/**
 * TypeMaster - Sound Engine (Web Audio API Synthesizer)
 * Zero external audio files. Synthesized mechanical keyboard sounds.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.65;
        this.clickType = 'mechanical';
    }

    init() {
        if (!this.ctx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (Ctx) this.ctx = new Ctx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setEnabled(val) { this.enabled = !!val; }
    setVolume(val) { this.volume = Math.max(0, Math.min(1, val)); }
    setClickType(type) { this.clickType = type; }

    configure(enabled, volume, clickType = 'mechanical') {
        this.enabled = enabled;
        this.volume = Math.max(0, Math.min(1, volume));
        this.clickType = clickType;
        if (enabled) this.init();
    }

    _gain(value) {
        const g = this.ctx.createGain();
        g.gain.value = value * this.volume;
        g.connect(this.ctx.destination);
        return g;
    }

    playKeyClick(isSpace = false) {
        if (!this.enabled || this.volume <= 0) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const master = this._gain(1);

        if (this.clickType === 'mechanical') {
            const osc = this.ctx.createOscillator();
            const oscG = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isSpace ? 105 : (155 + Math.random() * 25), now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.065);
            oscG.gain.setValueAtTime(0.55, now);
            oscG.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
            osc.connect(oscG); oscG.connect(master);

            const bufferSize = this.ctx.sampleRate * 0.025;
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = noiseBuffer;
            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = isSpace ? 1200 : 2400;
            noiseFilter.Q.value = 1.5;
            const noiseG = this.ctx.createGain();
            noiseG.gain.setValueAtTime(0.35, now);
            noiseG.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
            noise.connect(noiseFilter); noiseFilter.connect(noiseG); noiseG.connect(master);

            osc.start(now); osc.stop(now + 0.065);
            noise.start(now); noise.stop(now + 0.025);
        } else if (this.clickType === 'soft') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isSpace ? 280 : 380 + Math.random() * 40, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
            g.gain.setValueAtTime(0.2, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(g); g.connect(master);
            osc.start(now); osc.stop(now + 0.04);
        } else {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(isSpace ? 400 : 600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
            g.gain.setValueAtTime(0.15, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            osc.connect(g); g.connect(master);
            osc.start(now); osc.stop(now + 0.03);
        }
    }

    playErrorSound() {
        if (!this.enabled || this.volume <= 0) return;
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const master = this._gain(0.4);

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(g); g.connect(master);
        osc.start(now); osc.stop(now + 0.12);
    }

    playFinish() {
        if (!this.enabled || this.volume <= 0) return;
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.1;
            const master = this._gain(0.4);
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            g.gain.setValueAtTime(0.3, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(g); g.connect(master);
            osc.start(now); osc.stop(now + 0.3);
        });
    }
}
