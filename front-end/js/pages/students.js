/* =====================================================
   STUDENTS.JS
   Comprehensive Student Roster & Record Management
   Supports: Horizontal Smooth Scroll, All 16 Demographic &
             Academic Fields, Full CRUD, Fuzzy & Regex Search,
             Interactive Column Sorting, Bulk CSV/Excel Import
===================================================== */

let studentsSortColumn = "risk";
let studentsSortAsc = false;
let studentsRegexMode = false;

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

    content.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">Comprehensive Student Database</h1>
                <p class="text-muted small mb-0">Complete cohort records with demographic info, multi-signal indicators & risk indices</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="secondary-btn" onclick="openImportStudentsModal()">
                    <i class="bi bi-file-earmark-arrow-up text-success"></i> Import CSV/Excel
                </button>
                <button class="primary-btn" onclick="openAddStudentModal()">
                    <i class="bi bi-person-plus-fill"></i> Add Student Record
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
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        ${generateStudentsTableRows(getSortedStudents(students))}
                    </tbody>
                </table>
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
                            <input id="editStudentPhone" type="tel" placeholder="+91 98480 00000">
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
                phone: document.getElementById("editStudentPhone").value.trim()
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
        return `<tr><td colspan="18" class="text-center text-muted py-4">No student records found matching filter criteria.</td></tr>`;
    }
    return dataList.map(s => {
        let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
        let riskLabel = s.risk >= 60 ? "High Risk" : (s.risk >= 30 ? "Moderate" : "Low Risk");
        return `
            <tr>
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
                <td><span class="risk-badge ${badgeClass}">${s.risk}% (${riskLabel})</span></td>
                <td>${s.father || 'N/A'}</td>
                <td>${s.mother || 'N/A'}</td>
                <td>${s.mother_tongue || s.motherTongue || 'Telugu'}</td>
                <td>${s.place || 'Hyderabad'}</td>
                <td>${s.region || 'South India'}</td>
                <td>
                    <div class="small">
                        ${s.email ? `<div><i class="bi bi-envelope me-1 text-muted"></i>${s.email}</div>` : ''}
                        ${s.phone ? `<div><i class="bi bi-telephone me-1 text-muted"></i>${s.phone}</div>` : ''}
                        ${!s.email && !s.phone ? '<span class="text-muted">N/A</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary btn-sm" onclick="viewStudent360('${s.id}')" title="360° Profile">
                            <i class="bi bi-person-vcard"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="openEditModal('${s.id}')" title="Edit Record">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onclick="handleDeleteStudent('${s.id}', '${s.name}')" title="Delete Record">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
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

        return matchesQuery && matchesRisk;
    });

    const sorted = getSortedStudents(filtered);
    const tbody = document.getElementById("studentsTableBody");
    if (tbody) tbody.innerHTML = generateStudentsTableRows(sorted);

    const summary = document.getElementById("studentsCountSummary");
    if (summary) {
        summary.innerHTML = `Showing <strong>${sorted.length}</strong> of <strong>${students.length}</strong> students`;
    }
}

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
    document.getElementById("editStudentPhone").value = s.phone || "";

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
            const phone = (document.getElementById("studentPhone")?.value || "").trim();

            // Strict manual entry validation — refuse to submit if any field is empty
            if (!id || !name || !gender || !course || !year || rawCgpa === "" || rawAttd === "" || rawCredits === "" ||
                !father || !mother || !motherTongue || !place || !region || !country || !email || !phone) {
                alert("All fields are required. Please fill in every field manually.\n\n• If numeric data is not available, enter 0 (e.g. CGPA, Attendance, Credits).\n• If text data is not available, enter 'Unknown'.");
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
