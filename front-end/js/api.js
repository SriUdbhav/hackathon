/* =====================================================
   API.JS
   Centralized REST API communication layer
   All backend calls for CRUD, Auth, Subjects, Activities,
   Interventions, Settings, Agent, Anomalies, Notifications,
   Signup Requests & Email Audit Logs
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

    // ---- File upload helper (no Content-Type header — browser sets boundary) ----
    async _upload(path, formData) {
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                method: "POST",
                body: formData
            });
            return await res.json();
        } catch (e) {
            console.warn(`[API Upload Error] ${path}:`, e);
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

    getProfile(userId) {
        return this._fetch(`/profile/${encodeURIComponent(userId)}`);
    },

    // ===================== SIGNUP REQUESTS & APPROVAL =====================
    async submitSignupRequest(data) {
        const res = await this._fetch("/signup-requests", {
            method: "POST",
            body: JSON.stringify(data)
        });
        if (res) return res;

        // Fallback for standalone/offline demo
        const newReq = {
            id: Date.now(),
            user_id: data.id || data.user_id,
            display_name: data.display_name || data.name,
            role: data.role || "faculty",
            email: data.email,
            phone: data.phone || "",
            password: data.password,
            subjects: data.subjects || "",
            extra_roles: data.extra_roles || "",
            status: "Pending",
            created_at: new Date().toISOString().split('T')[0]
        };
        this._mockSignupRequests.unshift(newReq);
        return {
            success: true,
            message: `Application submitted successfully! Your ${data.role || 'Faculty'} account is awaiting Administrator approval. You will receive an email at ${data.email} once approved.`
        };
    },

    async getSignupRequests(status) {
        const query = status ? `?status=${status}` : "";
        const data = await this._fetch(`/signup-requests${query}`);
        if (data) return data;
        if (status) return this._mockSignupRequests.filter(r => r.status.toLowerCase() === status.toLowerCase());
        return this._mockSignupRequests;
    },

    async approveSignupRequest(reqId) {
        const res = await this._fetch(`/signup-requests/${reqId}/approve`, { method: "POST" });
        if (res) return res;

        // Fallback
        const req = this._mockSignupRequests.find(r => r.id === reqId);
        if (req) {
            req.status = "Approved";
            req.reviewed_at = new Date().toISOString();
            // Add to mock emails
            this._mockEmailLogs.unshift({
                id: Date.now(),
                recipient: req.email,
                subject: `Welcome to EduStudent Sight — ${req.role.toUpperCase()} Account Activated`,
                email_type: "Account Approved",
                sent_at: new Date().toISOString(),
                body_html: `<h3>Welcome, ${req.display_name}!</h3><p>Your ${req.role} account has been activated. <strong>ID:</strong> ${req.user_id}, <strong>Password:</strong> ${req.password}</p>`
            });
            return { success: true, message: `Application for ${req.display_name} approved! Faculty account created in Faculty & Mentor Management. Credentials dispatched to ${req.email}.` };
        }
        return { success: false, message: "Request not found." };
    },

    async rejectSignupRequest(reqId, reason) {
        const res = await this._fetch(`/signup-requests/${reqId}/reject`, {
            method: "POST",
            body: JSON.stringify({ reason })
        });
        if (res) return res;

        // Fallback
        const req = this._mockSignupRequests.find(r => r.id === reqId);
        if (req) {
            req.status = "Declined";
            req.rejection_reason = reason;
            req.reviewed_at = new Date().toISOString();
            this._mockEmailLogs.unshift({
                id: Date.now(),
                recipient: req.email,
                subject: `EduStudent Sight Application Status — ${req.role.toUpperCase()} Account`,
                email_type: "Account Declined",
                sent_at: new Date().toISOString(),
                body_html: `<h3>Application Notice</h3><p>Dear ${req.display_name}, your request was declined.</p><p><strong>Reason:</strong> ${reason}</p>`
            });
            return { success: true, message: `Application for ${req.display_name} marked as Declined. Reason recorded in history and notification dispatched to ${req.email}.` };
        }
        return { success: false, message: "Request not found." };
    },

    async getEmailLogs() {
        const data = await this._fetch("/emails");
        if (data) return data;
        return this._mockEmailLogs;
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

    importUsersCSV(formData) {
        return this._upload("/users/import", formData);
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

    bulkDeleteStudents(ids) {
        return this._fetch("/students/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ ids })
        });
    },

    recalculateRisks() {
        return this._fetch("/recalculate-risks", { method: "POST" });
    },

    advanceAttendanceDay(incrementPct = 2.0) {
        return this._fetch("/attendance/advance-day", {
            method: "POST",
            body: JSON.stringify({ increment_pct: incrementPct })
        });
    },

    getAttendanceStatus() {
        return this._fetch("/attendance/status");
    },

    importStudentsCSV(formData) {
        return this._upload("/students/import", formData);
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

    // ===================== MOCK STORE FALLBACK =====================
    _mockSignupRequests: [
        {
            id: 1,
            user_id: "FAC004",
            display_name: "Dr. Kavitha Menon",
            role: "faculty",
            email: "kavitha.menon@vignan.ac.in",
            phone: "+91 98765 43210",
            subjects: "CS301,CS302",
            extra_roles: "AI Lab Incharge, 3rd Year Mentor",
            password: "Welcome@123",
            status: "Pending",
            created_at: new Date().toISOString().split('T')[0]
        },
        {
            id: 2,
            user_id: "MEN003",
            display_name: "Prof. Rajesh Varma",
            role: "mentor",
            email: "rajesh.varma@vignan.ac.in",
            phone: "+91 98765 11223",
            subjects: "CS201,MA201",
            extra_roles: "Student Counselor",
            password: "MentorPass@2026",
            status: "Pending",
            created_at: new Date().toISOString().split('T')[0]
        }
    ],

    _mockEmailLogs: [
        {
            id: 1,
            recipient: "dr.ramesh@vignan.ac.in",
            subject: "Welcome to EduStudent Sight — Faculty Account Activated",
            email_type: "Account Approved",
            sent_at: new Date(Date.now() - 86400000).toISOString(),
            body_html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background: #1e293b; color: #ffffff; padding: 24px; text-align: center;">
                        <h2 style="margin: 0; font-size: 22px;">EduStudent Sight</h2>
                        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Academic Intelligence Platform</p>
                    </div>
                    <div style="padding: 24px; background: #ffffff;">
                        <h3 style="color: #0f172a; margin-top: 0;">Welcome, Dr. Ramesh Kumar!</h3>
                        <p style="color: #334155;">Your registration application for the <strong>FACULTY</strong> role has been approved.</p>
                        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin: 16px 0;">
                            <p style="margin: 0 0 6px;"><strong>User ID:</strong> <code>FAC001</code></p>
                            <p style="margin: 0 0 6px;"><strong>Password:</strong> <code>FAC001</code></p>
                            <p style="margin: 0 0 6px;"><strong>Assigned Subjects:</strong> CS201, CS202</p>
                        </div>
                    </div>
                </div>
            `
        }
    ],

    _mockNotifs: [
        { id: 1, title: "Urgent Attendance Breach", message: "Arjun Patel (25CS005) has fallen to 61% attendance (cutoff 75%). Immediate mentoring recommended.", type: "critical", date: new Date(Date.now() - 3600000).toISOString(), student_id: "25CS005", read: 0 },
        { id: 2, title: "Subject Score Alert", message: "Y.Hemanth Reddy (25CS002) scored below 18/30 in DBMS (CS201) internal exam.", type: "warning", date: new Date(Date.now() - 7200000).toISOString(), student_id: "25CS002", read: 0 },
        { id: 3, title: "Autonomous Loop Executed", message: "Autonomous AI cycle completed. 3 early intervention notifications dispatched.", type: "info", date: new Date(Date.now() - 86400000).toISOString(), student_id: null, read: 1 },
        { id: 4, title: "Exam Eligibility Notice", message: "Your attendance is at 82%, meeting the 75% department requirement.", type: "success", date: new Date(Date.now() - 14400000).toISOString(), student_id: "25CS001", read: 0 },
    ],

    // ===================== NOTIFICATIONS =====================
    async getNotifications(studentId, includeRead = true) {
        let query = "";
        const params = [];
        if (studentId) params.push(`student_id=${studentId}`);
        if (!includeRead) params.push("include_read=false");
        if (params.length) query = "?" + params.join("&");
        const data = await this._fetch(`/notifications${query}`);
        if (data) return data;

        // Fallback
        let notifs = [...this._mockNotifs];
        if (studentId) notifs = notifs.filter(n => n.student_id === studentId);
        if (!includeRead) notifs = notifs.filter(n => !n.read);
        return notifs;
    },

    async markNotificationRead(notifId) {
        const res = await this._fetch(`/notifications/${notifId}/read`, { method: "PUT" });
        if (res) return res;
        const n = this._mockNotifs.find(x => x.id === notifId);
        if (n) n.read = 1;
        return { success: true, message: "Marked read" };
    },

    async markAllNotificationsRead(studentId) {
        const res = await this._fetch("/notifications/read-all", {
            method: "PUT",
            body: JSON.stringify({ student_id: studentId || null })
        });
        if (res) return res;
        this._mockNotifs.forEach(n => {
            if (!studentId || n.student_id === studentId) n.read = 1;
        });
        return { success: true, message: "All marked read" };
    },

    async deleteNotification(notifId) {
        const res = await this._fetch(`/notifications/${notifId}`, { method: "DELETE" });
        if (res) return res;
        this._mockNotifs = this._mockNotifs.filter(x => x.id !== notifId);
        return { success: true, message: "Deleted" };
    },

    async deleteAllNotifications(studentId) {
        const query = studentId ? `?student_id=${studentId}` : "";
        const res = await this._fetch(`/notifications/delete-all${query}`, { method: "DELETE" });
        if (res) return res;
        if (studentId) {
            this._mockNotifs = this._mockNotifs.filter(x => x.student_id !== studentId);
        } else {
            this._mockNotifs = [];
        }
        return { success: true, message: "All deleted" };
    },

    // ===================== ANOMALIES =====================
    async getAnomalies() {
        const data = await this._fetch("/anomalies");
        if (data) return data;
        return [
            {
                student_id: "25CS005",
                student_name: "Arjun Patel",
                attendance: 61,
                risk: 72,
                anomalies: [
                    { type: "Overall Attendance Drop", severity: "High", message: "Overall attendance has fallen to 61%, below the mandatory 75% benchmark." },
                    { type: "Subject Marks Anomaly", severity: "High", message: "DBMS internal exam score is 8/30, indicating risk of course failure." }
                ]
            },
            {
                student_id: "25CS002",
                student_name: "Y.Hemanth Reddy",
                attendance: 68,
                risk: 55,
                anomalies: [
                    { type: "Attendance Warning", severity: "Moderate", message: "Attendance at 68% is below threshold in Discrete Mathematics (62%)." }
                ]
            }
        ];
    },

    // ===================== FACULTY MANAGEMENT (Admin) =====================
    async getFaculty() {
        const data = await this._fetch("/faculty");
        if (data) return data;

        // Fallback mock data built from existing mock stores
        const users = [
            { id: "FAC001", display_name: "Dr. Ramesh Kumar", role: "faculty", subjects: "CS201,CS202", extra_roles: "Class Teacher,2nd Year Coordinator", email: "dr.ramesh@vignan.ac.in", phone: "+91 90000 11111", status: "Active", source: "approved", students_assigned: 3, high_risk_students: 1 },
            { id: "FAC002", display_name: "Dr. Priya Sharma", role: "faculty", subjects: "CS203,CS204", extra_roles: "None", email: "dr.priya@vignan.ac.in", phone: "+91 90000 22222", status: "Active", source: "approved", students_assigned: 2, high_risk_students: 0 },
            { id: "FAC003", display_name: "Prof. Venkat Rao", role: "faculty", subjects: "MA201", extra_roles: "HOD Mathematics", email: "prof.venkat@vignan.ac.in", phone: "+91 90000 33333", status: "Active", source: "approved", students_assigned: 1, high_risk_students: 0 },
            { id: "MEN001", display_name: "Prof. Sunitha Devi", role: "mentor", subjects: "CS201,CS203", extra_roles: "None", email: "prof.sunitha@vignan.ac.in", phone: "+91 90000 44444", status: "Active", source: "approved", students_assigned: 3, high_risk_students: 1 },
            { id: "MEN002", display_name: "Dr. Anil Kumar", role: "mentor", subjects: "CS202,CS204", extra_roles: "None", email: "dr.anil@vignan.ac.in", phone: "+91 90000 55555", status: "Active", source: "approved", students_assigned: 2, high_risk_students: 0 },
        ];

        // Include any signup requests that have been Approved in the mock store
        const approvedRequests = this._mockSignupRequests.filter(r => r.status === "Approved");
        approvedRequests.forEach(r => {
            if (!users.some(u => u.id.toLowerCase() === r.user_id.toLowerCase())) {
                users.push({
                    id: r.user_id, display_name: r.display_name, role: r.role,
                    subjects: r.subjects, extra_roles: r.extra_roles, email: r.email, phone: r.phone,
                    status: "Active", source: "approved", students_assigned: 0, high_risk_students: 0
                });
            }
        });

        const pending = this._mockSignupRequests.filter(r => r.status === "Pending");
        const declined = this._mockSignupRequests.filter(r => r.status === "Declined" || r.status === "Rejected").map(r => ({
            id: r.user_id, req_id: r.id, display_name: r.display_name, role: r.role,
            subjects: r.subjects, extra_roles: r.extra_roles, email: r.email, phone: r.phone,
            status: "Declined", source: "declined", created_at: r.created_at,
            reviewed_at: r.reviewed_at || r.created_at, rejection_reason: r.rejection_reason || "Declined by administrator",
            students_assigned: 0, high_risk_students: 0
        }));

        return {
            faculty: users,
            declined_history: declined,
            summary: {
                total_faculty: users.length,
                active_faculty: users.filter(u => u.status === "Active").length,
                pending_applications: pending.length,
                mentors: users.filter(u => u.role === "mentor").length,
                total_students_assigned: users.reduce((sum, u) => sum + (u.students_assigned || 0), 0),
                total_students: 5
            }
        };
    },

    async getFacultyDetail(facultyId) {
        const data = await this._fetch(`/faculty/${encodeURIComponent(facultyId)}`);
        if (data) return data;

        // Fallback mock detail
        const mockProfiles = {
            "FAC001": { id: "FAC001", display_name: "Dr. Ramesh Kumar", role: "faculty", subjects: "CS201,CS202", extra_roles: "Class Teacher,2nd Year Coordinator", email: "dr.ramesh@vignan.ac.in", phone: "+91 90000 11111", status: "Active", source: "approved" },
            "MEN001": { id: "MEN001", display_name: "Prof. Sunitha Devi", role: "mentor", subjects: "CS201,CS203", extra_roles: "None", email: "prof.sunitha@vignan.ac.in", phone: "+91 90000 44444", status: "Active", source: "approved" },
        };

        const profile = mockProfiles[facultyId] || { id: facultyId, display_name: facultyId, role: "faculty", subjects: "", extra_roles: "", email: "", phone: "", status: "Active", source: "approved" };

        // Check if this is a pending application
        const pendingApp = this._mockSignupRequests.find(r => r.user_id === facultyId);
        let application = null;
        if (pendingApp) {
            profile.display_name = pendingApp.display_name;
            profile.role = pendingApp.role;
            profile.subjects = pendingApp.subjects;
            profile.extra_roles = pendingApp.extra_roles;
            profile.email = pendingApp.email;
            profile.phone = pendingApp.phone;
            profile.status = pendingApp.status;
            profile.source = "application";
            application = {
                req_id: pendingApp.id,
                status: pendingApp.status,
                submitted_date: pendingApp.created_at,
                reviewed_date: pendingApp.reviewed_at || null,
                rejection_reason: pendingApp.rejection_reason || null,
            };
        }

        return {
            success: true,
            profile: profile,
            application: application,
            assigned_students: [
                { id: "25CS005", name: "Arjun Patel", course: "CSE", year: "2nd Year", attendance: 61, cgpa: 6.9, risk: 72 },
                { id: "25CS002", name: "Y.Hemanth Reddy", course: "CSE", year: "2nd Year", attendance: 68, cgpa: 7.4, risk: 55 },
                { id: "25CS001", name: "V.Sri Udbhav", course: "CSE", year: "2nd Year", attendance: 82, cgpa: 8.2, risk: 18 },
            ],
            interventions: [
                { id: 1, student_id: "25CS005", date: "2026-08-20", action: "Academic Counseling", status: "Pending", notes: "Scheduled meeting", urgency: "High" },
                { id: 2, student_id: "25CS002", date: "2026-08-18", action: "Attendance Follow-up", status: "Completed", notes: "Student counseled", urgency: "Moderate" },
            ],
            ai_summary: {
                high_risk_count: 1,
                medium_risk_count: 1,
                total_assigned: 3,
                pending_interventions: 1,
                completed_interventions: 1,
            }
        };
    },

    updateFaculty(facultyId, data) {
        return this._fetch(`/faculty/${encodeURIComponent(facultyId)}`, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    },

    updateFacultyStatus(facultyId, status) {
        return this._fetch(`/faculty/${encodeURIComponent(facultyId)}/status`, {
            method: "PUT",
            body: JSON.stringify({ status })
        });
    },

    bulkImportFaculty(rows) {
        return this._fetch("/faculty/bulk-import", {
            method: "POST",
            body: JSON.stringify({ rows })
        });
    },

    bulkDeleteFaculty(ids, force = false) {
        return this._fetch("/faculty/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ ids, force })
        });
    },

    bulkStatusFaculty(ids, status) {
        return this._fetch("/faculty/bulk-status", {
            method: "POST",
            body: JSON.stringify({ ids, status })
        });
    }
};
