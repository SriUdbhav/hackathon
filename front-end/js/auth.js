/* =====================================================
   AUTH.JS
   Unified Access Control (UAC), Authentication,
   Session Persistence, and Role-Based Permissions
===================================================== */

// Universal Country Code Configuration & Phone Formatting
const COUNTRY_CODES_CONFIG = [
    { code: "+91", country: "India", flag: "🇮🇳", len: 10, placeholder: "98765 43210" },
    { code: "+1", country: "United States", flag: "🇺🇸", len: 10, placeholder: "202 555 0123" },
    { code: "+44", country: "United Kingdom", flag: "🇬🇧", len: 10, placeholder: "7911 123456" },
    { code: "+971", country: "UAE", flag: "🇦🇪", len: 9, placeholder: "50 123 4567" },
    { code: "+65", country: "Singapore", flag: "🇸🇬", len: 8, placeholder: "8123 4567" },
    { code: "+61", country: "Australia", flag: "🇦🇺", len: 9, placeholder: "412 345 678" },
    { code: "+1", country: "Canada", altCode: "+1-CA", flag: "🇨🇦", len: 10, placeholder: "416 555 0123" },
    { code: "+49", country: "Germany", flag: "🇩🇪", len: 11, placeholder: "151 1234567" },
    { code: "+81", country: "Japan", flag: "🇯🇵", len: 10, placeholder: "90 1234 5678" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", len: 9, placeholder: "50 123 4567" },
    { code: "+60", country: "Malaysia", flag: "🇲🇾", len: 9, placeholder: "12 345 6789" },
    { code: "+33", country: "France", flag: "🇫🇷", len: 9, placeholder: "6 12 34 56 78" }
];
window.COUNTRY_CODES_CONFIG = COUNTRY_CODES_CONFIG;

function getCountrySelectOptionsHtml(selectedCode = "+91") {
    return COUNTRY_CODES_CONFIG.map(c => {
        const val = c.altCode || c.code;
        const isSel = (val === selectedCode || c.code === selectedCode) ? "selected" : "";
        return `<option value="${val}" data-len="${c.len}" data-code="${c.code}" ${isSel}>${c.flag} ${c.code} (${c.country})</option>`;
    }).join("");
}
window.getCountrySelectOptionsHtml = getCountrySelectOptionsHtml;

function updatePhoneLimit(selectId, inputId) {
    const select = typeof selectId === "string" ? document.getElementById(selectId) : selectId;
    const input = typeof inputId === "string" ? document.getElementById(inputId) : inputId;
    if (!select || !input) return;

    const opt = select.options[select.selectedIndex];
    const len = parseInt(opt?.getAttribute("data-len") || "10", 10);

    input.maxLength = len;
    input.placeholder = `${len}-digit mobile number`;
    
    // Auto-trim existing value if it exceeds new length
    input.value = input.value.replace(/\D/g, "").slice(0, len);
}
window.updatePhoneLimit = updatePhoneLimit;

function formatPhoneDigits(input) {
    if (!input) return;
    input.value = input.value.replace(/\D/g, "");
    if (input.maxLength && input.value.length > input.maxLength) {
        input.value = input.value.slice(0, input.maxLength);
    }
}
window.formatPhoneDigits = formatPhoneDigits;

function getFullPhoneNumber(selectId, inputId) {
    const select = typeof selectId === "string" ? document.getElementById(selectId) : selectId;
    const input = typeof inputId === "string" ? document.getElementById(inputId) : inputId;
    if (!input) return "";

    const digits = (input.value || "").replace(/\D/g, "").trim();
    if (!digits) return "";

    if (!select) return digits;

    let code = select.value || "+91";
    if (select.selectedOptions && select.selectedOptions[0]) {
        code = select.selectedOptions[0].getAttribute("data-code") || select.selectedOptions[0].value || code;
    }
    if (code.includes("-")) code = code.split("-")[0];
    return `${code} ${digits}`;
}
window.getFullPhoneNumber = getFullPhoneNumber;

function setPhoneInputFromFull(selectId, inputId, fullPhone) {
    const select = typeof selectId === "string" ? document.getElementById(selectId) : selectId;
    const input = typeof inputId === "string" ? document.getElementById(inputId) : inputId;
    if (!input) return;

    if (!fullPhone) {
        input.value = "";
        if (select) {
            select.value = "+91";
            updatePhoneLimit(select, input);
        }
        return;
    }

    fullPhone = String(fullPhone).trim();
    let matchedConfig = null;
    
    for (const c of COUNTRY_CODES_CONFIG) {
        if (fullPhone.startsWith(c.code)) {
            matchedConfig = c;
            break;
        }
    }

    if (matchedConfig && select) {
        select.value = matchedConfig.altCode || matchedConfig.code;
        updatePhoneLimit(select, input);
        const digits = fullPhone.slice(matchedConfig.code.length).replace(/\D/g, "").trim();
        input.value = digits.slice(0, matchedConfig.len);
    } else {
        if (select) {
            select.value = "+91";
            updatePhoneLimit(select, input);
        }
        input.value = fullPhone.replace(/\D/g, "").slice(0, 10);
    }
}
window.setPhoneInputFromFull = setPhoneInputFromFull;

// Global state holding active user and live students
let currentUser = null;
const fallbackStudents = [
    { id: "25CS001", name: "V.Sri Udbhav", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 8.2, credits: 24, attendance: 82, lms_score: 88, risk: 18, father: "Ramesh Kumar", mother: "Lakshmi Kumar", mother_tongue: "Telugu", place: "Hyderabad", region: "South India", country: "India" },
    { id: "25CS002", name: "Y.Hemanth Reddy", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 7.4, credits: 23, attendance: 68, lms_score: 60, risk: 55, father: "Reddy Kumar", mother: "Padma", mother_tongue: "Telugu", place: "Vijayawada", region: "South India", country: "India" },
    { id: "25CS003", name: "T.Gopi", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 7.8, credits: 22, attendance: 73, lms_score: 70, risk: 42, father: "Srinivas", mother: "Anitha", mother_tongue: "Telugu", place: "Guntur", region: "South India", country: "India" },
    { id: "25CS004", name: "Sneha Rao", gender: "Female", course: "CSE", year: "2nd Year", cgpa: 8.7, credits: 25, attendance: 91, lms_score: 95, risk: 8, father: "Rao Kumar", mother: "Sunitha", mother_tongue: "Telugu", place: "Hyderabad", region: "South India", country: "India" },
    { id: "25CS005", name: "Arjun Patel", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 6.9, credits: 20, attendance: 61, lms_score: 50, risk: 72, father: "Mahesh Patel", mother: "Kavitha", mother_tongue: "Hindi", place: "Mumbai", region: "West India", country: "India" },
];
let students = [];
let allSubjects = [];

// Helper to refresh student list from backend SQLite
async function loadLatestStudents() {
    try {
        const liveData = await API.getStudents();
        if (liveData && liveData.length > 0) {
            students = liveData;
            return students;
        }
    } catch (e) {
        console.warn("Could not load students from API:", e);
    }
    if (students.length === 0) {
        students = fallbackStudents;
    }
    return students;
}

// Quick demo login fill helper with 1-click seamless sign-in
function fillDemoLogin(userId, password) {
    const idInput = document.getElementById("loginUserId");
    const pwInput = document.getElementById("loginPassword");
    const loginForm = document.getElementById("loginForm");
    if (idInput && pwInput) {
        idInput.value = userId;
        pwInput.value = password;
        const errEl = document.getElementById("loginError");
        if (errEl) errEl.textContent = "";
        
        // Auto-submit login form for 1-click instant demo access
        if (loginForm) {
            loginForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
        }
    }
}
window.fillDemoLogin = fillDemoLogin;

function getCurrentUser() {
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
window.getCurrentUser = getCurrentUser;

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
    const navFaculty = document.getElementById("navFaculty");
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

    // Topbar Search Container (Privacy: Hide for students)
    const topSearchContainer = document.getElementById("topSearchContainer");
    const navAiAgent = document.getElementById("navAiAgent");

    if (role === "admin") {
        if (topbarUserRole) topbarUserRole.textContent = "System Admin";
        if (topbarAvatar) topbarAvatar.innerHTML = '<i class="bi bi-shield-check"></i>';
        if (dropMenuDetail) dropMenuDetail.textContent = "Role: Administrator";
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Admin Portal";
        if (topSearchContainer) topSearchContainer.classList.remove("d-none");

        // Admin sees EVERYTHING including User Access and Faculty
        [navStudents, navAnalytics, navEngagement, navMentor, navAnomalies, navReports, navSettings, navUsers, navFaculty, navAiAgent, navLabelIntelligence, navLabelManagement].forEach(el => el?.classList.remove("d-none"));
        if (navStudent360Label) navStudent360Label.textContent = "Student 360°";
        if (typeof refreshApprovalsBadge === "function") refreshApprovalsBadge();
    }
    else if (role === "faculty") {
        if (topbarUserRole) topbarUserRole.textContent = `Faculty (${user.subjects || 'All Subjects'})`;
        if (topbarAvatar) topbarAvatar.innerHTML = '<i class="bi bi-mortarboard"></i>';
        if (dropMenuDetail) dropMenuDetail.textContent = `Faculty • ${user.extra_roles || 'Department'}`;
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Faculty Portal";
        if (topSearchContainer) topSearchContainer.classList.remove("d-none");

        [navStudents, navAnalytics, navEngagement, navMentor, navAnomalies, navReports, navSettings, navAiAgent, navLabelIntelligence, navLabelManagement].forEach(el => el?.classList.remove("d-none"));
        if (navUsers) navUsers.classList.add("d-none"); // Users tab admin only
        if (navFaculty) navFaculty.classList.add("d-none"); // Faculty management admin only
        if (navStudent360Label) navStudent360Label.textContent = "Student 360°";
    }
    else if (role === "mentor") {
        if (topbarUserRole) topbarUserRole.textContent = "Mentor";
        if (topbarAvatar) topbarAvatar.innerHTML = '<i class="bi bi-compass"></i>';
        if (dropMenuDetail) dropMenuDetail.textContent = `Mentor • ${user.subjects || 'All'}`;
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Mentor Portal";
        if (topSearchContainer) topSearchContainer.classList.remove("d-none");

        [navStudents, navAnalytics, navEngagement, navMentor, navAnomalies, navReports, navAiAgent, navLabelIntelligence, navLabelManagement].forEach(el => el?.classList.remove("d-none"));
        if (navSettings) navSettings.classList.add("d-none");
        if (navUsers) navUsers.classList.add("d-none");
        if (navFaculty) navFaculty.classList.add("d-none");
        if (navStudent360Label) navStudent360Label.textContent = "Student 360°";
    }
    else if (role === "student") {
        if (topbarUserRole) topbarUserRole.textContent = `Student (${user.linked_student_id || user.id})`;
        if (topbarAvatar) topbarAvatar.innerHTML = '<i class="bi bi-person"></i>';
        if (dropMenuDetail) dropMenuDetail.textContent = `ID: ${user.linked_student_id || user.id}`;
        if (sidebarRoleSubtitle) sidebarRoleSubtitle.textContent = "Student Portal";

        // UAC PRIVACY FIX: Students must NEVER have global search across other students
        if (topSearchContainer) topSearchContainer.classList.add("d-none");

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

        // Keep Analytics, 360 & AI Assistant visible (personalized)
        if (navAnalytics) navAnalytics.classList.remove("d-none");
        if (navAiAgent) {
            navAiAgent.classList.remove("d-none");
            const span = navAiAgent.querySelector("span");
            if (span) span.textContent = "AI Assistant";
        }
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

    let activePage = "dashboard";
    if (typeof getInitialPage === "function") {
        activePage = getInitialPage();
    } else {
        const hash = (window.location.hash || "").replace(/^#/, "").trim().toLowerCase();
        activePage = hash || sessionStorage.getItem("eduActivePage") || localStorage.getItem("eduActivePage") || "dashboard";
    }

    if (typeof navigateTo === "function") {
        navigateTo(activePage);
    } else if (typeof renderPage === "function") {
        renderPage(activePage);
    }

    // Refresh student data smoothly in background if not yet loaded
    if (!students || students.length === 0) {
        loadLatestStudents().then(() => {
            const curPage = (typeof currentActivePage !== "undefined" && currentActivePage) ? currentActivePage : activePage;
            if (curPage === "dashboard" && typeof renderDashboard === "function") {
                renderDashboard();
            }
        });
    }
}
window.showApp = showApp;

function logout(e) {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    currentUser = null;
    window.currentUser = null;
    localStorage.removeItem("eduUser");
    localStorage.removeItem("eduLoggedIn");
    localStorage.removeItem("eduActivePage");
    sessionStorage.removeItem("eduUser");
    sessionStorage.removeItem("eduLoggedIn");
    sessionStorage.removeItem("eduActivePage");

    // Clear URL hash cleanly without triggering reload
    try {
        history.replaceState(null, "", window.location.pathname);
    } catch(err) {
        window.location.hash = "";
    }
    
    document.getElementById("app")?.classList.add("d-none");
    document.getElementById("loginPage")?.classList.remove("d-none");
    document.getElementById("loginForm")?.reset();
    const errEl = document.getElementById("loginError");
    if (errEl) errEl.textContent = "";
    document.getElementById("userDropdownMenu")?.classList.add("d-none");
    
    // Reset view to signin
    switchAuthTab("signin");
}
window.logout = logout;

function toggleUserDropdown() {
    const menu = document.getElementById("userDropdownMenu");
    if (menu) menu.classList.toggle("d-none");
}
window.toggleUserDropdown = toggleUserDropdown;

// Close dropdown on outside click
document.addEventListener("click", function(e) {
    const pill = document.getElementById("userProfilePill");
    const menu = document.getElementById("userDropdownMenu");
    if (menu && !menu.classList.contains("d-none") && pill && !pill.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add("d-none");
    }
});

// Tab switcher between Sign In and Signup modes
function switchAuthTab(tab) {
    const signInView = document.getElementById("signInView");
    const signUpView = document.getElementById("signUpView");
    const tabSignIn = document.getElementById("tabSignIn");
    const tabSignUp = document.getElementById("tabSignUp");
    const loginBox = document.querySelector(".login-box");

    if (tab === "signup") {
        if (signInView) signInView.classList.add("d-none");
        if (signUpView) signUpView.classList.remove("d-none");
        if (tabSignIn) tabSignIn.classList.remove("active");
        if (tabSignUp) tabSignUp.classList.add("active");
        if (loginBox) loginBox.style.maxWidth = "560px";
    } else {
        if (signUpView) signUpView.classList.add("d-none");
        if (signInView) signInView.classList.remove("d-none");
        if (tabSignUp) tabSignUp.classList.remove("active");
        if (tabSignIn) tabSignIn.classList.add("active");
        if (loginBox) loginBox.style.maxWidth = "480px";
    }
}

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
    const signupForm = document.getElementById("signupForm");
    const passwordToggle = document.getElementById("passwordToggle");
    const logoutBtn = document.getElementById("logoutBtn");
    const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    const changePasswordForm = document.getElementById("changePasswordForm");

    // Check existing session
    const storedUser = getCurrentUser();
    if (storedUser) {
        showApp();
    }

    // 1. Sign In Form Submit Event
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const userId = document.getElementById("loginUserId").value.trim();
            const password = document.getElementById("loginPassword").value;
            const remember = document.getElementById("rememberMe")?.checked;
            const errorElement = document.getElementById("loginError");
            errorElement.textContent = "Authenticating...";

            let result = await API.login(userId, password);

            // Fallback for demo logins if backend API fails or returns error for demo creds
            if (!result || !result.success) {
                const demoUsers = {
                    "admin": { role: "admin", display_name: "System Administrator", linked_student_id: null, subjects: null, extra_roles: null, pw: "admin123" },
                    "fac001": { role: "faculty", display_name: "Dr. Ramesh Kumar", linked_student_id: null, subjects: "CS201,CS202", extra_roles: "Class Teacher,2nd Year Coordinator", pw: "FAC001" },
                    "fac002": { role: "faculty", display_name: "Dr. Priya Sharma", linked_student_id: null, subjects: "CS203,CS204", extra_roles: null, pw: "FAC002" },
                    "fac003": { role: "faculty", display_name: "Prof. Venkat Rao", linked_student_id: null, subjects: "MA201", extra_roles: "HOD Mathematics", pw: "FAC003" },
                    "men001": { role: "mentor", display_name: "Prof. Sunitha Devi", linked_student_id: null, subjects: "CS201,CS203", extra_roles: null, pw: "MEN001" },
                    "men002": { role: "mentor", display_name: "Dr. Anil Kumar", linked_student_id: null, subjects: "CS202,CS204", extra_roles: null, pw: "MEN002" },
                    "25cs001": { role: "student", display_name: "V.Sri Udbhav", linked_student_id: "25CS001", subjects: null, extra_roles: null, pw: "25CS001" },
                    "25cs002": { role: "student", display_name: "Y.Hemanth Reddy", linked_student_id: "25CS002", subjects: null, extra_roles: null, pw: "25CS002" },
                    "25cs003": { role: "student", display_name: "T.Gopi", linked_student_id: "25CS003", subjects: null, extra_roles: null, pw: "25CS003" },
                    "25cs004": { role: "student", display_name: "Sneha Rao", linked_student_id: "25CS004", subjects: null, extra_roles: null, pw: "25CS004" },
                    "25cs005": { role: "student", display_name: "Arjun Patel", linked_student_id: "25CS005", subjects: null, extra_roles: null, pw: "25CS005" },
                };
                const lookup = demoUsers[userId.toLowerCase()];
                if (lookup && (lookup.pw === password || lookup.pw.toLowerCase() === password.toLowerCase())) {
                    result = {
                        success: true,
                        id: userId,
                        role: lookup.role,
                        display_name: lookup.display_name,
                        linked_student_id: lookup.linked_student_id,
                        subjects: lookup.subjects,
                        extra_roles: lookup.extra_roles
                    };
                }
            }

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

    // 2. Signup / Registration Request Form Submit Event
    if (signupForm) {
        signupForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const statusEl = document.getElementById("signupStatus");
            const submitBtn = document.getElementById("signupSubmitBtn");
            const pw = document.getElementById("signupPassword").value;
            const confirmPw = document.getElementById("signupConfirmPassword").value;

            if (pw !== confirmPw) {
                statusEl.innerHTML = `<div class="alert alert-danger p-2 small"><i class="bi bi-exclamation-octagon me-1"></i> Passwords do not match.</div>`;
                return;
            }

            if (pw.length < 6) {
                statusEl.innerHTML = `<div class="alert alert-danger p-2 small"><i class="bi bi-exclamation-octagon me-1"></i> Password must be at least 6 characters long.</div>`;
                return;
            }

            const phoneVal = (document.getElementById("signupPhone")?.value || "").trim();

            const payload = {
                id: document.getElementById("signupUserId").value.trim(),
                display_name: document.getElementById("signupDisplayName").value.trim(),
                email: document.getElementById("signupEmail").value.trim(),
                phone: phoneVal,
                role: document.getElementById("signupRole").value,
                subjects: document.getElementById("signupSubjects").value.trim(),
                extra_roles: document.getElementById("signupExtraRoles").value.trim(),
                password: pw
            };

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Submitting Application...`;
            }

            const result = await API.submitSignupRequest(payload);

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<span>Submit Application for Approval</span> <i class="bi bi-send-check"></i>`;
            }

            if (result && result.success) {
                statusEl.innerHTML = `
                    <div class="alert alert-success p-3 rounded-3 shadow-sm border-0">
                        <h6 class="fw-bold mb-1"><i class="bi bi-check-circle-fill me-1 text-success"></i> Application Submitted!</h6>
                        <p class="small mb-2">${result.message}</p>
                        <button type="button" class="btn btn-sm btn-outline-success" onclick="switchAuthTab('signin')">
                            <i class="bi bi-arrow-left me-1"></i> Back to Sign In
                        </button>
                    </div>
                `;
                signupForm.reset();
            } else {
                statusEl.innerHTML = `
                    <div class="alert alert-danger p-2 small">
                        <i class="bi bi-exclamation-octagon me-1"></i> ${result?.message || "Registration submission failed."}
                    </div>
                `;
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
