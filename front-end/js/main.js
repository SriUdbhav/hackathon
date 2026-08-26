/* =====================================================
   MAIN.JS
   Application Router, Navigation, Global Search & Event Handlers
===================================================== */

function renderPage(page) {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Security check: if student tries to access restricted pages, redirect to dashboard
    if (role === "student" && ["students", "faculty", "engagement", "mentor", "anomalies", "reports", "settings", "users"].includes(page)) {
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
        case "faculty":
            renderFaculty();
            break;
        default:
            renderDashboard();
    }
}

function getInitialPage() {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const role = (user?.role || "faculty").toLowerCase();

    // 1. Check URL hash (e.g. #aiagent, #faculty, #students, etc.)
    const hash = (window.location.hash || "").replace(/^#/, "").trim().toLowerCase();

    // 2. Check storage if hash is not present
    let storedPage = null;
    try {
        storedPage = sessionStorage.getItem("eduActivePage") || localStorage.getItem("eduActivePage");
    } catch (e) {}

    let page = hash || storedPage || "dashboard";

    const validPages = [
        "dashboard", "students", "analytics", "engagement", "mentor",
        "anomalies", "student360", "aiagent", "notifications",
        "reports", "settings", "profile", "users", "faculty"
    ];

    if (!validPages.includes(page)) {
        page = "dashboard";
    }

    // Role-based restrictions
    if (role !== "admin" && ["users", "faculty"].includes(page)) {
        page = "dashboard";
    }
    if (role === "student" && ["students", "faculty", "engagement", "mentor", "anomalies", "reports", "settings", "users"].includes(page)) {
        page = "dashboard";
    }

    return page;
}

let currentActivePage = getInitialPage();

function navigateTo(page, updateHash = true) {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const role = (user?.role || "faculty").toLowerCase();

    if (role !== "admin" && ["users", "faculty"].includes(page)) {
        page = "dashboard";
    }
    if (role === "student" && ["students", "faculty", "engagement", "mentor", "anomalies", "reports", "settings", "users"].includes(page)) {
        page = "dashboard";
    }

    currentActivePage = page;
    try {
        sessionStorage.setItem("eduActivePage", page);
        localStorage.setItem("eduActivePage", page);
    } catch (e) {}

    if (updateHash && window.location.hash !== "#" + page) {
        window.location.hash = page;
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
        if (item.dataset.page === page) {
            item.classList.add("active");
        }
    });
    renderPage(page);
    refreshApprovalsBadge();
}

// Support browser back/forward and direct URL hash changes
window.addEventListener("hashchange", function() {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    if (!user) return;
    const hashPage = (window.location.hash || "").replace(/^#/, "").trim().toLowerCase();
    if (hashPage && hashPage !== currentActivePage) {
        navigateTo(hashPage, false);
    }
});

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

let _approvalTab = "pending"; // "pending" | "history"
let _approvalSearchQuery = "";
let currentRejectingReqId = null;
let _cachedSignupRequests = [];

async function refreshApprovalsBadge() {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const approvalsBadge = document.getElementById("approvalsBadge");
    if ((user?.role || "").toLowerCase() !== "admin") {
        if (approvalsBadge) approvalsBadge.classList.add("d-none");
        return;
    }

    try {
        const signupRequests = await API.getSignupRequests() || [];
        const pendingCount = signupRequests.filter(r => r.status === "Pending").length;
        if (approvalsBadge) {
            if (pendingCount > 0) {
                approvalsBadge.textContent = pendingCount;
                approvalsBadge.classList.remove("d-none");
            } else {
                approvalsBadge.classList.add("d-none");
            }
        }
    } catch (e) {
        console.error("Error updating approvals badge:", e);
    }
}

async function renderUsers() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "").toLowerCase();
    if (role !== "admin") {
        content.innerHTML = `<div class="text-center py-5"><h4>Access Denied</h4><p class="text-muted">Only administrators can review applications.</p></div>`;
        return;
    }

    content.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Loading Application Approvals...</p></div>`;

    const signupRequests = await API.getSignupRequests() || [];
    _cachedSignupRequests = signupRequests;

    const pendingList = signupRequests.filter(r => r.status === "Pending");
    const historyList = signupRequests.filter(r => r.status !== "Pending");

    // Update pending badge in sidebar
    const approvalsBadge = document.getElementById("approvalsBadge");
    if (approvalsBadge) {
        if (pendingList.length > 0) {
            approvalsBadge.textContent = pendingList.length;
            approvalsBadge.classList.remove("d-none");
        } else {
            approvalsBadge.classList.add("d-none");
        }
    }

    // Filter based on active tab & search
    const activeList = _approvalTab === "pending" ? pendingList : historyList;
    const q = _approvalSearchQuery.toLowerCase().trim();
    const filtered = activeList.filter(r => {
        if (!q) return true;
        return (r.display_name || "").toLowerCase().includes(q) ||
               (r.user_id || "").toLowerCase().includes(q) ||
               (r.role || "").toLowerCase().includes(q) ||
               String(r.id).includes(q);
    });

    content.innerHTML = `
        <!-- PAGE HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1"><i class="bi bi-person-check me-2" style="color: var(--accent);"></i>Approvals</h1>
                <p class="text-muted small mb-0">Decision Queue: Review applicant credentials, verify details, and approve or decline access</p>
            </div>
            <div class="d-flex gap-2 align-items-center">
                <span class="badge ${pendingList.length > 0 ? 'bg-warning text-dark' : 'bg-success'}" style="font-size: 13px; padding: 8px 14px; border-radius: 20px;">
                    <i class="bi ${pendingList.length > 0 ? 'bi-hourglass-split' : 'bi-check2-all'} me-1"></i>
                    ${pendingList.length} Pending Application${pendingList.length === 1 ? '' : 's'}
                </span>
            </div>
        </div>

        <!-- QUEUE CONTROLS: TABS & SEARCH -->
        <div class="card-box p-3 mb-4">
            <div class="row g-2 align-items-center">
                <div class="col-md-7">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn ${_approvalTab === 'pending' ? 'btn-primary' : 'btn-outline-secondary'} btn-sm d-flex align-items-center gap-2" onclick="switchApprovalTab('pending')">
                            <i class="bi bi-hourglass-split"></i> Pending Queue 
                            <span class="badge ${pendingList.length > 0 ? 'bg-danger text-white' : 'bg-secondary'}">${pendingList.length}</span>
                        </button>
                        <button type="button" class="btn ${_approvalTab === 'history' ? 'btn-primary' : 'btn-outline-secondary'} btn-sm d-flex align-items-center gap-2" onclick="switchApprovalTab('history')">
                            <i class="bi bi-clock-history"></i> Decision History 
                            <span class="badge bg-secondary">${historyList.length}</span>
                        </button>
                    </div>
                </div>
                <div class="col-md-5">
                    <div class="input-group">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search" style="color: var(--accent);"></i></span>
                        <input type="text" class="form-control form-control-sm" placeholder="Search applicant name, ID, role..." value="${_approvalSearchQuery}" onkeyup="_handleApprovalSearch(this.value)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                    </div>
                </div>
            </div>
        </div>

        <!-- 1. PENDING APPLICATIONS TABLE -->
        ${_approvalTab === 'pending' ? `
            <div class="card-box p-4">
                ${filtered.length === 0 ? `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-check-circle-fill text-success fs-1 d-block mb-3"></i>
                        <h5 class="fw-bold text-dark">All Applications Reviewed</h5>
                        <p class="small text-muted mb-0">There are no pending signup requests waiting for approval.</p>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="custom-table" style="font-size: 13.5px;">
                            <thead>
                                <tr>
                                    <th style="width: 110px;">App ID</th>
                                    <th>Applicant</th>
                                    <th style="width: 140px;">Requested Role</th>
                                    <th style="width: 140px;">Submitted Date</th>
                                    <th style="width: 120px;">Status</th>
                                    <th style="width: 250px; text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.map(r => {
                                    const roleBadge = r.role === 'mentor'
                                        ? `<span class="badge" style="background: #ede9fe; color: #7c3aed; font-size: 11px;">MENTOR</span>`
                                        : `<span class="badge bg-primary" style="font-size: 11px;">FACULTY</span>`;
                                    const formattedDate = r.created_at ? _formatAppDate(r.created_at) : 'Today';

                                    return `
                                        <tr id="reqRow_${r.id}">
                                            <td>
                                                <code style="font-size: 12px; font-weight: 700; background: var(--bg-sunken); padding: 4px 8px; border-radius: 4px;">REQ-${r.id}</code>
                                            </td>
                                            <td>
                                                <div class="d-flex align-items-center gap-2">
                                                    <div>
                                                        <strong style="color: var(--text); font-size: 14px;">${r.display_name}</strong>
                                                        <div class="small text-muted">Proposed ID: <code>${r.user_id}</code></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${roleBadge}</td>
                                            <td><span class="text-muted small">${formattedDate}</span></td>
                                            <td><span class="faculty-status-badge faculty-status-badge--pending"><i class="bi bi-circle-fill"></i> Pending</span></td>
                                            <td style="text-align: right;">
                                                <div class="d-inline-flex gap-2">
                                                    <button class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onclick="openViewApplicationModal(${r.id})" title="View Application Details">
                                                        <i class="bi bi-eye"></i> View
                                                    </button>
                                                    <button class="btn btn-sm btn-success d-flex align-items-center gap-1" onclick="handleApproveSignup(${r.id}, '${r.display_name.replace(/'/g, "\\'")}', '${r.email}')" title="Approve and create Faculty record">
                                                        <i class="bi bi-check-circle-fill"></i> Approve
                                                    </button>
                                                    <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onclick="openRejectModal(${r.id}, '${r.display_name.replace(/'/g, "\\'")}', '${r.user_id}', '${r.email}')" title="Decline Application">
                                                        <i class="bi bi-x-circle"></i> Decline
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        ` : `
            <!-- 2. DECISION HISTORY TABLE -->
            <div class="card-box p-4">
                ${filtered.length === 0 ? `
                    <div class="text-center py-5 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                        <h5 class="fw-bold">No Decision History</h5>
                        <p class="small text-muted mb-0">No approved or declined applications on record yet.</p>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="custom-table" style="font-size: 13px;">
                            <thead>
                                <tr>
                                    <th style="width: 100px;">App ID</th>
                                    <th>Applicant</th>
                                    <th>Role</th>
                                    <th>Submitted Date</th>
                                    <th>Decision Date</th>
                                    <th>Status</th>
                                    <th>Details / Reason</th>
                                    <th style="width: 80px; text-align: right;">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.map(r => {
                                    const isApproved = r.status === 'Approved';
                                    const isDeclined = r.status === 'Declined' || r.status === 'Rejected';
                                    const statusBadge = isApproved
                                        ? `<span class="faculty-status-badge faculty-status-badge--active"><i class="bi bi-check-circle-fill"></i> Approved</span>`
                                        : `<span class="faculty-status-badge faculty-status-badge--declined"><i class="bi bi-x-circle-fill"></i> Declined</span>`;
                                    const subDate = r.created_at ? _formatAppDate(r.created_at) : 'N/A';
                                    const reviewDate = r.reviewed_at ? _formatAppDate(r.reviewed_at) : 'Recorded';

                                    return `
                                        <tr>
                                            <td><code>REQ-${r.id}</code></td>
                                            <td>
                                                <strong>${r.display_name}</strong>
                                                <div class="small text-muted"><code>${r.user_id}</code></div>
                                            </td>
                                            <td><span class="badge ${r.role === 'mentor' ? 'bg-info text-dark' : 'bg-primary'}">${r.role.toUpperCase()}</span></td>
                                            <td><span class="small text-muted">${subDate}</span></td>
                                            <td><span class="small text-muted">${reviewDate}</span></td>
                                            <td>${statusBadge}</td>
                                            <td>
                                                ${isApproved
                                                    ? `<span class="small text-success"><i class="bi bi-shield-check me-1"></i>Active Faculty Record</span>`
                                                    : `<span class="small text-danger" title="${r.rejection_reason || ''}"><i class="bi bi-exclamation-circle me-1"></i>${r.rejection_reason || 'Declined'}</span>`
                                                }
                                            </td>
                                            <td style="text-align: right;">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="openViewApplicationModal(${r.id})" title="Inspect Application Details">
                                                    <i class="bi bi-eye"></i> View
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `}
    `;
}

function switchApprovalTab(tab) {
    _approvalTab = tab;
    renderUsers();
}

function _handleApprovalSearch(val) {
    _approvalSearchQuery = val;
    renderUsers();
}

function _formatAppDate(isoString) {
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return isoString.slice(0, 10);
        return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
        return isoString ? isoString.slice(0, 10) : 'N/A';
    }
}

// 1. APPROVE ACTION
async function handleApproveSignup(reqId, name, email) {
    if (!confirm(`Approve application for "${name}"?\n\nThis will:\n1. Change application status to "Approved".\n2. Create an Active Faculty record in Faculty & Mentor Management.\n3. Dispatch login credentials to ${email}.`)) {
        return;
    }

    const res = await API.approveSignupRequest(reqId);
    if (res && res.success) {
        alert(res.message || `Application for ${name} approved! Faculty account created in Faculty & Mentor Management.`);
        closeViewApplicationModal();
        renderUsers();
    } else {
        alert(res?.message || "Failed to approve registration.");
    }
}

// 2. DECLINE MODAL & ACTION
function openRejectModal(reqId, name, userId, email) {
    currentRejectingReqId = reqId;
    const nameEl = document.getElementById("rejectApplicantName");
    const idEl = document.getElementById("rejectApplicantId");
    const emailEl = document.getElementById("rejectApplicantEmail");
    const reasonText = document.getElementById("rejectionReasonText");
    const presetSelect = document.getElementById("rejectPresetSelect");

    if (nameEl) nameEl.textContent = name;
    if (idEl) idEl.textContent = userId;
    if (emailEl) emailEl.textContent = email;
    if (reasonText) reasonText.value = "";
    if (presetSelect) presetSelect.value = "";

    document.getElementById("rejectionReasonModal")?.classList.add("active");
}

function closeRejectionModal() {
    currentRejectingReqId = null;
    document.getElementById("rejectionReasonModal")?.classList.remove("active");
}

function applyRejectPreset(val) {
    if (val) {
        const textEl = document.getElementById("rejectionReasonText");
        if (textEl) textEl.value = val;
    }
}

async function submitRejectionAction() {
    if (!currentRejectingReqId) return;

    const reason = document.getElementById("rejectionReasonText")?.value.trim();
    if (!reason) {
        alert("Please enter or select a specific reason for declining.");
        return;
    }

    const res = await API.rejectSignupRequest(currentRejectingReqId, reason);
    if (res && res.success) {
        alert(res.message || "Application declined. Reason recorded in history.");
        closeRejectionModal();
        closeViewApplicationModal();
        renderUsers();
    } else {
        alert(res?.message || "Failed to decline application.");
    }
}

// 3. COMPACT VIEW APPLICATION MODAL (Inspect Application Details)
function openViewApplicationModal(reqId) {
    const req = (_cachedSignupRequests || []).find(r => r.id === reqId);
    if (!req) return;

    const modal = document.getElementById("viewApplicationModal");
    const content = document.getElementById("viewAppModalContent");
    const title = document.getElementById("viewAppModalTitle");

    if (title) title.textContent = `Application REQ-${req.id}`;

    if (content) {
        const roleBadge = req.role === 'mentor'
            ? `<span class="badge" style="background: #ede9fe; color: #7c3aed;">MENTOR</span>`
            : `<span class="badge bg-primary">FACULTY</span>`;
        const isPending = req.status === 'Pending';
        const statusBadge = req.status === 'Approved'
            ? `<span class="faculty-status-badge faculty-status-badge--active"><i class="bi bi-check-circle-fill"></i> Approved</span>`
            : req.status === 'Declined' || req.status === 'Rejected'
            ? `<span class="faculty-status-badge faculty-status-badge--declined"><i class="bi bi-x-circle-fill"></i> Declined</span>`
            : `<span class="faculty-status-badge faculty-status-badge--pending"><i class="bi bi-circle-fill"></i> Pending</span>`;

        content.innerHTML = `
            <div class="p-3 bg-light rounded border mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="mb-0 fw-bold" style="color: var(--text);">${req.display_name}</h5>
                    <div class="d-flex gap-2 align-items-center">
                        ${roleBadge}
                        ${statusBadge}
                    </div>
                </div>
                <div class="small text-muted">Proposed User ID: <code class="fw-bold">${req.user_id}</code></div>
            </div>

            <div class="row g-2 mb-3">
                <div class="col-6">
                    <label class="small text-muted fw-semibold text-uppercase">Institutional Email</label>
                    <div class="fw-semibold small">${req.email || 'N/A'}</div>
                </div>
                <div class="col-6">
                    <label class="small text-muted fw-semibold text-uppercase">Mobile / Phone</label>
                    <div class="fw-semibold small">${req.phone || 'N/A'}</div>
                </div>
            </div>

            <div class="mb-3">
                <label class="small text-muted fw-semibold text-uppercase">Assigned Subjects</label>
                <div class="fw-semibold small">${req.subjects || '<span class="text-muted">None specified</span>'}</div>
            </div>

            <div class="mb-3">
                <label class="small text-muted fw-semibold text-uppercase">Additional Responsibilities</label>
                <div class="fw-semibold small">${req.extra_roles || '<span class="text-muted">None specified</span>'}</div>
            </div>

            <div class="row g-2 mb-3">
                <div class="col-6">
                    <label class="small text-muted fw-semibold text-uppercase">Submission Date</label>
                    <div class="small text-muted">${req.created_at ? req.created_at.slice(0, 10) : 'N/A'}</div>
                </div>
                <div class="col-6">
                    <label class="small text-muted fw-semibold text-uppercase">Review Status</label>
                    <div class="small text-muted">${req.reviewed_at ? _formatAppDate(req.reviewed_at) : 'Pending Review'}</div>
                </div>
            </div>

            ${req.rejection_reason ? `
                <div class="p-2 mb-3 rounded bg-danger-subtle border border-danger-subtle text-danger small">
                    <strong>Decline Reason:</strong> ${req.rejection_reason}
                </div>
            ` : ''}

            <div class="d-flex justify-content-between align-items-center border-top pt-3">
                <button type="button" class="secondary-btn" onclick="closeViewApplicationModal()">Close</button>
                ${isPending ? `
                    <div class="d-flex gap-2">
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="openRejectModal(${req.id}, '${req.display_name.replace(/'/g, "\\'")}', '${req.user_id}', '${req.email}')">
                            <i class="bi bi-x-circle me-1"></i> Decline
                        </button>
                        <button type="button" class="btn btn-success btn-sm" onclick="handleApproveSignup(${req.id}, '${req.display_name.replace(/'/g, "\\'")}', '${req.email}')">
                            <i class="bi bi-check-circle-fill me-1"></i> Approve
                        </button>
                    </div>
                ` : `
                    <span class="small text-muted"><i class="bi bi-check2-all me-1"></i>Decision Recorded</span>
                `}
            </div>
        `;
    }

    modal?.classList.add("active");
}

function closeViewApplicationModal() {
    document.getElementById("viewApplicationModal")?.classList.remove("active");
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
