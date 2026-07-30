/**
 * TypeMaster - Visual QWERTY Keyboard Component with Interactive Directional Hands
 * Renders full QWERTY layout with dynamic finger extensions and motion trajectories.
 */

const KEYBOARD_ROWS = [
    [{label:'`',code:'Backquote',f:'pl'},{label:'1',code:'Digit1',f:'pl'},{label:'2',code:'Digit2',f:'rl'},{label:'3',code:'Digit3',f:'ml'},{label:'4',code:'Digit4',f:'il'},{label:'5',code:'Digit5',f:'il'},{label:'6',code:'Digit6',f:'ir'},{label:'7',code:'Digit7',f:'ir'},{label:'8',code:'Digit8',f:'mr'},{label:'9',code:'Digit9',f:'rr'},{label:'0',code:'Digit0',f:'pr'},{label:'-',code:'Minus',f:'pr'},{label:'=',code:'Equal',f:'pr'},{label:'Bksp',code:'Backspace',f:'pr',w:90}],
    [{label:'Tab',code:'Tab',f:'pl',w:70},{label:'Q',code:'KeyQ',f:'pl'},{label:'W',code:'KeyW',f:'rl'},{label:'E',code:'KeyE',f:'ml'},{label:'R',code:'KeyR',f:'il'},{label:'T',code:'KeyT',f:'il'},{label:'Y',code:'KeyY',f:'ir'},{label:'U',code:'KeyU',f:'ir'},{label:'I',code:'KeyI',f:'mr'},{label:'O',code:'KeyO',f:'rr'},{label:'P',code:'KeyP',f:'pr'},{label:'[',code:'BracketLeft',f:'pr'},{label:']',code:'BracketRight',f:'pr'},{label:'\\',code:'Backslash',f:'pr',w:70}],
    [{label:'Caps',code:'CapsLock',f:'pl',w:82},{label:'A',code:'KeyA',f:'pl',home:true},{label:'S',code:'KeyS',f:'rl',home:true},{label:'D',code:'KeyD',f:'ml',home:true},{label:'F',code:'KeyF',f:'il',home:true},{label:'G',code:'KeyG',f:'il'},{label:'H',code:'KeyH',f:'ir'},{label:'J',code:'KeyJ',f:'ir',home:true},{label:'K',code:'KeyK',f:'mr',home:true},{label:'L',code:'KeyL',f:'rr',home:true},{label:';',code:'Semicolon',f:'pr',home:true},{label:"'",code:'Quote',f:'pr'},{label:'Enter',code:'Enter',f:'pr',w:104}],
    [{label:'Shift',code:'ShiftLeft',f:'pl',w:108},{label:'Z',code:'KeyZ',f:'pl'},{label:'X',code:'KeyX',f:'rl'},{label:'C',code:'KeyC',f:'ml'},{label:'V',code:'KeyV',f:'il'},{label:'B',code:'KeyB',f:'il'},{label:'N',code:'KeyN',f:'ir'},{label:'M',code:'KeyM',f:'ir'},{label:',',code:'Comma',f:'mr'},{label:'.',code:'Period',f:'rr'},{label:'/',code:'Slash',f:'pr'},{label:'Shift',code:'ShiftRight',f:'pr',w:136}],
    [{label:'Space',code:'Space',f:'th',w:560}]
];

const FINGER_COLORS = {
    pl: '#EF4444', rl: '#F59E0B', ml: '#22C55E', il: '#3B82F6',
    ir: '#8B5CF6', mr: '#EC4899', rr: '#F59E0B', pr: '#EF4444',
    th: '#94A3B8'
};

const FINGER_LABELS = {
    pl:'Left Pinky', rl:'Left Ring', ml:'Left Middle', il:'Left Index',
    ir:'Right Index', mr:'Right Middle', rr:'Right Ring', pr:'Right Pinky',
    th:'Thumb'
};

const FINGER_HOME_KEY = {
    pl: 'KeyA', rl: 'KeyS', ml: 'KeyD', il: 'KeyF',
    ir: 'KeyJ', mr: 'KeyK', rr: 'KeyL', pr: 'Semicolon',
    th: 'Space'
};

class VirtualKeyboard {
    constructor(containerId) {
        this.el = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
        this.keyEls = {};
        this.activeTarget = null;
        this._onKeyDown = this._handleKeyDown.bind(this);
        this._onKeyUp = this._handleKeyUp.bind(this);
    }

    render() {
        this._buildDOM();
        this._bindPhysical();
    }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
    }

    _buildDOM() {
        if (!this.el) return;
        this.el.innerHTML = '';
        const wrap = document.createElement('div');
        wrap.className = 'vkb-wrap';
        wrap.id = 'vkb-wrap-main';

        KEYBOARD_ROWS.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'vkb-row';
            row.forEach(key => {
                const k = document.createElement('div');
                k.className = `vkb-key finger-${key.f}`;
                k.setAttribute('data-code', key.code);
                k.setAttribute('data-finger', key.f);
                if (key.home) k.classList.add('home-key');
                if (key.w) k.style.width = key.w + 'px';
                k.style.setProperty('--finger-color', FINGER_COLORS[key.f]);
                k.innerHTML = `<span class="vkb-label">${key.label}</span>`;
                if (key.home) {
                    const bump = document.createElement('span');
                    bump.className = 'home-bump';
                    k.appendChild(bump);
                }
                rowEl.appendChild(k);
                this.keyEls[key.code] = k;
            });
            wrap.appendChild(rowEl);
        });

        // Directional SVG Layer
        const svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgLayer.setAttribute('class', 'vkb-hands-overlay');
        svgLayer.id = 'vkb-hands-overlay';
        svgLayer.innerHTML = `
            <defs>
                <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>
            <g id="vkb-hands-outline-group" opacity="0.85"></g>
            <g id="vkb-motion-path-group"></g>
        `;
        wrap.appendChild(svgLayer);

        // Finger legend bar
        const legend = document.createElement('div');
        legend.className = 'vkb-legend';
        Object.entries(FINGER_LABELS).forEach(([code, name]) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `<span class="legend-dot" style="background:${FINGER_COLORS[code]}"></span><span>${name}</span>`;
            legend.appendChild(item);
        });
        wrap.appendChild(legend);
        this.el.appendChild(wrap);

        setTimeout(() => this.drawHandOutlines(), 50);
    }

    _bindPhysical() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    _handleKeyDown(e) {
        const k = this.keyEls[e.code];
        if (k) k.classList.add('vkb-pressed');
    }

    _handleKeyUp(e) {
        const k = this.keyEls[e.code];
        if (k) k.classList.remove('vkb-pressed');
    }

    highlightKey(char) {
        if (this.activeTarget) {
            this.activeTarget.classList.remove('vkb-target');
            const indicator = this.activeTarget.querySelector('.vkb-finger-indicator');
            if (indicator) indicator.remove();
        }

        this.clearMotionPath();

        if (!char) return;

        let code = null;
        if (char === ' ') code = 'Space';
        else if (/[a-zA-Z]/.test(char)) code = `Key${char.toUpperCase()}`;
        else if (/[0-9]/.test(char)) code = `Digit${char}`;
        else {
            const map = { '`':'Backquote','~':'Backquote','-':'Minus','_':'Minus','=':'Equal','+':'Equal','[':'BracketLeft','{':'BracketLeft',']':'BracketRight','}':'BracketRight','\\':'Backslash','|':'Backslash',';':'Semicolon',':':'Semicolon',"'":'Quote','"':'Quote',',':'Comma','<':'Comma','.':'Period','>':'Period','/':'Slash','?':'Slash' };
            code = map[char] || null;
        }

        if (code && this.keyEls[code]) {
            this.activeTarget = this.keyEls[code];
            this.activeTarget.classList.add('vkb-target');

            const fingerCode = this.activeTarget.getAttribute('data-finger');
            const fingerColor = FINGER_COLORS[fingerCode] || '#3B82F6';

            // Add finger label pill on target key
            const indicator = document.createElement('span');
            indicator.className = 'vkb-finger-indicator';
            indicator.style.background = fingerColor;
            indicator.textContent = FINGER_LABELS[fingerCode] ? FINGER_LABELS[fingerCode].split(' ')[1] : 'Touch';
            this.activeTarget.appendChild(indicator);

            // Draw motion path & finger reach animation
            this.drawDirectionPath(fingerCode, code, fingerColor);
        }
    }

    highlightNext(char) {
        this.highlightKey(char);
    }

    drawHandOutlines() {
        const group = document.getElementById('vkb-hands-outline-group');
        if (!group) return;

        const fKey = this.keyEls['KeyF'];
        const jKey = this.keyEls['KeyJ'];
        if (!fKey || !jKey) return;

        const wrap = document.getElementById('vkb-wrap-main');
        if (!wrap) return;
        const wrapRect = wrap.getBoundingClientRect();

        const fRect = fKey.getBoundingClientRect();
        const jRect = jKey.getBoundingClientRect();

        const leftX = fRect.left - wrapRect.left - 40;
        const leftY = fRect.top - wrapRect.top + 20;

        const rightX = jRect.left - wrapRect.left - 20;
        const rightY = jRect.top - wrapRect.top + 20;

        group.innerHTML = `
            <!-- Left Hand High-Contrast Outline & Finger Labels -->
            <g transform="translate(${leftX}, ${leftY})">
                <path d="M -60 120 C -60 70 -50 20 -40 -10 C -38 -15 -32 -15 -30 -10 C -25 15 -25 50 -25 70 C -20 10 -15 -25 -10 -35 C -8 -40 -2 -40 0 -35 C 5 5 5 45 5 65 C 10 5 15 -20 20 -30 C 22 -35 28 -35 30 -30 C 35 10 35 40 35 60 C 45 25 55 10 65 25 C 70 32 65 45 55 60 C 45 75 35 90 20 120"
                      fill="rgba(59, 130, 246, 0.1)" stroke="#3B82F6" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-filter)"/>
                <text x="-40" y="-20" fill="#EF4444" font-size="10" font-weight="bold">Pinky (A)</text>
                <text x="-15" y="-45" fill="#F59E0B" font-size="10" font-weight="bold">Ring (S)</text>
                <text x="0" y="-45" fill="#22C55E" font-size="10" font-weight="bold">Middle (D)</text>
                <text x="25" y="-38" fill="#3B82F6" font-size="10" font-weight="bold">Index (F)</text>
                <text x="65" y="15" fill="#94A3B8" font-size="10" font-weight="bold">Thumb</text>
            </g>
            <!-- Right Hand High-Contrast Outline & Finger Labels -->
            <g transform="translate(${rightX}, ${rightY})">
                <path d="M -20 120 C -35 90 -45 75 -55 60 C -65 45 -70 32 -65 25 C -55 10 -45 25 -35 60 C -35 40 -35 10 -30 -30 C -28 -35 -22 -35 -20 -30 C -15 -20 -10 5 -5 65 C -5 45 -5 5 0 -35 C 2 -40 8 -40 10 -35 C 15 -25 20 10 25 70 C 25 50 25 15 30 -10 C 32 -15 38 -15 40 -10 C 50 20 60 70 60 120"
                      fill="rgba(139, 92, 246, 0.1)" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-filter)"/>
                <text x="-65" y="15" fill="#94A3B8" font-size="10" font-weight="bold">Thumb</text>
                <text x="-40" y="-38" fill="#8B5CF6" font-size="10" font-weight="bold">Index (J)</text>
                <text x="-15" y="-45" fill="#EC4899" font-size="10" font-weight="bold">Middle (K)</text>
                <text x="10" y="-45" fill="#F59E0B" font-size="10" font-weight="bold">Ring (L)</text>
                <text x="35" y="-20" fill="#EF4444" font-size="10" font-weight="bold">Pinky (;)</text>
            </g>
        `;
    }

    drawDirectionPath(fingerCode, targetCode, color) {
        const motionGroup = document.getElementById('vkb-motion-path-group');
        if (!motionGroup) return;

        const homeCode = FINGER_HOME_KEY[fingerCode];
        const homeKeyEl = this.keyEls[homeCode];
        const targetKeyEl = this.keyEls[targetCode];

        if (!homeKeyEl || !targetKeyEl) return;

        const wrap = document.getElementById('vkb-wrap-main');
        if (!wrap) return;

        const wrapRect = wrap.getBoundingClientRect();
        const homeRect = homeKeyEl.getBoundingClientRect();
        const targetRect = targetKeyEl.getBoundingClientRect();

        const x1 = (homeRect.left + homeRect.width / 2) - wrapRect.left;
        const y1 = (homeRect.top + homeRect.height / 2) - wrapRect.top;

        const x2 = (targetRect.left + targetRect.width / 2) - wrapRect.left;
        const y2 = (targetRect.top + targetRect.height / 2) - wrapRect.top;

        const isHomeKey = homeCode === targetCode;

        if (isHomeKey) {
            motionGroup.innerHTML = `
                <circle cx="${x2}" cy="${y2}" r="20" fill="${color}22" stroke="${color}" stroke-width="3.5" opacity="0.95" filter="url(#glow-filter)">
                    <animate attributeName="r" values="16;24;16" dur="1s" repeatCount="indefinite"/>
                </circle>
            `;
            return;
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx = x1 + dx * 0.5 + (dy > 0 ? -20 : 20);
        const cy = y1 + dy * 0.5 - 15;

        const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        motionGroup.innerHTML = `
            <!-- Motion Trajectory Line -->
            <path d="${pathD}" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="8,4" opacity="0.95" filter="url(#glow-filter)">
                <animate attributeName="stroke-dashoffset" values="24;0" dur="0.5s" repeatCount="indefinite"/>
            </path>

            <!-- Extended Finger Reach Marker -->
            <circle cx="${x2}" cy="${y2}" r="18" fill="${color}44" stroke="${color}" stroke-width="3">
                <animate attributeName="r" values="14;20;14" dur="0.8s" repeatCount="indefinite"/>
            </circle>

            <!-- Base Home Circle -->
            <circle cx="${x1}" cy="${y1}" r="8" fill="${color}" stroke="#fff" stroke-width="2"/>
        `;
    }

    clearMotionPath() {
        const motionGroup = document.getElementById('vkb-motion-path-group');
        if (motionGroup) motionGroup.innerHTML = '';
    }
}

// Alias for backwards compatibility
const VisualKeyboard = VirtualKeyboard;
