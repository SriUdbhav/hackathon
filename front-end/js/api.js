/* =====================================================
   API.JS
   Centralized REST API communication layer
   All backend calls for CRUD, Auth, Subjects, Activities,
   Interventions, Settings, Agent, Anomalies
===================================================== */

const API_BASE = "http://localhost:5000/api";

const API = {

    // ---- Generic fetch helper ----
    async _fetch(path, options = {}) {
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                headers: { "Content-Type": "application/json", ...options.headers },
                ...options
            });
            return await res.json();
        } catch (e) {
            console.warn(`[API Error] ${path}:`, e);
            return null;
        }
    },

    // ===================== AUTH =====================
    login(id, password) {
        return this._fetch("/login", {
            method: "POST",
            body: JSON.stringify({ email: id, password })
        });
    },

    changePassword(id, currentPassword, newPassword) {
        return this._fetch("/users/password", {
            method: "PUT",
            body: JSON.stringify({ id, current_password: currentPassword, new_password: newPassword })
        });
    },

    // ===================== USERS (Admin) =====================
    getUsers() {
        return this._fetch("/users");
    },

    createUser(userData) {
        return this._fetch("/users", {
            method: "POST",
            body: JSON.stringify(userData)
        });
    },

    deleteUser(userId) {
        return this._fetch(`/users/${userId}`, { method: "DELETE" });
    },

    // ===================== STUDENTS =====================
    getStudents() {
        return this._fetch("/students");
    },

    getStudentDetail(studentId) {
        return this._fetch(`/students/${studentId}`);
    },

    addStudent(studentData) {
        return this._fetch("/students", {
            method: "POST",
            body: JSON.stringify(studentData)
        });
    },

    updateStudent(studentId, data) {
        return this._fetch(`/students/${studentId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    deleteStudent(studentId) {
        return this._fetch(`/students/${studentId}`, { method: "DELETE" });
    },

    recalculateRisks() {
        return this._fetch("/recalculate-risks", { method: "POST" });
    },

    // ===================== SUBJECTS & MARKS =====================
    getSubjects(year) {
        const query = year ? `?year=${encodeURIComponent(year)}` : "";
        return this._fetch(`/subjects${query}`);
    },

    getSubjectMarks(studentId) {
        return this._fetch(`/subject-marks/${studentId}`);
    },

    getAllSubjectMarks() {
        return this._fetch("/subject-marks");
    },

    saveSubjectMarks(data) {
        return this._fetch("/subject-marks", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    // ===================== EXTRACURRICULAR ACTIVITIES =====================
    getExtracurriculars() {
        return this._fetch("/extracurriculars");
    },

    getStudentActivities(studentId) {
        return this._fetch(`/student-activities/${studentId}`);
    },

    // ===================== INTERVENTIONS =====================
    getInterventions() {
        return this._fetch("/interventions");
    },

    getStudentInterventions(studentId) {
        return this._fetch(`/interventions/${studentId}`);
    },

    createIntervention(data) {
        return this._fetch("/interventions", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    updateIntervention(interventionId, data) {
        return this._fetch(`/interventions/update/${interventionId}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    // ===================== AI AGENT =====================
    agentChat(query, history, provider) {
        return this._fetch("/agent/chat", {
            method: "POST",
            body: JSON.stringify({ query, history, provider })
        });
    },

    sendAgentChat(query, history, provider) {
        return this.agentChat(query, history, provider);
    },

    runAutonomousLoop() {
        return this._fetch("/agent/run-autonomous-loop", { method: "POST" });
    },

    runAutonomousAgent() {
        return this.runAutonomousLoop();
    },

    getAgentLogs() {
        return this._fetch("/agent/logs");
    },

    // ===================== SETTINGS =====================
    getSettings() {
        return this._fetch("/settings");
    },

    saveSettings(data) {
        return this._fetch("/settings", {
            method: "POST",
            body: JSON.stringify(data)
        });
    },

    // ===================== NOTIFICATIONS & ANOMALIES =====================
    getNotifications(studentId) {
        const query = studentId ? `?student_id=${studentId}` : "";
        return this._fetch(`/notifications${query}`);
    },

    getAnomalies() {
        return this._fetch("/anomalies");
    }
};
