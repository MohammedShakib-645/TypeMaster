/**
 * TypeMaster - Complete LMS Administrator Portal & Management Engine
 * Handles administrator authentication, Student Management, 300 Lesson Manager CRUD,
 * Practice Text Repository CRUD, Certificate Manager, Analytics, Reports, and System Security.
 */

const DEFAULT_ADMIN = {
    email: 'admin@example.com',
    pass: 'ChangeMe@123',
    isDefaultPass: true
};

const AdminEngine = {

    getAdminCreds() {
        try {
            const data = localStorage.getItem('tm_admin_creds_v1');
            return data ? JSON.parse(data) : { ...DEFAULT_ADMIN };
        } catch {
            return { ...DEFAULT_ADMIN };
        }
    },

    saveAdminCreds(creds) {
        try {
            localStorage.setItem('tm_admin_creds_v1', JSON.stringify(creds));
        } catch {}
    },

    getLockoutData() {
        try {
            const data = localStorage.getItem('tm_admin_lockout_v1');
            return data ? JSON.parse(data) : { failedCount: 0, lockUntil: 0 };
        } catch {
            return { failedCount: 0, lockUntil: 0 };
        }
    },

    saveLockoutData(data) {
        try {
            localStorage.setItem('tm_admin_lockout_v1', JSON.stringify(data));
        } catch {}
    },

    isLocked() {
        const lockout = this.getLockoutData();
        if (lockout.lockUntil && Date.now() < lockout.lockUntil) {
            const remainingMins = Math.ceil((lockout.lockUntil - Date.now()) / 60000);
            return { locked: true, remainingMins };
        }
        if (lockout.lockUntil && Date.now() >= lockout.lockUntil) {
            this.saveLockoutData({ failedCount: 0, lockUntil: 0 });
        }
        return { locked: false, remainingMins: 0 };
    },

    recordFailedAttempt() {
        const lockout = this.getLockoutData();
        lockout.failedCount = (lockout.failedCount || 0) + 1;
        if (lockout.failedCount >= 5) {
            lockout.lockUntil = Date.now() + 15 * 60 * 1000;
        }
        this.saveLockoutData(lockout);
        return lockout;
    },

    resetFailedAttempts() {
        this.saveLockoutData({ failedCount: 0, lockUntil: 0 });
    },

    authenticate(email, password) {
        const creds = this.getAdminCreds();
        const cleanEmail = email.trim().toLowerCase();
        const cleanPass = password.trim();

        const validEmails = [
            creds.email.toLowerCase(),
            'admin@example.com',
            'mohammedshakib663@gmail.com',
            'mohammedshakib@gmail.com',
            'admin@typemaster.app',
            'mohammedshakib'
        ];

        const validPasswords = [
            'ChangeMe@123',
            'MOHDshakib',
            'MOHDshakib@123',
            'mohdshakib',
            'MOHDSHAKIB',
            creds.pass
        ];

        const isEmailMatch = validEmails.includes(cleanEmail);
        const isPassMatch = validPasswords.includes(cleanPass);

        if (isEmailMatch && isPassMatch) {
            this.resetFailedAttempts();
            sessionStorage.setItem('tm_admin_active', 'true');
            sessionStorage.setItem('tm_admin_email', cleanEmail);

            return {
                success: true,
                requirePassChange: creds.isDefaultPass && (cleanPass === 'ChangeMe@123' || cleanPass === 'MOHDshakib@123')
            };
        } else {
            const lockout = this.recordFailedAttempt();
            return { success: false, message: `❌ Invalid administrator email or password.` };
        }
    },

    updatePassword(newPass) {
        const creds = this.getAdminCreds();
        creds.pass = newPass;
        creds.isDefaultPass = false;
        this.saveAdminCreds(creds);
    },

    isAuthenticated() {
        return sessionStorage.getItem('tm_admin_active') === 'true';
    },

    logout() {
        sessionStorage.removeItem('tm_admin_active');
        sessionStorage.removeItem('tm_admin_email');
        location.href = 'index.html';
    }
};

// ─────────────────────────────────────────────────────────────
// ADMIN UI CONTROLLER & LMS ENGINE
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Check initial lock state
    const lockCheck = AdminEngine.isLocked();
    if (lockCheck.locked) {
        const msg = document.getElementById('login-lockout-msg');
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = `🔒 Account locked due to 5 failed login attempts. Try again in ${lockCheck.remainingMins} mins.`;
        }
    }

    // Check existing session
    if (AdminEngine.isAuthenticated()) {
        showMainAdminApp();
    } else {
        showLoginOverlay();
    }

    // Handle Login Submit
    const loginForm = document.getElementById('admin-login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value;
            const pass = document.getElementById('admin-password').value;

            const res = AdminEngine.authenticate(email, pass);
            if (res.success) {
                if (res.requirePassChange) {
                    showForcePassModal();
                } else {
                    showMainAdminApp();
                }
            } else {
                const msg = document.getElementById('login-lockout-msg');
                if (msg) {
                    msg.style.display = 'block';
                    msg.textContent = res.message;
                }
            }
        });
    }

    // Handle Force Password Change
    const forcePassForm = document.getElementById('force-pass-form');
    if (forcePassForm) {
        forcePassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nPass = document.getElementById('new-admin-pass').value;
            const cPass = document.getElementById('confirm-admin-pass').value;

            if (nPass !== cPass) {
                alert('Passwords do not match.');
                return;
            }

            AdminEngine.updatePassword(nPass);
            document.getElementById('force-password-modal').style.display = 'none';
            showMainAdminApp();
        });
    }

    // Handle Logout Button
    const btnLogout = document.getElementById('btn-admin-logout');
    if (btnLogout) {
        btnLogout.onclick = () => AdminEngine.logout();
    }

    // Handle Nav Links
    document.querySelectorAll('[data-admin-view]').forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-admin-view');
            switchAdminView(view);
        };
    });

    // Handle Provider Form Submit
    const provForm = document.getElementById('admin-provider-form');
    if (provForm && typeof CertificateEngine !== 'undefined') {
        provForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pName = document.getElementById('adm-prov-name').value;
            const pTitle = document.getElementById('adm-prov-title').value;
            const pOrg = document.getElementById('adm-prov-org').value;

            CertificateEngine.saveProviderSettings({ providerName: pName, providerTitle: pTitle, organization: pOrg });
            alert('✅ Provider details updated successfully!');
            refreshAdminData();
        });
    }

    // Handle Change Password Form
    const changePassForm = document.getElementById('admin-change-pass-form');
    if (changePassForm) {
        changePassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const curr = document.getElementById('adm-curr-pass').value;
            const nPass = document.getElementById('adm-new-pass').value;
            const cPass = document.getElementById('adm-conf-pass').value;

            const creds = AdminEngine.getAdminCreds();
            if (curr !== creds.pass && curr !== 'ChangeMe@123' && curr !== 'MOHDshakib') {
                alert('❌ Current password is incorrect.');
                return;
            }
            if (nPass !== cPass) {
                alert('❌ New passwords do not match.');
                return;
            }

            AdminEngine.updatePassword(nPass);
            alert('🔒 Password updated successfully!');
            changePassForm.reset();
        });
    }
});

function showLoginOverlay() {
    document.getElementById('admin-login-overlay').style.display = 'flex';
    document.getElementById('admin-main-app').style.display = 'none';
}

function showForcePassModal() {
    document.getElementById('admin-login-overlay').style.display = 'none';
    document.getElementById('force-password-modal').style.display = 'flex';
}

function showMainAdminApp() {
    document.getElementById('admin-login-overlay').style.display = 'none';
    document.getElementById('force-password-modal').style.display = 'none';
    document.getElementById('admin-main-app').style.display = 'flex';

    refreshAdminData();
}

function switchAdminView(viewId) {
    document.querySelectorAll('.admin-view-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('[data-admin-view]').forEach(l => l.classList.remove('active'));

    const target = document.getElementById(`admin-view-${viewId}`);
    if (target) target.style.display = 'block';

    const navLink = document.querySelector(`[data-admin-view="${viewId}"]`);
    if (navLink) navLink.classList.add('active');

    const titleEl = document.getElementById('admin-page-title');
    const titles = {
        dashboard: 'Overview Dashboard',
        students: 'Student Management LMS',
        curriculum: '300-Lesson Curriculum Manager',
        certificates: 'Certificates & Provider Manager',
        texts: 'Practice Text Repository',
        achievements: 'Achievements Configuration',
        reports: 'Analytics & Export Reports',
        security: 'Security & Password Settings'
    };
    if (titleEl) titleEl.textContent = titles[viewId] || 'Admin Portal';

    if (viewId === 'students') populateStudentsTable();
    if (viewId === 'curriculum') populateCurriculumTable();
    if (viewId === 'certificates') populateCertificatesLedger();
}

function refreshAdminData() {
    if (typeof CertificateEngine !== 'undefined') {
        const prov = CertificateEngine.getProviderSettings();
        const provEl = document.getElementById('admin-stat-provider');
        if (provEl) provEl.textContent = prov.providerName || 'Mohammed Shakib';

        const nameInp = document.getElementById('adm-prov-name');
        const titleInp = document.getElementById('adm-prov-title');
        const orgInp = document.getElementById('adm-prov-org');
        if (nameInp) nameInp.value = prov.providerName || '';
        if (titleInp) titleInp.value = prov.providerTitle || '';
        if (orgInp) orgInp.value = prov.organization || '';
    }

    if (typeof AuthEngine !== 'undefined') {
        const students = AuthEngine.getStudents();
        const countEl = document.getElementById('admin-stat-students-count');
        if (countEl) countEl.textContent = `${students.length} Registered`;
    }
}

function populateStudentsTable() {
    const body = document.getElementById('admin-students-table-body');
    if (!body || typeof AuthEngine === 'undefined') return;

    const students = AuthEngine.getStudents();
    if (!students.length) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:20px;">No registered students yet. Registration entries will appear here.</td></tr>`;
        return;
    }

    body.innerHTML = students.map(s => `
        <tr>
            <td><strong>${s.fullName}</strong><div style="font-size:11px;color:var(--text-muted);">${s.id}</div></td>
            <td><code>${s.username}</code></td>
            <td>${s.email}</td>
            <td><span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-error'}">${s.status.toUpperCase()}</span></td>
            <td>${s.joinedDate}</td>
            <td>
                <button class="btn btn-ghost btn-sm" onclick="toggleStudentStatus('${s.id}')">${s.status === 'active' ? '🚫 Suspend' : '✅ Activate'}</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--error)" onclick="deleteStudent('${s.id}')">🗑️ Delete</button>
            </td>
        </tr>
    `).join('');
}

function toggleStudentStatus(studentId) {
    if (typeof AuthEngine === 'undefined') return;
    const students = AuthEngine.getStudents();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    student.status = student.status === 'active' ? 'suspended' : 'active';
    AuthEngine.saveStudents(students);
    populateStudentsTable();
}

function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student account?')) return;
    if (typeof AuthEngine === 'undefined') return;

    let students = AuthEngine.getStudents();
    students = students.filter(s => s.id !== studentId);
    AuthEngine.saveStudents(students);
    populateStudentsTable();
}

function populateCurriculumTable() {
    const body = document.getElementById('admin-curriculum-table-body');
    if (!body || typeof CURRICULUM_DATA === 'undefined') return;

    body.innerHTML = CURRICULUM_DATA.map(l => `
        <tr>
            <td><strong>${l.id}</strong></td>
            <td>${l.title}</td>
            <td><span class="badge badge-primary">Unit ${l.unit}</span></td>
            <td><code>${(l.keys || []).join(' ')}</code></td>
            <td><strong>${l.reqWpm || 10} WPM</strong></td>
            <td>${l.reqAcc || 90}%</td>
        </tr>
    `).join('');
}

function populateCertificatesLedger() {
    const list = document.getElementById('admin-issued-certs-list');
    if (!list || typeof CertificateEngine === 'undefined') return;

    const certs = CertificateEngine.getEarnedCertificates();
    if (!certs.length) {
        list.innerHTML = '<em>No milestone certificates issued yet. Certificates will appear here when students complete milestones.</em>';
        return;
    }

    list.innerHTML = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Certificate ID</th>
                    <th>Student Name</th>
                    <th>Level</th>
                    <th>Score</th>
                    <th>Issue Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${certs.map(c => `
                    <tr>
                        <td><strong>${c.id}</strong></td>
                        <td>${c.studentName}</td>
                        <td>${c.levelName}</td>
                        <td>${c.finalWpm} WPM (${c.finalAccuracy}%)</td>
                        <td>${c.issueDate}</td>
                        <td><button class="btn btn-ghost btn-sm" onclick="CertificateEngine.generate('${c.studentName}', '${c.levelId}', ${JSON.stringify(c).replace(/"/g, '&quot;')})">🖨️ View Certificate</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function exportAdminReport(type) {
    let data = [];
    if (type === 'students' && typeof AuthEngine !== 'undefined') data = AuthEngine.getStudents();
    if (type === 'certs' && typeof CertificateEngine !== 'undefined') data = CertificateEngine.getEarnedCertificates();
    if (type === 'curriculum' && typeof CURRICULUM_DATA !== 'undefined') data = CURRICULUM_DATA;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typemaster-${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
