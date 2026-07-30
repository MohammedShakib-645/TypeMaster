/**
 * TypeMaster - Visual QWERTY Keyboard Component
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

        KEYBOARD_ROWS.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'vkb-row';
            row.forEach(key => {
                const k = document.createElement('div');
                k.className = `vkb-key finger-${key.f}`;
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

        // Finger legend
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
        if (this.activeTarget) this.activeTarget.classList.remove('vkb-target');
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
        }
    }

    highlightNext(char) {
        this.highlightKey(char);
    }
}

// Alias for backwards compatibility
const VisualKeyboard = VirtualKeyboard;
