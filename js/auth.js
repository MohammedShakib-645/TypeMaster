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
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },

    setActiveStudent(student, rememberMe = true) {
        const json = JSON.stringify(student);
        if (rememberMe) {
            localStorage.setItem('tm_active_student_v1', json);
        } else {
            sessionStorage.setItem('tm_active_student_v1', json);
        }
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
