/* =====================================================
   AUTH.JS
   Login, Authentication & Session Handling
===================================================== */

// Global state holding active students array
let students = [
    { id: "25CS001", name: "V.Sri Udbhav", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 8.2, credits: 24, attendance: 82, lms_score: 88, risk: 18, father: "Ramesh Kumar", mother: "Lakshmi Kumar", motherTongue: "Telugu", region: "South India", place: "Hyderabad", country: "India" },
    { id: "25CS002", name: "Y.Hemanth Reddy", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 7.4, credits: 23, attendance: 68, lms_score: 60, risk: 55, father: "Reddy Kumar", mother: "Padma", motherTongue: "Telugu", region: "South India", place: "Vijayawada", country: "India" },
    { id: "25CS003", name: "T.Gopi", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 7.8, credits: 22, attendance: 73, lms_score: 70, risk: 42, father: "Srinivas", mother: "Anitha", motherTongue: "Telugu", region: "South India", place: "Guntur", country: "India" },
    { id: "25CS004", name: "Sneha Rao", gender: "Female", course: "CSE", year: "2nd Year", cgpa: 8.7, credits: 25, attendance: 91, lms_score: 95, risk: 8, father: "Rao Kumar", mother: "Sunitha", motherTongue: "Telugu", region: "South India", place: "Hyderabad", country: "India" },
    { id: "25CS005", name: "Arjun Patel", gender: "Male", course: "CSE", year: "2nd Year", cgpa: 6.9, credits: 20, attendance: 61, lms_score: 50, risk: 72, father: "Mahesh Patel", mother: "Kavitha", motherTongue: "Hindi", region: "West India", place: "Mumbai", country: "India" }
];

// Helper to refresh student list from backend SQLite database if online
async function loadLatestStudents() {
    const liveData = await API.getStudents();
    if (liveData && liveData.length > 0) {
        students = liveData;
    }
}

function showApp() {
    const loginPage = document.getElementById("loginPage");
    const app = document.getElementById("app");

    if (loginPage) loginPage.classList.add("d-none");
    if (app) app.classList.remove("d-none");

    loadLatestStudents().then(() => {
        if (typeof renderPage === "function") {
            renderPage("dashboard");
        }
    });
}

function logout() {
    localStorage.removeItem("eduLoggedIn");
    sessionStorage.removeItem("eduLoggedIn");
    location.reload();
}

function initAuth() {
    const loginForm = document.getElementById("loginForm");
    const passwordToggle = document.getElementById("passwordToggle");
    const logoutBtn = document.getElementById("logoutBtn");

    // Check existing session
    if (localStorage.getItem("eduLoggedIn") === "true" || sessionStorage.getItem("eduLoggedIn") === "true") {
        showApp();
    }

    // Login Form Submit Event
    if (loginForm) {
        loginForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value;
            const remember = document.getElementById("rememberMe").checked;
            const errorElement = document.getElementById("loginError");

            // Try backend authentication first, fall back to local check for demo speed
            const result = await API.login(email, password);

            if (result && result.success) {
                if (remember) localStorage.setItem("eduLoggedIn", "true");
                else sessionStorage.setItem("eduLoggedIn", "true");
                showApp();
            } else if (email === "info@vignan.ac.in" && password === "vucse") {
                // Client side demo fallback
                if (remember) localStorage.setItem("eduLoggedIn", "true");
                else sessionStorage.setItem("eduLoggedIn", "true");
                showApp();
            } else {
                errorElement.textContent = result.message || "Invalid email or password.";
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

    // Logout Event Listener
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
}
