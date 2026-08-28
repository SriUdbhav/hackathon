/* =====================================================
   FACULTY.JS
   Admin → Faculty & Mentor Management Page
   Enterprise University Administration Design
   Renders: Summary Cards, Search Toolbar, Faculty Table,
   Detail Drawer, Add/Edit Modals, Status Change,
   3-Step Bulk Import, and Bulk Operations
   ===================================================== */

let _facultyData = null;
let _facultySearchQuery = "";
let _facultyFilterStatus = "ALL";
let _facultyFilterRole = "ALL";
let _facultyFilterDept = "ALL";

// =====================================================
// 1. MAIN PAGE RENDER
// =====================================================

async function renderFaculty() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "").toLowerCase();
    if (role !== "admin") {
        content.innerHTML = `
            <div class="text-center py-5">
                <div class="mb-3 text-danger"><i class="bi bi-shield-lock fs-1"></i></div>
                <h4 class="fw-bold">Access Restricted</h4>
                <p class="text-muted small">Only university administrators can manage faculty and mentor accounts.</p>
            </div>`;
        return;
    }

    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" style="width: 2.2rem; height: 2.2rem;" role="status"></div>
            <p class="mt-3 text-muted small fw-semibold">Loading Faculty & Mentor Records...</p>
        </div>`;

    const result = await API.getFaculty();
    _facultyData = result;

    const summary = result?.summary || {};
    const faculty = result?.faculty || [];

    content.innerHTML = `
        <!-- PAGE HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h4 fw-bold mb-1" style="color: var(--text); letter-spacing: -0.3px;">
                    <i class="bi bi-person-workspace me-2" style="color: var(--accent);"></i>Faculty & Mentor Management
                </h1>
                <p class="text-muted small mb-0">Manage approved faculty accounts, view assigned subjects, track student mentorship, and monitor performance</p>
            </div>
            <div class="d-flex gap-2 flex-wrap align-items-center">
                <button class="secondary-btn" onclick="openFacultyImportModal()" style="height: 38px;">
                    <i class="bi bi-file-earmark-arrow-up text-primary me-1"></i> Import Faculty
                </button>
                <button class="primary-btn" onclick="openAddFacultyModal()" style="height: 38px;">
                    <i class="bi bi-plus-lg me-1"></i> Add Faculty
                </button>
                <div class="dropdown d-inline-block position-relative">
                    <button class="secondary-btn" type="button" onclick="toggleFacultyExportMenu(this)" style="height: 38px;" title="Export Data">
                        <i class="bi bi-download me-1"></i> Export <i class="bi bi-chevron-down ms-1 small text-muted"></i>
                    </button>
                    <div class="faculty-action-menu d-none" style="right: 0; min-width: 170px;">
                        <a href="#" onclick="exportFacultyCSV(); event.preventDefault();"><i class="bi bi-filetype-csv me-2 text-primary"></i>Export as CSV</a>
                        <a href="#" onclick="exportFacultyExcel(); event.preventDefault();"><i class="bi bi-file-earmark-excel me-2 text-success"></i>Export as Excel</a>
                    </div>
                </div>
            </div>
        </div>

        <!-- SUMMARY CARDS (5 Balanced KPI Tiles) -->
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
                <div class="faculty-stat-card ${summary.pending_applications > 0 ? 'faculty-stat-card--alert' : ''}" style="cursor: pointer;" onclick="navigateTo('users')" title="Click to view Approval Queue">
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
                    <div class="faculty-stat-icon" style="background: rgba(124, 58, 237, 0.1); color: #7c3aed;">
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
                    <div class="faculty-stat-icon" style="background: rgba(219, 39, 119, 0.1); color: #db2777;">
                        <i class="bi bi-person-check-fill"></i>
                    </div>
                    <div>
                        <div class="faculty-stat-value">${summary.total_students_assigned || 0}</div>
                        <div class="faculty-stat-label">Students Assigned</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- BULK ACTION TOOLBAR (Appears smoothly when rows are selected) -->
        <div id="facultyBulkToolbar" class="faculty-bulk-toolbar d-none">
            <div class="d-flex align-items-center gap-3 flex-wrap">
                <span class="fw-bold small" style="color: var(--text);">
                    <span id="facultySelectedCount" class="badge bg-primary me-1">0</span> Faculty Selected
                </span>
                <div class="vr mx-1 d-none d-md-block" style="opacity: 0.2;"></div>
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-success fw-semibold" onclick="bulkActivateFaculty()" title="Activate Selected">
                        <i class="bi bi-check-circle me-1"></i>Activate
                    </button>
                    <button class="btn btn-sm btn-outline-secondary fw-semibold" onclick="bulkDeactivateFaculty()" title="Deactivate Selected">
                        <i class="bi bi-pause-circle me-1"></i>Deactivate
                    </button>
                    <button class="btn btn-sm btn-outline-primary fw-semibold" onclick="exportSelectedFacultyCSV()" title="Export Selected to CSV">
                        <i class="bi bi-download me-1"></i>Export Selected
                    </button>
                    <button class="btn btn-sm btn-outline-danger fw-semibold" onclick="bulkDeleteFacultyPrompt()" title="Delete / Archive Selected">
                        <i class="bi bi-trash3 me-1"></i>Delete / Archive
                    </button>
                </div>
            </div>
        </div>

        <!-- SEARCH & FILTER TOOLBAR (Unified Clean Line) -->
        <div class="faculty-toolbar-card">
            <div class="row g-2 align-items-center">
                <!-- Search Box (Visually dominant) -->
                <div class="col-12 col-md-4 col-lg-5">
                    <div class="faculty-search-input-group">
                        <i class="bi bi-search"></i>
                        <input type="text" id="facultySearchInput" placeholder="Search faculty by name, ID, email, or subjects..." onkeyup="filterFacultyTable()">
                    </div>
                </div>

                <!-- Status Filter -->
                <div class="col-6 col-md-2 col-lg-2">
                    <select id="facultyFilterStatus" class="form-select faculty-filter-select" onchange="filterFacultyTable()">
                        <option value="ALL">All Status</option>
                        <option value="Active">🟢 Active</option>
                        <option value="Inactive">⚪ Inactive</option>
                        <option value="Declined">🔴 Declined</option>
                    </select>
                </div>

                <!-- Role Filter -->
                <div class="col-6 col-md-2 col-lg-2">
                    <select id="facultyFilterRole" class="form-select faculty-filter-select" onchange="filterFacultyTable()">
                        <option value="ALL">All Roles</option>
                        <option value="faculty">Faculty</option>
                        <option value="mentor">Mentor</option>
                    </select>
                </div>

                <!-- Department / Subject Area Filter -->
                <div class="col-6 col-md-2 col-lg-2">
                    <select id="facultyFilterDept" class="form-select faculty-filter-select" onchange="filterFacultyTable()">
                        <option value="ALL">All Depts</option>
                        <option value="cs">CSE / IT</option>
                        <option value="ec">ECE</option>
                        <option value="ai">AI & DS</option>
                        <option value="ma">Mathematics</option>
                    </select>
                </div>

                <!-- Results Counter -->
                <div class="col-6 col-md-2 col-lg-1 text-end my-auto">
                    <span class="small" id="facultyCountSummary" style="color: var(--text-soft); font-size: 11.5px;">
                        <strong>${faculty.length}</strong> total
                    </span>
                </div>
            </div>
        </div>

        <!-- FACULTY DATA TABLE -->
        <div class="faculty-table-card">
            <div class="faculty-table-responsive">
                <table class="faculty-custom-table" id="facultyTable">
                    <thead>
                        <tr>
                            <th style="width: 42px; text-align: center;">
                                <input type="checkbox" id="facultySelectAll" onchange="toggleFacultySelectAll(this)" style="cursor: pointer; width: 15px; height: 15px; accent-color: var(--accent);">
                            </th>
                            <th style="min-width: 220px;">Faculty</th>
                            <th style="width: 110px;">ID</th>
                            <th style="width: 110px;">Role</th>
                            <th style="min-width: 180px;">Assigned Subjects</th>
                            <th style="width: 120px;">Students</th>
                            <th style="width: 120px;">Status</th>
                            <th style="width: 110px; text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="facultyTableBody">
                        ${_renderFacultyRows(faculty)}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- FACULTY DETAIL DRAWER (Slide-in Right Panel) -->
        <div id="facultyDrawerOverlay" class="faculty-drawer-overlay" onclick="closeFacultyDrawer()"></div>
        <div id="facultyDrawer" class="faculty-drawer">
            <div id="facultyDrawerContent"></div>
        </div>

        <!-- ADD FACULTY MODAL -->
        <div id="facultyAddModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 580px;">
                <div class="modal-head">
                    <div>
                        <span>UNIVERSITY ADMINISTRATION</span>
                        <h2>Add New Faculty Member</h2>
                    </div>
                    <button class="modal-close" onclick="closeAddFacultyModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="facultyAddForm" class="p-3" onsubmit="handleCreateFaculty(event)">
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Full Name <span class="text-danger">*</span></label>
                            <input type="text" id="addFacDisplayName" class="form-control" placeholder="e.g. Dr. K. Satyanarayana" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Faculty User ID <span class="text-danger">*</span></label>
                            <input type="text" id="addFacId" class="form-control" placeholder="e.g. FAC004" required>
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Institutional Email <span class="text-danger">*</span></label>
                            <input type="email" id="addFacEmail" class="form-control" placeholder="faculty@vignan.ac.in" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Role <span class="text-danger">*</span></label>
                            <select id="addFacRole" class="form-select">
                                <option value="faculty" selected>Faculty (Teaching & Assessment)</option>
                                <option value="mentor">Mentor (Counseling & Guidance)</option>
                            </select>
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Department <span class="text-danger">*</span></label>
                            <select id="addFacDept" class="form-select">
                                <option value="CSE" selected>Computer Science & Eng (CSE)</option>
                                <option value="ECE">Electronics & Comm (ECE)</option>
                                <option value="AI & DS">Artificial Intelligence & DS</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="IT">Information Technology (IT)</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Assigned Mentorship Year</label>
                            <select id="addFacYear" class="form-select">
                                <option value="1st Year">1st Year Cohort</option>
                                <option value="2nd Year" selected>2nd Year Cohort</option>
                                <option value="3rd Year">3rd Year Cohort</option>
                                <option value="4th Year">4th Year Cohort</option>
                                <option value="All Years">All Years</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Phone / Mobile</label>
                        <div class="d-flex gap-2">
                            <select id="addFacCountryCode" class="form-select" style="width: 145px; font-size: 12.5px; font-weight: 500;" onchange="updatePhoneLimit('addFacCountryCode', 'addFacPhone')">
                                <option value="+91" data-len="10" data-code="+91" selected>🇮🇳 +91 (India)</option>
                                <option value="+1" data-len="10" data-code="+1">🇺🇸 +1 (US)</option>
                                <option value="+44" data-len="10" data-code="+44">🇬🇧 +44 (UK)</option>
                                <option value="+971" data-len="9" data-code="+971">🇦🇪 +971 (UAE)</option>
                                <option value="+65" data-len="8" data-code="+65">🇸🇬 +65 (Singapore)</option>
                                <option value="+61" data-len="9" data-code="+61">🇦🇺 +61 (Australia)</option>
                            </select>
                            <input type="tel" id="addFacPhone" class="form-control flex-grow-1" placeholder="10-digit mobile number" maxlength="10" oninput="formatPhoneDigits(this)">
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Assigned Subjects</label>
                            <input type="text" id="addFacSubjects" class="form-control" placeholder="e.g. CS201, CS202">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Mentorship Specialization</label>
                            <input type="text" id="addFacSpecialization" class="form-control" placeholder="e.g. Core Programming & Counseling">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Additional Responsibilities</label>
                        <input type="text" id="addFacExtraRoles" class="form-control" placeholder="e.g. Class Teacher, Lab Incharge, 2nd Year Coordinator">
                    </div>
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeAddFacultyModal()">Cancel</button>
                        <button type="submit" class="primary-btn" id="addFacSubmitBtn"><i class="bi bi-check2 me-1"></i>Add Faculty Record</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- FACULTY EDIT MODAL -->
        <div id="facultyEditModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 580px;">
                <div class="modal-head">
                    <div>
                        <span>FACULTY MANAGEMENT</span>
                        <h2 id="facultyEditTitle">Edit Faculty Profile</h2>
                    </div>
                    <button class="modal-close" onclick="closeFacultyEditModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="facultyEditForm" class="p-3">
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Display Name</label>
                            <input type="text" id="editFacDisplayName" class="form-control" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Faculty ID</label>
                            <input type="text" id="editFacId" class="form-control" readonly disabled>
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Email</label>
                            <input type="email" id="editFacEmail" class="form-control">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Phone / Mobile</label>
                            <div class="d-flex gap-2">
                                <select id="editFacCountryCode" class="form-select" style="width: 145px; font-size: 12.5px; font-weight: 500;" onchange="updatePhoneLimit('editFacCountryCode', 'editFacPhone')">
                                    <option value="+91" data-len="10" data-code="+91" selected>🇮🇳 +91 (India)</option>
                                    <option value="+1" data-len="10" data-code="+1">🇺🇸 +1 (US)</option>
                                    <option value="+44" data-len="10" data-code="+44">🇬🇧 +44 (UK)</option>
                                    <option value="+971" data-len="9" data-code="+971">🇦🇪 +971 (UAE)</option>
                                    <option value="+65" data-len="8" data-code="+65">🇸🇬 +65 (Singapore)</option>
                                    <option value="+61" data-len="9" data-code="+61">🇦🇺 +61 (Australia)</option>
                                </select>
                                <input type="tel" id="editFacPhone" class="form-control flex-grow-1" placeholder="10-digit number" maxlength="10" oninput="formatPhoneDigits(this)">
                            </div>
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Department</label>
                            <select id="editFacDept" class="form-select">
                                <option value="CSE">Computer Science & Eng (CSE)</option>
                                <option value="ECE">Electronics & Comm (ECE)</option>
                                <option value="AI & DS">Artificial Intelligence & DS</option>
                                <option value="Mathematics">Mathematics</option>
                                <option value="IT">Information Technology (IT)</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Assigned Mentorship Year</label>
                            <select id="editFacYear" class="form-select">
                                <option value="1st Year">1st Year Cohort</option>
                                <option value="2nd Year">2nd Year Cohort</option>
                                <option value="3rd Year">3rd Year Cohort</option>
                                <option value="4th Year">4th Year Cohort</option>
                                <option value="All Years">All Years</option>
                            </select>
                        </div>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Assigned Subjects</label>
                            <input type="text" id="editFacSubjects" class="form-control" placeholder="e.g. CS201, CS202">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small">Specialization / Focus Area</label>
                            <input type="text" id="editFacSpecialization" class="form-control" placeholder="e.g. Database Systems & Mentorship">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small">Additional Responsibilities</label>
                        <input type="text" id="editFacExtraRoles" class="form-control" placeholder="e.g. Class Teacher, Lab Incharge">
                    </div>
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeFacultyEditModal()">Cancel</button>
                        <button type="submit" class="primary-btn"><i class="bi bi-check2 me-1"></i>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- FACULTY IMPORT MODAL (3-Step Professional Workflow: Upload → Validate → Confirm) -->
        <div id="facultyImportModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 820px;">
                <div class="modal-head">
                    <div>
                        <span>DATA INGESTION</span>
                        <h2>Import Faculty Members</h2>
                    </div>
                    <button class="modal-close" onclick="closeFacultyImportModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <!-- Step Progress Pills -->
                    <div class="fac-step-pills">
                        <div class="fac-step-pill active" id="facStepPill1"><i class="bi bi-1-circle-fill"></i> Upload File</div>
                        <i class="bi bi-chevron-right text-muted small"></i>
                        <div class="fac-step-pill" id="facStepPill2"><i class="bi bi-2-circle-fill"></i> Validate & Preview</div>
                        <i class="bi bi-chevron-right text-muted small"></i>
                        <div class="fac-step-pill" id="facStepPill3"><i class="bi bi-3-circle-fill"></i> Confirmation</div>
                    </div>

                    <!-- STEP 1: Upload Dropzone -->
                    <div id="facImportStep1">
                        <div class="fac-import-dropzone mb-3" onclick="document.getElementById('facultyImportFileInput').click()">
                            <i class="bi bi-cloud-arrow-up text-primary" style="font-size: 42px;"></i>
                            <h6 class="fw-bold mt-2 mb-1" style="color: var(--text);">Drop CSV or Excel file here or Browse Files</h6>
                            <p class="text-muted small mb-2">Supported file formats: <code>.CSV</code> or <code>.XLSX</code> (Max 5MB)</p>
                            <button type="button" class="secondary-btn btn-sm mx-auto" onclick="document.getElementById('facultyImportFileInput').click(); event.stopPropagation();">
                                <i class="bi bi-folder2-open me-1"></i>Choose Local File
                            </button>
                            <input type="file" id="facultyImportFileInput" class="d-none" accept=".csv,.xlsx,.xls" onchange="handleFacultyFileSelected()">
                        </div>
                        <div class="d-flex justify-content-between align-items-center p-2 rounded" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                            <span class="small fw-semibold text-muted"><i class="bi bi-file-earmark-spreadsheet me-1"></i>Sample Templates:</span>
                            <div class="d-flex gap-2">
                                <a href="#" class="small text-decoration-none fw-semibold" onclick="downloadFacultyTemplate('csv'); event.preventDefault();" style="color: var(--accent);">
                                    <i class="bi bi-download me-1"></i>CSV Template
                                </a>
                                <span class="text-muted">·</span>
                                <a href="#" class="small text-decoration-none fw-semibold" onclick="downloadFacultyTemplate('xlsx'); event.preventDefault();" style="color: var(--accent);">
                                    <i class="bi bi-download me-1"></i>Excel (.xlsx) Template
                                </a>
                            </div>
                        </div>
                        <div id="facImportParseStatus" class="d-none mt-3 text-center">
                            <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                            <span class="small text-muted fw-semibold">Parsing and validating records...</span>
                        </div>
                    </div>

                    <!-- STEP 2: Preview & Validation -->
                    <div id="facImportStep2" class="d-none">
                        <div class="fac-validation-summary-bar">
                            <span class="small fw-bold text-muted me-2">Validation Summary:</span>
                            <div id="facImportPreviewSummary" class="d-flex gap-2 flex-wrap"></div>
                            <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="resetFacultyImport()"><i class="bi bi-arrow-left me-1"></i>Change File</button>
                        </div>
                        <div class="table-responsive border rounded" style="max-height: 320px; overflow-y: auto;">
                            <table class="faculty-custom-table" id="facImportPreviewTable">
                                <thead>
                                    <tr>
                                        <th style="width: 50px;">Row</th>
                                        <th>Name</th>
                                        <th>Faculty ID</th>
                                        <th>Institutional Email</th>
                                        <th>Role</th>
                                        <th>Status / Issues</th>
                                    </tr>
                                </thead>
                                <tbody id="facImportPreviewBody"></tbody>
                            </table>
                        </div>
                    </div>

                    <!-- STEP 3: Summary Completion Screen -->
                    <div id="facImportStep3" class="d-none">
                        <div id="facImportSummaryContent"></div>
                    </div>

                    <!-- MODAL FOOTER ACTIONS -->
                    <div class="d-flex justify-content-end gap-2 mt-4 pt-2 border-top" id="facImportActions">
                        <button type="button" class="secondary-btn" onclick="closeFacultyImportModal()">Cancel</button>
                        <button type="button" class="primary-btn d-none" id="facImportConfirmBtn" onclick="confirmFacultyImport()">
                            <i class="bi bi-check2-circle me-1"></i>Import <span id="facImportValidCount">0</span> Faculty Members
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- BULK DELETE / ARCHIVE SAFETY CONFIRMATION MODAL -->
        <div id="facultyBulkDeleteModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 540px;">
                <div class="modal-head">
                    <div>
                        <span class="text-danger">ADMINISTRATIVE ACTION</span>
                        <h2>Delete / Deactivate Faculty</h2>
                    </div>
                    <button class="modal-close" onclick="closeFacultyBulkDeleteModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <div id="facultyBulkDeleteContent"></div>
                    <div class="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeFacultyBulkDeleteModal()">Cancel</button>
                        <button type="button" class="btn btn-warning fw-semibold d-none" id="facBulkDeactivateBtn" onclick="executeBulkDeactivate()">
                            <i class="bi bi-pause-circle me-1"></i>Deactivate Instead (Recommended)
                        </button>
                        <button type="button" class="btn btn-danger fw-semibold" id="facBulkDeleteConfirmBtn" onclick="executeBulkDelete(false)">
                            <i class="bi bi-trash3 me-1"></i>Permanent Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// =====================================================
// 2. TABLE ROW RENDERING & FILTERING
// =====================================================

function _renderFacultyRows(facultyList) {
    if (!facultyList || facultyList.length === 0) {
        return `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="text-muted mb-2"><i class="bi bi-inbox fs-1" style="opacity: 0.5;"></i></div>
                    <h6 class="fw-bold mb-1" style="color: var(--text);">No faculty records found</h6>
                    <p class="text-muted small mb-0">Try clearing or adjusting your search keyword and filter criteria.</p>
                </td>
            </tr>`;
    }

    return facultyList.map(f => {
        const isDeclined = f.status === 'Declined' || f.status === 'Rejected' || f.source === 'declined';
        const statusBadge = _facultyStatusBadge(f.status);
        const rolePill = f.role === "mentor"
            ? `<span class="faculty-role-pill faculty-role-pill--mentor">MENTOR</span>`
            : `<span class="faculty-role-pill faculty-role-pill--faculty">FACULTY</span>`;

        const subjectTags = (f.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
        const subjectDisplay = subjectTags.length > 2
            ? subjectTags.slice(0, 2).map(s => `<span class="faculty-tag">${s}</span>`).join(" ") + ` <span class="faculty-tag faculty-tag--more">+${subjectTags.length - 2}</span>`
            : subjectTags.map(s => `<span class="faculty-tag">${s}</span>`).join(" ") || '<span class="text-muted small">None assigned</span>';

        const initials = (f.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        const avatarBg = f.role === "mentor" ? "#7c3aed" : "var(--accent)";

        return `
            <tr class="faculty-table-row" data-faculty-id="${f.id}" data-status="${f.status}" data-role="${f.role}" data-source="${f.source || 'approved'}" data-name="${(f.display_name || '').toLowerCase()}" data-email="${(f.email || '').toLowerCase()}" data-subjects="${(f.subjects || '').toLowerCase()}">
                <td style="text-align: center;">
                    <input type="checkbox" class="faculty-select-cb" data-faculty-id="${f.id}" onchange="updateFacultySelectionCount()" style="cursor: pointer; width: 15px; height: 15px; accent-color: var(--accent);">
                </td>
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="faculty-avatar-sm" style="background: ${avatarBg};">${initials}</div>
                        <div>
                            <strong style="color: var(--text); font-size: 13.5px; font-weight: 600;">${f.display_name || f.id}</strong>
                            <div class="small text-muted" style="font-size: 12px;">${f.email || 'No email registered'}</div>
                        </div>
                    </div>
                </td>
                <td><code style="font-size: 12px; font-weight: 600; background: var(--bg-sunken); padding: 2px 6px; border-radius: 4px; color: var(--text);">${f.id}</code></td>
                <td>${rolePill}</td>
                <td><div class="d-flex flex-wrap gap-1 align-items-center">${subjectDisplay}</div></td>
                <td>
                    ${isDeclined ? '<span class="text-muted small">—</span>' : `
                        <span class="fw-bold" style="color: var(--text);">${f.students_assigned || 0}</span>
                        ${f.high_risk_students > 0 ? `<span class="ms-1 badge bg-danger-subtle text-danger border border-danger-subtle" title="${f.high_risk_students} high-risk students assigned" style="font-size: 10.5px;"><i class="bi bi-exclamation-triangle-fill me-1"></i>${f.high_risk_students}</span>` : ''}
                    `}
                </td>
                <td>${statusBadge}</td>
                <td style="text-align: right;">
                    <div class="d-flex gap-1 justify-content-end align-items-center">
                        <button class="faculty-view-btn" onclick="openFacultyDrawer('${f.id}')" title="View Full Details">
                            <i class="bi bi-eye"></i> View
                        </button>
                        <div class="dropdown d-inline-block position-relative">
                            <button class="faculty-more-btn" type="button" onclick="toggleFacultyMenu(this)" title="More Actions">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <div class="faculty-action-menu d-none">
                                <a href="#" onclick="openFacultyDrawer('${f.id}'); event.preventDefault();">
                                    <i class="bi bi-person-lines-fill me-2 text-primary"></i>View Full Profile
                                </a>
                                ${!isDeclined ? `
                                    <a href="#" onclick="openFacultyEditModal('${f.id}'); event.preventDefault();">
                                        <i class="bi bi-pencil me-2 text-secondary"></i>Edit Profile
                                    </a>
                                    <a href="#" onclick="viewStudent360FromFaculty('${f.id}'); event.preventDefault();">
                                        <i class="bi bi-people me-2 text-info"></i>Assign / View Students
                                    </a>
                                    <a href="#" onclick="changeFacultyStatusPrompt('${f.id}', '${f.status}'); event.preventDefault();">
                                        <i class="bi bi-toggle-on me-2 text-warning"></i>${f.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                    </a>
                                    <div class="dropdown-divider my-1"></div>
                                    <a href="#" onclick="exportSingleFacultyCSV('${f.id}'); event.preventDefault();">
                                        <i class="bi bi-download me-2 text-muted"></i>Export Record
                                    </a>
                                    <a href="#" class="text-danger" onclick="promptSingleFacultyDelete('${f.id}'); event.preventDefault();">
                                        <i class="bi bi-trash3 me-2"></i>Delete / Archive
                                    </a>
                                ` : ''}
                            </div>
                        </div>
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
    const statusFilter = (document.getElementById("facultyFilterStatus")?.value || "all").toLowerCase().trim();
    const roleFilter = (document.getElementById("facultyFilterRole")?.value || "all").toLowerCase().trim();
    const deptFilter = (document.getElementById("facultyFilterDept")?.value || "all").toLowerCase().trim();

    const baseList = statusFilter === "declined"
        ? (_facultyData?.declined_history || [])
        : (_facultyData?.faculty || []);

    const filtered = baseList.filter(f => {
        const name = (f.display_name || "").toLowerCase();
        const email = (f.email || "").toLowerCase();
        const subjects = (f.subjects || "").toLowerCase();
        const id = (f.id || "").toLowerCase();
        const rawStatus = (f.status || "Active").toLowerCase();
        const rawRole = (f.role || "").toLowerCase();
        const extraRoles = (f.extra_roles || "").toLowerCase();

        // 1. Search Query Match
        const matchesSearch = !query || name.includes(query) || email.includes(query) || subjects.includes(query) || id.includes(query) || extraRoles.includes(query);

        // 2. Status Match
        let matchesStatus = false;
        if (statusFilter === "all") {
            matchesStatus = true;
        } else if (statusFilter === "active") {
            matchesStatus = rawStatus === "active" || rawStatus === "approved";
        } else if (statusFilter === "inactive") {
            matchesStatus = rawStatus === "inactive" || rawStatus === "disabled";
        } else if (statusFilter === "declined") {
            matchesStatus = rawStatus === "declined" || rawStatus === "rejected";
        } else {
            matchesStatus = rawStatus === statusFilter;
        }

        // 3. Role Match
        let matchesRole = false;
        if (roleFilter === "all") {
            matchesRole = true;
        } else if (roleFilter === "faculty") {
            matchesRole = rawRole === "faculty" || extraRoles.includes("faculty");
        } else if (roleFilter === "mentor") {
            matchesRole = rawRole === "mentor" || extraRoles.includes("mentor");
        } else {
            matchesRole = rawRole === roleFilter || extraRoles.includes(roleFilter);
        }

        // 4. Department Match
        let matchesDept = false;
        if (deptFilter === "all") {
            matchesDept = true;
        } else if (deptFilter === "cs") {
            matchesDept = subjects.includes("cs") || subjects.includes("cse") || subjects.includes("it") || extraRoles.includes("cse");
        } else if (deptFilter === "ec") {
            matchesDept = subjects.includes("ec") || subjects.includes("ece") || extraRoles.includes("ece");
        } else if (deptFilter === "ai") {
            matchesDept = subjects.includes("ai") || subjects.includes("ds") || extraRoles.includes("ai");
        } else if (deptFilter === "ma") {
            matchesDept = subjects.includes("ma") || subjects.includes("math") || extraRoles.includes("math");
        } else {
            matchesDept = subjects.includes(deptFilter) || extraRoles.includes(deptFilter);
        }

        return matchesSearch && matchesStatus && matchesRole && matchesDept;
    });

    const tbody = document.getElementById("facultyTableBody");
    if (tbody) {
        tbody.innerHTML = _renderFacultyRows(filtered);
    }

    const summaryEl = document.getElementById("facultyCountSummary");
    if (summaryEl) {
        summaryEl.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${baseList.length}</strong>`;
    }
}


// =====================================================
// 3. FACULTY DETAIL DRAWER (Slide-in Right Panel)
// =====================================================

async function openFacultyDrawer(facultyId) {
    const overlay = document.getElementById("facultyDrawerOverlay");
    const drawer = document.getElementById("facultyDrawer");
    const drawerContent = document.getElementById("facultyDrawerContent");
    if (!drawer || !drawerContent) return;

    drawerContent.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted small fw-semibold">Loading faculty profile & telemetry...</p>
        </div>`;
    overlay?.classList.add("active");
    drawer.classList.add("active");

    const data = await API.getFacultyDetail(facultyId);
    if (!data || !data.success) {
        drawerContent.innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="bi bi-exclamation-circle fs-1"></i>
                <p class="mt-2 fw-semibold">Failed to load faculty details.</p>
                <button class="secondary-btn btn-sm mt-2" onclick="closeFacultyDrawer()">Close Drawer</button>
            </div>`;
        return;
    }

    const p = data.profile;
    const app = data.application;
    const students = data.assigned_students || [];
    const ai = data.ai_summary || {};

    const initials = (p.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const roleFull = p.role === "mentor" ? "Mentor (Student Counseling & Guidance)" : "Faculty (Teaching & Assessment)";
    const roleBadge = p.role === "mentor"
        ? `<span class="faculty-role-pill faculty-role-pill--mentor">MENTOR</span>`
        : `<span class="faculty-role-pill faculty-role-pill--faculty">FACULTY</span>`;
    const statusBadge = _facultyStatusBadge(p.status);
    const avatarBg = p.role === "mentor" ? "#7c3aed" : "var(--accent)";

    const subjectTags = (p.subjects || "").split(",").map(s => s.trim()).filter(Boolean);
    const extraRoles = (p.extra_roles || "").split(",").map(s => s.trim()).filter(Boolean);

    const highRisk = students.filter(s => (s.risk || 0) >= 60);
    const medRisk = students.filter(s => (s.risk || 0) >= 30 && (s.risk || 0) < 60);

    drawerContent.innerHTML = `
        <!-- CLOSE BUTTON -->
        <button class="faculty-drawer-close" onclick="closeFacultyDrawer()" title="Close details"><i class="bi bi-x-lg"></i></button>

        <!-- PROFILE HEADER -->
        <div class="faculty-drawer-header">
            <div class="faculty-avatar-lg" style="background: ${avatarBg};">${initials}</div>
            <div class="flex-grow-1">
                <h4 class="mb-1 fw-bold" style="color: var(--text); letter-spacing: -0.2px;">${p.display_name}</h4>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                    <code style="font-size: 12px; background: var(--bg-sunken); padding: 2px 8px; border-radius: 4px; color: var(--text);">${p.id}</code>
                    ${roleBadge}
                    ${statusBadge}
                </div>
            </div>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="faculty-drawer-actions">
            ${p.source === "approved" || p.status === "Active" || p.status === "Inactive" ? `
                <button class="btn btn-outline-primary btn-sm fw-semibold" onclick="openFacultyEditModal('${p.id}')">
                    <i class="bi bi-pencil me-1"></i>Edit Profile
                </button>
                <button class="btn btn-outline-secondary btn-sm fw-semibold" onclick="changeFacultyStatusPrompt('${p.id}', '${p.status}')">
                    <i class="bi bi-toggle-on me-1"></i>${p.status === 'Active' ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-outline-secondary btn-sm fw-semibold" onclick="exportSingleFacultyCSV('${p.id}')">
                    <i class="bi bi-download me-1"></i>Export Record
                </button>
            ` : ''}
        </div>

        <!-- 1. PERSONAL & CONTACT INFORMATION -->
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-person-vcard me-2"></i>Contact Information</h6>
            <div class="faculty-info-card">
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-envelope text-primary"></i>
                        <div>
                            <span class="faculty-info-label">Institutional Email</span>
                            <span class="faculty-info-value">${p.email || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-telephone text-success"></i>
                        <div>
                            <span class="faculty-info-label">Mobile / Phone</span>
                            <span class="faculty-info-value">${p.phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-person-badge text-muted"></i>
                        <div>
                            <span class="faculty-info-label">University User ID</span>
                            <span class="faculty-info-value">${p.id}</span>
                        </div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-building text-muted"></i>
                        <div>
                            <span class="faculty-info-label">Institution</span>
                            <span class="faculty-info-value">Vignan University</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. PROFESSIONAL INFORMATION -->
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-briefcase me-2"></i>Professional Information</h6>
            <div class="faculty-info-card">
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-shield-shaded text-primary"></i>
                        <div>
                            <span class="faculty-info-label">Role Description</span>
                            <span class="faculty-info-value">${roleFull}</span>
                        </div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-book text-info"></i>
                        <div>
                            <span class="faculty-info-label">Assigned Subjects</span>
                            <div class="d-flex flex-wrap gap-1 mt-1">
                                ${subjectTags.length > 0 ? subjectTags.map(s => `<span class="faculty-tag">${s}</span>`).join(" ") : '<span class="text-muted small">None assigned</span>'}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-award text-warning"></i>
                        <div>
                            <span class="faculty-info-label">Additional Responsibilities</span>
                            <div class="d-flex flex-wrap gap-1 mt-1">
                                ${extraRoles.length > 0 && extraRoles[0] !== 'None' ? extraRoles.map(r => `<span class="faculty-tag">${r}</span>`).join(" ") : '<span class="text-muted small">None specified</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. APPLICATION INFORMATION (If applicable) -->
        ${app ? `
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-file-earmark-text me-2"></i>Application History</h6>
            <div class="faculty-info-card">
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-clipboard-check text-primary"></i>
                        <div>
                            <span class="faculty-info-label">Application Status</span>
                            <span class="faculty-info-value">${_facultyStatusBadge(app.status)}</span>
                        </div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-calendar-event text-muted"></i>
                        <div>
                            <span class="faculty-info-label">Submitted Date</span>
                            <span class="faculty-info-value">${app.submitted_date || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                <div class="faculty-info-row">
                    <div class="faculty-info-item">
                        <i class="bi bi-calendar-check text-muted"></i>
                        <div>
                            <span class="faculty-info-label">Reviewed Date</span>
                            <span class="faculty-info-value">${app.reviewed_date ? app.reviewed_date.slice(0, 16).replace('T', ' ') : 'Pending Review'}</span>
                        </div>
                    </div>
                    <div class="faculty-info-item">
                        <i class="bi bi-person-check text-muted"></i>
                        <div>
                            <span class="faculty-info-label">Reviewed By</span>
                            <span class="faculty-info-value">${app.reviewed_date ? 'System Administrator' : '—'}</span>
                        </div>
                    </div>
                </div>
                ${app.rejection_reason ? `
                <div class="faculty-info-row">
                    <div class="faculty-info-item" style="flex: 1 1 100%;">
                        <i class="bi bi-exclamation-triangle text-danger"></i>
                        <div>
                            <span class="faculty-info-label">Decline Reason</span>
                            <span class="faculty-info-value text-danger">${app.rejection_reason}</span>
                        </div>
                    </div>
                </div>` : ''}
            </div>
        </div>` : ''}

        <!-- 4. MENTORSHIP & ASSIGNED STUDENTS -->
        ${p.source === "approved" ? `
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-people me-2"></i>Mentorship Metrics & Students</h6>
            <div class="faculty-info-card">
                <div class="d-flex flex-wrap gap-2 mb-3">
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value">${students.length}</div>
                        <div class="faculty-mini-stat-label">Students</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--risk-high);">${highRisk.length}</div>
                        <div class="faculty-mini-stat-label">High Risk</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--risk-medium);">${medRisk.length}</div>
                        <div class="faculty-mini-stat-label">Med Risk</div>
                    </div>
                    <div class="faculty-mini-stat">
                        <div class="faculty-mini-stat-value" style="color: var(--warning);">${ai.pending_interventions || 0}</div>
                        <div class="faculty-mini-stat-label">Pending</div>
                    </div>
                </div>
                ${students.length > 0 ? `
                <div class="table-responsive rounded border" style="max-height: 220px; overflow-y: auto;">
                    <table class="faculty-custom-table" style="font-size: 12.5px;">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>ID</th>
                                <th>Attendance</th>
                                <th>CGPA</th>
                                <th>Risk Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(s => {
                                const riskClass = s.risk >= 60 ? 'high' : (s.risk >= 30 ? 'medium' : 'low');
                                return `
                                    <tr style="cursor: pointer;" onclick="closeFacultyDrawer(); setTimeout(() => typeof viewStudent360 === 'function' && viewStudent360('${s.id}'), 200);" title="Click to view Student 360° Profile">
                                        <td><strong>${s.name}</strong></td>
                                        <td><code>${s.id}</code></td>
                                        <td>${s.attendance}%</td>
                                        <td>${s.cgpa}</td>
                                        <td><span class="risk-badge ${riskClass}">${s.risk}%</span></td>
                                    </tr>`;
                            }).join("")}
                        </tbody>
                    </table>
                </div>` : `<div class="text-center py-3 text-muted small"><i class="bi bi-inbox me-1"></i>No students currently assigned</div>`}
            </div>
        </div>` : ''}

        <!-- 5. AI MONITORING & RISK SUMMARY -->
        ${p.source === "approved" ? `
        <div class="faculty-info-section">
            <h6 class="faculty-section-title"><i class="bi bi-cpu me-2"></i>AI Monitoring & Risk Insights</h6>
            <div class="faculty-ai-alert-box">
                <div class="d-flex flex-wrap gap-2 mb-3">
                    <div class="faculty-ai-stat-row">
                        <i class="bi bi-exclamation-triangle-fill" style="color: var(--risk-high); font-size: 18px;"></i>
                        <div>
                            <div class="fw-bold" style="font-size: 16px; color: var(--risk-high);">${highRisk.length || ai.high_risk_count || 0}</div>
                            <div class="small text-muted" style="font-size: 11px;">Require Attention</div>
                        </div>
                    </div>
                    <div class="faculty-ai-stat-row">
                        <i class="bi bi-bell-fill" style="color: var(--warning); font-size: 18px;"></i>
                        <div>
                            <div class="fw-bold" style="font-size: 16px; color: var(--warning);">${ai.pending_interventions || 0}</div>
                            <div class="small text-muted" style="font-size: 11px;">Interventions Pending</div>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                    <span class="small text-muted">Autonomous predictive analysis active</span>
                    <button class="primary-btn btn-sm" onclick="closeFacultyDrawer(); navigateTo('mentor');">
                        View AI Risk Analysis →
                    </button>
                </div>
            </div>
        </div>` : ''}
    `;
}

function closeFacultyDrawer() {
    document.getElementById("facultyDrawerOverlay")?.classList.remove("active");
    document.getElementById("facultyDrawer")?.classList.remove("active");
}


// =====================================================
// 4. ADD & EDIT FACULTY MODALS
// =====================================================

function openAddFacultyModal() {
    document.getElementById("facultyAddForm")?.reset();
    document.getElementById("facultyAddModal")?.classList.add("active");
}

function closeAddFacultyModal() {
    document.getElementById("facultyAddModal")?.classList.remove("active");
}

async function handleCreateFaculty(e) {
    e.preventDefault();
    const btn = document.getElementById("addFacSubmitBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<div class="spinner-border spinner-border-sm me-1"></div> Saving...';
    }

    const payload = [{
        display_name: document.getElementById("addFacDisplayName").value.trim(),
        id: document.getElementById("addFacId").value.trim(),
        email: document.getElementById("addFacEmail").value.trim(),
        role: document.getElementById("addFacRole").value,
        phone: getFullPhoneNumber("addFacCountryCode", "addFacPhone"),
        subjects: document.getElementById("addFacSubjects")?.value.trim() || "",
        extra_roles: document.getElementById("addFacExtraRoles")?.value.trim() || "",
        department: document.getElementById("addFacDept")?.value || "CSE",
        assigned_year: document.getElementById("addFacYear")?.value || "2nd Year",
        specialization: document.getElementById("addFacSpecialization")?.value.trim() || "Academic Counseling",
    }];

    const res = await API.bulkImportFaculty(payload);
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-check2 me-1"></i>Add Faculty Record';
    }

    if (res && res.success && res.imported > 0) {
        showSuccessToast("Faculty / Mentor account added successfully!");
        closeAddFacultyModal();
        renderFaculty();
    } else {
        showErrorToast(res?.message || "Failed to add faculty member. Check for duplicate ID/email.");
    }
}

let _editingFacultyId = null;

async function openFacultyEditModal(facultyId) {
    _editingFacultyId = facultyId;

    const data = await API.getFacultyDetail(facultyId);
    if (!data || !data.profile) {
        showErrorToast("Could not load faculty record for editing.");
        return;
    }

    const p = data.profile;
    document.getElementById("editFacDisplayName").value = p.display_name || "";
    document.getElementById("editFacId").value = p.id || "";
    document.getElementById("editFacEmail").value = p.email || "";
    setPhoneInputFromFull("editFacCountryCode", "editFacPhone", p.phone || "");
    document.getElementById("editFacSubjects").value = p.subjects || "";
    document.getElementById("editFacExtraRoles").value = p.extra_roles || "";
    if (document.getElementById("editFacDept")) document.getElementById("editFacDept").value = p.department || "CSE";
    if (document.getElementById("editFacYear")) document.getElementById("editFacYear").value = p.assigned_year || "2nd Year";
    if (document.getElementById("editFacSpecialization")) document.getElementById("editFacSpecialization").value = p.specialization || "";
    document.getElementById("facultyEditTitle").textContent = `Edit ${p.display_name}`;

    document.getElementById("facultyEditModal")?.classList.add("active");

    const form = document.getElementById("facultyEditForm");
    form.onsubmit = async function(e) {
        e.preventDefault();
        const payload = {
            display_name: document.getElementById("editFacDisplayName").value.trim(),
            email: document.getElementById("editFacEmail").value.trim(),
            phone: getFullPhoneNumber("editFacCountryCode", "editFacPhone"),
            subjects: document.getElementById("editFacSubjects")?.value.trim() || "",
            extra_roles: document.getElementById("editFacExtraRoles")?.value.trim() || "",
            department: document.getElementById("editFacDept")?.value || "CSE",
            assigned_year: document.getElementById("editFacYear")?.value || "2nd Year",
            specialization: document.getElementById("editFacSpecialization")?.value.trim() || "Academic Counseling",
        };
        const res = await API.updateFaculty(_editingFacultyId, payload);
        if (res && res.success) {
            showSuccessToast(res.message || "Faculty profile updated successfully!");
            closeFacultyEditModal();
            closeFacultyDrawer();
            renderFaculty();
        } else {
            showErrorToast(res?.message || "Failed to update faculty profile.");
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
    const ok = await showConfirmModal({
        title: "Change Faculty Status",
        message: `Change status for faculty <code>${facultyId}</code> from <strong>${currentStatus}</strong> to <strong>${newStatus}</strong>?`,
        confirmText: `Set to ${newStatus}`,
        confirmBtnClass: newStatus === "Active" ? "primary-btn" : "btn btn-warning",
        icon: "bi-arrow-left-right text-primary"
    });
    if (!ok) return;

    const res = await API.updateFacultyStatus(facultyId, newStatus);
    if (res && res.success) {
        showSuccessToast(res.message || `Status changed to ${newStatus}.`);
        closeFacultyDrawer();
        renderFaculty();
    } else {
        showErrorToast(res?.message || "Failed to change status.");
    }
}


// =====================================================
// 6. UTILITY MENUS & NAVIGATION
// =====================================================

function toggleFacultyMenu(btn) {
    const menu = btn.nextElementSibling;
    if (!menu) return;

    document.querySelectorAll(".faculty-action-menu").forEach(m => {
        if (m !== menu) m.classList.add("d-none");
    });

    menu.classList.toggle("d-none");

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

function toggleFacultyExportMenu(btn) {
    toggleFacultyMenu(btn);
}

function viewStudent360FromFaculty(facultyId) {
    closeFacultyDrawer();
    if (typeof navigateTo === "function") {
        navigateTo("mentor");
    }
}


// =====================================================
// 7. CHECKBOX SELECTION & BULK TOOLBAR
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
// 8. BULK STATUS ACTIONS (ACTIVATE / DEACTIVATE)
// =====================================================

async function bulkActivateFaculty() {
    const ids = _getSelectedApprovedFacultyIds();
    if (ids.length === 0) { showWarningToast("No approved faculty selected for activation."); return; }
    
    const ok = await showConfirmModal({
        title: "Bulk Activate Faculty",
        message: `Activate <strong>${ids.length}</strong> selected faculty member(s)?`,
        confirmText: "Activate Selected",
        confirmBtnClass: "primary-btn",
        icon: "bi-check2-circle text-success"
    });
    if (!ok) return;

    const res = await API.bulkStatusFaculty(ids, "Active");
    if (res && res.success) {
        showSuccessToast(res.message);
        renderFaculty();
    } else {
        showErrorToast(res?.message || "Failed to activate faculty.");
    }
}

async function bulkDeactivateFaculty() {
    const ids = _getSelectedApprovedFacultyIds();
    if (ids.length === 0) { showWarningToast("No approved faculty selected for deactivation."); return; }
    
    const ok = await showConfirmModal({
        title: "Bulk Deactivate Faculty",
        message: `Deactivate <strong>${ids.length}</strong> selected faculty member(s)?`,
        confirmText: "Deactivate Selected",
        confirmBtnClass: "btn btn-warning",
        icon: "bi-slash-circle text-warning"
    });
    if (!ok) return;

    const res = await API.bulkStatusFaculty(ids, "Inactive");
    if (res && res.success) {
        showSuccessToast(res.message);
        renderFaculty();
    } else {
        showErrorToast(res?.message || "Failed to deactivate faculty.");
    }
}


// =====================================================
// 9. BULK & SINGLE DELETE WITH SAFETY CHECKS
// =====================================================

let _bulkDeleteIds = [];

function promptSingleFacultyDelete(facultyId) {
    _bulkDeleteIds = [facultyId];
    _openDeleteConfirmModal([facultyId]);
}

function bulkDeleteFacultyPrompt() {
    const ids = _getSelectedApprovedFacultyIds();
    if (ids.length === 0) { alert("No approved faculty selected for deletion."); return; }
    _bulkDeleteIds = ids;
    _openDeleteConfirmModal(ids);
}

function _openDeleteConfirmModal(ids) {
    const facultyRecords = ids.map(id => {
        const row = document.querySelector(`tr[data-faculty-id="${id}"]`);
        return {
            id,
            name: row?.dataset.name || id
        };
    });

    const content = document.getElementById("facultyBulkDeleteContent");
    content.innerHTML = `
        <div class="mb-3 p-3 rounded" style="background: var(--risk-high-soft); border-left: 4px solid var(--risk-high);">
            <div class="fw-bold text-danger mb-1"><i class="bi bi-shield-exclamation me-1"></i>Delete ${ids.length} Faculty Member(s)?</div>
            <p class="mb-0 small" style="color: var(--text-soft);">
                <strong>Safety Rule:</strong> Faculty with assigned students, mentorship history, or system records will be <strong>archived/deactivated</strong> to preserve historical student telemetry.
            </p>
        </div>
        <div class="small" style="color: var(--text-soft);">
            <strong class="d-block mb-1">Selected Accounts:</strong>
            <ul class="mb-0 ps-3" style="max-height: 130px; overflow-y: auto;">
                ${facultyRecords.map(f => `<li><strong>${f.name}</strong> <code>(${f.id})</code></li>`).join("")}
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
            msg += `\n\n⚠ ${res.deactivated} faculty member(s) with active student assignments were archived/deactivated.`;
        }
        alert(msg);
        closeFacultyBulkDeleteModal();
        renderFaculty();
    } else {
        alert(res?.message || "Delete operation failed.");
    }
}

async function executeBulkDeactivate() {
    if (_bulkDeleteIds.length === 0) return;
    const res = await API.bulkStatusFaculty(_bulkDeleteIds, "Inactive");
    if (res && res.success) {
        alert(`${res.updated || _bulkDeleteIds.length} faculty member(s) deactivated/archived safely.`);
        closeFacultyBulkDeleteModal();
        renderFaculty();
    } else {
        alert(res?.message || "Deactivation failed.");
    }
}


// =====================================================
// 10. BULK IMPORT — 3-Step Professional Workflow
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

    document.getElementById("facStepPill1")?.classList.add("active");
    document.getElementById("facStepPill2")?.classList.remove("active", "completed");
    document.getElementById("facStepPill3")?.classList.remove("active", "completed");
}

function downloadFacultyTemplate(format) {
    const headers = ["Full Name", "University User ID", "Institutional Email", "Mobile/Phone", "Role", "Assigned Subjects", "Additional Responsibilities"];
    const sampleRows = [
        ["Dr. Example Faculty", "FAC100", "example.fac@vignan.ac.in", "+91 90000 12345", "faculty", "CS201,CS202", "Class Teacher"],
        ["Prof. Sample Mentor", "MEN100", "sample.men@vignan.ac.in", "+91 90000 67890", "mentor", "CS203", "Career Counselor"]
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
            if (typeof XLSX === "undefined") { alert("Excel parser is not loaded. Please upload a .CSV file."); return; }
            const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { type: "array" });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: "" });
            rows = jsonRows.map(r => _mapImportRow(r));
        }

        if (rows.length === 0) {
            alert("No data rows found in the selected file. Please verify columns and try again.");
            document.getElementById("facImportParseStatus")?.classList.add("d-none");
            return;
        }

        _facImportParsedRows = rows;
        _validateAndPreviewImport(rows);
    } catch (err) {
        alert("Error reading file: " + err.message);
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

        if (r.id && existingIds.has(r.id.toLowerCase())) errors.push("Duplicate ID (already registered)");
        if (r.email && existingEmails.has(r.email.toLowerCase())) errors.push("Duplicate Email (already registered)");
        if (r.id && batchIds.has(r.id.toLowerCase())) errors.push("Duplicate ID in this file");
        if (r.email && batchEmails.has(r.email.toLowerCase())) errors.push("Duplicate Email in this file");

        const isDuplicate = errors.some(e => e.startsWith("Duplicate"));
        const status = errors.length === 0 ? "valid" : (isDuplicate ? "duplicate" : "invalid");

        if (status === "valid") { validCount++; batchIds.add(r.id.toLowerCase()); if (r.email) batchEmails.add(r.email.toLowerCase()); }
        else if (status === "duplicate") duplicateCount++;
        else invalidCount++;

        return { ...r, row: idx + 1, errors, status };
    });

    _facImportValidRows = validatedRows.filter(r => r.status === "valid");

    const previewBody = document.getElementById("facImportPreviewBody");
    previewBody.innerHTML = validatedRows.map(r => {
        const statusBadge = r.status === "valid"
            ? `<span class="faculty-status-badge faculty-status-badge--active"><i class="bi bi-circle-fill"></i> Valid</span>`
            : r.status === "duplicate"
            ? `<span class="faculty-status-badge faculty-status-badge--pending" title="${r.errors.join('; ')}"><i class="bi bi-circle-fill"></i> Duplicate</span>`
            : `<span class="faculty-status-badge faculty-status-badge--declined" title="${r.errors.join('; ')}"><i class="bi bi-circle-fill"></i> Invalid</span>`;

        return `
            <tr style="${r.status !== 'valid' ? 'background: var(--bg-sunken);' : ''}">
                <td><strong>${r.row}</strong></td>
                <td>${r.display_name || '<span class="text-danger">Missing</span>'}</td>
                <td><code>${r.id || '—'}</code></td>
                <td>${r.email || '<span class="text-danger">Missing</span>'}</td>
                <td>${(r.role || 'faculty').toUpperCase()}</td>
                <td>
                    ${statusBadge}
                    ${r.errors.length > 0 ? `<div class="small text-danger mt-1 fw-semibold">${r.errors.join("; ")}</div>` : ''}
                </td>
            </tr>`;
    }).join("");

    document.getElementById("facImportPreviewSummary").innerHTML = `
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">${validCount} Valid</span>
        <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">${duplicateCount} Duplicates</span>
        <span class="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">${invalidCount} Invalid</span>
    `;

    document.getElementById("facImportStep1")?.classList.add("d-none");
    document.getElementById("facImportStep2")?.classList.remove("d-none");
    document.getElementById("facStepPill1")?.classList.add("completed");
    document.getElementById("facStepPill2")?.classList.add("active");

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
    btn.innerHTML = '<div class="spinner-border spinner-border-sm me-2"></div> Ingesting records...';

    const res = await API.bulkImportFaculty(_facImportValidRows);
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check2-circle me-1"></i>Import Faculty Members';

    if (res && res.success) {
        _facImportResults = res;
        _showImportSummary(res);
    } else {
        alert(res?.message || "Bulk import failed.");
    }
}

function _showImportSummary(res) {
    document.getElementById("facImportStep2")?.classList.add("d-none");
    document.getElementById("facImportConfirmBtn")?.classList.add("d-none");
    document.getElementById("facImportStep3")?.classList.remove("d-none");
    document.getElementById("facStepPill2")?.classList.add("completed");
    document.getElementById("facStepPill3")?.classList.add("active");

    const failedRows = (res.results || []).filter(r => r.status !== "imported");

    document.getElementById("facImportSummaryContent").innerHTML = `
        <div class="text-center mb-4">
            <div class="mb-2"><i class="bi bi-check-circle-fill text-success" style="font-size: 52px;"></i></div>
            <h5 class="fw-bold" style="color: var(--text);">✓ ${res.imported} Faculty Members Imported Successfully</h5>
            <p class="text-muted small">New faculty accounts are now provisioned and active in the database.</p>
        </div>
        <div class="d-flex justify-content-center gap-3 mb-4">
            <div class="p-3 text-center rounded border" style="background: var(--bg-sunken); min-width: 120px;">
                <div class="fw-bold" style="font-size: 26px; color: var(--success); font-family: var(--font-mono);">${res.imported}</div>
                <div class="small text-muted fw-semibold">Imported</div>
            </div>
            <div class="p-3 text-center rounded border" style="background: var(--bg-sunken); min-width: 120px;">
                <div class="fw-bold" style="font-size: 26px; color: var(--warning); font-family: var(--font-mono);">${res.duplicates}</div>
                <div class="small text-muted fw-semibold">Duplicates</div>
            </div>
            <div class="p-3 text-center rounded border" style="background: var(--bg-sunken); min-width: 120px;">
                <div class="fw-bold" style="font-size: 26px; color: var(--danger); font-family: var(--font-mono);">${res.failed}</div>
                <div class="small text-muted fw-semibold">Failed</div>
            </div>
        </div>
        ${failedRows.length > 0 ? `
        <div class="text-center mb-3">
            <button class="btn btn-sm btn-outline-danger" onclick="downloadImportErrorReport()">
                <i class="bi bi-download me-1"></i>Download Error Log (${failedRows.length} rows)
            </button>
        </div>` : ''}
        <div class="text-center pt-2 border-top">
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
// 11. EXPORT — CSV & Excel
// =====================================================

function _getFacultyDataForExport(onlySelected) {
    const allFaculty = _facultyData?.faculty || [];
    if (onlySelected) {
        const selectedIds = new Set(_getSelectedFacultyIds());
        return allFaculty.filter(f => selectedIds.has(f.id));
    }
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

function exportSingleFacultyCSV(facultyId) {
    const allFaculty = _facultyData?.faculty || [];
    const record = allFaculty.filter(f => f.id === facultyId);
    if (record.length === 0) { alert("Faculty record not found."); return; }
    const rows = _facultyToExportRows(record);
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(",")];
    rows.forEach(r => {
        csvLines.push(headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(","));
    });
    _downloadFile(csvLines.join("\n"), `faculty_${facultyId}_export.csv`, "text/csv");
}

function exportFacultyExcel() {
    if (typeof XLSX === "undefined") { alert("Excel library not loaded. Please use CSV export."); return; }
    const data = _getFacultyDataForExport(false);
    if (data.length === 0) { alert("No faculty records to export."); return; }
    const rows = _facultyToExportRows(data);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faculty & Mentors");
    XLSX.writeFile(wb, `faculty_export_${new Date().toISOString().slice(0,10)}.xlsx`);
}

function exportSelectedFacultyCSV() {
    const data = _getFacultyDataForExport(true);
    if (data.length === 0) { alert("No faculty members selected to export."); return; }
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

// Window Exports for Faculty Management Page
window.renderFaculty = renderFaculty;
window.filterFacultyTable = filterFacultyTable;
window.openFacultyDrawer = openFacultyDrawer;
window.closeFacultyDrawer = closeFacultyDrawer;
window.openAddFacultyModal = openAddFacultyModal;
window.closeAddFacultyModal = closeAddFacultyModal;
window.handleCreateFaculty = handleCreateFaculty;
window.openFacultyEditModal = openFacultyEditModal;
window.closeFacultyEditModal = closeFacultyEditModal;
window.changeFacultyStatusPrompt = changeFacultyStatusPrompt;
window.toggleFacultyMenu = toggleFacultyMenu;
window.toggleFacultyExportMenu = toggleFacultyExportMenu;
window.viewStudent360FromFaculty = viewStudent360FromFaculty;
window.toggleFacultySelectAll = toggleFacultySelectAll;
window.updateFacultySelectionCount = updateFacultySelectionCount;
window.bulkActivateFaculty = bulkActivateFaculty;
window.bulkDeactivateFaculty = bulkDeactivateFaculty;
window.promptSingleFacultyDelete = promptSingleFacultyDelete;
window.bulkDeleteFacultyPrompt = bulkDeleteFacultyPrompt;
window.closeFacultyBulkDeleteModal = closeFacultyBulkDeleteModal;
window.executeBulkDelete = executeBulkDelete;
window.executeBulkDeactivate = executeBulkDeactivate;
window.openFacultyImportModal = openFacultyImportModal;
window.closeFacultyImportModal = closeFacultyImportModal;
window.resetFacultyImport = resetFacultyImport;
window.downloadFacultyTemplate = downloadFacultyTemplate;
window.handleFacultyFileSelected = handleFacultyFileSelected;
window.confirmFacultyImport = confirmFacultyImport;
window.downloadImportErrorReport = downloadImportErrorReport;
window.exportFacultyCSV = exportFacultyCSV;
window.exportSingleFacultyCSV = exportSingleFacultyCSV;
window.exportFacultyExcel = exportFacultyExcel;
window.exportSelectedFacultyCSV = exportSelectedFacultyCSV;
