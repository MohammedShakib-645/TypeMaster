/**
 * TypeMaster - Student Authentication & User Profile System
 * Handles student registration, login, logout, password recovery, profile editing, and local persistence.
 */

const AuthEngine = {

    getStudents() {
        try {
            const data = localStorage.getItem('tm_students_v1');
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    saveStudents(students) {
        try {
            localStorage.setItem('tm_students_v1', JSON.stringify(students));
        } catch {}
    },

    getActiveStudent() {
        try {
            const data = localStorage.getItem('tm_active_student_v1') || sessionStorage.getItem('tm_active_student_v1');
            if (!data) return null;
            const student = JSON.parse(data);
            // Invalidate legacy guest student sessions
            if (student && (student.email === 'guest@typemaster.app' || student.username === 'guest')) {
                this.logoutSilently();
                return null;
            }
            return student;
        } catch { return null; }
    },

    logoutSilently() {
        localStorage.removeItem('tm_active_student_v1');
        sessionStorage.removeItem('tm_active_student_v1');
    },

    setActiveStudent(student, rememberMe = true) {
        const json = JSON.stringify(student);
        if (rememberMe) {
            localStorage.setItem('tm_active_student_v1', json);
        } else {
            sessionStorage.setItem('tm_active_student_v1', json);
        }
    },

    loginWithGoogle(googleProfile) {
        const cleanEmail = (googleProfile.email || '').trim().toLowerCase();
        const cleanName = (googleProfile.fullName || googleProfile.name || 'Google User').trim();
        const googleId = googleProfile.googleId || googleProfile.sub || 'G-' + Date.now();
        const avatar = googleProfile.avatar || googleProfile.picture || '🌐';

        if (!cleanEmail) {
            return { success: false, message: 'Google authentication failed: Email missing.' };
        }

        const students = this.getStudents();
        let student = students.find(s => s.email.toLowerCase() === cleanEmail);

        if (student) {
            student.authProvider = 'google';
            student.googleId = googleId;
            if (avatar) student.avatar = avatar;
            this.saveStudents(students);
            this.setActiveStudent(student, true);
            return { success: true, student: student, isNew: false };
        } else {
            const baseUser = cleanEmail.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase();
            let username = baseUser || 'student';
            let counter = 1;
            while (students.some(s => s.username.toLowerCase() === username)) {
                username = `${baseUser}${counter++}`;
            }

            const newStudent = {
                id: 'STU-' + Date.now().toString(36).toUpperCase(),
                fullName: cleanName,
                username: username,
                email: cleanEmail,
                authProvider: 'google',
                googleId: googleId,
                status: 'active',
                avatar: avatar,
                joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                joinedTimestamp: Date.now()
            };

            students.push(newStudent);
            this.saveStudents(students);
            this.setActiveStudent(newStudent, true);

            return { success: true, student: newStudent, isNew: true };
        }
    },

    decodeJwtPayload(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Failed to decode JWT payload', e);
            return null;
        }
    },

    handleGoogleCredential(responseToken) {
        const payload = this.decodeJwtPayload(responseToken);
        if (!payload) {
            return { success: false, message: 'Could not decode Google Sign-In response.' };
        }

        const profile = {
            googleId: payload.sub,
            fullName: payload.name,
            email: payload.email,
            avatar: payload.picture,
            provider: 'google'
        };

        return this.loginWithGoogle(profile);
    },

    register(fullName, username, email, password, confirmPassword) {
        const cleanName = fullName.trim();
        const cleanUser = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName || !cleanUser || !cleanEmail || !password) {
            return { success: false, message: 'All fields are required.' };
        }
        if (password !== confirmPassword) {
            return { success: false, message: 'Passwords do not match.' };
        }
        if (password.length < 6) {
            return { success: false, message: 'Password must be at least 6 characters.' };
        }

        const students = this.getStudents();
        if (students.some(s => s.email.toLowerCase() === cleanEmail)) {
            return { success: false, message: 'Email address is already registered.' };
        }
        if (students.some(s => s.username.toLowerCase() === cleanUser)) {
            return { success: false, message: 'Username is already taken.' };
        }

        const newStudent = {
            id: 'STU-' + Date.now().toString(36).toUpperCase(),
            fullName: cleanName,
            username: cleanUser,
            email: cleanEmail,
            password: password,
            status: 'active',
            avatar: '⚡',
            joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            joinedTimestamp: Date.now()
        };

        students.push(newStudent);
        this.saveStudents(students);
        this.setActiveStudent(newStudent, true);

        return { success: true, student: newStudent };
    },

    login(emailOrUsername, password, rememberMe = true) {
        const cleanInput = emailOrUsername.trim().toLowerCase();
        const students = this.getStudents();

        const student = students.find(s => 
            s.email.toLowerCase() === cleanInput || s.username.toLowerCase() === cleanInput
        );

        if (!student) {
            return { success: false, message: 'Account not found with provided username or email.' };
        }
        if (student.status === 'suspended') {
            return { success: false, message: '🔒 Account suspended. Please contact administrator.' };
        }
        if (student.password !== password) {
            return { success: false, message: 'Incorrect password.' };
        }

        this.setActiveStudent(student, rememberMe);
        return { success: true, student: student };
    },

    logout() {
        localStorage.removeItem('tm_active_student_v1');
        sessionStorage.removeItem('tm_active_student_v1');
        location.reload();
    },

    updateProfile(updatedFields) {
        const current = this.getActiveStudent();
        if (!current) return false;

        const students = this.getStudents();
        const index = students.findIndex(s => s.id === current.id);
        if (index === -1) return false;

        const updated = { ...students[index], ...updatedFields };
        students[index] = updated;

        this.saveStudents(students);
        this.setActiveStudent(updated, true);
        return updated;
    },

    resetPassword(email, newPassword) {
        const cleanEmail = email.trim().toLowerCase();
        const students = this.getStudents();
        const index = students.findIndex(s => s.email.toLowerCase() === cleanEmail);

        if (index === -1) return { success: false, message: 'Email not found.' };

        students[index].password = newPassword;
        this.saveStudents(students);
        return { success: true, message: 'Password updated successfully.' };
    }
};
