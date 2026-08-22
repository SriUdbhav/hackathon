/* =====================================================
   STUDENTS.JS
   Student Management, Filtering, Full CRUD (Add, Edit, Delete)
===================================================== */

function renderStudents() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">Student Roster & Profiles</h1>
                <p class="text-muted small mb-0">Full database of enrolled students, multi-signal indicators & risk metrics</p>
            </div>
            <button class="primary-btn" onclick="openAddStudentModal()">
                <i class="bi bi-person-plus"></i> Add New Student
            </button>
        </div>

        <!-- SEARCH AND FILTER BAR -->
        <div class="card-box p-3 mb-4">
            <div class="row g-2">
                <div class="col-md-6">
                    <input type="text" id="studentSearchInput" class="form-control" placeholder="Search student by name or ID..." onkeyup="filterStudentsTable()">
                </div>
                <div class="col-md-3">
                    <select id="riskFilterSelect" class="form-select" onchange="filterStudentsTable()">
                        <option value="ALL">All Risk Levels</option>
                        <option value="HIGH">High Risk (>= 60%)</option>
                        <option value="MEDIUM">Moderate (30-59%)</option>
                        <option value="LOW">Low Risk (< 30%)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- STUDENTS TABLE -->
        <div class="card-box p-4">
            <div class="table-responsive">
                <table class="custom-table" id="studentsTable">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Course</th>
                            <th>Attendance</th>
                            <th>CGPA</th>
                            <th>LMS Score</th>
                            <th>Risk Score</th>
                            <th>Actions</th>
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
                        <h2>Edit Student Signals</h2>
                    </div>
                    <button class="modal-close" onclick="closeEditModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="editStudentForm">
                    <input type="hidden" id="editStudentId">
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Student Name</label>
                            <input id="editStudentName" required>
                        </div>
                        <div class="form-group">
                            <label>Course</label>
                            <input id="editStudentCourse" required>
                        </div>
                        <div class="form-group">
                            <label>Attendance %</label>
                            <input id="editStudentAttendance" type="number" min="0" max="100" required>
                        </div>
                        <div class="form-group">
                            <label>CGPA</label>
                            <input id="editStudentCGPA" type="number" step="0.01" min="0" max="10" required>
                        </div>
                        <div class="form-group">
                            <label>LMS Engagement Score %</label>
                            <input id="editStudentLMS" type="number" min="0" max="100" required>
                        </div>
                        <div class="form-group">
                            <label>Year</label>
                            <select id="editStudentYear">
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                            </select>
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

    // Bind Edit Form Submit
    const editForm = document.getElementById("editStudentForm");
    if (editForm) {
        editForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const id = document.getElementById("editStudentId").value;
            const updatedData = {
                name: document.getElementById("editStudentName").value,
                course: document.getElementById("editStudentCourse").value,
                year: document.getElementById("editStudentYear").value,
                attendance: parseInt(document.getElementById("editStudentAttendance").value),
                cgpa: parseFloat(document.getElementById("editStudentCGPA").value),
                lms_score: parseInt(document.getElementById("editStudentLMS").value)
            };

            const res = await API.updateStudent(id, updatedData);
            if (res && res.success) {
                alert("Student updated successfully!");
                closeEditModal();
                await loadLatestStudents();
                renderStudents();
            } else {
                alert("Error updating student.");
            }
        });
    }
}

function generateStudentsTableRows(dataList) {
    if (!dataList || dataList.length === 0) {
        return `<tr><td colspan="8" class="text-center text-muted py-4">No student records found.</td></tr>`;
    }
    return dataList.map(s => {
        let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
        return `
            <tr>
                <td><strong>${s.id}</strong></td>
                <td>${s.name}</td>
                <td>${s.course} (${s.year || '2nd Year'})</td>
                <td>${s.attendance}%</td>
                <td>${s.cgpa}</td>
                <td>${s.lms_score || s.attendance}%</td>
                <td><span class="risk-badge ${badgeClass}">${s.risk}%</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" onclick="viewStudent360('${s.id}')" title="View 360 Profile">
                            <i class="bi bi-person-vcard"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="openEditModal('${s.id}')" title="Edit Student">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="handleDeleteStudent('${s.id}', '${s.name}')" title="Delete Student">
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
        const matchesQuery = s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query);
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
    document.getElementById("editStudentCourse").value = s.course;
    document.getElementById("editStudentYear").value = s.year || "2nd Year";
    document.getElementById("editStudentAttendance").value = s.attendance;
    document.getElementById("editStudentCGPA").value = s.cgpa;
    document.getElementById("editStudentLMS").value = s.lms_score || s.attendance;

    document.getElementById("editStudentModal").classList.add("active");
}

function closeEditModal() {
    document.getElementById("editStudentModal")?.classList.remove("active");
}

async function handleDeleteStudent(studentId, studentName) {
    if (confirm(`Are you sure you want to delete student "${studentName}" (${studentId})?`)) {
        const res = await API.deleteStudent(studentId);
        if (res && res.success) {
            alert(`Student ${studentName} deleted successfully.`);
            await loadLatestStudents();
            renderStudents();
        } else {
            // Local fallback
            students = students.filter(s => s.id !== studentId);
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
                course: document.getElementById("studentCourse").value,
                year: document.getElementById("studentYear").value,
                cgpa: parseFloat(document.getElementById("studentCGPA").value),
                attendance: parseInt(document.getElementById("studentAttendance").value),
                credits: parseInt(document.getElementById("studentCredits").value),
                father: document.getElementById("fatherName").value || "N/A",
                mother: document.getElementById("motherName").value || "N/A",
                motherTongue: document.getElementById("motherTongue").value || "Telugu",
                place: document.getElementById("studentPlace").value || "Hyderabad",
                region: document.getElementById("studentRegion").value || "South India",
                country: document.getElementById("studentCountry").value || "India"
            };

            const response = await API.addStudent(newStudent);

            if (response && response.success) {
                alert("Student added successfully!");
                closeAddStudentModal();
                studentForm.reset();
                await loadLatestStudents();
                renderStudents();
            } else {
                newStudent.risk = Math.max(0, 100 - newStudent.attendance);
                students.unshift(newStudent);
                alert("Student added locally!");
                closeAddStudentModal();
                studentForm.reset();
                renderStudents();
            }
        });
    }
}
