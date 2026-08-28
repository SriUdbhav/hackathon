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

    // Trigger smooth entrance animation on pageContent
    const pageContent = document.getElementById("pageContent");
    if (pageContent) {
        pageContent.style.animation = "none";
        void pageContent.offsetHeight; // trigger reflow
        pageContent.style.animation = "";
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
        case "enquiries":
            renderEnquiries();
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
        "dashboard", "students", "analytics", "engagement", "mentor", "enquiries",
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
    refreshEnquiriesBadge();
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

async function refreshEnquiriesBadge(knownCount = null) {
    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const enquiriesBadge = document.getElementById("enquiriesBadge");
    if (!enquiriesBadge || !user || (user.role || "").toLowerCase() === "student") {
        if (enquiriesBadge) enquiriesBadge.classList.add("d-none");
        return;
    }

    if (knownCount !== null) {
        if (knownCount > 0) {
            enquiriesBadge.textContent = knownCount;
            enquiriesBadge.classList.remove("d-none");
        } else {
            enquiriesBadge.classList.add("d-none");
        }
        return;
    }

    try {
        const role = (user.role || "faculty").toLowerCase();
        const enquiries = await API.getInterventionEnquiries(role, user.id, "pending") || [];
        const pendingCount = enquiries.filter(e => e.status === "Completion Requested").length;
        if (enquiriesBadge) {
            if (pendingCount > 0) {
                enquiriesBadge.textContent = pendingCount;
                enquiriesBadge.classList.remove("d-none");
            } else {
                enquiriesBadge.classList.add("d-none");
            }
        }
    } catch (e) {
        console.warn("Could not fetch enquiries count:", e);
    }
}
window.refreshEnquiriesBadge = refreshEnquiriesBadge;

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
    const ok = await showConfirmModal({
        title: "Approve Registration",
        message: `Approve application for <strong>${name}</strong>?<br><br>• Status will update to <strong>Approved</strong>.<br>• Active faculty profile will be created.<br>• Access credentials will be dispatched to <code>${email}</code>.`,
        confirmText: "Approve Application",
        confirmBtnClass: "primary-btn",
        icon: "bi-shield-check text-success"
    });
    if (!ok) return;

    const res = await API.approveSignupRequest(reqId);
    if (res && res.success) {
        showSuccessToast(res.message || `Application for ${name} approved! Faculty account created.`);
        closeViewApplicationModal();
        renderUsers();
    } else {
        showErrorToast(res?.message || "Failed to approve registration.");
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
    const ok = await showConfirmModal({
        title: "Delete User Account",
        message: `Are you sure you want to permanently delete user account <code>${userId}</code>?`,
        confirmText: "Delete Account",
        confirmBtnClass: "btn btn-danger",
        icon: "bi-trash3-fill text-danger"
    });
    if (!ok) return;

    const res = await API.deleteUser(userId);
    if (res && res.success) {
        showSuccessToast(`User ${userId} deleted successfully.`);
        renderUsers();
    } else {
        showErrorToast(res?.message || `Failed to delete user ${userId}.`);
    }
}

// Window Exports for Approvals Queue & Modals
window.renderUsers = renderUsers;
window.switchApprovalTab = switchApprovalTab;
window._handleApprovalSearch = _handleApprovalSearch;
window.handleApproveSignup = handleApproveSignup;
window.openRejectModal = openRejectModal;
window.closeRejectionModal = closeRejectionModal;
window.applyRejectPreset = applyRejectPreset;
window.submitRejectionAction = submitRejectionAction;
window.openViewApplicationModal = openViewApplicationModal;
window.closeViewApplicationModal = closeViewApplicationModal;
window.openEmailPreview = openEmailPreview;
window.closeEmailPreviewModal = closeEmailPreviewModal;
window.openAddUserModal = openAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.openImportUsersModal = openImportUsersModal;
window.closeImportUsersModal = closeImportUsersModal;
window.handleImportUsersSubmit = handleImportUsersSubmit;
window.handleDeleteUser = handleDeleteUser;
window.openStudentRiskBreakdownModal = openStudentRiskBreakdownModal;
window.closeStudentRiskModal = closeStudentRiskModal;
window.runRiskSimulation = runRiskSimulation;

// =====================================================
// MOBILE SIDEBAR & USER MENU CONTROLLERS
// =====================================================

function toggleSidebar(forceState) {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if (!sidebar) return;

    const isMobile = window.innerWidth <= 991;

    if (isMobile) {
        const willOpen = typeof forceState === "boolean" ? forceState : !sidebar.classList.contains("mobile-open");
        if (willOpen) {
            sidebar.classList.add("mobile-open");
            backdrop?.classList.add("active");
            document.body.style.overflow = "hidden";
        } else {
            sidebar.classList.remove("mobile-open");
            backdrop?.classList.remove("active");
            document.body.style.overflow = "";
        }
    } else {
        const willCollapse = typeof forceState === "boolean" ? forceState : !sidebar.classList.contains("collapsed");
        if (willCollapse) {
            sidebar.classList.add("collapsed");
        } else {
            sidebar.classList.remove("collapsed");
        }
    }
}
window.toggleSidebar = toggleSidebar;

function toggleUserDropdown(forceState) {
    const menu = document.getElementById("userDropdownMenu");
    if (!menu) return;
    if (typeof forceState === "boolean") {
        if (forceState) menu.classList.remove("d-none");
        else menu.classList.add("d-none");
    } else {
        menu.classList.toggle("d-none");
    }
}
window.toggleUserDropdown = toggleUserDropdown;

// Close dropdown on clicking outside
document.addEventListener("click", function(e) {
    const pill = document.getElementById("userProfilePill");
    const menu = document.getElementById("userDropdownMenu");
    if (menu && !menu.classList.contains("d-none")) {
        if (pill && !pill.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add("d-none");
        }
    }
});

// Handle window resize
window.addEventListener("resize", function() {
    if (window.innerWidth > 991) {
        document.getElementById("sidebar")?.classList.remove("mobile-open");
        document.getElementById("sidebarBackdrop")?.classList.remove("active");
        document.body.style.overflow = "";
    }
});

// =====================================================
// EXPLAINABLE AI RISK BREAKDOWN MODAL & SIMULATOR
// =====================================================

async function openStudentRiskBreakdownModal(studentId) {
    const modal = document.getElementById("riskBreakdownModal");
    const content = document.getElementById("riskBreakdownModalContent");
    const title = document.getElementById("riskModalTitle");
    if (!modal || !content) return;

    // Show loading
    modal.classList.add("active");
    content.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-2 text-muted small">Computing explainable multi-signal risk breakdown...</p></div>`;

    let s = null;
    try {
        s = await API.getStudentDetail(studentId);
    } catch (e) {
        s = null;
    }
    if (!s || s.error) {
        s = students.find(item => item.id === studentId);
    }

    if (!s) {
        content.innerHTML = `<div class="alert alert-warning">Student data for [${studentId}] could not be loaded.</div>`;
        return;
    }

    const attendance = Number(s.attendance || 0);
    const cgpa = Number(s.cgpa || 0);
    const lms = Number(s.lms_score || s.attendance || 0);
    const risk = Number(s.risk || 0);

    // Dynamic weights from AI engine formula
    const attdWeight = 0.40;
    const cgpaWeight = 0.35;
    const lmsWeight = 0.25;

    const attdPts = Number((attendance * attdWeight).toFixed(2));
    const cgpaScaled = Number((cgpa * 10).toFixed(1));
    const cgpaPts = Number((cgpaScaled * cgpaWeight).toFixed(2));
    const lmsPts = Number((lms * lmsWeight).toFixed(2));
    const engagementSum = Number((attdPts + cgpaPts + lmsPts).toFixed(2));

    const badgeClass = risk >= 60 ? "high" : (risk >= 30 ? "medium" : "low");
    const riskTier = risk >= 60 ? "High Risk (Immediate Intervention Required)" : (risk >= 30 ? "Moderate Warning (Needs Guidance)" : "Low Risk (Healthy Standing)");
    const reasons = s.ai_analysis?.reasons || [];
    const marks = s.subject_marks || [];

    if (title) {
        title.innerHTML = `AI Risk Diagnostics for ${s.name} <span class="badge bg-light text-dark fs-6 ms-1 border">${s.id}</span>`;
    }

    content.innerHTML = `
        <!-- 1. OVERALL RISK METER -->
        <div class="risk-meter-container mb-3">
            <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                <div>
                    <span class="text-muted small text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Current Calculated Academic Risk</span>
                    <h3 class="fw-bold mb-0 ${risk >= 60 ? 'text-danger' : (risk >= 30 ? 'text-warning' : 'text-success')}">
                        ${risk}% <span class="fs-6 fw-normal text-muted">/ 100%</span>
                    </h3>
                </div>
                <div class="text-end">
                    <span class="risk-badge ${badgeClass} fs-6">${riskTier}</span>
                </div>
            </div>
            
            <div class="risk-meter-bar position-relative">
                <div class="risk-meter-indicator" style="left: ${Math.min(98, Math.max(2, risk))}%;" title="Risk Position: ${risk}%"></div>
            </div>
            <div class="d-flex justify-content-between text-muted" style="font-size: 11px;">
                <span><i class="bi bi-check-circle text-success me-1"></i> Low (&lt;30%)</span>
                <span><i class="bi bi-exclamation-triangle text-warning me-1"></i> Moderate (30%-59%)</span>
                <span><i class="bi bi-exclamation-octagon text-danger me-1"></i> High (&ge;60%)</span>
            </div>
        </div>

        <!-- 2. THE MULTI-SIGNAL FORMULA EXPLANATION -->
        <div class="p-3 bg-light rounded-3 border mb-3">
            <div class="d-flex align-items-center gap-2 mb-2">
                <i class="bi bi-calculator text-primary fs-5"></i>
                <h6 class="fw-bold mb-0 text-dark">Multi-Signal Formula Logic</h6>
            </div>
            <p class="small text-muted mb-2">
                The institutional AI Engine calculates <strong>Academic Risk</strong> as the mathematical inverse of a student's composite <strong>Multi-Signal Engagement Index</strong>:
            </p>
            <div class="p-2 rounded bg-white border font-mono small mb-2 text-center" style="font-size: 12px; color: var(--text);">
                <strong>Academic Risk (%)</strong> = 100 - [ (Attendance% &times; 0.40) + (CGPA &times; 10 &times; 0.35) + (LMS Activity% &times; 0.25) ]
            </div>
        </div>

        <!-- 3. PERSONALIZED BREAKDOWN CARDS -->
        <h6 class="fw-bold mb-2 text-dark"><i class="bi bi-pie-chart text-primary me-1"></i> Personalized Factor Breakdown</h6>
        <div class="row g-2 mb-3">
            <!-- Attendance -->
            <div class="col-md-4">
                <div class="risk-pillar-card h-100 ${attendance < 75 ? 'border-danger' : 'border-success'}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="fw-bold small">1. Attendance</span>
                        <span class="badge bg-primary">40% Weight</span>
                    </div>
                    <h4 class="fw-bold mb-1 ${attendance < 75 ? 'text-danger' : 'text-success'}">${attendance}%</h4>
                    <p class="small text-muted mb-2" style="font-size: 11px;">
                        Math: <code>${attendance} &times; 0.40</code> = <strong>+${attdPts} pts</strong> (out of 40.0)
                    </p>
                    <span class="badge ${attendance < 75 ? 'bg-danger text-white' : 'bg-success text-white'}" style="font-size: 10px;">
                        ${attendance < 75 ? '<i class="bi bi-x-circle me-1"></i>Below 75% Cutoff' : '<i class="bi bi-check2 me-1"></i>Cutoff Satisfied'}
                    </span>
                </div>
            </div>

            <!-- CGPA -->
            <div class="col-md-4">
                <div class="risk-pillar-card h-100 ${cgpa < 7.5 ? 'border-warning' : 'border-success'}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="fw-bold small">2. CGPA Scaled</span>
                        <span class="badge bg-primary">35% Weight</span>
                    </div>
                    <h4 class="fw-bold mb-1 text-primary">${cgpa} <span class="fs-6 text-muted">/ 10</span></h4>
                    <p class="small text-muted mb-2" style="font-size: 11px;">
                        Math: <code>(${cgpa} &times; 10) &times; 0.35</code> = <strong>+${cgpaPts} pts</strong> (out of 35.0)
                    </p>
                    <span class="badge ${cgpa < 7.5 ? 'bg-warning text-dark' : 'bg-success text-white'}" style="font-size: 10px;">
                        ${cgpa < 7.5 ? '<i class="bi bi-exclamation-circle me-1"></i>Below 7.5 Target' : '<i class="bi bi-check2 me-1"></i>Above 7.5 Benchmark'}
                    </span>
                </div>
            </div>

            <!-- LMS Engagement -->
            <div class="col-md-4">
                <div class="risk-pillar-card h-100 ${lms < 60 ? 'border-warning' : 'border-success'}">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="fw-bold small">3. LMS Portal</span>
                        <span class="badge bg-primary">25% Weight</span>
                    </div>
                    <h4 class="fw-bold mb-1 text-warning">${lms}%</h4>
                    <p class="small text-muted mb-2" style="font-size: 11px;">
                        Math: <code>${lms} &times; 0.25</code> = <strong>+${lmsPts} pts</strong> (out of 25.0)
                    </p>
                    <span class="badge ${lms < 60 ? 'bg-warning text-dark' : 'bg-success text-white'}" style="font-size: 10px;">
                        ${lms < 60 ? '<i class="bi bi-clock-history me-1"></i>Low Portal Activity' : '<i class="bi bi-check2 me-1"></i>Active LMS Portal'}
                    </span>
                </div>
            </div>
        </div>

        <!-- 4. TOTAL MATH AUDIT TIE-UP -->
        <div class="risk-math-box mb-3">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <span>Engagement Index Score:</span>
                <strong>${attdPts} + ${cgpaPts} + ${lmsPts} = ${engagementSum} / 100</strong>
            </div>
            <div class="d-flex justify-content-between align-items-center text-danger">
                <span>Final Academic Risk Calculation:</span>
                <strong>100 - ${engagementSum} = ${risk}% Risk</strong>
            </div>
        </div>

        <!-- 5. ACTIVE AI DIAGNOSTIC TRIGGERS -->
        <div class="card-box p-3 mb-3">
            <h6 class="fw-bold mb-2 text-dark"><i class="bi bi-stars text-danger me-1"></i> Active AI Diagnostic Triggers & Anomalies</h6>
            ${reasons.length === 0 ? '<p class="text-muted small mb-0">No active anomaly triggers identified for this profile.</p>' : `
                <ul class="mb-0 ps-3 small text-muted">
                    ${reasons.map(r => `<li class="mb-1 text-dark"><strong>${r}</strong></li>`).join("")}
                </ul>
            `}
        </div>

        <!-- 6. INTERACTIVE "WHAT-IF" RECOVERY SIMULATOR -->
        <div class="card-box p-3 mb-2" style="border-left: 4px solid var(--accent); background: var(--bg-sunken);">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h6 class="fw-bold mb-0 text-dark"><i class="bi bi-sliders text-primary me-1"></i> Interactive Risk Recovery Simulator</h6>
                <span class="badge bg-success" id="simRiskBadge">Simulated Risk: ${risk}%</span>
            </div>
            <p class="small text-muted mb-3">
                Adjust the sliders below to simulate how improving your attendance or GPA will lower your risk score in real time:
            </p>
            <div class="row g-3">
                <div class="col-md-6">
                    <label class="form-label small fw-semibold d-flex justify-content-between mb-1">
                        <span>Simulated Attendance:</span>
                        <span class="text-primary fw-bold" id="simAttdVal">${attendance}%</span>
                    </label>
                    <input type="range" class="form-range risk-sim-slider" id="simAttdSlider" min="0" max="100" value="${attendance}" oninput="runRiskSimulation()">
                </div>
                <div class="col-md-6">
                    <label class="form-label small fw-semibold d-flex justify-content-between mb-1">
                        <span>Simulated CGPA:</span>
                        <span class="text-primary fw-bold" id="simCgpaVal">${cgpa}</span>
                    </label>
                    <input type="range" class="form-range risk-sim-slider" id="simCgpaSlider" min="0" max="10" step="0.1" value="${cgpa}" oninput="runRiskSimulation()">
                </div>
            </div>
            <div class="mt-2 text-muted small" id="simPredictionNote" style="font-size: 11.5px;">
                <i class="bi bi-lightbulb-fill text-warning me-1"></i> Moving attendance above <strong>75%</strong> will significantly lower your risk tier.
            </div>
        </div>

        <div class="d-flex justify-content-end mt-3">
            <button type="button" class="primary-btn" onclick="closeStudentRiskModal()">
                <i class="bi bi-check-lg"></i> Done
            </button>
        </div>
    `;
}
window.openStudentRiskBreakdownModal = openStudentRiskBreakdownModal;
window.showStudentRiskModal = openStudentRiskBreakdownModal;

function closeStudentRiskModal() {
    const modal = document.getElementById("riskBreakdownModal");
    if (modal) modal.classList.remove("active");
}
window.closeStudentRiskModal = closeStudentRiskModal;

function runRiskSimulation() {
    const attdInput = document.getElementById("simAttdSlider");
    const cgpaInput = document.getElementById("simCgpaSlider");
    const attdVal = document.getElementById("simAttdVal");
    const cgpaVal = document.getElementById("simCgpaVal");
    const simBadge = document.getElementById("simRiskBadge");
    const note = document.getElementById("simPredictionNote");

    if (!attdInput || !cgpaInput || !simBadge) return;

    const attd = Number(attdInput.value);
    const cgpa = Number(cgpaInput.value);
    const lms = 70; // baseline LMS

    if (attdVal) attdVal.textContent = `${attd}%`;
    if (cgpaVal) cgpaVal.textContent = `${cgpa}`;

    const engagement = (attd * 0.40) + ((cgpa * 10) * 0.35) + (lms * 0.25);
    const simRisk = Math.round(Math.max(0, Math.min(100, 100 - engagement)));

    let badgeClass = 'bg-success text-white';
    let label = 'Low Risk';
    if (simRisk >= 60) {
        badgeClass = 'bg-danger text-white';
        label = 'High Risk';
    } else if (simRisk >= 30) {
        badgeClass = 'bg-warning text-dark';
        label = 'Moderate Risk';
    }

    simBadge.className = `badge ${badgeClass}`;
    simBadge.textContent = `Simulated Risk: ${simRisk}% (${label})`;

    if (note) {
        if (simRisk < 30) {
            note.innerHTML = `<i class="bi bi-trophy-fill text-success me-1"></i> <strong>Excellent!</strong> At ${attd}% attendance and ${cgpa} CGPA, your risk is <strong>${simRisk}%</strong> (Good Standing).`;
        } else if (simRisk < 60) {
            note.innerHTML = `<i class="bi bi-info-circle-fill text-warning me-1"></i> Improving CGPA to <strong>8.0</strong> or attendance to <strong>80%</strong> will bring your risk below 30%.`;
        } else {
            note.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-danger me-1"></i> <strong>Critical:</strong> Attendance under 70% keeps your risk in the High Risk category.`;
        }
    }
}
window.runRiskSimulation = runRiskSimulation;

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
            if (window.innerWidth <= 991) {
                toggleSidebar(false);
            }
        });
    });

    // Sidebar collapse / mobile drawer toggle button
    const sidebarToggle = document.getElementById("sidebarToggle");
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", function() {
            toggleSidebar();
        });
    }

    // Topbar Notifications button click
    const notificationBtn = document.getElementById("notificationButton");
    if (notificationBtn) {
        notificationBtn.addEventListener("click", function() {
            navigateTo("notifications");
        });
    }

    // Keyboard shortcut (Ctrl + K or Cmd + K) for quick search focus & Escape for modals
    document.addEventListener("keydown", function(e) {
        const user = getCurrentUser();
        const role = (user?.role || "").toLowerCase();
        if (role !== "student" && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            document.getElementById("globalSearch")?.focus();
        } else if (e.key === "Escape") {
            document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
            document.getElementById("userDropdownMenu")?.classList.add("d-none");
            document.getElementById("globalSearchResults")?.classList.add("d-none");
            document.getElementById("student360Dropdown")?.classList.add("d-none");
        }
    });

    // Global backdrop click to dismiss active modals
    document.addEventListener("click", function(e) {
        if (e.target.classList && e.target.classList.contains("modal-overlay") && e.target.classList.contains("active")) {
            e.target.classList.remove("active");
        }
    });
});

