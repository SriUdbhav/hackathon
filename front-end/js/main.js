/* =====================================================
   MAIN.JS
   Application Router, Navigation, Global Search & Event Handlers
===================================================== */

function renderPage(page) {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Security check: if student tries to access restricted pages, redirect to dashboard
    if (role === "student" && ["students", "engagement", "mentor", "anomalies", "reports", "settings", "users"].includes(page)) {
        page = "dashboard";
    }

    // Toggle global search bar visibility
    const searchContainer = document.getElementById("topSearchContainer");
    if (searchContainer) {
        if (role === "student") {
            searchContainer.classList.add("d-none");
        } else if (["settings", "reports", "users", "aiagent", "profile"].includes(page)) {
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
        case "profile":
            renderProfile();
            break;
        case "users":
            renderUsers();
            break;
        default:
            renderDashboard();
    }
}

let currentActivePage = "dashboard";

function navigateTo(page) {
    currentActivePage = page;
    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.page === page) {
            item.classList.add("active");
        }
    });
    renderPage(page);
}

// Global search bar autocomplete & jump with fuzzy matching & regex
function initGlobalSearch() {
    const searchInput = document.getElementById("globalSearch");
    const resultsContainer = document.getElementById("globalSearchResults");

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener("input", function() {
        const user = getCurrentUser();
        const role = (user?.role || "").toLowerCase();
        if (role === "student") {
            // Privacy protection
            resultsContainer.classList.add("d-none");
            return;
        }

        const rawQuery = this.value.trim();
        const query = rawQuery.toLowerCase();
        if (!query) {
            resultsContainer.classList.add("d-none");
            resultsContainer.innerHTML = "";
            return;
        }

        // Search matching: direct contains + fuzzy match
        let matches = [];

        // Check if query looks like regex (starts with /)
        if (rawQuery.startsWith('/') && rawQuery.length > 1) {
            try {
                const regexPattern = rawQuery.slice(1);
                const reg = new RegExp(regexPattern, 'i');
                matches = students.filter(s =>
                    reg.test(s.name) || reg.test(s.id) || reg.test(s.course || '') || reg.test(s.place || '')
                );
            } catch (e) {
                matches = [];
            }
        } else {
            matches = students.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.id.toLowerCase().includes(query) ||
                (s.course && s.course.toLowerCase().includes(query)) ||
                (s.place && s.place.toLowerCase().includes(query)) ||
                fuzzyMatch(query, s.name.toLowerCase()) ||
                fuzzyMatch(query, s.id.toLowerCase())
            );
        }

        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div class="p-3 text-muted small text-center"><i class="bi bi-search me-1"></i> No matching students found</div>`;
            resultsContainer.classList.remove("d-none");
            return;
        }

        resultsContainer.innerHTML = matches.slice(0, 8).map(s => {
            const riskClass = s.risk >= 60 ? "text-danger" : (s.risk >= 30 ? "text-warning" : "text-success");
            const displayName = highlightMatch(s.name, query.startsWith('/') ? query.slice(1) : query);
            return `
                <div class="search-item" onclick="selectSearchResult('${s.id}')">
                    <div>
                        <strong>${displayName}</strong>
                        <span class="text-muted ms-2 small">(${s.id}) • ${s.course || 'CSE'} • Attd: ${s.attendance}%</span>
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

// =====================================================
// USER MANAGEMENT, PENDING SIGNUPS & EMAIL AUDIT (Admin Only)
// =====================================================

let currentUsersTab = "active";
let currentRejectingReqId = null;

async function renderUsers() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const userList = await API.getUsers() || [];
    const signupRequests = await API.getSignupRequests() || [];
    const emailLogs = await API.getEmailLogs() || [];

    const pendingRequests = signupRequests.filter(r => r.status === "Pending");

    content.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">User Access & Institutional Approval Queue</h1>
                <p class="text-muted small mb-0">Manage Active Faculty/Mentor Accounts, Review Pending Signups, and Audit Email Dispatches</p>
            </div>
            <div class="d-flex gap-2">
                <button class="secondary-btn" onclick="openImportUsersModal()">
                    <i class="bi bi-file-earmark-arrow-up text-success"></i> Bulk Import CSV
                </button>
                <button class="primary-btn" onclick="openAddUserModal()">
                    <i class="bi bi-person-plus-fill"></i> Add Account Directly
                </button>
            </div>
        </div>

        <!-- TAB NAVIGATION -->
        <div class="d-flex gap-2 mb-4 border-bottom pb-2">
            <button class="btn ${currentUsersTab === 'active' ? 'btn-primary' : 'btn-outline-secondary'} btn-sm d-flex align-items-center gap-2" onclick="switchUsersTab('active')">
                <i class="bi bi-people"></i> Active Accounts <span class="badge" style="background: var(--bg-sunken); color: var(--text);">${userList.length}</span>
            </button>
            <button class="btn ${currentUsersTab === 'pending' ? 'btn-warning text-dark' : 'btn-outline-secondary'} btn-sm d-flex align-items-center gap-2 position-relative" onclick="switchUsersTab('pending')">
                <i class="bi bi-person-lines-fill"></i> Pending Registrations
                <span class="badge ${pendingRequests.length > 0 ? 'bg-danger text-white' : 'bg-secondary'}">${pendingRequests.length}</span>
            </button>
            <button class="btn ${currentUsersTab === 'emails' ? 'btn-dark' : 'btn-outline-secondary'} btn-sm d-flex align-items-center gap-2" onclick="switchUsersTab('emails')">
                <i class="bi bi-envelope-check"></i> Email Dispatch Log <span class="badge bg-secondary">${emailLogs.length}</span>
            </button>
        </div>

        <!-- 1. ACTIVE ACCOUNTS TAB -->
        <div id="usersTabActive" class="${currentUsersTab === 'active' ? '' : 'd-none'}">
            <div class="card-box p-4">
                <div class="table-responsive">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Display Name</th>
                                <th>Role</th>
                                <th>Email & Phone</th>
                                <th>Assigned Subjects</th>
                                <th>Responsibilities</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${userList.map(u => `
                                <tr>
                                    <td><code>${u.id}</code></td>
                                    <td><strong>${u.display_name || u.id}</strong></td>
                                    <td>
                                        <span class="badge ${u.role === 'admin' ? 'bg-dark' : (u.role === 'faculty' ? 'bg-primary' : (u.role === 'mentor' ? 'bg-info text-dark' : 'bg-secondary'))}">
                                            ${(u.role || 'user').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="small">
                                            ${u.email ? `<div><i class="bi bi-envelope me-1" style="color: var(--accent);"></i>${u.email}</div>` : ''}
                                            ${u.phone ? `<div><i class="bi bi-telephone me-1" style="color: var(--text-muted);"></i>${u.phone}</div>` : ''}
                                            ${!u.email && !u.phone ? '<span class="text-muted">N/A</span>' : ''}
                                        </div>
                                    </td>
                                    <td>${u.subjects || '<span class="text-muted">None</span>'}</td>
                                    <td>${u.extra_roles || '<span class="text-muted">None</span>'}</td>
                                    <td>
                                        ${u.id === 'admin' ? '<span class="badge bg-secondary">System Protected</span>' : `
                                            <button class="btn btn-outline-danger btn-sm" onclick="handleDeleteUser('${u.id}')" title="Delete User">
                                                <i class="bi bi-trash3"></i>
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- 2. PENDING SIGNUP REQUESTS TAB -->
        <div id="usersTabPending" class="${currentUsersTab === 'pending' ? '' : 'd-none'}">
            <div class="card-box p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-shield-exclamation text-warning me-2"></i> Pending Faculty & Mentor Applications
                    </h4>
                    <span class="badge bg-warning text-dark">${pendingRequests.length} Awaiting Verification</span>
                </div>
                <p class="small mb-4" style="color: var(--text-soft);">
                    Review applicants and cross-check their institutional ID against departmental records. Upon approval, their account will be activated and credentials emailed automatically.
                </p>

                ${pendingRequests.length === 0 ? `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                        <h5>No Pending Registrations</h5>
                        <p class="small">All applicant requests have been reviewed and processed.</p>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Application ID</th>
                                    <th>Applicant Name</th>
                                    <th>Requested Role</th>
                                    <th>Proposed User ID</th>
                                    <th>Contact Info</th>
                                    <th>Subjects & Roles</th>
                                    <th>Submission Date</th>
                                    <th>Admin Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pendingRequests.map(r => `
                                    <tr>
                                        <td>#REQ-${r.id}</td>
                                        <td><strong>${r.display_name}</strong></td>
                                        <td>
                                            <span class="badge ${r.role === 'faculty' ? 'bg-primary' : 'bg-info text-dark'}">
                                                ${r.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td><code>${r.user_id}</code></td>
                                        <td>
                                            <div class="small">
                                                <div><i class="bi bi-envelope me-1" style="color: var(--accent);"></i>${r.email}</div>
                                                <div><i class="bi bi-telephone me-1" style="color: var(--text-muted);"></i>${r.phone}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <small class="d-block"><strong>Subj:</strong> ${r.subjects || 'None'}</small>
                                            <small class="d-block text-muted"><strong>Roles:</strong> ${r.extra_roles || 'None'}</small>
                                        </td>
                                        <td><small class="text-muted">${r.created_at ? r.created_at.slice(0, 16).replace('T', ' ') : 'N/A'}</small></td>
                                        <td>
                                            ${r.status === 'Pending' ? `
                                                <div class="btn-group btn-group-sm">
                                                    <button class="btn btn-success btn-sm d-flex align-items-center gap-1" onclick="handleApproveSignup(${r.id}, '${r.display_name}', '${r.email}')" title="Approve & Send Credentials">
                                                        <i class="bi bi-check-circle-fill"></i> Approve
                                                    </button>
                                                    <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onclick="openRejectModal(${r.id}, '${r.display_name}', '${r.user_id}', '${r.email}')" title="Reject with Reason">
                                                        <i class="bi bi-x-circle"></i> Reject
                                                    </button>
                                                </div>
                                            ` : `
                                                <span class="small text-muted"><i class="bi bi-clock me-1"></i> Reviewed: ${r.reviewed_at || 'Completed'}</span>
                                            `}
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>

        <!-- 3. EMAIL DISPATCH AUDIT LOG TAB -->
        <div id="usersTabEmails" class="${currentUsersTab === 'emails' ? '' : 'd-none'}">
            <div class="card-box p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4 class="fw-bold mb-0 text-dark">
                        <i class="bi bi-envelope-paper text-primary me-2"></i> Dispatched Email Notifications Audit
                    </h4>
                    <span class="badge bg-secondary">${emailLogs.length} Logged</span>
                </div>
                <p class="small mb-4" style="color: var(--text-soft);">
                    Audit trail of all credential dispatches and application acceptance/rejection notices sent to faculty and mentors.
                </p>

                ${emailLogs.length === 0 ? `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-envelope-open fs-1 d-block mb-3"></i>
                        <h5>No Emails Logged Yet</h5>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Recipient</th>
                                    <th>Email Subject</th>
                                    <th>Type</th>
                                    <th>Sent At</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${emailLogs.map(em => `
                                    <tr>
                                        <td><strong>${em.recipient}</strong></td>
                                        <td>${em.subject}</td>
                                        <td><span class="badge ${em.email_type === 'Account Approved' ? 'bg-success' : 'bg-danger'}">${em.email_type}</span></td>
                                        <td><small class="text-muted">${new Date(em.sent_at).toLocaleString()}</small></td>
                                        <td>
                                            <button class="btn btn-sm btn-outline-primary" onclick="openEmailPreview(${em.id})">
                                                <i class="bi bi-eye"></i> View Email
                                            </button>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>

        <!-- ADD USER MODAL (Direct Admin Creation) -->
        <div id="addUserModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span>SYSTEM ACCESS</span>
                        <h2>Create User Account Directly</h2>
                    </div>
                    <button class="modal-close" onclick="closeAddUserModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="addUserForm" class="p-3">
                    <div class="p-2 mb-3 bg-light rounded border small text-muted">
                        <i class="bi bi-info-circle text-primary me-1"></i>
                        <strong>Manual Entry Required:</strong> All fields must be entered manually. Enter <code>0</code> for numerical fields and <code>Unknown</code> for text fields if data is unavailable.
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">User ID / Username <span class="text-danger">*</span></label>
                            <input type="text" id="newUserId" class="form-control" placeholder="e.g. FAC004" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Display Name <span class="text-danger">*</span></label>
                            <input type="text" id="newUserDisplayName" class="form-control" placeholder="e.g. Dr. Jane Smith" required>
                        </div>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Institutional Email <span class="text-danger">*</span></label>
                            <input type="email" id="newUserEmail" class="form-control" placeholder="jane@vignan.ac.in (or Unknown)" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Phone Number <span class="text-danger">*</span></label>
                            <input type="tel" id="newUserPhone" class="form-control" placeholder="+91 90000 00000 (or Unknown)" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Role <span class="text-danger">*</span></label>
                        <select id="newUserRole" class="form-select" required>
                            <option value="" disabled selected>-- Select Role --</option>
                            <option value="faculty">Faculty</option>
                            <option value="mentor">Mentor</option>
                            <option value="admin">Administrator</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Assigned Subjects <span class="text-danger">*</span></label>
                        <input type="text" id="newUserSubjects" class="form-control" placeholder="e.g. CS201, CS202 (or Unknown)" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Additional Responsibilities <span class="text-danger">*</span></label>
                        <input type="text" id="newUserExtraRoles" class="form-control" placeholder="e.g. Class Teacher, Lab Incharge (or Unknown)" required>
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeAddUserModal()">Cancel</button>
                        <button type="submit" class="primary-btn">Create User</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- IMPORT USERS MODAL -->
        <div id="importUsersModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span>ADMINISTRATIVE IMPORT</span>
                        <h2>Bulk Import Users (Faculty / Mentors)</h2>
                    </div>
                    <button class="modal-close" onclick="closeImportUsersModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <p class="text-muted small mb-3">
                        Upload a <code>.csv</code> or <code>.xlsx</code> file containing columns: <strong>id</strong>, <strong>role</strong> (faculty/mentor), <strong>display_name</strong>, <strong>email</strong>, <strong>phone</strong>, <strong>subjects</strong>, <strong>extra_roles</strong>.
                    </p>
                    <div class="mb-3">
                        <input type="file" id="userImportFileInput" class="form-control" accept=".csv, .xlsx, .xls">
                    </div>
                    <div id="userImportProgress" class="d-none mb-3">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span class="small text-muted">Processing and importing accounts...</span>
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeImportUsersModal()">Cancel</button>
                        <button type="button" class="primary-btn" onclick="handleImportUsersSubmit()">
                            <i class="bi bi-upload me-1"></i> Upload & Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Store email logs globally for quick preview
    window._cachedEmailLogs = emailLogs;

    // Bind add user form
    const form = document.getElementById("addUserForm");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();

            const newId = (document.getElementById("newUserId")?.value || "").trim();
            const displayName = (document.getElementById("newUserDisplayName")?.value || "").trim();
            const email = (document.getElementById("newUserEmail")?.value || "").trim();
            const phone = (document.getElementById("newUserPhone")?.value || "").trim();
            const role = (document.getElementById("newUserRole")?.value || "").trim();
            const subjects = (document.getElementById("newUserSubjects")?.value || "").trim();
            const extraRoles = (document.getElementById("newUserExtraRoles")?.value || "").trim();

            if (!newId || !displayName || !email || !phone || !role || !subjects || !extraRoles) {
                alert("All fields are required. If information is not available, please enter 'Unknown' or '0' for numerical metrics.");
                return;
            }

            const payload = {
                id: newId,
                display_name: displayName,
                email: email,
                phone: phone,
                role: role,
                subjects: subjects,
                extra_roles: extraRoles
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

function switchUsersTab(tab) {
    currentUsersTab = tab;
    renderUsers();
}

async function handleApproveSignup(reqId, name, email) {
    if (!confirm(`Approve registration application for "${name}"?\n\nThis will activate their account and dispatch a welcome email with credentials to ${email}.`)) {
        return;
    }

    const res = await API.approveSignupRequest(reqId);
    if (res && res.success) {
        alert(res.message);
        renderUsers();
    } else {
        alert(res?.message || "Failed to approve registration.");
    }
}

function openRejectModal(reqId, name, userId, email) {
    currentRejectingReqId = reqId;
    document.getElementById("rejectApplicantName").textContent = name;
    document.getElementById("rejectApplicantId").textContent = userId;
    document.getElementById("rejectApplicantEmail").textContent = email;
    document.getElementById("rejectionReasonText").value = "";
    document.getElementById("rejectPresetSelect").value = "";
    document.getElementById("rejectionReasonModal")?.classList.add("active");
}

function closeRejectionModal() {
    currentRejectingReqId = null;
    document.getElementById("rejectionReasonModal")?.classList.remove("active");
}

function applyRejectPreset(val) {
    if (val) {
        document.getElementById("rejectionReasonText").value = val;
    }
}

async function submitRejectionAction() {
    if (!currentRejectingReqId) return;

    const reason = document.getElementById("rejectionReasonText").value.trim();
    if (!reason) {
        alert("Please enter or select a specific reason for rejection.");
        return;
    }

    const res = await API.rejectSignupRequest(currentRejectingReqId, reason);
    if (res && res.success) {
        alert(res.message);
        closeRejectionModal();
        renderUsers();
    } else {
        alert(res?.message || "Failed to reject registration.");
    }
}

function openEmailPreview(emailId) {
    const logs = window._cachedEmailLogs || [];
    const em = logs.find(x => x.id === emailId);
    if (!em) return;

    document.getElementById("emailModalRecipient").textContent = em.recipient;
    document.getElementById("emailModalType").textContent = em.email_type;
    document.getElementById("emailModalType").className = `badge ${em.email_type === 'Account Approved' ? 'bg-success' : 'bg-danger'}`;
    document.getElementById("emailModalDate").textContent = new Date(em.sent_at).toLocaleString();
    document.getElementById("emailModalSubject").textContent = em.subject;
    document.getElementById("emailModalBody").innerHTML = em.body_html || em.body_text || "<p>No content</p>";

    document.getElementById("emailPreviewModal")?.classList.add("active");
}

function closeEmailPreviewModal() {
    document.getElementById("emailPreviewModal")?.classList.remove("active");
}

function openAddUserModal() {
    document.getElementById("addUserModal")?.classList.add("active");
}
function closeAddUserModal() {
    document.getElementById("addUserModal")?.classList.remove("active");
}

function openImportUsersModal() {
    document.getElementById("importUsersModal")?.classList.add("active");
}
function closeImportUsersModal() {
    document.getElementById("importUsersModal")?.classList.remove("active");
}

async function handleImportUsersSubmit() {
    const fileInput = document.getElementById("userImportFileInput");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please select a CSV or Excel file to import.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const progress = document.getElementById("userImportProgress");
    if (progress) progress.classList.remove("d-none");

    const res = await API.importUsersCSV(formData);
    if (progress) progress.classList.add("d-none");

    if (res && res.success) {
        alert(`Successfully imported ${res.imported} users! (${res.skipped} skipped).`);
        closeImportUsersModal();
        renderUsers();
    } else {
        alert(res?.message || "Failed to import users. Please check file format.");
    }
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
        const user = getCurrentUser();
        const role = (user?.role || "").toLowerCase();
        if (role !== "student" && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            document.getElementById("globalSearch")?.focus();
        }
    });
});
