/* =====================================================
   FACULTY.JS
   Admin → Faculty Management Page
   Renders: Summary Cards, Faculty Table, Detail Drawer,
   Edit Modal, Status Change, Approval/Decline Workflow
   Data: Reads from existing users + signup_requests
===================================================== */

let _facultyData = null;
let _facultySearchQuery = "";
let _facultyFilterStatus = "ALL";
let _facultyFilterRole = "ALL";

// =====================================================
// 1. MAIN PAGE RENDER
// =====================================================

async function renderFaculty() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "").toLowerCase();
    if (role !== "admin") {
        content.innerHTML = `<div class="text-center py-5"><h4>Access Denied</h4><p class="text-muted">Only administrators can manage faculty.</p></div>`;
        return;
    }

    content.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted">Loading Faculty Data...</p></div>`;

    const result = await API.getFaculty();
    _facultyData = result;

    const summary = result?.summary || {};
    const faculty = result?.faculty || [];

    content.innerHTML = `
        <!-- PAGE HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1"><i class="bi bi-person-workspace me-2" style="color: var(--accent);"></i>Faculty & Mentor Management</h1>
                <p class="text-muted small mb-0">Manage approved faculty accounts, view assigned subjects, track student mentorship, and monitor performance</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="secondary-btn" onclick="openFacultyImportModal()">
                    <i class="bi bi-file-earmark-arrow-up text-success"></i> Import Faculty
                </button>
                <div class="dropdown d-inline-block">
                    <button class="secondary-btn" type="button" onclick="toggleFacultyExportMenu(this)">
                        <i class="bi bi-download"></i> Export
                    </button>
                    <div class="faculty-action-menu d-none" style="right: 0; min-width: 160px;">
                        <a href="#" onclick="exportFacultyCSV(); event.preventDefault();"><i class="bi bi-filetype-csv me-2"></i>Export CSV</a>
                        <a href="#" onclick="exportFacultyExcel(); event.preventDefault();"><i class="bi bi-file-earmark-excel me-2"></i>Export Excel</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- BULK ACTION TOOLBAR (hidden until selection) -->
        <div id="facultyBulkToolbar" class="faculty-bulk-toolbar d-none">
            <div class="d-flex align-items-center gap-3 flex-wrap">
                <span class="fw-semibold" style="color: var(--text);"><span id="facultySelectedCount">0</span> Selected</span>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-success" onclick="bulkActivateFaculty()" title="Activate Selected">
                        <i class="bi bi-check-circle me-1"></i>Activate
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="bulkDeactivateFaculty()" title="Deactivate Selected">
                        <i class="bi bi-pause-circle me-1"></i>Deactivate
                    </button>
                    <button class="btn btn-sm btn-outline-primary" onclick="exportSelectedFacultyCSV()" title="Export Selected">
                        <i class="bi bi-download me-1"></i>Export
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="bulkDeleteFacultyPrompt()" title="Delete Selected">
                        <i class="bi bi-trash3 me-1"></i>Delete
                    </button>
                </div>
            </div>
        </div>

        <!-- SUMMARY CARDS -->
        <div class="row g-3 mb-4">
            <div class="col-6 col-md">
                <div class="faculty-stat-card">
                    <div class="faculty-stat-icon" style="background: var(--accent-soft); color: var(--accent);">
                        <i class="bi bi-people-fill"></i>
                    </div>
                    <div>
                        <div class="faculty-stat-value">${summary.total_faculty || 0}</div>
                        <div class="faculty-stat-label">Total Faculty</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md">
                <div class="faculty-stat-card">
                    <div class="faculty-stat-icon" style="background: var(--risk-low-soft); color: var(--risk-low);">
                        <i class="bi bi-check-circle-fill"></i>
                    </div>
                    <div>
                        <div class="faculty-stat-value">${summary.active_faculty || 0}</div>
                        <div class="faculty-stat-label">Active Faculty</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md">
                <div class="faculty-stat-card ${summary.pending_applications > 0 ? 'faculty-stat-card--alert' : ''}" style="cursor: pointer;" onclick="navigateTo('users')" title="Go to Application Approvals Queue">
                    <div class="faculty-stat-icon" style="background: ${summary.pending_applications > 0 ? 'var(--risk-medium-soft)' : 'var(--bg-sunken)'}; color: ${summary.pending_applications > 0 ? 'var(--risk-medium)' : 'var(--text-muted)'};">
                        <i class="bi bi-hourglass-split"></i>
                    </div>
                    <div>
                        <div class="faculty-stat-value">${summary.pending_applications || 0}</div>
                        <div class="faculty-stat-label">Pending Applications</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md">
                <div class="faculty-stat-card">
                    <div class="faculty-stat-icon" style="background: #ede9fe; color: #7c3aed;">
                        <i class="bi bi-compass-fill"></i>
                    </div>
                    <div>
                        <div class="faculty-stat-value">${summary.mentors || 0}</div>
                        <div class="faculty-stat-label">Mentors</div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md">
                <div class="faculty-stat-card">
                    <div class="faculty-stat-icon" style="background: #fce7f3; color: #db2777;">
                        <i class="bi bi-person-check-fill"></i>
                    </div>
                    <div>
                        <div class="faculty-stat-value">${summary.total_students_assigned || 0}</div>
                        <div class="faculty-stat-label">Students Assigned</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- SEARCH & FILTERS -->
        <div class="card-box p-3 mb-4">
            <div class="row g-2 align-items-center">
                <div class="col-md-5">
                    <div class="input-group">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search" style="color: var(--accent);"></i></span>
                        <input type="text" id="facultySearchInput" class="form-control" placeholder="Search by name, ID, email, or subject..." onkeyup="filterFacultyTable()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                    </div>
                </div>
                <div class="col-md-2">
                    <select id="facultyFilterStatus" class="form-select" onchange="filterFacultyTable()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="ALL">All Status</option>
                        <option value="Active">🟢 Active</option>
                        <option value="Inactive">⚪ Inactive</option>
                        <option value="Declined">🔴 Declined History</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <select id="facultyFilterRole" class="form-select" onchange="filterFacultyTable()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="ALL">All Roles</option>
                        <option value="faculty">Faculty</option>
                        <option value="mentor">Mentor</option>
                    </select>
                </div>
                <div class="col-md-3 text-end my-auto">
                    <span class="small" id="facultyCountSummary" style="color: var(--text-soft);">
                        Showing <strong>${faculty.length}</strong> of <strong>${faculty.length}</strong> records
                    </span>
                </div>
            </div>
        </div>

        <!-- FACULTY TABLE -->
        <div class="card-box p-4">
            <div class="table-responsive">
                <table class="custom-table" id="facultyTable">
                    <thead>
                        <tr>
                            <th style="width: 36px;"><input type="checkbox" id="facultySelectAll" onchange="toggleFacultySelectAll(this)" style="cursor: pointer; width: 16px; height: 16px;"></th>
                            <th>Faculty</th>
                            <th>Faculty ID</th>
                            <th>Department / Role</th>
                            <th>Assigned Subjects</th>
                            <th>Students</th>
                            <th>Status</th>
                            <th style="width: 140px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="facultyTableBody">
                        ${_renderFacultyRows(faculty)}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- FACULTY DETAIL DRAWER (injected via JS) -->
        <div id="facultyDrawerOverlay" class="faculty-drawer-overlay" onclick="closeFacultyDrawer()"></div>
        <div id="facultyDrawer" class="faculty-drawer">
            <div id="facultyDrawerContent"></div>
        </div>

        <!-- FACULTY EDIT MODAL -->
        <div id="facultyEditModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 560px;">
                <div class="modal-head">
                    <div>
                        <span>FACULTY MANAGEMENT</span>
                        <h2 id="facultyEditTitle">Edit Faculty Profile</h2>
                    </div>
                    <button class="modal-close" onclick="closeFacultyEditModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="facultyEditForm" class="p-3">
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Display Name</label>
                            <input type="text" id="editFacDisplayName" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Faculty ID</label>
                            <input type="text" id="editFacId" class="form-control" readonly disabled>
                        </div>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Email</label>
                            <input type="email" id="editFacEmail" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Phone / Mobile</label>
                            <div class="d-flex gap-2">
                                <select id="editFacCountryCode" class="form-select" style="width: 145px; font-size: 12.5px; font-weight: 500; background: var(--bg-elevated); color: var(--text); border-color: var(--border);" onchange="updatePhoneLimit('editFacCountryCode', 'editFacPhone')">
                                    <option value="+91" data-len="10" data-code="+91" selected>🇮🇳 +91 (India)</option>
                                    <option value="+1" data-len="10" data-code="+1">🇺🇸 +1 (US)</option>
                                    <option value="+44" data-len="10" data-code="+44">🇬🇧 +44 (UK)</option>
                                    <option value="+971" data-len="9" data-code="+971">🇦🇪 +971 (UAE)</option>
                                    <option value="+65" data-len="8" data-code="+65">🇸🇬 +65 (Singapore)</option>
                                    <option value="+61" data-len="9" data-code="+61">🇦🇺 +61 (Australia)</option>
                                    <option value="+1-CA" data-len="10" data-code="+1">🇨🇦 +1 (Canada)</option>
                                    <option value="+49" data-len="11" data-code="+49">🇩🇪 +49 (Germany)</option>
                                    <option value="+81" data-len="10" data-code="+81">🇯🇵 +81 (Japan)</option>
                                    <option value="+966" data-len="9" data-code="+966">🇸🇦 +966 (Saudi Arabia)</option>
                                    <option value="+60" data-len="9" data-code="+60">🇲🇾 +60 (Malaysia)</option>
                                    <option value="+33" data-len="9" data-code="+33">🇫🇷 +33 (France)</option>
                                </select>
                                <input type="tel" id="editFacPhone" class="form-control flex-grow-1" placeholder="10-digit number" maxlength="10" oninput="formatPhoneDigits(this)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Assigned Subjects</label>
                        <input type="text" id="editFacSubjects" class="form-control" placeholder="e.g. CS201, CS202">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Additional Responsibilities</label>
                        <input type="text" id="editFacExtraRoles" class="form-control" placeholder="e.g. Class Teacher, Lab Incharge">
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeFacultyEditModal()">Cancel</button>
                        <button type="submit" class="primary-btn"><i class="bi bi-check2 me-1"></i>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- FACULTY IMPORT MODAL (Multi-step: Upload → Preview → Confirm) -->
        <div id="facultyImportModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 820px;">
                <div class="modal-head">
                    <div>
                        <span>DATA INGESTION</span>
                        <h2>Bulk Import Faculty</h2>
                    </div>
                    <button class="modal-close" onclick="closeFacultyImportModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <!-- STEP 1: Upload -->
                    <div id="facImportStep1">
                        <p class="text-muted small mb-3">
                            Upload a <code>.csv</code> or <code>.xlsx</code> file with faculty data.<br>
                            Required columns: <strong>Full Name</strong>, <strong>University User ID</strong>, <strong>Institutional Email</strong>.<br>
                            Optional: <strong>Mobile/Phone</strong>, <strong>Role</strong>, <strong>Assigned Subjects</strong>, <strong>Additional Responsibilities</strong>.
                        </p>
                        <div class="mb-3">
                            <a href="#" class="small" onclick="downloadFacultyTemplate('csv'); event.preventDefault();" style="color: var(--accent);"><i class="bi bi-download me-1"></i>Download CSV Template</a>
                            <span class="mx-2 text-muted">|</span>
                            <a href="#" class="small" onclick="downloadFacultyTemplate('xlsx'); event.preventDefault();" style="color: var(--accent);"><i class="bi bi-download me-1"></i>Download Excel Template</a>
                        </div>
                        <div class="mb-3">
                            <input type="file" id="facultyImportFileInput" class="form-control" accept=".csv,.xlsx,.xls" onchange="handleFacultyFileSelected()">
                        </div>
                        <div id="facImportParseStatus" class="d-none mb-3">
                            <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                            <span class="small text-muted">Parsing and validating records...</span>
                        </div>
                    </div>

                    <!-- STEP 2: Preview (hidden until file parsed) -->
                    <div id="facImportStep2" class="d-none">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <span class="fw-semibold">Preview & Validation</span>
                                <span id="facImportPreviewSummary" class="ms-2 small text-muted"></span>
                            </div>
                            <button class="btn btn-sm btn-outline-secondary" onclick="resetFacultyImport()"><i class="bi bi-arrow-left me-1"></i>Back</button>
                        </div>
                        <div class="table-responsive" style="max-height: 340px; overflow-y: auto;">
                            <table class="custom-table" style="font-size: 13px;" id="facImportPreviewTable">
                                <thead><tr><th>Row</th><th>Name</th><th>Faculty ID</th><th>Email</th><th>Role</th><th>Validation</th></tr></thead>
                                <tbody id="facImportPreviewBody"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- STEP 3: Summary (hidden until import complete) -->
                    <div id="facImportStep3" class="d-none">
                        <div id="facImportSummaryContent"></div>
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-3" id="facImportActions">
                        <button type="button" class="secondary-btn" onclick="closeFacultyImportModal()">Cancel</button>
                        <button type="button" class="primary-btn d-none" id="facImportConfirmBtn" onclick="confirmFacultyImport()">
                            <i class="bi bi-check2-circle me-1"></i>Confirm Import (<span id="facImportValidCount">0</span> records)
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- BULK DELETE CONFIRMATION MODAL -->
        <div id="facultyBulkDeleteModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 540px;">
                <div class="modal-head">
                    <div>
                        <span class="text-danger">ADMINISTRATIVE ACTION</span>
                        <h2>Delete Faculty Members</h2>
                    </div>
                    <button class="modal-close" onclick="closeFacultyBulkDeleteModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <div id="facultyBulkDeleteContent"></div>
                    <div class="d-flex justify-content-end gap-2 mt-3">
                        <button type="button" class="secondary-btn" onclick="closeFacultyBulkDeleteModal()">Cancel</button>
                        <button type="button" class="btn btn-warning d-none" id="facBulkDeactivateBtn" onclick="executeBulkDeactivate()">
                            <i class="bi bi-pause-circle me-1"></i>Deactivate Instead
                        </button>
                        <button type="button" class="btn btn-danger" id="facBulkDeleteConfirmBtn" onclick="executeBulkDelete(false)">
                            <i class="bi bi-trash3 me-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// =====================================================
// 2. TABLE RENDERING & FILTERING
// =====================================================

function _renderFacultyRows(facultyList) {
    if (!facultyList || facultyList.length === 0) {
        return `<tr><td colspan="8" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-1 d-block mb-2"></i>No faculty records found</td></tr>`;
    }

    return facultyList.map(f => {
        const isDeclined = f.status === 'Declined' || f.status === 'Rejected' || f.source === 'declined';
        const statusBadge = _facultyStatusBadge(f.status);
        const roleBadge = f.role === "mentor"
            ? `<span class="badge" style="background: #ede9fe; color: #7c3aed;">MENTOR</span>`
            : `<span class="badge bg-primary">FACULTY</span>`;
        const subjectTags = (f.subjects || "None").split(",").map(s => s.trim()).filter(Boolean);
        const subjectDisplay = subjectTags.length > 2
            ? subjectTags.slice(0, 2).map(s => `<span class="faculty-tag">${s}</span>`).join("") + `<span class="faculty-tag faculty-tag--more">+${subjectTags.length - 2}</span>`
            : subjectTags.map(s => `<span class="faculty-tag">${s}</span>`).join("") || '<span class="text-muted small">None</span>';

        const initials = (f.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        const avatarColor = f.role === "mentor" ? "#7c3aed" : "var(--accent)";

        return `
            <tr class="faculty-table-row" data-faculty-id="${f.id}" data-status="${f.status}" data-role="${f.role}" data-source="${f.source || 'approved'}" data-name="${(f.display_name || '').toLowerCase()}" data-email="${(f.email || '').toLowerCase()}" data-subjects="${(f.subjects || '').toLowerCase()}">
                <td><input type="checkbox" class="faculty-select-cb" data-faculty-id="${f.id}" onchange="updateFacultySelectionCount()" style="cursor: pointer; width: 16px; height: 16px;"></td>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="faculty-avatar-sm" style="background: ${avatarColor};">${initials}</div>
                        <div>
                            <strong style="color: var(--text);">${f.display_name || f.id}</strong>
                            <div class="small" style="color: var(--text-muted);">${f.email || ''}</div>
                        </div>
                    </div>
                </td>
                <td><code style="font-size: 12px; font-weight: 600;">${f.id}</code></td>
                <td>${roleBadge}</td>
                <td><div class="d-flex flex-wrap gap-1">${subjectDisplay}</div></td>
                <td>
                    ${isDeclined ? '<span class="text-muted small">—</span>' : `
                        <span class="fw-semibold" style="color: var(--text);">${f.students_assigned || 0}</span>
                        ${f.high_risk_students > 0 ? `<span class="ms-1 small" style="color: var(--risk-high);"><i class="bi bi-exclamation-triangle-fill"></i> ${f.high_risk_students}</span>` : ''}
                    `}
                </td>
                <td>${statusBadge}</td>
                <td>
                    <div class="d-flex gap-1 flex-wrap">
                        <button class="btn btn-sm btn-outline-primary" onclick="openFacultyDrawer('${f.id}')" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${!isDeclined ? `
                            <button class="btn btn-sm btn-outline-secondary" onclick="openFacultyEditModal('${f.id}')" title="Edit Profile">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <div class="dropdown d-inline-block">
                                <button class="btn btn-sm btn-outline-secondary" type="button" onclick="toggleFacultyMenu(this)" title="More Actions">
                                    <i class="bi bi-three-dots"></i>
                                </button>
                                <div class="faculty-action-menu d-none">
                                    <a href="#" onclick="changeFacultyStatusPrompt('${f.id}', '${f.status}'); event.preventDefault();">
                                        <i class="bi bi-toggle-on me-2"></i>Change Status
                                    </a>
                                    <a href="#" onclick="viewStudent360FromFaculty('${f.id}'); event.preventDefault();">
                                        <i class="bi bi-people me-2"></i>View Students
                                    </a>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function _facultyStatusBadge(status) {
    const map = {
        "Active": `<span class="faculty-status-badge faculty-status-badge--active"><i class="bi bi-circle-fill"></i> Active</span>`,
        "Pending": `<span class="faculty-status-badge faculty-status-badge--pending"><i class="bi bi-circle-fill"></i> Pending</span>`,
        "Declined": `<span class="faculty-status-badge faculty-status-badge--declined"><i class="bi bi-circle-fill"></i> Declined</span>`,
        "Rejected": `<span class="faculty-status-badge faculty-status-badge--declined"><i class="bi bi-circle-fill"></i> Declined</span>`,
        "Inactive": `<span class="faculty-status-badge faculty-status-badge--inactive"><i class="bi bi-circle-fill"></i> Inactive</span>`,
    };
    return map[status] || map["Active"];
}

function filterFacultyTable() {
    const query = (document.getElementById("facultySearchInput")?.value || "").toLowerCase().trim();
    const statusFilter = document.getElementById("facultyFilterStatus")?.value || "ALL";
    const roleFilter = document.getElementById("facultyFilterRole")?.value || "ALL";

    const baseList = statusFilter === "Declined"
        ? (_facultyData?.declined_history || [])
        : (_facultyData?.faculty || []);

    const filtered = baseList.filter(f => {
        const name = (f.display_name || "").toLowerCase();
        const email = (f.email || "").toLowerCase();
        const subjects = (f.subjects || "").toLowerCase();
        const id = (f.id || "").toLowerCase();
        const status = f.status || "Active";
        const role = (f.role || "").toLowerCase();

        const matchesSearch = !query || name.includes(query) || email.includes(query) || subjects.includes(query) || id.includes(query);
        const matchesStatus = statusFilter === "ALL" || statusFilter === "Declined" || status === statusFilter;
        const matchesRole = roleFilter === "ALL" || role === roleFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesRole;
    });

    const tbody = document.getElementById("facultyTableBody");
    if (tbody) {
        tbody.innerHTML = _renderFacultyRows(filtered);
    }

    const summaryEl = document.getElementById("facultyCountSummary");
    if (summaryEl) {
        summaryEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${baseList.length}</strong> records`;
    }
}


// =====================================================
// 3. FACULTY DETAIL DRAWER
// =====================================================

async function openFacultyDrawer(facultyId) {
    const overlay = document.getElementById("facultyDrawerOverlay");
    const drawer = document.getElementById("facultyDrawer");
    const drawerContent = document.getElementById("facultyDrawerContent");
    if (!drawer || !drawerContent) return;

    drawerContent.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary"></div><p class="mt-3 text-muted small">Loading faculty details...</p></div>`;
    overlay?.classList.add("active");
    drawer.classList.add("active");

    const data = await API.getFacultyDetail(facultyId);
    if (!data || !data.success) {
        drawerContent.innerHTML = `<div class="text-center py-5 text-danger"><i class="bi bi-exclamation-circle fs-1"></i><p class="mt-2">Failed to load faculty details.</p></div>`;
        return;
    }

    const p = data.profile;
    const app = data.application;
    const students = data.assigned_students || [];
    const interventions = data.interventions || [];
    const ai = data.ai_summary || {};

    const initials = (p.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const roleFull = p.role === "mentor" ? "Mentor (Student Counseling & Guidance)" : "Faculty (Teaching & Assessment)";
    const roleBadge = p.role === "mentor"
        ? `<span class="badge" style="background: #ede9fe; color: #7c3aed; font-size: 11px;">${roleFull}</span>`
        : `<span class="badge bg-primary" style="font-size: 11px;">${roleFull}</span>`;
    const statusBadge = _facultyStatusBadge(p.status);
    const avatarBg = p.role === "mentor" ? "linear-gradient(135deg, #7c3aed, #a78bfa)" : "linear-gradient(135deg, var(--accent), #60a5fa)";

    const subjectTags = (p.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
    const extraRoles = (p.extra_roles || "").split(",").map(s => s.trim()).filter(Boolean);

    const highRisk = students.filter(s => (s.risk || 0) >= 60);
    const medRisk = students.filter(s => (s.risk || 0) >= 30 && (s.risk || 0) < 60);

    drawerContent.innerHTML = `
        <!-- CLOSE BUTTON -->
        <button class="faculty-drawer-close" onclick="closeFacultyDrawer()"><i class="bi bi-x-lg"></i></button>

        <!-- PROFILE HEADER -->
        <div class="faculty-drawer-header">
            <div class="faculty-avatar-lg" style="background: ${avatarBg};">${initials}</div>
            <div class="flex-grow-1">
                <h3 class="mb-1 fw-bold" style="color: var(--text);">${p.display_name}</h3>
                <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
                    <code style="font-size: 12px; background: var(--bg-sunken); padding: 2px 8px; border-radius: 4px;">${p.id}</code>
                    ${roleBadge}
                    ${statusBadge}
                </div>
            </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="faculty-drawer-actions">
            ${p.source === "approved" || p.status === "Active" || p.status === "Inactive" ? `
                <button class="btn btn-outline-primary btn-sm" onclick="openFacultyEditModal('${p.id}')">
                    <i class="bi bi-pencil me-1"></i>Edit Profile
                </button>
                <button class="btn btn-outline-secondary btn-sm" onclick="changeFacultyStatusPrompt('${p.id}', '${p.status}')">
                    <i class="bi bi-toggle-on me-1"></i>Change Status
                </button>
            ` : ''}
        </div>

        <!-- PERSONAL & CONTACT INFORMATION -->
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-person-vcard me-2"></i>Personal & Contact Information</h6>
            <div class="faculty-info-card">
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-person" style="color: var(--accent);"></i>
                        <div><span class="faculty-info-label">Full Name</span><span class="faculty-info-value">${p.display_name}</span></div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-person-badge" style="color: var(--accent);"></i>
                        <div><span class="faculty-info-label">University User ID</span><span class="faculty-info-value">${p.id}</span></div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-envelope" style="color: var(--info);"></i>
                        <div><span class="faculty-info-label">Institutional Email</span><span class="faculty-info-value">${p.email || 'N/A'}</span></div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-telephone" style="color: var(--success);"></i>
                        <div><span class="faculty-info-label">Mobile / Phone Number</span><span class="faculty-info-value">${p.phone || 'N/A'}</span></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- PROFESSIONAL INFORMATION -->
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-briefcase me-2"></i>Professional Information</h6>
            <div class="faculty-info-card">
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-shield-shaded" style="color: var(--accent);"></i>
                        <div><span class="faculty-info-label">Role</span><span class="faculty-info-value">${roleFull}</span></div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-book" style="color: var(--info);"></i>
                        <div>
                            <span class="faculty-info-label">Assigned Subjects</span>
                            <div class="d-flex flex-wrap gap-1 mt-1">
                                ${subjectTags.length > 0 ? subjectTags.map(s => `<span class="faculty-tag">${s}</span>`).join("") : '<span class="text-muted small">None assigned</span>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-briefcase" style="color: var(--warning);"></i>
                        <div>
                            <span class="faculty-info-label">Additional Responsibilities</span>
                            <div class="d-flex flex-wrap gap-1 mt-1">
                                ${extraRoles.length > 0 && extraRoles[0] !== 'None' ? extraRoles.map(r => `<span class="faculty-tag faculty-tag--secondary">${r}</span>`).join("") : '<span class="text-muted small">None</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- APPLICATION INFORMATION -->
        ${app ? `
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-file-earmark-text me-2"></i>Application Details</h6>
            <div class="faculty-info-card">
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-clipboard-check" style="color: ${app.status === 'Approved' ? 'var(--success)' : app.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)'}; "></i>
                        <div><span class="faculty-info-label">Application Status</span><span class="faculty-info-value">${_facultyStatusBadge(app.status)}</span></div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-calendar-event" style="color: var(--text-muted);"></i>
                        <div><span class="faculty-info-label">Submitted Date</span><span class="faculty-info-value">${app.submitted_date || 'N/A'}</span></div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-calendar-check" style="color: var(--text-muted);"></i>
                        <div><span class="faculty-info-label">Reviewed Date</span><span class="faculty-info-value">${app.reviewed_date ? app.reviewed_date.slice(0, 16).replace('T', ' ') : 'Not yet reviewed'}</span></div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-person-check" style="color: var(--text-muted);"></i>
                        <div><span class="faculty-info-label">Reviewed By</span><span class="faculty-info-value">${app.reviewed_date ? 'System Administrator' : '—'}</span></div>
                    </div>
                </div>
                ${app.rejection_reason ? `
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-exclamation-triangle" style="color: var(--danger);"></i>
                        <div>
                            <span class="faculty-info-label">Decline Reason</span>
                            <span class="faculty-info-value" style="color: var(--danger);">${app.rejection_reason}</span>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        ` : ''}

        <!-- MENTORSHIP & ASSIGNED STUDENTS (only for approved) -->
        ${p.source === "approved" ? `
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-people me-2"></i>Mentorship & Assigned Students</h6>
            <div class="faculty-info-card">
                <div class="d-flex flex-wrap gap-3 mb-3">
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value">${students.length}</div>
                        <div class="faculty-mini-stat-label">Assigned</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--risk-high);">${highRisk.length}</div>
                        <div class="faculty-mini-stat-label">High Risk</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--risk-medium);">${medRisk.length}</div>
                        <div class="faculty-mini-stat-label">Medium Risk</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--warning);">${ai.pending_interventions || 0}</div>
                        <div class="faculty-mini-stat-label">Pending Interventions</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--success);">${ai.completed_interventions || 0}</div>
                        <div class="faculty-mini-stat-label">Completed</div>
                    </div>
                </div>
                ${students.length > 0 ? `
                <div class="table-responsive">
                    <table class="custom-table" style="font-size: 13px;">
                        <thead><tr><th>Student</th><th>ID</th><th>Attendance</th><th>CGPA</th><th>Risk</th></tr></thead>
                        <tbody>
                            ${students.map(s => {
                                const riskClass = s.risk >= 60 ? 'high' : (s.risk >= 30 ? 'medium' : 'low');
                                return `
                                    <tr style="cursor: pointer;" onclick="closeFacultyDrawer(); setTimeout(() => typeof viewStudent360 === 'function' && viewStudent360('${s.id}'), 200);">
                                        <td><strong>${s.name}</strong></td>
                                        <td><code>${s.id}</code></td>
                                        <td>${s.attendance}%</td>
                                        <td>${s.cgpa}</td>
                                        <td><span class="risk-badge ${riskClass}">${s.risk}%</span></td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
                ` : `<div class="text-center py-3 text-muted small"><i class="bi bi-inbox me-1"></i>No students currently assigned</div>`}
            </div>
        </div>
        ` : ''}

        <!-- AI MONITORING SUMMARY (only for approved) -->
        ${p.source === "approved" ? `
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-cpu me-2"></i>AI Monitoring Summary</h6>
            <div class="faculty-info-card" style="background: linear-gradient(135deg, var(--bg-elevated), var(--bg-sunken));">
                <div class="d-flex flex-wrap gap-3">
                    <div class="faculty-ai-stat">
                        <i class="bi bi-exclamation-triangle-fill" style="color: var(--risk-high); font-size: 20px;"></i>
                        <div>
                            <div class="fw-bold" style="font-size: 18px; color: var(--risk-high);">${ai.high_risk_count || 0}</div>
                            <div class="small" style="color: var(--text-muted);">High-Risk Students</div>
                        </div>
                    </div>
                    <div class="faculty-ai-stat">
                        <i class="bi bi-bell-fill" style="color: var(--warning); font-size: 20px;"></i>
                        <div>
                            <div class="fw-bold" style="font-size: 18px; color: var(--warning);">${ai.pending_interventions || 0}</div>
                            <div class="small" style="color: var(--text-muted);">Pending Recommendations</div>
                        </div>
                    </div>
                    <div class="faculty-ai-stat">
                        <i class="bi bi-stars" style="color: var(--info); font-size: 20px;"></i>
                        <div>
                            <div class="fw-bold" style="font-size: 18px; color: var(--info);">${ai.medium_risk_count || 0}</div>
                            <div class="small" style="color: var(--text-muted);">Anomalies Detected</div>
                        </div>
                    </div>
                </div>
                <div class="mt-3 pt-3" style="border-top: 1px solid var(--border-soft);">
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="closeFacultyDrawer(); navigateTo('anomalies');">
                            <i class="bi bi-stars me-1"></i>View AI Anomalies
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="closeFacultyDrawer(); navigateTo('mentor');">
                            <i class="bi bi-person-check me-1"></i>Mentor Priority
                        </button>
                    </div>
                </div>
            </div>
        </div>
        ` : ''}
    `;
}

function closeFacultyDrawer() {
    document.getElementById("facultyDrawerOverlay")?.classList.remove("active");
    document.getElementById("facultyDrawer")?.classList.remove("active");
}


// =====================================================
// 4. EDIT MODAL
// =====================================================

let _editingFacultyId = null;

async function openFacultyEditModal(facultyId) {
    _editingFacultyId = facultyId;

    // Pre-fill from existing data
    const data = await API.getFacultyDetail(facultyId);
    if (!data || !data.profile) {
        alert("Could not load faculty data for editing.");
        return;
    }

    const p = data.profile;
    document.getElementById("editFacDisplayName").value = p.display_name || "";
    document.getElementById("editFacId").value = p.id || "";
    document.getElementById("editFacEmail").value = p.email || "";
    setPhoneInputFromFull("editFacCountryCode", "editFacPhone", p.phone || "");
    document.getElementById("editFacSubjects").value = p.subjects || "";
    document.getElementById("editFacExtraRoles").value = p.extra_roles || "";
    document.getElementById("facultyEditTitle").textContent = `Edit ${p.display_name}`;

    document.getElementById("facultyEditModal")?.classList.add("active");

    // Bind submit
    const form = document.getElementById("facultyEditForm");
    form.onsubmit = async function(e) {
        e.preventDefault();
        const payload = {
            display_name: document.getElementById("editFacDisplayName").value.trim(),
            email: document.getElementById("editFacEmail").value.trim(),
            phone: getFullPhoneNumber("editFacCountryCode", "editFacPhone"),
            subjects: document.getElementById("editFacSubjects").value.trim(),
            extra_roles: document.getElementById("editFacExtraRoles").value.trim(),
        };
        const res = await API.updateFaculty(_editingFacultyId, payload);
        if (res && res.success) {
            alert(res.message || "Faculty profile updated successfully!");
            closeFacultyEditModal();
            closeFacultyDrawer();
            renderFaculty();
        } else {
            alert(res?.message || "Failed to update faculty profile.");
        }
    };
}

function closeFacultyEditModal() {
    _editingFacultyId = null;
    document.getElementById("facultyEditModal")?.classList.remove("active");
}


// =====================================================
// 5. STATUS CHANGE
// =====================================================

async function changeFacultyStatusPrompt(facultyId, currentStatus) {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
    if (!confirm(`Change ${facultyId} status from "${currentStatus}" to "${newStatus}"?`)) return;

    const res = await API.updateFacultyStatus(facultyId, newStatus);
    if (res && res.success) {
        alert(res.message || `Status changed to ${newStatus}.`);
        closeFacultyDrawer();
        renderFaculty();
    } else {
        alert(res?.message || "Failed to change status.");
    }
}




// =====================================================
// 7. UTILITY HELPERS
// =====================================================

function toggleFacultyMenu(btn) {
    const menu = btn.nextElementSibling;
    if (!menu) return;

    // Close all other open menus first
    document.querySelectorAll(".faculty-action-menu").forEach(m => {
        if (m !== menu) m.classList.add("d-none");
    });

    menu.classList.toggle("d-none");

    // Close on outside click
    const closeHandler = (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.add("d-none");
            document.removeEventListener("click", closeHandler);
        }
    };
    if (!menu.classList.contains("d-none")) {
        setTimeout(() => document.addEventListener("click", closeHandler), 0);
    }
}

function viewStudent360FromFaculty(facultyId) {
    closeFacultyDrawer();
    if (typeof navigateTo === "function") {
        navigateTo("mentor");
    }
}

function toggleFacultyExportMenu(btn) {
    toggleFacultyMenu(btn);
}


// =====================================================
// 8. CHECKBOX SELECTION & BULK TOOLBAR
// =====================================================

function toggleFacultySelectAll(masterCb) {
    const checked = masterCb.checked;
    document.querySelectorAll(".faculty-select-cb").forEach(cb => {
        const row = cb.closest("tr");
        if (row && !row.classList.contains("d-none")) {
            cb.checked = checked;
        }
    });
    updateFacultySelectionCount();
}

function updateFacultySelectionCount() {
    const selected = document.querySelectorAll(".faculty-select-cb:checked");
    const count = selected.length;
    const toolbar = document.getElementById("facultyBulkToolbar");
    const countEl = document.getElementById("facultySelectedCount");

    if (count > 0) {
        toolbar?.classList.remove("d-none");
        if (countEl) countEl.textContent = count;
    } else {
        toolbar?.classList.add("d-none");
    }

    // Sync master checkbox
    const allCbs = document.querySelectorAll(".faculty-select-cb");
    const visibleCbs = [...allCbs].filter(cb => {
        const row = cb.closest("tr");
        return row && !row.classList.contains("d-none");
    });
    const masterCb = document.getElementById("facultySelectAll");
    if (masterCb) {
        masterCb.checked = visibleCbs.length > 0 && visibleCbs.every(cb => cb.checked);
        masterCb.indeterminate = visibleCbs.some(cb => cb.checked) && !visibleCbs.every(cb => cb.checked);
    }
}

function _getSelectedFacultyIds() {
    return [...document.querySelectorAll(".faculty-select-cb:checked")].map(cb => cb.dataset.facultyId);
}

function _getSelectedApprovedFacultyIds() {
    return [...document.querySelectorAll(".faculty-select-cb:checked")].filter(cb => {
        const row = cb.closest("tr");
        return row && row.dataset.source === "approved";
    }).map(cb => cb.dataset.facultyId);
}


// =====================================================
// 9. BULK STATUS CHANGE
// =====================================================

async function bulkActivateFaculty() {
    const ids = _getSelectedApprovedFacultyIds();
    if (ids.length === 0) { alert("No approved faculty selected for activation."); return; }
    if (!confirm(`Activate ${ids.length} faculty member(s)?`)) return;

    const res = await API.bulkStatusFaculty(ids, "Active");
    if (res && res.success) {
        alert(res.message);
        renderFaculty();
    } else {
        alert(res?.message || "Failed to activate faculty.");
    }
}

async function bulkDeactivateFaculty() {
    const ids = _getSelectedApprovedFacultyIds();
    if (ids.length === 0) { alert("No approved faculty selected for deactivation."); return; }
    if (!confirm(`Deactivate ${ids.length} faculty member(s)?`)) return;

    const res = await API.bulkStatusFaculty(ids, "Inactive");
    if (res && res.success) {
        alert(res.message);
        renderFaculty();
    } else {
        alert(res?.message || "Failed to deactivate faculty.");
    }
}


// =====================================================
// 10. BULK DELETE WITH DEPENDENCY CHECK
// =====================================================

let _bulkDeleteIds = [];

function bulkDeleteFacultyPrompt() {
    const ids = _getSelectedApprovedFacultyIds();
    if (ids.length === 0) { alert("No approved faculty selected for deletion."); return; }
    _bulkDeleteIds = ids;

    const names = ids.map(id => {
        const row = document.querySelector(`tr[data-faculty-id="${id}"]`);
        return row?.dataset.name || id;
    });

    const content = document.getElementById("facultyBulkDeleteContent");
    content.innerHTML = `
        <div class="mb-3" style="padding: 14px; background: var(--risk-high-soft); border-radius: var(--radius); border-left: 4px solid var(--risk-high);">
            <strong style="color: var(--risk-high);"><i class="bi bi-exclamation-triangle me-1"></i>Warning</strong>
            <p class="mb-0 mt-1 small" style="color: var(--text-soft);">You are about to delete <strong>${ids.length}</strong> faculty member(s). Faculty with assigned students, interventions, or application history will be <strong>deactivated</strong> instead of permanently deleted to preserve data integrity.</p>
        </div>
        <div class="small" style="color: var(--text-soft);">
            <strong>Faculty to be processed:</strong>
            <ul class="mt-1 mb-0" style="max-height: 140px; overflow-y: auto;">
                ${names.map(n => `<li>${n}</li>`).join("")}
            </ul>
        </div>
    `;

    document.getElementById("facBulkDeactivateBtn")?.classList.remove("d-none");
    document.getElementById("facultyBulkDeleteModal")?.classList.add("active");
}

function closeFacultyBulkDeleteModal() {
    _bulkDeleteIds = [];
    document.getElementById("facultyBulkDeleteModal")?.classList.remove("active");
}

async function executeBulkDelete(force) {
    if (_bulkDeleteIds.length === 0) return;
    const res = await API.bulkDeleteFaculty(_bulkDeleteIds, force);
    if (res && res.success) {
        let msg = res.message;
        if (res.deactivated > 0) {
            msg += `\n\n⚠ ${res.deactivated} faculty with dependencies were deactivated instead of deleted.`;
        }
        alert(msg);
        closeFacultyBulkDeleteModal();
        renderFaculty();
    } else {
        alert(res?.message || "Bulk delete failed.");
    }
}

async function executeBulkDeactivate() {
    if (_bulkDeleteIds.length === 0) return;
    const res = await API.bulkStatusFaculty(_bulkDeleteIds, "Inactive");
    if (res && res.success) {
        alert(`${res.updated} faculty member(s) deactivated (archive mode).`);
        closeFacultyBulkDeleteModal();
        renderFaculty();
    } else {
        alert(res?.message || "Bulk deactivation failed.");
    }
}


// =====================================================
// 11. BULK IMPORT — Multi-step Modal
// =====================================================

let _facImportParsedRows = [];
let _facImportValidRows = [];
let _facImportResults = null;

function openFacultyImportModal() {
    resetFacultyImport();
    document.getElementById("facultyImportModal")?.classList.add("active");
}

function closeFacultyImportModal() {
    resetFacultyImport();
    document.getElementById("facultyImportModal")?.classList.remove("active");
}

function resetFacultyImport() {
    _facImportParsedRows = [];
    _facImportValidRows = [];
    _facImportResults = null;
    const fileInput = document.getElementById("facultyImportFileInput");
    if (fileInput) fileInput.value = "";
    document.getElementById("facImportStep1")?.classList.remove("d-none");
    document.getElementById("facImportStep2")?.classList.add("d-none");
    document.getElementById("facImportStep3")?.classList.add("d-none");
    document.getElementById("facImportConfirmBtn")?.classList.add("d-none");
    document.getElementById("facImportParseStatus")?.classList.add("d-none");
}

function downloadFacultyTemplate(format) {
    const headers = ["Full Name", "University User ID", "Institutional Email", "Mobile/Phone", "Role", "Assigned Subjects", "Additional Responsibilities"];
    const sampleRows = [
        ["Dr. Example Faculty", "FAC100", "example.fac@university.edu", "+91 90000 12345", "faculty", "CS201,CS202", "Class Teacher"],
        ["Prof. Sample Mentor", "MEN100", "sample.men@university.edu", "+91 90000 67890", "mentor", "CS203", "Career Counselor"]
    ];

    if (format === "csv") {
        const csvContent = [headers.join(","), ...sampleRows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
        _downloadFile(csvContent, "faculty_import_template.csv", "text/csv");
    } else {
        if (typeof XLSX === "undefined") { alert("Excel library not loaded. Please use CSV format."); return; }
        const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Faculty Import");
        XLSX.writeFile(wb, "faculty_import_template.xlsx");
    }
}

async function handleFacultyFileSelected() {
    const fileInput = document.getElementById("facultyImportFileInput");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const ext = file.name.split(".").pop().toLowerCase();

    document.getElementById("facImportParseStatus")?.classList.remove("d-none");

    try {
        let rows = [];
        if (ext === "csv") {
            const text = await file.text();
            rows = _parseCSVToFacultyRows(text);
        } else if (ext === "xlsx" || ext === "xls") {
            if (typeof XLSX === "undefined") { alert("Excel library not loaded."); return; }
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
            rows = jsonRows.map(r => _mapImportRow(r));
        }

        if (rows.length === 0) {
            alert("No data rows found in file. Please check the format.");
            document.getElementById("facImportParseStatus")?.classList.add("d-none");
            return;
        }

        _facImportParsedRows = rows;
        _validateAndPreviewImport(rows);
    } catch (err) {
        alert("Error parsing file: " + err.message);
    }
    document.getElementById("facImportParseStatus")?.classList.add("d-none");
}

function _parseCSVToFacultyRows(csvText) {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = _parseCSVLine(headerLine);
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
        const vals = _parseCSVLine(lines[i]);
        if (vals.length === 0 || vals.every(v => !v.trim())) continue;
        const obj = {};
        headers.forEach((h, idx) => { obj[h.trim()] = (vals[idx] || "").trim(); });
        rows.push(_mapImportRow(obj));
    }
    return rows;
}

function _parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            result.push(current); current = "";
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

function _mapImportRow(obj) {
    // Normalize column names — support flexible headers
    const get = (...keys) => {
        for (const k of keys) {
            for (const ok of Object.keys(obj)) {
                if (ok.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")) return obj[ok];
            }
        }
        return "";
    };
    return {
        display_name: get("Full Name", "FullName", "display_name", "name", "Name"),
        id: get("University User ID", "UniversityUserID", "user_id", "id", "ID", "FacultyID", "Faculty ID"),
        email: get("Institutional Email", "InstitutionalEmail", "email", "Email"),
        phone: get("Mobile/Phone", "MobilePhone", "phone", "Phone", "Mobile"),
        role: get("Role", "role") || "faculty",
        subjects: get("Assigned Subjects", "AssignedSubjects", "subjects", "Subjects"),
        extra_roles: get("Additional Responsibilities", "AdditionalResponsibilities", "extra_roles", "ExtraRoles", "Responsibilities"),
    };
}

function _validateAndPreviewImport(rows) {
    // Get existing faculty IDs and emails for duplicate checking
    const existingIds = new Set((_facultyData?.faculty || []).map(f => f.id.toLowerCase()));
    const existingEmails = new Set((_facultyData?.faculty || []).filter(f => f.email).map(f => f.email.toLowerCase()));

    const batchIds = new Set();
    const batchEmails = new Set();
    let validCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;

    const validatedRows = rows.map((r, idx) => {
        const errors = [];

        if (!r.id) errors.push("Missing User ID");
        if (!r.display_name) errors.push("Missing Full Name");
        if (!r.email) errors.push("Missing Email");
        if (r.email && (!r.email.includes("@") || !r.email.split("@")[1]?.includes("."))) errors.push("Invalid email format");
        if (r.role && !['faculty', 'mentor'].includes(r.role.toLowerCase())) errors.push("Invalid role");

        if (r.id && existingIds.has(r.id.toLowerCase())) errors.push("Duplicate — ID exists");
        if (r.email && existingEmails.has(r.email.toLowerCase())) errors.push("Duplicate — Email exists");
        if (r.id && batchIds.has(r.id.toLowerCase())) errors.push("Duplicate — ID in batch");
        if (r.email && batchEmails.has(r.email.toLowerCase())) errors.push("Duplicate — Email in batch");

        const isDuplicate = errors.some(e => e.startsWith("Duplicate"));
        const status = errors.length === 0 ? "valid" : (isDuplicate ? "duplicate" : "invalid");

        if (status === "valid") { validCount++; batchIds.add(r.id.toLowerCase()); if (r.email) batchEmails.add(r.email.toLowerCase()); }
        else if (status === "duplicate") duplicateCount++;
        else invalidCount++;

        return { ...r, row: idx + 1, errors, status };
    });

    _facImportValidRows = validatedRows.filter(r => r.status === "valid");

    // Render preview table
    const previewBody = document.getElementById("facImportPreviewBody");
    previewBody.innerHTML = validatedRows.map(r => {
        const statusBadge = r.status === "valid"
            ? `<span class="faculty-status-badge faculty-status-badge--active"><i class="bi bi-circle-fill"></i> Valid</span>`
            : r.status === "duplicate"
            ? `<span class="faculty-status-badge faculty-status-badge--pending" title="${r.errors.join('; ')}"><i class="bi bi-circle-fill"></i> Duplicate</span>`
            : `<span class="faculty-status-badge faculty-status-badge--declined" title="${r.errors.join('; ')}"><i class="bi bi-circle-fill"></i> Invalid</span>`;
        return `<tr style="${r.status !== 'valid' ? 'opacity: 0.7;' : ''}">
            <td>${r.row}</td>
            <td>${r.display_name || '<span class="text-danger">—</span>'}</td>
            <td><code>${r.id || '—'}</code></td>
            <td>${r.email || '<span class="text-danger">—</span>'}</td>
            <td>${(r.role || 'faculty').toLowerCase()}</td>
            <td>${statusBadge}${r.errors.length > 0 ? `<div class="small text-danger mt-1">${r.errors.join(", ")}</div>` : ''}</td>
        </tr>`;
    }).join("");

    // Update summary
    document.getElementById("facImportPreviewSummary").innerHTML =
        `<span class="text-success">${validCount} valid</span> · <span class="text-warning">${duplicateCount} duplicate</span> · <span class="text-danger">${invalidCount} invalid</span> · ${rows.length} total`;

    // Show step 2
    document.getElementById("facImportStep1")?.classList.add("d-none");
    document.getElementById("facImportStep2")?.classList.remove("d-none");

    if (validCount > 0) {
        document.getElementById("facImportConfirmBtn")?.classList.remove("d-none");
        document.getElementById("facImportValidCount").textContent = validCount;
    } else {
        document.getElementById("facImportConfirmBtn")?.classList.add("d-none");
    }
}

async function confirmFacultyImport() {
    if (_facImportValidRows.length === 0) { alert("No valid records to import."); return; }

    const btn = document.getElementById("facImportConfirmBtn");
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div>Importing...';

    const res = await API.bulkImportFaculty(_facImportValidRows);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Confirm Import';

    if (res && res.success) {
        _facImportResults = res;
        _showImportSummary(res);
    } else {
        alert(res?.message || "Import failed.");
    }
}

function _showImportSummary(res) {
    document.getElementById("facImportStep2")?.classList.add("d-none");
    document.getElementById("facImportConfirmBtn")?.classList.add("d-none");
    document.getElementById("facImportStep3")?.classList.remove("d-none");

    const failedRows = (res.results || []).filter(r => r.status !== "imported");

    document.getElementById("facImportSummaryContent").innerHTML = `
        <div class="text-center mb-3">
            <i class="bi bi-check-circle-fill" style="font-size: 48px; color: var(--success);"></i>
            <h5 class="mt-2 fw-bold">Import Complete</h5>
        </div>
        <div class="d-flex justify-content-center gap-4 mb-3">
            <div class="text-center">
                <div class="fw-bold" style="font-size: 28px; color: var(--success); font-family: var(--font-mono);">${res.imported}</div>
                <div class="small text-muted">Successfully Imported</div>
            </div>
            <div class="text-center">
                <div class="fw-bold" style="font-size: 28px; color: var(--danger); font-family: var(--font-mono);">${res.failed}</div>
                <div class="small text-muted">Failed</div>
            </div>
            <div class="text-center">
                <div class="fw-bold" style="font-size: 28px; color: var(--warning); font-family: var(--font-mono);">${res.duplicates}</div>
                <div class="small text-muted">Duplicates</div>
            </div>
        </div>
        ${failedRows.length > 0 ? `
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-danger" onclick="downloadImportErrorReport()">
                <i class="bi bi-download me-1"></i>Download Error Report (${failedRows.length} rows)
            </button>
        </div>` : ''}
        <div class="text-center mt-3">
            <button class="primary-btn" onclick="closeFacultyImportModal(); renderFaculty();">
                <i class="bi bi-arrow-right me-1"></i>View Updated Faculty Table
            </button>
        </div>
    `;
}

function downloadImportErrorReport() {
    if (!_facImportResults) return;
    const failed = (_facImportResults.results || []).filter(r => r.status !== "imported");
    const headers = ["Row", "Faculty ID", "Name", "Email", "Role", "Status", "Errors"];
    const csvLines = [headers.join(",")];
    failed.forEach(r => {
        csvLines.push([r.row, r.id, `"${r.name}"`, r.email, r.role, r.status, `"${(r.errors || []).join('; ')}"`].join(","));
    });
    _downloadFile(csvLines.join("\n"), "faculty_import_errors.csv", "text/csv");
}


// =====================================================
// 12. EXPORT — CSV & Excel
// =====================================================

function _getFacultyDataForExport(onlySelected) {
    const allFaculty = _facultyData?.faculty || [];
    if (onlySelected) {
        const selectedIds = new Set(_getSelectedFacultyIds());
        return allFaculty.filter(f => selectedIds.has(f.id));
    }
    // Export currently filtered (visible) rows
    const visibleIds = new Set();
    document.querySelectorAll("#facultyTableBody tr.faculty-table-row").forEach(row => {
        if (!row.classList.contains("d-none")) visibleIds.add(row.dataset.facultyId);
    });
    return allFaculty.filter(f => visibleIds.has(f.id));
}

function _facultyToExportRows(list) {
    return list.map(f => ({
        "Full Name": f.display_name || "",
        "University User ID": f.id || "",
        "Institutional Email": f.email || "",
        "Mobile/Phone": f.phone || "",
        "Role": (f.role || "").charAt(0).toUpperCase() + (f.role || "").slice(1),
        "Assigned Subjects": f.subjects || "",
        "Additional Responsibilities": f.extra_roles || "",
        "Status": f.status || "",
        "Students Assigned": f.students_assigned || 0,
    }));
}

function exportFacultyCSV() {
    const data = _getFacultyDataForExport(false);
    if (data.length === 0) { alert("No faculty records to export."); return; }
    const rows = _facultyToExportRows(data);
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(",")];
    rows.forEach(r => {
        csvLines.push(headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(","));
    });
    _downloadFile(csvLines.join("\n"), `faculty_export_${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
}

function exportFacultyExcel() {
    if (typeof XLSX === "undefined") { alert("Excel library not loaded. Please use CSV export."); return; }
    const data = _getFacultyDataForExport(false);
    if (data.length === 0) { alert("No faculty records to export."); return; }
    const rows = _facultyToExportRows(data);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty");
    XLSX.writeFile(wb, `faculty_export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportSelectedFacultyCSV() {
    const data = _getFacultyDataForExport(true);
    if (data.length === 0) { alert("No faculty selected to export."); return; }
    const rows = _facultyToExportRows(data);
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(",")];
    rows.forEach(r => {
        csvLines.push(headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(","));
    });
    _downloadFile(csvLines.join("\n"), `faculty_selected_${new Date().toISOString().slice(0,10)}.csv`, "text/csv");
}

function _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
