/* =====================================================
   MAIN.JS
   Application Router, Navigation, Global Search & Event Handlers
===================================================== */

function renderPage(page) {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Security check: if student tries to access restricted pages, redirect to dashboard or 360
    if (role === "student" && ["students", "engagement", "mentor", "anomalies", "reports", "settings", "users"].includes(page)) {
        page = "dashboard";
    }

    // Toggle global search bar visibility (some pages like Settings, Reports, AI Agent don't need it)
    const searchContainer = document.getElementById("topSearchContainer");
    if (searchContainer) {
        if (["settings", "reports", "users", "aiagent"].includes(page)) {
            searchContainer.style.opacity = "0.4";
            searchContainer.style.pointerEvents = "none";
        } else {
            searchContainer.style.opacity = "1";
            searchContainer.style.pointerEvents = "auto";
        }
    }

    switch (page) {
        case "dashboard":
            renderDashboard();
            break;
        case "students":
            renderStudents();
            break;
        case "analytics":
            renderAnalytics();
            break;
        case "engagement":
            renderEngagement();
            break;
        case "mentor":
            renderMentor();
            break;
        case "anomalies":
            renderAnomalies();
            break;
        case "student360":
            renderStudent360();
            break;
        case "aiagent":
            renderAIAgent();
            break;
        case "notifications":
            renderNotifications();
            break;
        case "reports":
            renderReports();
            break;
        case "settings":
            renderSettings();
            break;
        case "users":
            renderUsers();
            break;
        default:
            renderDashboard();
    }
}

function navigateTo(page) {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.page === page) {
            item.classList.add("active");
        }
    });
    renderPage(page);
}

// Global search bar autocomplete & jump
function initGlobalSearch() {
    const searchInput = document.getElementById("globalSearch");
    const resultsContainer = document.getElementById("globalSearchResults");

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener("input", function() {
        const query = this.value.trim().toLowerCase();
        if (!query) {
            resultsContainer.classList.add("d-none");
            resultsContainer.innerHTML = "";
            return;
        }

        const matches = students.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            (s.course && s.course.toLowerCase().includes(query)) ||
            (s.place && s.place.toLowerCase().includes(query))
        );

        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div class="p-3 text-muted small text-center"><i class="bi bi-search me-1"></i> No matching students found</div>`;
            resultsContainer.classList.remove("d-none");
            return;
        }

        resultsContainer.innerHTML = matches.slice(0, 6).map(s => {
            const riskClass = s.risk >= 60 ? "text-danger" : (s.risk >= 30 ? "text-warning" : "text-success");
            return `
                <div class="search-item" onclick="selectSearchResult('${s.id}')">
                    <div>
                        <strong>${s.name}</strong>
                        <span class="text-muted ms-2 small">(${s.id}) • ${s.course}</span>
                    </div>
                    <div class="small fw-semibold ${riskClass}">
                        ${s.risk}% Risk
                    </div>
                </div>
            `;
        }).join("");
        resultsContainer.classList.remove("d-none");
    });

    // Close search dropdown on clicking outside
    document.addEventListener("click", function(e) {
        if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.add("d-none");
        }
    });
}

function selectSearchResult(studentId) {
    const resultsContainer = document.getElementById("globalSearchResults");
    const searchInput = document.getElementById("globalSearch");
    if (resultsContainer) resultsContainer.classList.add("d-none");
    if (searchInput) searchInput.value = "";

    if (typeof viewStudent360 === "function") {
        viewStudent360(studentId);
    }
}

// User Management Page (Admin only)
async function renderUsers() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const userList = await API.getUsers() || [];

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">👑 User Access Control & Personas</h1>
                <p class="text-muted small mb-0">Manage Faculty, Mentors, and Student accounts and subject assignments</p>
            </div>
            <button class="primary-btn" onclick="openAddUserModal()">
                <i class="bi bi-person-plus-fill"></i> Add Account
            </button>
        </div>

        <div class="card-box p-4">
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Display Name</th>
                            <th>Role</th>
                            <th>Assigned Subjects</th>
                            <th>Additional Roles / Responsibilities</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${userList.map(u => {
                            let roleBadge = u.role === 'admin' ? 'bg-dark' : (u.role === 'faculty' ? 'bg-primary' : (u.role === 'mentor' ? 'bg-info' : 'bg-secondary'));
                            return `
                                <tr>
                                    <td><strong>${u.id}</strong></td>
                                    <td>${u.display_name || u.id}</td>
                                    <td><span class="badge ${roleBadge}">${u.role.toUpperCase()}</span></td>
                                    <td><code>${u.subjects || 'N/A'}</code></td>
                                    <td><small class="text-muted">${u.extra_roles || 'None'}</small></td>
                                    <td>
                                        ${u.id === 'admin' ? '<span class="badge bg-light text-dark">Protected</span>' : `
                                            <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteUser('${u.id}')">
                                                <i class="bi bi-trash"></i> Delete
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- ADD USER MODAL -->
        <div id="addUserModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 500px;">
                <div class="modal-head">
                    <div>
                        <span>SYSTEM ACCESS</span>
                        <h2>Create User Account</h2>
                    </div>
                    <button class="modal-close" onclick="closeAddUserModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="addUserForm" class="p-3">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">User ID / Username</label>
                        <input type="text" id="newUserId" class="form-control" placeholder="e.g. FAC004 or MEN003" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Display Name</label>
                        <input type="text" id="newUserDisplayName" class="form-control" placeholder="e.g. Dr. Jane Smith" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Role</label>
                        <select id="newUserRole" class="form-select">
                            <option value="faculty">Faculty</option>
                            <option value="mentor">Mentor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Assigned Subjects (Codes separated by comma)</label>
                        <input type="text" id="newUserSubjects" class="form-control" placeholder="e.g. CS201,CS202,MA201">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Additional Responsibilities (Optional)</label>
                        <input type="text" id="newUserExtraRoles" class="form-control" placeholder="e.g. Class Teacher, Coordinator, HOD">
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeAddUserModal()">Cancel</button>
                        <button type="submit" class="primary-btn">Create User</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Bind add user form
    const form = document.getElementById("addUserForm");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            const payload = {
                id: document.getElementById("newUserId").value.trim(),
                display_name: document.getElementById("newUserDisplayName").value.trim(),
                role: document.getElementById("newUserRole").value,
                subjects: document.getElementById("newUserSubjects").value.trim(),
                extra_roles: document.getElementById("newUserExtraRoles").value.trim()
            };
            const res = await API.createUser(payload);
            if (res && res.success) {
                alert(`User account ${payload.id} created successfully!`);
                closeAddUserModal();
                renderUsers();
            } else {
                alert(res?.message || "Failed to create user account.");
            }
        });
    }
}

function openAddUserModal() {
    document.getElementById("addUserModal")?.classList.add("active");
}
function closeAddUserModal() {
    document.getElementById("addUserModal")?.classList.remove("active");
}
async function handleDeleteUser(userId) {
    if (confirm(`Are you sure you want to delete user account "${userId}"?`)) {
        const res = await API.deleteUser(userId);
        if (res && res.success) {
            alert(`User ${userId} deleted.`);
            renderUsers();
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Initialize Auth Session & Event Listeners
    initAuth();

    // Initialize Global Search
    initGlobalSearch();

    // Initialize Add Student Modal
    if (typeof initStudentModalEvents === "function") {
        initStudentModalEvents();
    }

    // Sidebar navigation click handler
    document.querySelectorAll(".nav-item").forEach(button => {
        button.addEventListener("click", function() {
            const page = this.dataset.page;
            navigateTo(page);
            if (window.innerWidth <= 750) {
                document.getElementById("sidebar")?.classList.remove("mobile-open");
            }
        });
    });

    // Sidebar collapse toggle button
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function() {
            const sidebar = document.getElementById("sidebar");
            if (window.innerWidth <= 750) {
                sidebar.classList.toggle("mobile-open");
            } else {
                sidebar.classList.toggle("collapsed");
            }
        });
    }

    // Topbar Notifications button click
    const notificationBtn = document.getElementById("notificationButton");
    if (notificationBtn) {
        notificationBtn.addEventListener("click", function() {
            navigateTo("notifications");
        });
    }

    // Keyboard shortcut (Ctrl + K or Cmd + K) for quick search focus
    document.addEventListener("keydown", function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            document.getElementById("globalSearch")?.focus();
        }
    });
});
