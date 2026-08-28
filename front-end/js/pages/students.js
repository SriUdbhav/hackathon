/* =====================================================
   STUDENTS.JS
   Comprehensive Student Roster & Record Management
   Supports: Horizontal Smooth Scroll, All 16 Demographic &
             Academic Fields, Full CRUD, Fuzzy & Regex Search,
             Interactive Column Sorting, Bulk CSV/Excel Import,
             Persistent Multi-Select & Bulk Deletion
===================================================== */

let studentsSortColumn = "risk";
let studentsSortAsc = false;
let studentsRegexMode = false;

if (!window._selectedStudentIds) {
    window._selectedStudentIds = new Set();
}

async function renderStudents() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Student persona redirect
    if (role === "student") {
        viewStudent360(user.linked_student_id || user.id);
        return;
    }

    if (students.length === 0) {
        await loadLatestStudents();
    }

    const selectedCount = window._selectedStudentIds ? window._selectedStudentIds.size : 0;
    if (!window._selectedYearFilter) window._selectedYearFilter = "ALL";

    const y1Count = students.filter(s => (s.year || '').includes('1')).length;
    const y2Count = students.filter(s => (s.year || '').includes('2')).length;
    const y3Count = students.filter(s => (s.year || '').includes('3')).length;
    const y4Count = students.filter(s => (s.year || '').includes('4')).length;
    const totalCount = students.length;

    content.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">Comprehensive Student Database</h1>
                <p class="text-muted small mb-0">Complete cohort records with demographic info, multi-signal indicators & risk indices</p>
            </div>
            <div class="d-flex gap-2 flex-wrap align-items-center">
                <button class="btn btn-outline-danger btn-sm ${selectedCount > 0 ? '' : 'd-none'}" id="bulkDeleteBtn" onclick="handleBulkDeleteStudents()" style="border-radius: 8px; font-weight: 600;">
                    <i class="bi bi-trash3"></i> Delete Selected (<span id="bulkDeleteCount">${selectedCount}</span>)
                </button>
                <button class="secondary-btn" onclick="openImportStudentsModal()">
                    <i class="bi bi-file-earmark-arrow-up text-success"></i> Import CSV/Excel
                </button>
                <button class="primary-btn" onclick="openAddStudentModal()">
                    <i class="bi bi-person-plus-fill"></i> Add Student Record
                </button>
            </div>
        </div>

        <!-- YEAR-WISE SEGREGATION TABS & ATTENDANCE SIMULATION BAR -->
        <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div class="d-flex gap-1 flex-wrap align-items-center" id="studentsYearTabsContainer">
                <span class="text-muted small me-2 fw-semibold"><i class="bi bi-mortarboard-fill text-primary me-1"></i> Academic Year:</span>
                <button type="button" class="btn btn-sm ${window._selectedYearFilter === 'ALL' ? 'btn-primary active' : 'btn-outline-secondary'}" onclick="filterStudentsByYear('ALL')">
                    All Years (${totalCount})
                </button>
                <button type="button" class="btn btn-sm ${window._selectedYearFilter === '1st Year' ? 'btn-primary active' : 'btn-outline-secondary'}" onclick="filterStudentsByYear('1st Year')">
                    1st Year (${y1Count})
                </button>
                <button type="button" class="btn btn-sm ${window._selectedYearFilter === '2nd Year' ? 'btn-primary active' : 'btn-outline-secondary'}" onclick="filterStudentsByYear('2nd Year')">
                    2nd Year (${y2Count})
                </button>
                <button type="button" class="btn btn-sm ${window._selectedYearFilter === '3rd Year' ? 'btn-primary active' : 'btn-outline-secondary'}" onclick="filterStudentsByYear('3rd Year')">
                    3rd Year (${y3Count})
                </button>
                <button type="button" class="btn btn-sm ${window._selectedYearFilter === '4th Year' ? 'btn-primary active' : 'btn-outline-secondary'}" onclick="filterStudentsByYear('4th Year')">
                    4th Year (${y4Count})
                </button>
            </div>

            <!-- AUTOMATED ATTENDANCE SIMULATION BUTTON -->
            <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-outline-success d-flex align-items-center gap-1 shadow-sm fw-semibold" id="advanceAttdBtn" onclick="handleAdvanceAttendanceDay()" title="Advance calendar by 24h: Increases attendance for all students by +2% and recalibrates AI risk scores">
                    <i class="bi bi-clock-history"></i> Advance 24h (+2% Daily Attd)
                </button>
            </div>
        </div>

        <!-- BULK ACTION TOOLBAR (Appears smoothly when rows are selected) -->
        <div id="studentsBulkToolbar" class="students-bulk-toolbar ${selectedCount > 0 ? '' : 'd-none'}">
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="badge bg-primary fs-6 px-3 py-2" id="studentsBulkCountBadge">${selectedCount} Selected</span>
                <span class="text-muted small" id="studentsBulkBannerText">
                    ${selectedCount >= students.length 
                        ? `All <strong>${students.length}</strong> students across all pages are selected.` 
                        : `<strong>${selectedCount}</strong> student record${selectedCount === 1 ? '' : 's'} selected.`
                    }
                </span>
                <button type="button" class="btn btn-sm btn-link p-0 text-decoration-underline fw-bold ${selectedCount < students.length ? '' : 'd-none'}" id="selectAllAcrossPagesBtn" onclick="selectAllAcrossAllPages()">
                    Select all ${students.length} students across all pages
                </button>
            </div>
            <div class="d-flex align-items-center gap-2 flex-wrap">
                <button class="btn btn-sm btn-outline-secondary" onclick="clearStudentSelection()">
                    <i class="bi bi-x-circle me-1"></i> Clear Selection
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="exportSelectedStudentsCSV()">
                    <i class="bi bi-download me-1"></i> Export Selected
                </button>
                <button class="btn btn-sm btn-danger fw-semibold d-flex align-items-center gap-1" onclick="handleBulkDeleteStudents()">
                    <i class="bi bi-trash3-fill"></i> Delete Selected (<span id="bulkDeleteToolbarCount">${selectedCount}</span>)
                </button>
            </div>
        </div>

        <!-- SEARCH AND FILTER BAR -->
        <div class="card-box p-3 mb-4">
            <div class="row g-2 align-items-center">
                <div class="col-md-5">
                    <div class="input-group">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search" style="color: var(--accent);"></i></span>
                        <input type="text" id="studentSearchInput" class="form-control" placeholder="Search name, ID, place, or mother tongue..." onkeyup="filterStudentsTable()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <button class="btn btn-outline-secondary" type="button" id="studentsRegexBtn" onclick="toggleStudentsRegex()" title="Toggle Regex Mode">
                            <i class="bi bi-code-slash"></i>
                        </button>
                    </div>
                </div>
                <div class="col-md-3">
                    <select id="riskFilterSelect" class="form-select" onchange="filterStudentsTable()" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="ALL">All Risk Levels</option>
                        <option value="HIGH">High Risk (&ge; 60%)</option>
                        <option value="MEDIUM">Moderate (30% - 59%)</option>
                        <option value="LOW">Low Risk (&lt; 30%)</option>
                    </select>
                </div>
                <div class="col-md-4 text-end my-auto">
                    <span class="small" id="studentsCountSummary" style="color: var(--text-soft);">
                        Showing <strong>${students.length}</strong> of <strong>${students.length}</strong> students
                    </span>
                </div>
            </div>
        </div>

        <!-- STUDENTS TABLE WITH HORIZONTAL SCROLL & SORTABLE HEADERS -->
        <div class="card-box p-4">
            <div class="table-responsive" style="max-height: 600px; overflow-x: auto;">
                <table class="custom-table" id="studentsTable" style="white-space: nowrap;">
                    <thead>
                        <tr>
                            <th style="width: 55px; text-align: center; background: var(--bg-sunken); position: relative;">
                                <div class="d-flex align-items-center justify-content-center gap-1">
                                    <input type="checkbox" id="selectAllStudents" onchange="toggleSelectAllStudents(this)" style="cursor: pointer; width: 16px; height: 16px;" title="Select / Deselect Visible Page">
                                    <button class="btn btn-sm p-0 border-0 text-muted" type="button" onclick="toggleSelectDropdown(event)" title="Selection options" style="font-size: 10px; line-height: 1;">
                                        <i class="bi bi-caret-down-fill"></i>
                                    </button>
                                </div>
                                <div id="selectionDropdownMenu" class="dropdown-menu dropdown-menu-start shadow-sm border p-1" style="font-size: 12px; min-width: 200px; position: absolute; top: 100%; left: 0; z-index: 1050; display: none;">
                                    <button class="dropdown-item py-1 px-2 rounded" type="button" onclick="selectAllOnCurrentPage()"><i class="bi bi-file-earmark me-2 text-primary"></i> Select This Page</button>
                                    <button class="dropdown-item py-1 px-2 rounded fw-bold text-primary" type="button" onclick="selectAllAcrossAllPages()"><i class="bi bi-check-all me-2"></i> Select All Across All Pages (${students.length})</button>
                                    <div class="dropdown-divider my-1"></div>
                                    <button class="dropdown-item py-1 px-2 rounded text-danger" type="button" onclick="selectAllByRiskTier('HIGH')"><i class="bi bi-exclamation-octagon me-2"></i> Select All High Risk</button>
                                    <button class="dropdown-item py-1 px-2 rounded text-warning text-dark" type="button" onclick="selectAllByRiskTier('MEDIUM')"><i class="bi bi-exclamation-triangle me-2"></i> Select All Moderate</button>
                                    <div class="dropdown-divider my-1"></div>
                                    <button class="dropdown-item py-1 px-2 rounded text-muted" type="button" onclick="clearStudentSelection()"><i class="bi bi-x-circle me-2"></i> Deselect All</button>
                                </div>
                            </th>
                            <th class="sticky-start cursor-pointer" onclick="sortStudentsBy('id')" style="background: var(--bg-sunken); color: var(--text);">
                                Student ID ${getSortIcon('id')}
                            </th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('name')">
                                Full Name ${getSortIcon('name')}
                            </th>
                            <th>Gender</th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('course')">
                                Course ${getSortIcon('course')}
                            </th>
                            <th>Year</th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('attendance')">
                                Attendance ${getSortIcon('attendance')}
                            </th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('cgpa')">
                                CGPA ${getSortIcon('cgpa')}
                            </th>
                            <th>Credits</th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('lms_score')">
                                LMS Score ${getSortIcon('lms_score')}
                            </th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('risk')">
                                Academic Risk ${getSortIcon('risk')}
                            </th>
                            <th>Father's Name</th>
                            <th>Mother's Name</th>
                            <th>Mother Tongue</th>
                            <th class="cursor-pointer" onclick="sortStudentsBy('place')">
                                Place / City ${getSortIcon('place')}
                            </th>
                            <th>Region</th>
                            <th>Country</th>
                            <th>Contact Info</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                    </tbody>
                </table>
            </div>
            <!-- STUDENTS PAGINATION CONTROLS -->
            <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 pt-2 border-top">
                <div class="d-flex align-items-center gap-2">
                    <span class="small text-muted" id="studentsPageInfo">Page 1 of 1</span>
                    <select class="form-select form-select-sm" style="width: auto; font-size: 12px; background: var(--bg-elevated); color: var(--text); border-color: var(--border);" onchange="handleStudentsPageSizeChange(this.value)">
                        <option value="20" selected>20 / page</option>
                        <option value="50">50 / page</option>
                        <option value="100">100 / page</option>
                    </select>
                </div>
                <div class="d-flex gap-1" id="studentsPaginationControls">
                </div>
            </div>
        </div>

        <!-- EDIT STUDENT MODAL -->
        <div id="editStudentModal" class="modal-overlay">
            <div class="student-modal">
                <div class="modal-head">
                    <div>
                        <span>STUDENT MANAGEMENT</span>
                        <h2>Edit Student Signals & Demographics</h2>
                    </div>
                    <button class="modal-close" onclick="closeEditModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="editStudentForm">
                    <input type="hidden" id="editStudentId">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input id="editStudentName" required>
                        </div>
                        <div class="form-group">
                            <label>Course</label>
                            <input id="editStudentCourse" required>
                        </div>
                        <div class="form-group">
                            <label>Attendance % (0 - 100)</label>
                            <input id="editStudentAttendance" type="number" min="0" max="100" required>
                        </div>
                        <div class="form-group">
                            <label>CGPA (0 - 10)</label>
                            <input id="editStudentCGPA" type="number" step="0.01" min="0" max="10" required>
                        </div>
                        <div class="form-group">
                            <label>LMS Score %</label>
                            <input id="editStudentLMS" type="number" min="0" max="100" required>
                        </div>
                        <div class="form-group">
                            <label>Credits</label>
                            <input id="editStudentCredits" type="number" required>
                        </div>
                        <div class="form-group">
                            <label>Year</label>
                            <select id="editStudentYear">
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Father's Name</label>
                            <input id="editFatherName">
                        </div>
                        <div class="form-group">
                            <label>Mother's Name</label>
                            <input id="editMotherName">
                        </div>
                        <div class="form-group">
                            <label>Mother Tongue</label>
                            <input id="editMotherTongue">
                        </div>
                        <div class="form-group">
                            <label>Place / City</label>
                            <input id="editStudentPlace">
                        </div>
                        <div class="form-group">
                            <label>Region</label>
                            <input id="editStudentRegion">
                        </div>
                        <div class="form-group">
                            <label>Student Email</label>
                            <input id="editStudentEmail" type="email" placeholder="student@vignan.ac.in">
                        </div>
                        <div class="form-group">
                            <label>Phone / Mobile</label>
                            <div class="d-flex gap-2">
                                <select id="editStudentCountryCode" class="form-select" style="width: 145px; font-size: 12.5px; font-weight: 500; background: var(--bg-elevated); color: var(--text); border-color: var(--border);" onchange="updatePhoneLimit('editStudentCountryCode', 'editStudentPhone')">
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
                                <input id="editStudentPhone" type="tel" class="form-control flex-grow-1" placeholder="10-digit number" maxlength="10" oninput="formatPhoneDigits(this)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                            </div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="secondary-btn" onclick="closeEditModal()">Cancel</button>
                        <button type="submit" class="primary-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- BULK IMPORT STUDENTS MODAL -->
        <div id="importStudentsModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 580px;">
                <div class="modal-head">
                    <div>
                        <span>DATA INGESTION</span>
                        <h2>Bulk Import Students</h2>
                    </div>
                    <button class="modal-close" onclick="closeImportStudentsModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-3">
                    <p class="text-muted small mb-3">
                        Upload a <code>.csv</code> or <code>.xlsx</code> file with student data. Required headers: <strong>id</strong>, <strong>name</strong>. Optional: <strong>gender</strong>, <strong>course</strong>, <strong>year</strong>, <strong>cgpa</strong>, <strong>attendance</strong>, <strong>credits</strong>, <strong>lms_score</strong>, <strong>father</strong>, <strong>mother</strong>, <strong>mother_tongue</strong>, <strong>place</strong>, <strong>region</strong>, <strong>country</strong>.
                    </p>
                    <div class="mb-3">
                        <input type="file" id="studentImportFileInput" class="form-control" accept=".csv, .xlsx, .xls">
                    </div>
                    <div id="studentImportProgress" class="d-none mb-3">
                        <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                        <span class="small text-muted">Ingesting student records and calculating AI risk profiles...</span>
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeImportStudentsModal()">Cancel</button>
                        <button type="button" class="primary-btn" onclick="handleImportStudentsSubmit()">
                            <i class="bi bi-upload me-1"></i> Ingest & Calculate Risks
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- BULK DELETE CONFIRMATION MODAL -->
        <div id="studentBulkDeleteModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head" style="border-bottom: 2px solid var(--risk-high);">
                    <div>
                        <span class="text-danger fw-bold"><i class="bi bi-exclamation-octagon-fill me-1"></i> PERMANENT REMOVAL</span>
                        <h2 class="text-danger">Bulk Delete Students</h2>
                    </div>
                    <button class="modal-close" onclick="closeStudentBulkDeleteModal()"><i class="bi bi-x"></i></button>
                </div>
                <div class="p-4">
                    <div class="alert alert-danger d-flex align-items-center gap-2 mb-3">
                        <i class="bi bi-trash3-fill fs-3 text-danger flex-shrink-0"></i>
                        <div>
                            <strong>Warning: Permanent Deletion</strong>
                            <p class="small mb-0">You are about to permanently delete <strong id="bulkDeleteConfirmCount">0</strong> student record(s).</p>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-bold text-muted">Selected Student Accounts:</label>
                        <div id="bulkDeleteStudentList" class="p-2 border rounded bg-light" style="max-height: 170px; overflow-y: auto; font-size: 13px;">
                            <!-- populated dynamically by JS -->
                        </div>
                    </div>
                    <p class="text-muted small mb-0">
                        <i class="bi bi-info-circle me-1 text-danger"></i> All associated semester subject marks, attendance telemetry, login credentials, and AI intervention logs will be erased.
                    </p>
                </div>
                <div class="modal-actions p-3 border-top bg-light d-flex justify-content-end gap-2">
                    <button type="button" class="secondary-btn" onclick="closeStudentBulkDeleteModal()">Cancel</button>
                    <button type="button" class="btn btn-danger fw-semibold d-flex align-items-center gap-2" id="confirmBulkDeleteBtn" onclick="executeBulkDeleteStudents()">
                        <i class="bi bi-trash3-fill"></i> Confirm Permanent Delete
                    </button>
                </div>
            </div>
        </div>
    `;

    // Bind Edit Form
    const editForm = document.getElementById("editStudentForm");
    if (editForm) {
        editForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const id = document.getElementById("editStudentId").value;
            const updatedData = {
                name: document.getElementById("editStudentName").value.trim(),
                course: document.getElementById("editStudentCourse").value.trim(),
                year: document.getElementById("editStudentYear").value,
                attendance: parseInt(document.getElementById("editStudentAttendance").value),
                cgpa: parseFloat(document.getElementById("editStudentCGPA").value),
                credits: parseInt(document.getElementById("editStudentCredits").value),
                lms_score: parseInt(document.getElementById("editStudentLMS").value),
                father: document.getElementById("editFatherName").value.trim(),
                mother: document.getElementById("editMotherName").value.trim(),
                motherTongue: document.getElementById("editMotherTongue").value.trim(),
                place: document.getElementById("editStudentPlace").value.trim(),
                region: document.getElementById("editStudentRegion").value.trim(),
                email: document.getElementById("editStudentEmail").value.trim(),
                phone: getFullPhoneNumber("editStudentCountryCode", "editStudentPhone")
            };

            const res = await API.updateStudent(id, updatedData);
            if (res && res.success) {
                alert(`Student record for ${updatedData.name} (${id}) updated! New risk score: ${res.risk}%`);
                closeEditModal();
                await loadLatestStudents();
                renderStudents();
            } else {
                alert("Failed to update student record.");
            }
        });
    }

    // Initial render with pagination
    filterStudentsTable();
}

function getSortIcon(col) {
    if (studentsSortColumn !== col) return '<i class="bi bi-arrow-down-up text-muted ms-1" style="font-size: 10px;"></i>';
    return studentsSortAsc
        ? '<i class="bi bi-sort-up text-primary ms-1"></i>'
        : '<i class="bi bi-sort-down text-primary ms-1"></i>';
}

function sortStudentsBy(col) {
    if (studentsSortColumn === col) {
        studentsSortAsc = !studentsSortAsc;
    } else {
        studentsSortColumn = col;
        studentsSortAsc = true;
    }
    filterStudentsTable();
}

function getSortedStudents(list) {
    return [...list].sort((a, b) => {
        let valA = a[studentsSortColumn];
        let valB = b[studentsSortColumn];

        if (typeof valA === "number" || typeof valB === "number") {
            valA = Number(valA || 0);
            valB = Number(valB || 0);
            return studentsSortAsc ? valA - valB : valB - valA;
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        if (valA < valB) return studentsSortAsc ? -1 : 1;
        if (valA > valB) return studentsSortAsc ? 1 : -1;
        return 0;
    });
}

function toggleStudentsRegex() {
    studentsRegexMode = !studentsRegexMode;
    const btn = document.getElementById("studentsRegexBtn");
    if (btn) {
        btn.className = studentsRegexMode ? "btn btn-primary" : "btn btn-outline-secondary";
    }
    filterStudentsTable();
}

function generateStudentsTableRows(dataList) {
    if (!dataList || dataList.length === 0) {
        return `<tr><td colspan="20" class="text-center text-muted py-4">No student records found matching filter criteria.</td></tr>`;
    }
    return dataList.map(s => {
        let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
        let riskLabel = s.risk >= 60 ? "High Risk" : (s.risk >= 30 ? "Moderate" : "Low Risk");
        const isChecked = window._selectedStudentIds && window._selectedStudentIds.has(s.id);
        return `
            <tr class="${isChecked ? 'table-active' : ''}">
                <td style="text-align: center;">
                    <input type="checkbox" class="student-select-cb" data-student-id="${s.id}" data-student-name="${s.name}" onchange="handleStudentCheckboxChange(this)" ${isChecked ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                </td>
                <td class="sticky-start" style="background: var(--bg-elevated); color: var(--text);"><code>${s.id}</code></td>
                <td><strong>${s.name}</strong></td>
                <td>${s.gender || 'Male'}</td>
                <td>${s.course || 'CSE'}</td>
                <td>${s.year || '2nd Year'}</td>
                <td>
                    <span class="${s.attendance < 75 ? 'text-danger fw-bold' : 'text-success'}">
                        ${s.attendance}%
                    </span>
                </td>
                <td><strong>${s.cgpa}</strong></td>
                <td>${s.credits || 24}</td>
                <td>${s.lms_score || s.attendance}%</td>
                <td><span class="risk-badge ${badgeClass} cursor-pointer" onclick="openStudentRiskBreakdownModal('${s.id}')" title="Click to view AI risk calculation breakdown">${s.risk}% (${riskLabel})</span></td>
                <td>${s.father || 'N/A'}</td>
                <td>${s.mother || 'N/A'}</td>
                <td>${s.mother_tongue || s.motherTongue || 'Telugu'}</td>
                <td>${s.place || 'Hyderabad'}</td>
                <td>${s.region || 'South India'}</td>
                <td>${s.country || 'India'}</td>
                <td>
                    <div class="small">
                        ${s.email ? `<div><i class="bi bi-envelope me-1 text-muted"></i>${s.email}</div>` : ''}
                        ${s.phone ? `<div><i class="bi bi-telephone me-1 text-muted"></i>${s.phone}</div>` : ''}
                        ${!s.email && !s.phone ? '<span class="text-muted">N/A</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudent360('${s.id}')" title="Open 360 Profile">
                            <i class="bi bi-person-lines-fill"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="openEditModal('${s.id}')" title="Edit Student">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="handleDeleteStudent('${s.id}')" title="Delete Student">
                            <i class="bi bi-trash3"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

window._studentsPageState = window._studentsPageState || { page: 1, pageSize: 20 };

function handleStudentsPageChange(newPage) {
    if (!window._studentsPageState) window._studentsPageState = { page: 1, pageSize: 20 };
    window._studentsPageState.page = newPage;
    filterStudentsTable();
}
window.handleStudentsPageChange = handleStudentsPageChange;

function handleStudentsPageSizeChange(newSize) {
    if (!window._studentsPageState) window._studentsPageState = { page: 1, pageSize: 20 };
    window._studentsPageState.pageSize = parseInt(newSize, 10) || 20;
    window._studentsPageState.page = 1;
    filterStudentsTable();
}
window.handleStudentsPageSizeChange = handleStudentsPageSizeChange;

function renderStudentsPaginationControls(currentPage, totalPages) {
    const container = document.getElementById("studentsPaginationControls");
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = `
        <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === 1 ? 'disabled' : ''} onclick="handleStudentsPageChange(1)" title="First Page">
            <i class="bi bi-chevron-double-left"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === 1 ? 'disabled' : ''} onclick="handleStudentsPageChange(${currentPage - 1})" title="Previous Page">
            <i class="bi bi-chevron-left"></i>
        </button>
    `;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let p = startPage; p <= endPage; p++) {
        html += `
            <button class="btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-outline-secondary'} py-0 px-2" onclick="handleStudentsPageChange(${p})">
                ${p}
            </button>
        `;
    }

    html += `
        <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleStudentsPageChange(${currentPage + 1})" title="Next Page">
            <i class="bi bi-chevron-right"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleStudentsPageChange(${totalPages})" title="Last Page">
            <i class="bi bi-chevron-double-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

function filterStudentsTable() {
    const rawQuery = (document.getElementById("studentSearchInput")?.value || "").trim();
    const query = rawQuery.toLowerCase();
    const riskFilter = document.getElementById("riskFilterSelect")?.value || "ALL";

    let filtered = students.filter(s => {
        let matchesQuery = true;
        if (query) {
            if (studentsRegexMode) {
                try {
                    const reg = new RegExp(rawQuery, 'i');
                    matchesQuery = reg.test(s.name) || reg.test(s.id) || reg.test(s.place || '') || reg.test(s.mother_tongue || s.motherTongue || '') || reg.test(s.course || '') || reg.test(s.email || '');
                } catch {
                    matchesQuery = s.name.toLowerCase().includes(query);
                }
            } else {
                matchesQuery =
                    s.name.toLowerCase().includes(query) ||
                    s.id.toLowerCase().includes(query) ||
                    (s.place && s.place.toLowerCase().includes(query)) ||
                    (s.email && s.email.toLowerCase().includes(query)) ||
                    ((s.mother_tongue || s.motherTongue) && (s.mother_tongue || s.motherTongue).toLowerCase().includes(query)) ||
                    fuzzyMatch(query, s.name.toLowerCase()) ||
                    fuzzyMatch(query, s.id.toLowerCase());
            }
        }

        let matchesRisk = true;
        if (riskFilter === "HIGH") matchesRisk = s.risk >= 60;
        if (riskFilter === "MEDIUM") matchesRisk = s.risk >= 30 && s.risk < 60;
        if (riskFilter === "LOW") matchesRisk = s.risk < 30;

        let matchesYear = true;
        if (window._selectedYearFilter && window._selectedYearFilter !== "ALL") {
            const yrTarget = window._selectedYearFilter.toLowerCase();
            const sYr = (s.year || "").toLowerCase();
            if (yrTarget.includes("1")) matchesYear = sYr.includes("1");
            else if (yrTarget.includes("2")) matchesYear = sYr.includes("2");
            else if (yrTarget.includes("3")) matchesYear = sYr.includes("3");
            else if (yrTarget.includes("4")) matchesYear = sYr.includes("4");
            else matchesYear = sYr === yrTarget;
        }

        return matchesQuery && matchesRisk && matchesYear;
    });

    const sorted = getSortedStudents(filtered);
    const { page, pageSize } = window._studentsPageState || { page: 1, pageSize: 20 };
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    if (window._studentsPageState) window._studentsPageState.page = currentPage;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, sorted.length);
    const pageItems = sorted.slice(startIndex, endIndex);

    const tbody = document.getElementById("studentsTableBody");
    if (tbody) tbody.innerHTML = generateStudentsTableRows(pageItems);

    const summary = document.getElementById("studentsCountSummary");
    if (summary) {
        summary.innerHTML = sorted.length > 0
            ? `Showing <strong>${startIndex + 1}-${endIndex}</strong> of <strong>${sorted.length}</strong> students ${sorted.length !== students.length ? `(filtered from ${students.length})` : ''}`
            : `No students matching filters`;
    }

    const pageInfo = document.getElementById("studentsPageInfo");
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }

    renderStudentsPaginationControls(currentPage, totalPages);
    updateBulkDeleteCount();
}

function filterStudentsByYear(year) {
    window._selectedYearFilter = year;
    if (window._studentsPageState) window._studentsPageState.page = 1;
    
    // Update active class on year tabs
    const container = document.getElementById("studentsYearTabsContainer");
    if (container) {
        container.querySelectorAll("button").forEach(btn => {
            if (btn.textContent.includes(year) || (year === 'ALL' && btn.textContent.includes('All Years'))) {
                btn.className = "btn btn-sm btn-primary active";
            } else {
                btn.className = "btn btn-sm btn-outline-secondary";
            }
        });
    }
    filterStudentsTable();
}
window.filterStudentsByYear = filterStudentsByYear;

async function handleAdvanceAttendanceDay() {
    const btn = document.getElementById("advanceAttdBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Advancing 24h (+2%)...`;
    }

    try {
        const res = await API.advanceAttendanceDay(2.0);
        if (res && res.success) {
            await loadLatestStudents();
            renderStudents();
            alert(`🎉 24-Hour Cycle Advanced!\n\nAttendance has been increased by +2.0% for all ${res.students_updated || 'active'} students.\nAI Risk scores and subject attendance have been updated dynamically.`);
        } else {
            alert("Attendance advancement failed: " + (res?.message || "Unknown error"));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="bi bi-clock-history"></i> Advance 24h (+2% Daily Attd)`;
            }
        }
    } catch (e) {
        console.error("Advance attendance error:", e);
        alert("Error connecting to server. Please try again.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-clock-history"></i> Advance 24h (+2% Daily Attd)`;
        }
    }
}
window.handleAdvanceAttendanceDay = handleAdvanceAttendanceDay;

function openEditModal(studentId) {
    const s = students.find(item => item.id === studentId);
    if (!s) return;

    document.getElementById("editStudentId").value = s.id;
    document.getElementById("editStudentName").value = s.name;
    document.getElementById("editStudentCourse").value = s.course || "CSE";
    document.getElementById("editStudentYear").value = s.year || "2nd Year";
    document.getElementById("editStudentAttendance").value = s.attendance;
    document.getElementById("editStudentCGPA").value = s.cgpa;
    document.getElementById("editStudentCredits").value = s.credits || 24;
    document.getElementById("editStudentLMS").value = s.lms_score || s.attendance;
    document.getElementById("editFatherName").value = s.father || "";
    document.getElementById("editMotherName").value = s.mother || "";
    document.getElementById("editMotherTongue").value = s.mother_tongue || s.motherTongue || "";
    document.getElementById("editStudentPlace").value = s.place || "";
    document.getElementById("editStudentRegion").value = s.region || "";
    document.getElementById("editStudentEmail").value = s.email || "";
    setPhoneInputFromFull("editStudentCountryCode", "editStudentPhone", s.phone || "");

    document.getElementById("editStudentModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editStudentModal")?.classList.remove("active");
}

function openImportStudentsModal() {
    document.getElementById("importStudentsModal")?.classList.add("active");
}
function closeImportStudentsModal() {
    document.getElementById("importStudentsModal")?.classList.remove("active");
}

async function handleImportStudentsSubmit() {
    const fileInput = document.getElementById("studentImportFileInput");
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert("Please select a CSV or Excel file to import.");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const progress = document.getElementById("studentImportProgress");
    if (progress) progress.classList.remove("d-none");

    const res = await API.importStudentsCSV(formData);
    if (progress) progress.classList.add("d-none");

    if (res && res.success) {
        alert(`Successfully imported ${res.imported} students! (${res.skipped} skipped). Risk indices calculated.`);
        closeImportStudentsModal();
        await loadLatestStudents();
        renderStudents();
    } else {
        alert(res?.message || "Failed to import students. Please check the file format.");
    }
}

async function handleDeleteStudent(studentId, studentName) {
    if (confirm(`Are you sure you want to delete student "${studentName}" (${studentId})? This will also remove associated marks and activities.`)) {
        const res = await API.deleteStudent(studentId);
        if (res && res.success) {
            alert(`Student ${studentName} deleted.`);
            await loadLatestStudents();
            renderStudents();
        }
    }
}

function openAddStudentModal() {
    const modal = document.getElementById("studentModal");
    const form = document.getElementById("studentForm");
    if (form) form.reset();
    if (modal) modal.classList.add("active");
}
function closeAddStudentModal() {
    document.getElementById("studentModal")?.classList.remove("active");
}

function initStudentModalEvents() {
    const closeModalBtn = document.getElementById("closeModal");
    const cancelModalBtn = document.getElementById("cancelModal");
    const studentForm = document.getElementById("studentForm");

    if (closeModalBtn) closeModalBtn.addEventListener("click", closeAddStudentModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener("click", closeAddStudentModal);

    if (studentForm) {
        studentForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const id = (document.getElementById("studentId")?.value || "").trim();
            const name = (document.getElementById("studentName")?.value || "").trim();
            const gender = (document.getElementById("studentGender")?.value || "").trim();
            const course = (document.getElementById("studentCourse")?.value || "").trim();
            const year = (document.getElementById("studentYear")?.value || "").trim();
            const rawCgpa = (document.getElementById("studentCGPA")?.value || "").trim();
            const rawAttd = (document.getElementById("studentAttendance")?.value || "").trim();
            const rawCredits = (document.getElementById("studentCredits")?.value || "").trim();
            const father = (document.getElementById("fatherName")?.value || "").trim();
            const mother = (document.getElementById("motherName")?.value || "").trim();
            const motherTongue = (document.getElementById("motherTongue")?.value || "").trim();
            const place = (document.getElementById("studentPlace")?.value || "").trim();
            const region = (document.getElementById("studentRegion")?.value || "").trim();
            const country = (document.getElementById("studentCountry")?.value || "").trim();
            const email = (document.getElementById("studentEmail")?.value || "").trim();
            const phone = getFullPhoneNumber("studentCountryCode", "studentPhone");
            const countryCodeSelect = document.getElementById("studentCountryCode");
            const opt = countryCodeSelect?.options[countryCodeSelect.selectedIndex];
            const requiredLen = parseInt(opt?.getAttribute("data-len") || "10", 10);
            const digits = (document.getElementById("studentPhone")?.value || "").replace(/\D/g, "");

            // Strict manual entry validation — refuse to submit if any field is empty
            if (!id || !name || !gender || !course || !year || rawCgpa === "" || rawAttd === "" || rawCredits === "" ||
                !father || !mother || !motherTongue || !place || !region || !country || !email || !digits) {
                alert("All fields are required. Please fill in every field manually.\n\n• If numeric data is not available, enter 0 (e.g. CGPA, Attendance, Credits).\n• If text data is not available, enter 'Unknown'.");
                return;
            }

            if (digits.length < requiredLen) {
                alert(`Please enter a valid ${requiredLen}-digit mobile number for ${opt?.textContent || 'selected country'}.`);
                return;
            }

            const cgpa = parseFloat(rawCgpa);
            const attendance = parseInt(rawAttd);
            const credits = parseInt(rawCredits);

            if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
                alert("Please enter a valid CGPA between 0.00 and 10.00 (or 0 if unavailable).");
                return;
            }
            if (isNaN(attendance) || attendance < 0 || attendance > 100) {
                alert("Please enter a valid Attendance percentage between 0 and 100 (or 0 if unavailable).");
                return;
            }
            if (isNaN(credits) || credits < 0) {
                alert("Please enter a valid non-negative number for Credits (or 0 if unavailable).");
                return;
            }

            const newStudent = {
                id,
                name,
                gender,
                course,
                year,
                cgpa,
                attendance,
                credits,
                father,
                mother,
                motherTongue,
                place,
                region,
                country,
                email,
                phone
            };

            const response = await API.addStudent(newStudent);

            if (response && response.success) {
                alert(`Student ${newStudent.name} (${newStudent.id}) added successfully! Calculated Risk Score: ${response.student?.risk || 0}%`);
                closeAddStudentModal();
                studentForm.reset();
                await loadLatestStudents();
                if (typeof renderStudents === "function") renderStudents();
            } else {
                alert("Error adding student: " + (response?.message || "Please check the entered values."));
            }
        });
    }
}


// =====================================================
// PERSISTENT MULTI-SELECT & BULK ACTIONS (ALL PAGES)
// =====================================================

function toggleSelectDropdown(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    const menu = document.getElementById("selectionDropdownMenu");
    if (!menu) return;
    const isShowing = menu.style.display === "block";
    menu.style.display = isShowing ? "none" : "block";

    if (!isShowing) {
        const dismissHandler = function(evt) {
            if (!menu.contains(evt.target)) {
                menu.style.display = "none";
                document.removeEventListener("click", dismissHandler);
            }
        };
        setTimeout(() => document.addEventListener("click", dismissHandler), 10);
    }
}
window.toggleSelectDropdown = toggleSelectDropdown;

function handleStudentCheckboxChange(cb) {
    if (!window._selectedStudentIds) window._selectedStudentIds = new Set();
    const sid = cb.dataset.studentId;
    if (cb.checked) {
        window._selectedStudentIds.add(sid);
    } else {
        window._selectedStudentIds.delete(sid);
    }

    // Highlight row
    const row = cb.closest("tr");
    if (row) {
        if (cb.checked) row.classList.add("table-active");
        else row.classList.remove("table-active");
    }

    updateBulkDeleteCount();
}
window.handleStudentCheckboxChange = handleStudentCheckboxChange;

function toggleSelectAllStudents(masterCheckbox) {
    if (!window._selectedStudentIds) window._selectedStudentIds = new Set();
    const isChecked = masterCheckbox.checked;

    const cbs = document.querySelectorAll(".student-select-cb");
    cbs.forEach(cb => {
        cb.checked = isChecked;
        const sid = cb.dataset.studentId;
        const row = cb.closest("tr");
        if (isChecked) {
            window._selectedStudentIds.add(sid);
            if (row) row.classList.add("table-active");
        } else {
            window._selectedStudentIds.delete(sid);
            if (row) row.classList.remove("table-active");
        }
    });

    updateBulkDeleteCount();
}
window.toggleSelectAllStudents = toggleSelectAllStudents;

function selectAllOnCurrentPage() {
    if (!window._selectedStudentIds) window._selectedStudentIds = new Set();
    const cbs = document.querySelectorAll(".student-select-cb");
    cbs.forEach(cb => {
        cb.checked = true;
        const sid = cb.dataset.studentId;
        window._selectedStudentIds.add(sid);
        const row = cb.closest("tr");
        if (row) row.classList.add("table-active");
    });
    const menu = document.getElementById("selectionDropdownMenu");
    if (menu) menu.style.display = "none";
    updateBulkDeleteCount();
}
window.selectAllOnCurrentPage = selectAllOnCurrentPage;

function selectAllAcrossAllPages() {
    if (!window._selectedStudentIds) window._selectedStudentIds = new Set();

    // Get all students currently in memory
    students.forEach(s => {
        if (s && s.id) {
            window._selectedStudentIds.add(s.id);
        }
    });

    // Update checkboxes on current page
    document.querySelectorAll(".student-select-cb").forEach(cb => {
        cb.checked = true;
        const row = cb.closest("tr");
        if (row) row.classList.add("table-active");
    });

    const selectAll = document.getElementById("selectAllStudents");
    if (selectAll) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    }

    const menu = document.getElementById("selectionDropdownMenu");
    if (menu) menu.style.display = "none";

    updateBulkDeleteCount();
}
window.selectAllAcrossAllPages = selectAllAcrossAllPages;

function selectAllByRiskTier(tier) {
    if (!window._selectedStudentIds) window._selectedStudentIds = new Set();
    
    students.forEach(s => {
        let matches = false;
        if (tier === 'HIGH') matches = (s.risk >= 60);
        else if (tier === 'MEDIUM') matches = (s.risk >= 30 && s.risk < 60);
        else if (tier === 'LOW') matches = (s.risk < 30);
        if (matches) {
            window._selectedStudentIds.add(s.id);
        }
    });

    // Update visible checkboxes
    document.querySelectorAll(".student-select-cb").forEach(cb => {
        const sid = cb.dataset.studentId;
        const checked = window._selectedStudentIds.has(sid);
        cb.checked = checked;
        const row = cb.closest("tr");
        if (row) {
            if (checked) row.classList.add("table-active");
            else row.classList.remove("table-active");
        }
    });

    const menu = document.getElementById("selectionDropdownMenu");
    if (menu) menu.style.display = "none";

    updateBulkDeleteCount();
}
window.selectAllByRiskTier = selectAllByRiskTier;

function clearStudentSelection() {
    if (window._selectedStudentIds) window._selectedStudentIds.clear();
    document.querySelectorAll(".student-select-cb").forEach(cb => {
        cb.checked = false;
        const row = cb.closest("tr");
        if (row) row.classList.remove("table-active");
    });
    const selectAll = document.getElementById("selectAllStudents");
    if (selectAll) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    }
    const menu = document.getElementById("selectionDropdownMenu");
    if (menu) menu.style.display = "none";
    updateBulkDeleteCount();
}
window.clearStudentSelection = clearStudentSelection;

function updateBulkDeleteCount() {
    const count = window._selectedStudentIds ? window._selectedStudentIds.size : 0;
    const totalStudents = students.length;

    const btn = document.getElementById("bulkDeleteBtn");
    const countSpan = document.getElementById("bulkDeleteCount");
    const toolbar = document.getElementById("studentsBulkToolbar");
    const toolbarCount = document.getElementById("bulkDeleteToolbarCount");
    const badge = document.getElementById("studentsBulkCountBadge");
    const bannerText = document.getElementById("studentsBulkBannerText");
    const selectAllPagesBtn = document.getElementById("selectAllAcrossPagesBtn");

    if (btn) {
        if (count > 0) btn.classList.remove("d-none");
        else btn.classList.add("d-none");
    }
    if (toolbar) {
        if (count > 0) toolbar.classList.remove("d-none");
        else toolbar.classList.add("d-none");
    }
    if (countSpan) countSpan.textContent = count;
    if (toolbarCount) toolbarCount.textContent = count;
    if (badge) badge.textContent = `${count} Selected`;

    if (bannerText) {
        if (count >= totalStudents && totalStudents > 0) {
            bannerText.innerHTML = `All <strong>${totalStudents}</strong> students across all pages are selected.`;
        } else {
            bannerText.innerHTML = `<strong>${count}</strong> student record${count === 1 ? '' : 's'} selected.`;
        }
    }

    if (selectAllPagesBtn) {
        if (count > 0 && count < totalStudents) {
            selectAllPagesBtn.classList.remove("d-none");
            selectAllPagesBtn.textContent = `Select all ${totalStudents} students across all pages`;
        } else {
            selectAllPagesBtn.classList.add("d-none");
        }
    }

    // Master checkbox state based on visible page items
    const pageCbs = document.querySelectorAll(".student-select-cb");
    const checkedPageCbs = document.querySelectorAll(".student-select-cb:checked");
    const selectAll = document.getElementById("selectAllStudents");
    if (selectAll) {
        if (count >= totalStudents && totalStudents > 0) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else if (pageCbs.length > 0 && checkedPageCbs.length === pageCbs.length) {
            selectAll.checked = true;
            selectAll.indeterminate = false;
        } else if (checkedPageCbs.length > 0 || (count > 0 && count < totalStudents)) {
            selectAll.checked = false;
            selectAll.indeterminate = true;
        } else {
            selectAll.checked = false;
            selectAll.indeterminate = false;
        }
    }
}
window.updateBulkDeleteCount = updateBulkDeleteCount;

function exportSelectedStudentsCSV() {
    if (!window._selectedStudentIds || window._selectedStudentIds.size === 0) {
        alert("No students selected for export.");
        return;
    }
    const selectedList = students.filter(s => window._selectedStudentIds.has(s.id));
    const headers = ["id", "name", "gender", "course", "year", "attendance", "cgpa", "credits", "lms_score", "risk", "father", "mother", "mother_tongue", "place", "region", "country", "email", "phone"];
    
    let csvContent = headers.join(",") + "\n";
    selectedList.forEach(s => {
        const row = headers.map(h => {
            let val = s[h] !== undefined ? s[h] : (s[h === 'mother_tongue' ? 'motherTongue' : ''] || '');
            let str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        });
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selected_students_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
window.exportSelectedStudentsCSV = exportSelectedStudentsCSV;

// =====================================================
// BULK DELETE SAFETY MODAL & EXECUTION
// =====================================================

function handleBulkDeleteStudents() {
    const count = window._selectedStudentIds ? window._selectedStudentIds.size : 0;
    if (count === 0) {
        alert("Please select at least one student record to delete.");
        return;
    }

    const modal = document.getElementById("studentBulkDeleteModal");
    const listContainer = document.getElementById("bulkDeleteStudentList");
    const countSpan = document.getElementById("bulkDeleteConfirmCount");

    if (countSpan) countSpan.textContent = count;

    if (listContainer) {
        const selectedList = students.filter(s => window._selectedStudentIds.has(s.id));
        const previewItems = selectedList.slice(0, 15);
        const remaining = selectedList.length - previewItems.length;

        listContainer.innerHTML = `
            <ul class="list-unstyled mb-0 d-flex flex-column gap-1">
                ${previewItems.map(s => {
                    const badgeClass = s.risk >= 60 ? 'bg-danger' : (s.risk >= 30 ? 'bg-warning text-dark' : 'bg-success');
                    return `
                        <li class="d-flex justify-content-between align-items-center p-2 rounded" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                            <div>
                                <strong style="color: var(--text);">${s.name}</strong> 
                                <code class="ms-1" style="background: var(--bg-elevated);">${s.id}</code>
                                <span class="text-muted small ms-2">(${s.course || 'CSE'} • ${s.year || '2nd Year'})</span>
                            </div>
                            <span class="badge ${badgeClass}">${s.risk}% Risk</span>
                        </li>
                    `;
                }).join("")}
                ${remaining > 0 ? `
                    <li class="p-2 text-center text-muted fw-semibold rounded" style="background: var(--bg-sunken);">
                        <i class="bi bi-three-dots"></i> and ${remaining} more student records across all pages
                    </li>
                ` : ''}
            </ul>
        `;
    }

    if (modal) modal.classList.add("active");
}
window.handleBulkDeleteStudents = handleBulkDeleteStudents;

function closeStudentBulkDeleteModal() {
    const modal = document.getElementById("studentBulkDeleteModal");
    if (modal) modal.classList.remove("active");
}
window.closeStudentBulkDeleteModal = closeStudentBulkDeleteModal;

async function executeBulkDeleteStudents() {
    const count = window._selectedStudentIds ? window._selectedStudentIds.size : 0;
    if (count === 0) return;

    const btn = document.getElementById("confirmBulkDeleteBtn");
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Deleting ${count} Student Records...`;
    }

    const ids = Array.from(window._selectedStudentIds);
    try {
        const res = await API.bulkDeleteStudents(ids);
        if (res && res.success) {
            closeStudentBulkDeleteModal();
            if (window._selectedStudentIds) window._selectedStudentIds.clear();
            await loadLatestStudents();
            renderStudents();
            alert(`Successfully deleted ${res.deleted || count} student record(s) and all associated data.`);
        } else {
            alert("Bulk delete failed: " + (res?.message || "Unknown error"));
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="bi bi-trash3-fill"></i> Confirm Permanent Delete`;
            }
        }
    } catch (err) {
        console.error("Bulk delete execution error:", err);
        alert("An error occurred while executing bulk delete. Please try again.");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-trash3-fill"></i> Confirm Permanent Delete`;
        }
    }
}
window.executeBulkDeleteStudents = executeBulkDeleteStudents;


