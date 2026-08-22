/* =====================================================
   AUTH.JS
   Unified Access Control (UAC), Authentication,
   Session Persistence, and Role-Based Permissions
===================================================== */

// Global state holding active user and live students
let currentUser = null;
let students = [];
let allSubjects = [];

// Helper to refresh student list from backend SQLite
async function loadLatestStudents() {
    const liveData = await API.getStudents();
    if (liveData && liveData.length > 0) {
        students = liveData;
    }
}

// Quick demo login fill helper
function fillDemoLogin(userId, password) {
    const idInput = document.getElementById("loginUserId");
    const pwInput = document.getElementById("loginPassword");
    if (idInput && pwInput) {
        idInput.value = userId;
        pwInput.value = password;
        document.getElementById("loginError").textContent = "";
    }
}

function getCurrentUser() {
    if (currentUser) return currentUser;
    const stored = localStorage.getItem("eduUser") || sessionStorage.getItem("eduUser");
    if (stored) {
        try {
            currentUser = JSON.parse(stored);
        } catch (e) {
            currentUser = null;
        }
    }
    return currentUser;
}

function applyRolePermissions(user) {
    if (!user) return;
    const role = (user.role || "faculty").toLowerCase();

    // Elements to toggle
    const navStudents = document.getElementById("navStudents");
    const navAnalytics = document.getElementById("navAnalytics");
    const navEngagement = document.getElementById("navEngagement");
    const navMentor = document.getElementById("navMentor");
    const navAnomalies = document.getElementById("navAnomalies");
    const navReports = document.getElementById("navReports");
    const navSettings = document.getElementById("navSettings");
    const navUsers = document.getElementById("navUsers");
    const navLabelIntelligence = document.getElementById("navLabelIntelligence");
    const navLabelManagement = document.getElementById("navLabelManagement");
    const navStudent360Label = document.getElementById("navStudent360Label");

    // Topbar Profile Info
    const topbarUserName = document.getElementById("topbarUserName");
    const topbarUserRole = document.getElementById("topbarUserRole");
    const topbarAvatar = document.getElementById("topbarAvatar");
    const dropMenuName = document.getElementById("dropMenuName");
    const dropMenuDetail = document.getElementById("dropMenuDetail");
    const sidebarRoleSubtitle = document.getElementById("sidebarRoleSubtitle");

    if (topbarUserName) topbarUserName.textContent = user.display_name || user.id;
    if (dropMenuName) dropMenuName.textContent = user.display_name || user.id;

    if (role === "admin") {
        if (topbarUserRole) topbarUserRole.textContent = "System Admin";
        if (topbarAvatar) topbarAvatar.textContent = "👑";
        if (dropMenuDetail) dropMenuDetail.textContent = "Role: Administrator";
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Admin Portal";

        // Admin sees EVERYTHING including User Access
        [navStudents, navAnalytics, navEngagement, navMentor, navAnomalies, navReports, navSettings, navUsers, navLabelIntelligence, navLabelManagement].forEach(el => el?.classList.remove("d-none"));
        if (navStudent360Label) navStudent360Label.textContent = "Student 360°";
    }
    else if (role === "faculty") {
        if (topbarUserRole) topbarUserRole.textContent = `Faculty (${user.subjects || 'All Subjects'})`;
        if (topbarAvatar) topbarAvatar.textContent = "👨‍🏫";
        if (dropMenuDetail) dropMenuDetail.textContent = `Faculty • ${user.extra_roles || 'Department'}`;
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Faculty Portal";

        [navStudents, navAnalytics, navEngagement, navMentor, navAnomalies, navReports, navSettings, navLabelIntelligence, navLabelManagement].forEach(el => el?.classList.remove("d-none"));
        if (navUsers) navUsers.classList.add("d-none"); // Users tab admin only
        if (navStudent360Label) navStudent360Label.textContent = "Student 360°";
    }
    else if (role === "mentor") {
        if (topbarUserRole) topbarUserRole.textContent = "Mentor";
        if (topbarAvatar) topbarAvatar.textContent = "🤝";
        if (dropMenuDetail) dropMenuDetail.textContent = `Mentor • ${user.subjects || 'All'}`;
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Mentor Portal";

        [navStudents, navAnalytics, navEngagement, navMentor, navAnomalies, navReports, navLabelIntelligence, navLabelManagement].forEach(el => el?.classList.remove("d-none"));
        if (navSettings) navSettings.classList.add("d-none");
        if (navUsers) navUsers.classList.add("d-none");
        if (navStudent360Label) navStudent360Label.textContent = "Student 360°";
    }
    else if (role === "student") {
        if (topbarUserRole) topbarUserRole.textContent = `Student (${user.linked_student_id || user.id})`;
        if (topbarAvatar) topbarAvatar.textContent = "🎓";
        if (dropMenuDetail) dropMenuDetail.textContent = `ID: ${user.linked_student_id || user.id}`;
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Student Portal";

        // Hide administrative & class-wide tabs for individual students
        if (navStudents) navStudents.classList.add("d-none");
        if (navEngagement) navEngagement.classList.add("d-none");
        if (navMentor) navMentor.classList.add("d-none");
        if (navAnomalies) navAnomalies.classList.add("d-none");
        if (navReports) navReports.classList.add("d-none");
        if (navSettings) navSettings.classList.add("d-none");
        if (navUsers) navUsers.classList.add("d-none");
        if (navLabelIntelligence) navLabelIntelligence.classList.add("d-none");
        if (navLabelManagement) navLabelManagement.classList.add("d-none");

        // Keep Analytics & 360 visible (personalized)
        if (navAnalytics) navAnalytics.classList.remove("d-none");
        if (navStudent360Label) navStudent360Label.textContent = "My 360° Profile";
    }
}

function showApp() {
    const loginPage = document.getElementById("loginPage");
    const app = document.getElementById("app");

    if (loginPage) loginPage.classList.add("d-none");
    if (app) app.classList.remove("d-none");

    const user = getCurrentUser();
    applyRolePermissions(user);

    loadLatestStudents().then(() => {
        if (typeof renderPage === "function") {
            // Students start on Student 360 or Dashboard
            renderPage("dashboard");
        }
    });
}

function logout(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("eduUser");
    localStorage.removeItem("eduLoggedIn");
    sessionStorage.removeItem("eduUser");
    sessionStorage.removeItem("eduLoggedIn");
    location.reload();
}

function toggleUserDropdown() {
    const menu = document.getElementById("userDropdownMenu");
    if (menu) menu.classList.toggle("d-none");
}

// Close dropdown on outside click
document.addEventListener("click", function(e) {
    const pill = document.getElementById("userProfilePill");
    const menu = document.getElementById("userDropdownMenu");
    if (menu && !menu.classList.contains("d-none") && pill && !pill.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add("d-none");
    }
});

// Change Password Modal Handlers
function openChangePasswordModal(e) {
    if (e) e.preventDefault();
    document.getElementById("userDropdownMenu")?.classList.add("d-none");
    document.getElementById("changePasswordModal")?.classList.add("active");
    document.getElementById("passwordChangeError").textContent = "";
    document.getElementById("changePasswordForm")?.reset();
}

function closeChangePasswordModal() {
    document.getElementById("changePasswordModal")?.classList.remove("active");
}

function initAuth() {
    const loginForm = document.getElementById("loginForm");
    const passwordToggle = document.getElementById("passwordToggle");
    const logoutBtn = document.getElementById("logoutBtn");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    const changePasswordForm = document.getElementById("changePasswordForm");

    // Check existing session
    const storedUser = getCurrentUser();
    if (storedUser) {
        showApp();
    }

    // Login Form Submit Event
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const userId = document.getElementById("loginUserId").value.trim();
            const password = document.getElementById("loginPassword").value;
            const remember = document.getElementById("rememberMe")?.checked;
            const errorElement = document.getElementById("loginError");
            errorElement.textContent = "Authenticating...";

            const result = await API.login(userId, password);

            if (result && result.success) {
                currentUser = {
                    id: result.id,
                    role: result.role,
                    display_name: result.display_name,
                    linked_student_id: result.linked_student_id,
                    subjects: result.subjects,
                    extra_roles: result.extra_roles
                };

                const userJSON = JSON.stringify(currentUser);
                if (remember) {
                    localStorage.setItem("eduUser", userJSON);
                    localStorage.setItem("eduLoggedIn", "true");
                } else {
                    sessionStorage.setItem("eduUser", userJSON);
                    sessionStorage.setItem("eduLoggedIn", "true");
                }

                errorElement.textContent = "";
                showApp();
            } else {
                errorElement.textContent = result?.message || "Invalid User ID or password. Please try again.";
            }
        });
    }

    // Toggle Password Visibility
    if (passwordToggle) {
        passwordToggle.addEventListener("click", function() {
            const passwordInput = document.getElementById("loginPassword");
            const icon = this.querySelector("i");
            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.className = "bi bi-eye-slash";
            } else {
                passwordInput.type = "password";
                icon.className = "bi bi-eye";
            }
        });
    }

    // Forgot password link
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener("click", function(e) {
            e.preventDefault();
            const idInput = document.getElementById("loginUserId")?.value.trim() || "your account";
            alert(`Temporary password recovery link has been dispatched to the registered institutional email for [${idInput}]. Please check your inbox.`);
        });
    }

    // Change password form
    if (changePasswordForm) {
        changePasswordForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const user = getCurrentUser();
            if (!user) return;

            const currentPw = document.getElementById("currentPasswordInput").value;
            const newPw = document.getElementById("newPasswordInput").value;
            const confirmPw = document.getElementById("confirmPasswordInput").value;
            const errEl = document.getElementById("passwordChangeError");

            if (newPw !== confirmPw) {
                errEl.textContent = "New password and confirmation do not match.";
                return;
            }

            const res = await API.changePassword(user.id, currentPw, newPw);
            if (res && res.success) {
                alert("Password updated successfully! Please keep it secure.");
                closeChangePasswordModal();
            } else {
                errEl.textContent = res?.message || "Failed to update password. Verify current password.";
            }
        });
    }

    // Logout Button
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
}
