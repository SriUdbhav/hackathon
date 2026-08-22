/* =====================================================
   DASHBOARD.JS
   Renders main overview metrics, risk cards, and student table
===================================================== */

function renderDashboard() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    // Calculate metrics
    const totalStudents = students.length;
    const highRiskCount = students.filter(s => s.risk >= 60).length;
    const avgAttendance = Math.round(students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / (totalStudents || 1));
    const avgCGPA = (students.reduce((sum, s) => sum + Number(s.cgpa || 0), 0) / (totalStudents || 1)).toFixed(2);

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">Academic Risk & Engagement Dashboard</h1>
                <p class="text-muted small mb-0">Real-time AI monitoring & intervention overview</p>
            </div>
            <button class="primary-btn" onclick="openAddStudentModal()">
                <i class="bi bi-plus-lg"></i> Add Student
            </button>
        </div>

        <!-- METRIC CARDS GRID -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">TOTAL MONITORED</span>
                    <h2 class="fw-bold mb-0">${totalStudents}</h2>
                    <small class="text-success"><i class="bi bi-person-check me-1"></i> Active Students</small>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">HIGH RISK STUDENTS</span>
                    <h2 class="fw-bold text-danger mb-0">${highRiskCount}</h2>
                    <small class="text-danger"><i class="bi bi-exclamation-triangle me-1"></i> Requires Mentor Action</small>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">AVERAGE ATTENDANCE</span>
                    <h2 class="fw-bold mb-0">${avgAttendance}%</h2>
                    <small class="text-primary"><i class="bi bi-graph-up me-1"></i> Across All Courses</small>
                </div>
            </div>

            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">AVERAGE CGPA</span>
                    <h2 class="fw-bold mb-0">${avgCGPA}</h2>
                    <small class="text-success"><i class="bi bi-award me-1"></i> Semester Benchmark</small>
                </div>
            </div>
        </div>

        <!-- RECENT RISK STUDENTS TABLE -->
        <div class="card-box p-4">
            <div class="card-head">
                <h3>Priority Academic Risk Watchlist</h3>
                <span>Updated in real-time</span>
            </div>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Course / Year</th>
                            <th>Attendance</th>
                            <th>CGPA</th>
                            <th>Academic Risk</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.slice(0, 5).map(s => {
                            let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
                            let riskLabel = s.risk >= 60 ? "High Risk" : (s.risk >= 30 ? "Moderate" : "Low Risk");
                            return `
                                <tr>
                                    <td><strong>${s.id}</strong></td>
                                    <td>${s.name}</td>
                                    <td>${s.course} (${s.year})</td>
                                    <td>${s.attendance}%</td>
                                    <td>${s.cgpa}</td>
                                    <td><span class="risk-badge ${badgeClass}">${s.risk}% (${riskLabel})</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudent360('${s.id}')">
                                            View 360° Profile
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
