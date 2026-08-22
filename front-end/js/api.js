/* =====================================================
   API.JS
   Clean & Robust Fetch Wrapper for Backend REST & Agent Endpoints
===================================================== */

const API = {
    // 1. Fetch all students
    async getStudents() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/students`);
            if (!response.ok) throw new Error("Failed to fetch students");
            return await response.json();
        } catch (error) {
            console.warn("Backend API offline. Using fallback local data:", error);
            return null;
        }
    },

    // 2. Fetch single student details by ID
    async getStudentById(id) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/students/${id}`);
            if (!response.ok) throw new Error("Student not found");
            return await response.json();
        } catch (error) {
            console.error("API error fetching student detail:", error);
            return null;
        }
    },

    // 3. Add a new student
    async addStudent(studentData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/students`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(studentData)
            });
            return await response.json();
        } catch (error) {
            console.error("API error adding student:", error);
            return { success: false, message: "Network error" };
        }
    },

    // 4. Update student
    async updateStudent(id, studentData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/students/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(studentData)
            });
            return await response.json();
        } catch (error) {
            console.error("API error updating student:", error);
            return { success: false };
        }
    },

    // 5. Delete student
    async deleteStudent(id) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/students/${id}`, {
                method: "DELETE"
            });
            return await response.json();
        } catch (error) {
            console.error("API error deleting student:", error);
            return { success: false };
        }
    },

    // 6. Run Truly Autonomous Agent Loop
    async runAutonomousAgent() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/agent/run-autonomous-loop`, {
                method: "POST"
            });
            return await response.json();
        } catch (error) {
            console.error("API error running autonomous agent loop:", error);
            return { success: false, traces: [] };
        }
    },

    // 7. Interactive Agent Chat with Multi-turn History & Provider Override
    async sendAgentChat(query, history = [], provider = null) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/agent/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, history, provider })
            });
            return await response.json();
        } catch (error) {
            console.error("API error in agent chat:", error);
            return { response: "AI Agent offline. Check backend connection." };
        }
    },

    // 8. Fetch AI detected anomalies
    async getAnomalies() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/anomalies`);
            return await response.json();
        } catch (error) {
            console.error("API error fetching anomalies:", error);
            return [];
        }
    },

    // 9. Fetch Notifications
    async getNotifications() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/notifications`);
            return await response.json();
        } catch (error) {
            console.error("API error fetching notifications:", error);
            return [];
        }
    },

    // 10. Update Intervention
    async updateIntervention(studentId, status, notes) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/interventions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: studentId, status: status, notes: notes })
            });
            return await response.json();
        } catch (error) {
            console.error("API error updating intervention:", error);
            return { success: false };
        }
    },

    // 11. Settings (AI Provider & Keys)
    async getSettings() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/settings`);
            return await response.json();
        } catch (error) {
            return {};
        }
    },

    async saveSettings(settingsData) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settingsData)
            });
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    },

    // 12. Login
    async login(email, password) {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/api/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: "Server connection failed" };
        }
    }
};
