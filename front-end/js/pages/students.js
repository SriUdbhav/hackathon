/* =====================================================
   STUDENTS.JS
   Comprehensive Student Roster & Record Management
   Supports: Horizontal Smooth Scroll, All 16 Demographic &
             Academic Fields, Full CRUD (Add, Edit, Delete)
===================================================== */

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
                <h1 class="h3 fw-bold mb-1">📋 Comprehensive Student Database</h1>
                <p class="text-muted small mb-0">Complete cohort records with demographic info, multi-signal indicators & risk indices</p>
            </div>
            <div class="d-flex gap-2">
                <button class="primary-btn" onclick="openAddStudentModal()">
                    <i class="bi bi-person-plus-fill"></i> Add Student Record
                </button>
            </div>
        </div>

        <!-- SEARCH AND FILTER BAR -->
        <div class="card-box p-3 mb-4">
            <div class="row g-2">
                <div class="col-md-5">
                    <div class="input-group">
                        <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
                        <input type="text" id="studentSearchInput" class="form-control" placeholder="Search by name, ID, place, or mother tongue..." onkeyup="filterStudentsTable()">
                    </div>
                </div>
                <div class="col-md-3">
                    <select id="riskFilterSelect" class="form-select" onchange="filterStudentsTable()">
                        <option value="ALL">All Risk Levels</option>
                        <option value="HIGH">High Risk (&ge; 60%)</option>
                        <option value="MEDIUM">Moderate (30% - 59%)</option>
                        <option value="LOW">Low Risk (&lt; 30%)</option>
                    </select>
                </div>
                <div class="col-md-4 text-end my-auto">
                    <span class="text-muted small"><i class="bi bi-info-circle me-1"></i> Use horizontal scroll to inspect all 16 demographic columns</span>
                </div>
            </div>
        </div>

        <!-- STUDENTS TABLE WITH HORIZONTAL SCROLL -->
        <div class="card-box p-4">
            <div class="table-responsive" style="max-height: 600px; overflow-x: auto;">
                <table class="custom-table" id="studentsTable" style="white-space: nowrap;">
                    <thead>
                        <tr>
                            <th class="sticky-start bg-light">Student ID</th>
                            <th>Full Name</th>
                            <th>Gender</th>
                            <th>Course</th>
                            <th>Year</th>
                            <th>Attendance</th>
                            <th>CGPA</th>
                            <th>Credits</th>
                            <th>LMS Score</th>
                            <th>Academic Risk</th>
                            <th>Father's Name</th>
                            <th>Mother's Name</th>
                            <th>Mother Tongue</th>
                            <th>Place / City</th>
                            <th>Region</th>
                            <th>Country</th>
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                        ${generateStudentsTableRows(students)}
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
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="secondary-btn" onclick="closeEditModal()">Cancel</button>
                        <button type="submit" class="primary-btn">Save Changes</button>
                    </div>
                </form>
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
                region: document.getElementById("editStudentRegion").value.trim()
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

function generateStudentsTableRows(dataList) {
    if (!dataList || dataList.length === 0) {
        return `<tr><td colspan="17" class="text-center text-muted py-4">No student records found matching filter criteria.</td></tr>`;
    }
    return dataList.map(s => {
        let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
        let riskLabel = s.risk >= 60 ? "High Risk" : (s.risk >= 30 ? "Moderate" : "Low Risk");
        return `
            <tr>
                <td><code>${s.id}</code></td>
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
                <td>${s.country || 'India'}</td>
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
    const query = (document.getElementById("studentSearchInput")?.value || "").toLowerCase();
    const riskFilter = document.getElementById("riskFilterSelect")?.value || "ALL";

    const filtered = students.filter(s => {
        const matchesQuery =
            s.name.toLowerCase().includes(query) ||
            s.id.toLowerCase().includes(query) ||
            (s.place && s.place.toLowerCase().includes(query)) ||
            ((s.mother_tongue || s.motherTongue) && (s.mother_tongue || s.motherTongue).toLowerCase().includes(query));

        let matchesRisk = true;
        if (riskFilter === "HIGH") matchesRisk = s.risk >= 60;
        if (riskFilter === "MEDIUM") matchesRisk = s.risk >= 30 && s.risk < 60;
        if (riskFilter === "LOW") matchesRisk = s.risk < 30;

        return matchesQuery && matchesRisk;
    });

    const tbody = document.getElementById("studentsTableBody");
    if (tbody) tbody.innerHTML = generateStudentsTableRows(filtered);
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

    document.getElementById("editStudentModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editStudentModal")?.classList.remove("active");
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
    document.getElementById("studentModal")?.classList.add("active");
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

            const newStudent = {
                id: document.getElementById("studentId").value.trim(),
                name: document.getElementById("studentName").value.trim(),
                gender: document.getElementById("studentGender").value,
                course: document.getElementById("studentCourse").value.trim(),
                year: document.getElementById("studentYear").value,
                cgpa: parseFloat(document.getElementById("studentCGPA").value),
                attendance: parseInt(document.getElementById("studentAttendance").value),
                credits: parseInt(document.getElementById("studentCredits").value),
                father: document.getElementById("fatherName").value.trim() || "N/A",
                mother: document.getElementById("motherName").value.trim() || "N/A",
                motherTongue: document.getElementById("motherTongue").value.trim() || "Telugu",
                place: document.getElementById("studentPlace").value.trim() || "Hyderabad",
                region: document.getElementById("studentRegion").value.trim() || "South India",
                country: document.getElementById("studentCountry").value.trim() || "India"
            };

            const response = await API.addStudent(newStudent);

            if (response && response.success) {
                alert(`Student ${newStudent.name} (${newStudent.id}) added with risk score: ${response.student?.risk}%`);
                closeAddStudentModal();
                studentForm.reset();
                await loadLatestStudents();
                if (typeof renderStudents === "function") renderStudents();
            } else {
                alert("Error adding student: " + (response?.message || "Check fields."));
            }
        });
    }
}
