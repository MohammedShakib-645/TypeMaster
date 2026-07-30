/**
 * TypeMaster - Interactive Finger Placement Guide
 * Shows both hands with color-coded fingers, key assignments,
 * posture tips, and animated "next key" finger hints.
 */

// Finger → Color mapping (consistent across app)
const FINGER_MAP = {
    // Left Hand
    'left-pinky':  { color: '#EF4444', label: 'Left Pinky',   hand: 'left',  emoji: '🤙' },
    'left-ring':   { color: '#F59E0B', label: 'Left Ring',    hand: 'left',  emoji: '💍' },
    'left-middle': { color: '#22C55E', label: 'Left Middle',  hand: 'left',  emoji: '🖕' },
    'left-index':  { color: '#3B82F6', label: 'Left Index',   hand: 'left',  emoji: '👆' },
    'left-thumb':  { color: '#94A3B8', label: 'Left Thumb',   hand: 'left',  emoji: '👍' },
    // Right Hand
    'right-thumb': { color: '#94A3B8', label: 'Right Thumb',  hand: 'right', emoji: '👍' },
    'right-index': { color: '#8B5CF6', label: 'Right Index',  hand: 'right', emoji: '☝️' },
    'right-middle':{ color: '#EC4899', label: 'Right Middle', hand: 'right', emoji: '🖕' },
    'right-ring':  { color: '#F59E0B', label: 'Right Ring',   hand: 'right', emoji: '💍' },
    'right-pinky': { color: '#EF4444', label: 'Right Pinky',  hand: 'right', emoji: '🤙' }
};

// Every key → which finger types it
const KEY_FINGER_MAP = {
    // Row 1 (Number row)
    '`': 'left-pinky',  '1': 'left-pinky',  '2': 'left-ring',   '3': 'left-middle',
    '4': 'left-index',  '5': 'left-index',  '6': 'right-index', '7': 'right-index',
    '8': 'right-middle','9': 'right-ring',  '0': 'right-pinky', '-': 'right-pinky',
    '=': 'right-pinky',
    // Row 2 (QWERTY)
    'q': 'left-pinky',  'w': 'left-ring',   'e': 'left-middle', 'r': 'left-index',
    't': 'left-index',  'y': 'right-index', 'u': 'right-index', 'i': 'right-middle',
    'o': 'right-ring',  'p': 'right-pinky', '[': 'right-pinky', ']': 'right-pinky',
    '\\': 'right-pinky',
    // Row 3 (Home row)
    'a': 'left-pinky',  's': 'left-ring',   'd': 'left-middle', 'f': 'left-index',
    'g': 'left-index',  'h': 'right-index', 'j': 'right-index', 'k': 'right-middle',
    'l': 'right-ring',  ';': 'right-pinky', "'": 'right-pinky',
    // Row 4 (Bottom row)
    'z': 'left-pinky',  'x': 'left-ring',   'c': 'left-middle', 'v': 'left-index',
    'b': 'left-index',  'n': 'right-index', 'm': 'right-index', ',': 'right-middle',
    '.': 'right-ring',  '/': 'right-pinky',
    // Special
    ' ': 'left-thumb'  // or right thumb — we show both thumbs for space
};

// Get finger for a character
function getFingerForChar(char) {
    if (!char) return null;
    const lower = char.toLowerCase();
    return KEY_FINGER_MAP[lower] || null;
}

// ─────────────────────────────────────────────────────────────
// FINGER GUIDE COMPONENT CLASS
// ─────────────────────────────────────────────────────────────
class FingerGuide {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.activeFinger = null;
        this._build();
    }

    _build() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="fguide-wrap">
                <!-- Both Hands SVG Display -->
                <div class="hands-display">
                    ${this._buildHandSVG('left')}
                    <div class="hands-center-info">
                        <div class="active-finger-badge" id="fg-active-badge">
                            <div class="fg-badge-icon">⌨️</div>
                            <div class="fg-badge-text">Start typing to see<br>finger guidance</div>
                        </div>
                        <div class="space-thumb-hint">
                            <span class="thumb-icon">👍</span>
                            <strong>Thumbs → Spacebar</strong>
                        </div>
                    </div>
                    ${this._buildHandSVG('right')}
                </div>

                <!-- Finger Color Legend -->
                <div class="finger-legend-full">
                    ${Object.entries(FINGER_MAP).map(([id, f]) => `
                        <div class="fl-item" data-finger="${id}" onclick="FingerGuideInstance?.highlightFinger('${id}', true)">
                            <div class="fl-dot" style="background:${f.color}"></div>
                            <span class="fl-label">${f.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    _buildHandSVG(hand) {
        const isLeft = hand === 'left';
        const fingers = isLeft
            ? ['left-pinky','left-ring','left-middle','left-index','left-thumb']
            : ['right-thumb','right-index','right-middle','right-ring','right-pinky'];

        // Finger positions (x offset from hand base)
        const fingerDefs = {
            'left-pinky':  { x: 10,  yTop: 30, height: 75, width: 22, rx: 11 },
            'left-ring':   { x: 37,  yTop: 14, height: 91, width: 22, rx: 11 },
            'left-middle': { x: 64,  yTop: 5,  height: 100, width: 22, rx: 11 },
            'left-index':  { x: 91,  yTop: 16, height: 89, width: 22, rx: 11 },
            'left-thumb':  { x: 95,  yTop: 95, height: 40, width: 30, rx: 15, rotate: isLeft ? 60 : -60 },
            'right-thumb': { x: -5,  yTop: 95, height: 40, width: 30, rx: 15, rotate: -60 },
            'right-index': { x: 6,   yTop: 16, height: 89, width: 22, rx: 11 },
            'right-middle':{ x: 33,  yTop: 5,  height: 100, width: 22, rx: 11 },
            'right-ring':  { x: 60,  yTop: 14, height: 91, width: 22, rx: 11 },
            'right-pinky': { x: 87,  yTop: 30, height: 75, width: 22, rx: 11 }
        };

        const svgFingers = fingers.map(fid => {
            const f = FINGER_MAP[fid];
            const d = fingerDefs[fid];
            if (fid.includes('thumb')) {
                const tx = isLeft ? d.x : d.x;
                const ty = d.yTop;
                return `<rect id="fg-${fid}" data-finger="${fid}"
                    x="${tx}" y="${ty}" width="${d.width}" height="${d.height}"
                    rx="${d.rx}" ry="${d.rx}"
                    fill="${f.color}" opacity="0.75"
                    style="transform-origin:${tx + d.width/2}px ${ty}px;transform:rotate(${d.rotate || 0}deg);transition:all 0.3s ease;cursor:pointer;"
                    onclick="FingerGuideInstance?.highlightFinger('${fid}', true)"
                />`;
            }
            return `
                <g id="fg-${fid}" data-finger="${fid}" style="cursor:pointer;" onclick="FingerGuideInstance?.highlightFinger('${fid}', true)">
                    <rect x="${d.x}" y="${d.yTop}" width="${d.width}" height="${d.height}"
                        rx="${d.rx}" ry="${d.rx}"
                        fill="${f.color}" opacity="0.72"
                        style="transition:all 0.25s ease;"
                    />
                </g>
            `;
        }).join('');

        const palmY = 115;
        const palmX = isLeft ? 10 : 5;

        return `
            <div class="hand-svg-wrap" data-hand="${hand}">
                <div class="hand-label">${isLeft ? '← Left Hand' : 'Right Hand →'}</div>
                <svg viewBox="0 0 140 160" class="hand-svg" id="svg-${hand}">
                    <!-- Palm -->
                    <rect x="${palmX}" y="${palmY}" width="118" height="50" rx="24" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
                    <!-- Fingers -->
                    ${svgFingers}
                    <!-- Finger labels -->
                    ${fingers.filter(f => !f.includes('thumb')).map(fid => {
                        const d = fingerDefs[fid];
                        const f = FINGER_MAP[fid];
                        return `<text x="${d.x + d.width/2}" y="${d.yTop - 4}" text-anchor="middle" font-size="8" fill="${f.color}" opacity="0.8">${fid.split('-')[1].charAt(0).toUpperCase()}</text>`;
                    }).join('')}
                </svg>
            </div>
        `;
    }

    highlightFinger(fingerId, isClick = false) {
        // Reset all finger opacities
        Object.keys(FINGER_MAP).forEach(fid => {
            const el = document.getElementById(`fg-${fid}`);
            if (el) {
                el.style.opacity = fingerId ? '0.3' : '0.72';
                el.style.filter = '';
                el.querySelector?.('rect')?.setAttribute('opacity', fingerId ? '0.3' : '0.72');
                el.querySelectorAll?.('rect')?.forEach(r => r.setAttribute('opacity', fingerId ? '0.3' : '0.72'));
            }
        });

        if (fingerId) {
            const activeEl = document.getElementById(`fg-${fingerId}`);
            if (activeEl) {
                activeEl.style.opacity = '1';
                activeEl.style.filter = `drop-shadow(0 0 10px ${FINGER_MAP[fingerId]?.color})`;
                const rects = activeEl.querySelectorAll?.('rect') || [activeEl];
                rects.forEach(r => r.setAttribute('opacity', '1'));
            }
        }

        // Update badge
        const badge = document.getElementById('fg-active-badge');
        if (badge && fingerId && FINGER_MAP[fingerId]) {
            const f = FINGER_MAP[fingerId];
            badge.innerHTML = `
                <div class="fg-badge-icon" style="color:${f.color}">${f.emoji}</div>
                <div class="fg-badge-text">
                    <strong style="color:${f.color}">${f.label}</strong>
                    <div>${this._getKeysForFinger(fingerId)}</div>
                </div>
            `;
        } else if (badge && !fingerId) {
            badge.innerHTML = `<div class="fg-badge-icon">⌨️</div><div class="fg-badge-text">Start typing to see<br>finger guidance</div>`;
        }

        this.activeFinger = fingerId;
    }

    _getKeysForFinger(fingerId) {
        const keys = Object.entries(KEY_FINGER_MAP)
            .filter(([k, f]) => f === fingerId)
            .map(([k]) => k === ' ' ? 'Space' : k.toUpperCase())
            .slice(0, 12);
        return keys.join(' · ');
    }

    // Called from typing engine for each keypress
    highlightForChar(char) {
        const finger = getFingerForChar(char);
        this.highlightFinger(finger);
    }

    resetHighlight() {
        this.highlightFinger(null);
    }
}

// Global instance
let FingerGuideInstance = null;

function initFingerGuide(containerId) {
    FingerGuideInstance = new FingerGuide(containerId);
    return FingerGuideInstance;
}
