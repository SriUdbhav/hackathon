/* =====================================================
   DASHBOARD.JS
   Executive Academic Risk & Engagement Dashboard
   Supports: Stock-market Linear Charts (Chart.js),
             Persona-specific Views (Faculty vs Student),
             Subject Performance Overview, Real-time Alerts
===================================================== */

let attendanceTrendChart = null;

async function renderDashboard() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Make sure we have latest student list
    if (students.length === 0) {
        await loadLatestStudents();
    }

    // STUDENT PERSONA VIEW
    if (role === "student") {
        renderStudentDashboard(content, user);
        return;
    }

    // FACULTY / MENTOR / ADMIN VIEW
    renderFacultyAdminDashboard(content, user, role);
}

async function renderFacultyAdminDashboard(content, user, role) {
    const totalStudents = students.length;
    const highRiskStudents = students.filter(s => s.risk >= 60);
    const moderateRiskStudents = students.filter(s => s.risk >= 30 && s.risk < 60);
    const lowRiskStudents = students.filter(s => s.risk < 30);

    const avgAttendance = totalStudents > 0
        ? Math.round(students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / totalStudents)
        : 0;
    const avgCGPA = totalStudents > 0
        ? (students.reduce((sum, s) => sum + Number(s.cgpa || 0), 0) / totalStudents).toFixed(2)
        : "0.00";
    const avgLMS = totalStudents > 0
        ? Math.round(students.reduce((sum, s) => sum + Number(s.lms_score || s.attendance || 0), 0) / totalStudents)
        : 0;

    // Fetch live interventions
    const interventions = await API.getInterventions() || [];
    const pendingInterventions = interventions.filter(i => i.status === 'Pending' || i.status === 'In Progress');

    // Role-specific controls: only admin sees autonomous loop, only admin/faculty see add student
    const showAutonomousBtn = role === 'admin';
    const showAddStudentBtn = role === 'admin' || role === 'faculty';

    content.innerHTML = `
        <!-- HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">
                    Academic Health & Risk Overview
                </h1>
                <p class="small mb-0" style="color: var(--text-soft);">
                    Real-time academic monitoring, cohort signals, and predictive diagnostic radar
                </p>
            </div>
            <div class="d-flex gap-2">
                ${showAutonomousBtn ? `
                    <button class="secondary-btn d-flex align-items-center gap-2" onclick="triggerAutonomousCycle(this)">
                        <i class="bi bi-cpu text-primary"></i> Run Autonomous AI Diagnostic
                    </button>
                ` : ''}
                ${showAddStudentBtn ? `
                    <button class="primary-btn d-flex align-items-center gap-2" onclick="openAddStudentModal()">
                        <i class="bi bi-person-plus"></i> Add Student
                    </button>
                ` : ''}
            </div>
        </div>

        <!-- AT-A-GLANCE METRIC CARDS -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-blue">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Monitored Cohort</span>
                            <h2 class="fw-bold mb-0 text-dark">${totalStudents} <span class="fs-6 text-muted fw-normal">Students</span></h2>
                            <small class="text-primary mt-2 d-inline-flex align-items-center"><i class="bi bi-people-fill me-1"></i> B.Tech CSE (2nd Year)</small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-mortarboard"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-red">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">High Risk Students</span>
                            <h2 class="fw-bold mb-0 text-danger">${highRiskStudents.length} <span class="fs-6 text-muted fw-normal">Critical</span></h2>
                            <small class="text-danger mt-2 d-inline-flex align-items-center"><i class="bi bi-exclamation-triangle-fill me-1"></i> Action Required</small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-shield-exclamation"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-yellow">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Pending Mentorships</span>
                            <h2 class="fw-bold mb-0 text-warning">${pendingInterventions.length} <span class="fs-6 text-muted fw-normal">Active</span></h2>
                            <small class="text-warning mt-2 d-inline-flex align-items-center"><i class="bi bi-clock-history me-1"></i> 1-on-1 Sessions Queued</small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-person-lines-fill"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-green">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Cohort Avg Signals</span>
                            <h2 class="fw-bold mb-0 text-success">${avgAttendance}% <span class="fs-6 text-muted fw-normal">| ${avgCGPA} GPA</span></h2>
                            <small class="text-success mt-2 d-inline-flex align-items-center"><i class="bi bi-check-circle-fill me-1"></i> LMS Avg: ${avgLMS}%</small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-graph-up-arrow"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- LINEAR STOCK-MARKET GRAPH & HIGH RISK RADAR -->
        <div class="row g-4 mb-4">
            <div class="col-lg-8">
                <div class="card-box h-100">
                    <div class="card-head">
                        <div>
                            <h3 class="fw-bold"><i class="bi bi-activity text-primary me-2"></i> Cohort Weekly Attendance & Engagement Trend</h3>
                            <span class="text-muted small">8-Week linear progression tracking with volatility boundaries</span>
                        </div>
                        <span class="badge bg-success-subtle text-success px-2 py-1">
                            <i class="bi bi-arrow-up-right me-1"></i> Live Stream
                        </span>
                    </div>
                    <div style="position: relative; height: 280px;">
                        <canvas id="attendanceTrendCanvas"></canvas>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="card-box h-100 d-flex flex-column justify-content-between">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-shield-exclamation text-danger me-2"></i> Priority Interventions Required</h3>
                        <span class="badge bg-danger">${highRiskStudents.length} Flagged</span>
                    </div>

                    <div class="list-group list-group-flush flex-grow-1">
                        ${highRiskStudents.length === 0 ? '<p class="text-muted small my-auto text-center py-4"><i class="bi bi-check-circle me-1"></i>No students currently in High Risk status.</p>' :
                            highRiskStudents.map(s => `
                                <div class="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong class="d-block text-dark">${s.name} <code class="small">${s.id}</code></strong>
                                        <small class="text-danger fw-semibold">Risk: ${s.risk}% • Attd: ${s.attendance}% • CGPA: ${s.cgpa}</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-danger" onclick="viewStudent360('${s.id}')">
                                        Intervene
                                    </button>
                                </div>
                            `).join("")
                        }
                    </div>

                    <div class="pt-3 border-top mt-2">
                        <button class="btn btn-light w-100 btn-sm text-primary fw-semibold" onclick="navigateTo('mentor')">
                            Open Mentor Priority Dashboard <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- STUDENT QUICK ROSTER (Simplified for Faculty) -->
        <div class="card-box p-4">
            <div class="card-head">
                <div>
                    <h3 class="fw-bold"><i class="bi bi-people-fill text-primary me-2"></i> Student Cohort Overview</h3>
                    <span class="text-muted small">Quick risk snapshot — <strong>${highRiskStudents.length}</strong> high risk, <strong>${moderateRiskStudents.length}</strong> moderate, <strong>${lowRiskStudents.length}</strong> healthy</span>
                </div>
                <button class="primary-btn btn-sm" onclick="navigateTo('students')">View Full Records</button>
            </div>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Attendance</th>
                            <th>CGPA</th>
                            <th>Risk Index</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                            let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
                            let riskLabel = s.risk >= 60 ? "High Risk" : (s.risk >= 30 ? "Moderate" : "Low Risk");
                            return `
                                <tr>
                                    <td><code>${s.id}</code></td>
                                    <td><strong>${s.name}</strong></td>
                                    <td>
                                        <span class="${s.attendance < 75 ? 'text-danger fw-bold' : 'text-success'}">
                                            ${s.attendance}%
                                        </span>
                                    </td>
                                    <td><strong>${s.cgpa}</strong></td>
                                    <td><span class="risk-badge ${badgeClass}">${s.risk}% (${riskLabel})</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudent360('${s.id}')">
                                            <i class="bi bi-person-vcard"></i> 360°
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

    // Render stock-market style Chart.js linear graph
    initAttendanceLinearChart();
}

async function renderStudentDashboard(content, user) {
    const studentId = user.linked_student_id || user.id;
    const studentDetail = await API.getStudentDetail(studentId);

    if (!studentDetail || studentDetail.error) {
        content.innerHTML = `<div class="alert alert-warning">Student profile [${studentId}] record not found in system.</div>`;
        return;
    }

    const s = studentDetail;
    const marks = s.subject_marks || [];
    const activities = s.activities || [];
    const interventions = s.interventions || [];

    const badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
    const riskStatus = s.risk >= 60 ? "Academic Risk Warning" : (s.risk >= 30 ? "Moderate Attention" : "Good Academic Standing");

    content.innerHTML = `
        <!-- STUDENT WELCOME HEADER -->
        <div class="profile-header mb-4">
            <div class="profile-avatar-box">
                <div class="profile-avatar">${s.name.charAt(0)}</div>
                <div class="profile-info">
                    <h2>Welcome, ${s.name}! <span class="badge bg-light text-dark fs-6 ms-2">${s.id}</span></h2>
                    <p><i class="bi bi-book me-1"></i> ${s.course} • ${s.year} • CGPA: <strong>${s.cgpa}</strong></p>
                </div>
            </div>
            <div class="text-end">
                <span class="risk-badge ${badgeClass} fs-6 mb-2">${s.risk}% Risk (${riskStatus})</span>
                <p class="text-light-50 small mb-0"><i class="bi bi-shield-check me-1"></i> Personalized Student Portal</p>
            </div>
        </div>

        <!-- MY METRICS CARDS -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="stat-card-modern ${s.attendance < 75 ? 'accent-red' : 'accent-green'}">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">My Attendance</span>
                    <h2 class="fw-bold mb-0 ${s.attendance < 75 ? 'text-danger' : 'text-success'}">${s.attendance}%</h2>
                    <small class="text-muted mt-2 d-inline-flex align-items-center">${s.attendance < 75 ? '<i class="bi bi-exclamation-triangle text-danger me-1"></i>Below 75% cutoff' : '<i class="bi bi-check-circle text-success me-1"></i>Eligible for exams'}</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card-modern accent-blue">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Cumulative CGPA</span>
                    <h2 class="fw-bold mb-0 text-primary">${s.cgpa} <span class="fs-6 text-muted fw-normal">/ 10</span></h2>
                    <small class="text-muted mt-2 d-inline-flex align-items-center"><i class="bi bi-award text-primary me-1"></i> Credits: ${s.credits}</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card-modern accent-yellow">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">LMS Engagement</span>
                    <h2 class="fw-bold mb-0 text-warning">${s.lms_score || s.attendance}%</h2>
                    <small class="text-muted mt-2 d-inline-flex align-items-center"><i class="bi bi-lightning-charge text-warning me-1"></i> Portal activity</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card-modern accent-green">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Active Mentorships</span>
                    <h2 class="fw-bold mb-0 text-success">${interventions.length}</h2>
                    <small class="text-muted mt-2 d-inline-flex align-items-center"><i class="bi bi-person-check text-success me-1"></i> Academic Support</small>
                </div>
            </div>
        </div>

        <!-- MY SUBJECTS & MARKS BREAKDOWN -->
        <div class="card-box p-4 mb-4">
            <div class="card-head">
                <div>
                    <h3 class="fw-bold"><i class="bi bi-journal-check text-primary me-2"></i> My Enrolled Subjects & Performance</h3>
                    <span class="text-muted small">Semester 3 Subject attendance, internal assessment scores, and grades</span>
                </div>
            </div>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Subject Code</th>
                            <th>Subject Name</th>
                            <th>Attendance</th>
                            <th>Internal Marks (30)</th>
                            <th>Assignment (100%)</th>
                            <th>Estimated Grade</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${marks.map(m => `
                            <tr>
                                <td><code>${m.subject_code}</code></td>
                                <td><strong>${m.subject_name || m.short_name}</strong></td>
                                <td>
                                    <span class="${m.attendance < 75 ? 'text-danger fw-bold' : 'text-success'}">
                                        ${m.attendance}%
                                    </span>
                                </td>
                                <td><strong>${m.internal_marks} / 30</strong></td>
                                <td>${m.assignment_score}%</td>
                                <td><span class="badge bg-primary">${m.grade}</span></td>
                                <td>
                                    ${m.attendance < 70 || m.internal_marks < 12
                                        ? '<span class="badge bg-danger">Support Needed</span>'
                                        : '<span class="badge bg-success">On Track</span>'
                                    }
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- MY EXTRACURRICULAR ACTIVITIES & INTERVENTIONS -->
        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-trophy text-warning me-2"></i> My Extracurricular & Club Engagements</h3>
                    </div>
                    ${activities.length === 0 ? '<p class="text-muted small">No extracurricular activities registered yet.</p>' : `
                        <div class="d-flex flex-wrap gap-2 mb-3">
                            ${activities.map(a => `
                                <div class="activity-tag ${a.category.toLowerCase()} p-2 rounded">
                                    <strong>${a.activity_name}</strong> (${a.category})
                                    <span class="badge bg-light text-dark ms-1">${a.role}</span>
                                    ${a.notes ? `<small class="d-block text-muted mt-1">${a.notes}</small>` : ''}
                                </div>
                            `).join("")}
                        </div>
                    `}
                </div>
            </div>

            <div class="col-md-6">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-chat-heart text-danger me-2"></i> Faculty Mentoring & Guidance</h3>
                    </div>
                    ${interventions.length === 0 ? '<p class="text-muted small">No active mentoring interventions assigned. Keep up the good work!</p>' : `
                        <div class="list-group list-group-flush">
                            ${interventions.map(i => `
                                <div class="list-group-item px-0 py-2 border-bottom">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <strong class="text-dark">${i.action}</strong>
                                        <span class="badge ${i.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}">${i.status}</span>
                                    </div>
                                    <p class="small text-muted mb-0"><i class="bi bi-calendar3 me-1"></i> ${i.date} ${i.notes ? `• ${i.notes}` : ''}</p>
                                </div>
                            `).join("")}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

function initAttendanceLinearChart() {
    const canvas = document.getElementById("attendanceTrendCanvas");
    if (!canvas) return;

    if (attendanceTrendChart) {
        attendanceTrendChart.destroy();
    }

    const ctx = canvas.getContext("2d");

    // Create rich gradient background for stock-market look
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.35)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");

    attendanceTrendChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8 (Current)"],
            datasets: [
                {
                    label: "Cohort Attendance %",
                    data: [84, 82, 85, 79, 76, 78, 77, 78],
                    borderColor: "#3b82f6",
                    backgroundColor: gradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: "#3b82f6",
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: "Mandatory Threshold (75%)",
                    data: [75, 75, 75, 75, 75, 75, 75, 75],
                    borderColor: "#ef4444",
                    borderWidth: 2,
                    borderDash: [6, 6],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } }
                },
                tooltip: {
                    backgroundColor: "#1e293b",
                    padding: 10,
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    min: 50,
                    max: 100,
                    grid: { color: "#f1f5f9" },
                    ticks: { callback: v => v + "%" }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

async function triggerAutonomousCycle(btn) {
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Reasoning AI Loop...`;
    }
    const res = await API.runAutonomousLoop();
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-robot text-primary"></i> Run Autonomous AI Loop`;
    }
    if (res && res.success) {
        alert(`Autonomous AI loop completed successfully! Executed ${res.actions_count} diagnostic actions and dispatched interventions.`);
        await loadLatestStudents();
        renderDashboard();
    } else {
        alert("Autonomous cycle triggered.");
    }
}
