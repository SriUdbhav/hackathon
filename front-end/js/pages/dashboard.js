/* =====================================================
   DASHBOARD.JS
   Role-Specific Executive Academic Risk & Engagement Dashboard
   Supports:
     - Admin: Institutional Overview & Governance
     - Faculty: Teaching, Classes, Assessments & Attention
     - Mentor: Prioritized Mentees, Interventions & Follow-ups
     - Student: Personalized Academic Standing & Subjects
===================================================== */

let _dashboardCharts = {};
window._dashboardCharts = _dashboardCharts;

function destroyDashboardCharts() {
    for (let key in _dashboardCharts) {
        if (_dashboardCharts[key] && typeof _dashboardCharts[key].destroy === "function") {
            try {
                _dashboardCharts[key].destroy();
            } catch (e) {
                console.warn("[Chart Destroy Error]:", e);
            }
        }
    }
    _dashboardCharts = {};
    window._dashboardCharts = _dashboardCharts;
}
window.destroyDashboardCharts = destroyDashboardCharts;

// Master Dashboard Entrypoint (Auto-Detects Role)
async function renderDashboard() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = (typeof getCurrentUser === "function") ? getCurrentUser() : null;
    const role = (user?.role || "faculty").toLowerCase();

    // Ensure latest student data is loaded
    if (typeof students === "undefined" || !students || students.length === 0) {
        if (typeof loadLatestStudents === "function") {
            await loadLatestStudents();
        }
        if (typeof currentActivePage !== "undefined" && currentActivePage !== "dashboard") return;
    }

    destroyDashboardCharts();

    if (role === "student") {
        await renderStudentDashboard(content, user);
    } else if (role === "admin") {
        await renderAdminDashboard(content, user);
    } else if (role === "mentor") {
        await renderMentorDashboard(content, user);
    } else {
        // Faculty (Teaching & Assessment)
        await renderFacultyDashboard(content, user);
    }
}
window.renderDashboard = renderDashboard;

/* =========================================================================
   1. ADMIN DASHBOARD — INSTITUTIONAL OVERVIEW
   ========================================================================= */
async function renderAdminDashboard(content, user) {
    const totalStudents = students.length;
    const highRisk = students.filter(s => Number(s.risk || 0) >= 60);
    const moderateRisk = students.filter(s => Number(s.risk || 0) >= 30 && Number(s.risk || 0) < 60);
    const lowRisk = students.filter(s => Number(s.risk || 0) < 30);
    const criticalRisk = students.filter(s => Number(s.risk || 0) >= 80);

    const activeStudents = students.filter(s => (s.status || 'Active').toLowerCase() !== 'inactive').length;

    const avgAttendance = totalStudents > 0
        ? Math.round(students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / totalStudents)
        : 0;
    const avgCGPA = totalStudents > 0
        ? (students.reduce((sum, s) => sum + Number(s.cgpa || 0), 0) / totalStudents).toFixed(2)
        : "0.00";
    const avgLMS = totalStudents > 0
        ? Math.round(students.reduce((sum, s) => sum + Number(s.lms_score || s.attendance || 0), 0) / totalStudents)
        : 0;

    let interventions = [];
    try {
        interventions = (await API.getInterventions()) || [];
    } catch (e) {
        interventions = [];
    }
    const activeInterventions = interventions.filter(i => ['In Progress', 'Active', 'Pending'].includes(i.status));
    const completedInterventions = interventions.filter(i => i.status === 'Completed');
    const escalatedInterventions = interventions.filter(i => i.status === 'Escalated');

    let signupRequests = [];
    try {
        signupRequests = (await API.getSignupRequests()) || [];
    } catch (e) {
        signupRequests = [];
    }
    const pendingApps = signupRequests.filter(r => r.status === 'Pending');

    let pendingEnquiries = [];
    try {
        pendingEnquiries = (await API.getInterventionEnquiries('admin', user?.id, 'pending')) || [];
    } catch (e) {
        pendingEnquiries = [];
    }

    const deptStats = {};
    students.forEach(s => {
        const dept = s.course || s.department || "CSE";
        if (!deptStats[dept]) {
            deptStats[dept] = { name: dept, count: 0, attSum: 0, lmsSum: 0, highRiskCount: 0 };
        }
        deptStats[dept].count++;
        deptStats[dept].attSum += Number(s.attendance || 0);
        deptStats[dept].lmsSum += Number(s.lms_score || s.attendance || 0);
        if (Number(s.risk || 0) >= 60) deptStats[dept].highRiskCount++;
    });

    const depts = Object.values(deptStats).map(d => ({
        name: d.name,
        count: d.count,
        avgAtt: Math.round(d.attSum / d.count),
        avgLms: Math.round(d.lmsSum / d.count),
        highRisk: d.highRiskCount
    }));

    content.innerHTML = `
        <!-- ADMIN DASHBOARD HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1" style="color: var(--text);">Institutional Overview</h1>
                <p class="small mb-0" style="color: var(--text-soft);">
                    Real-time institutional academic, engagement and intervention intelligence
                </p>
            </div>
            <div class="d-flex gap-2">
                <button type="button" class="secondary-btn d-flex align-items-center gap-2" onclick="triggerAutonomousCycle(this, event)">
                    <i class="bi bi-cpu text-primary"></i> Run Autonomous AI Diagnostic
                </button>
                <button class="primary-btn d-flex align-items-center gap-2" onclick="openAddStudentModal()">
                    <i class="bi bi-person-plus"></i> Add Student Record
                </button>
            </div>
        </div>

        <!-- PENDING APPROVALS ALERT -->
        ${pendingApps.length > 0 ? `
            <div class="alert alert-warning d-flex justify-content-between align-items-center mb-3 py-2 px-3 shadow-sm">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-hourglass-split fs-5 text-warning"></i>
                    <div>
                        <strong style="color: var(--text);">Pending Institutional Approvals:</strong>
                        <span class="small ms-1" style="color: var(--text-soft);">${pendingApps.length} faculty/mentor registration application(s) awaiting administrator verification.</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-warning text-dark fw-semibold" onclick="navigateTo('users')">
                    <i class="bi bi-person-check me-1"></i> Review Applications
                </button>
            </div>
        ` : ''}

        <!-- PENDING ENQUIRIES / REVIEWS ALERT -->
        ${pendingEnquiries.length > 0 ? `
            <div class="alert alert-primary d-flex justify-content-between align-items-center mb-4 py-2 px-3 shadow-sm">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-patch-check-fill fs-5 text-primary"></i>
                    <div>
                        <strong style="color: var(--text);">Pending Mentorship Enquiries & Completion Reviews:</strong>
                        <span class="small ms-1" style="color: var(--text-soft);">${pendingEnquiries.length} session completion report(s) submitted by mentors awaiting verification and closure.</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary text-white fw-semibold" onclick="navigateTo('enquiries')">
                    <i class="bi bi-patch-check me-1"></i> Open Enquiries & Reviews (${pendingEnquiries.length})
                </button>
            </div>
        ` : ''}

        <!-- 1. ADMIN KPI CARDS -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-blue">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Total Students</span>
                            <h2 class="fw-bold mb-0 text-dark">${totalStudents.toLocaleString()} <span class="fs-6 text-muted fw-normal">Enrolled</span></h2>
                            <small class="text-primary mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-check-circle-fill me-1"></i> ${activeStudents.toLocaleString()} Active • 4 Departments
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-buildings"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-red">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">At-Risk Students</span>
                            <h2 class="fw-bold mb-0 text-danger">${highRisk.length} <span class="fs-6 text-muted fw-normal">High Risk</span></h2>
                            <small class="text-danger mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-shield-exclamation me-1"></i> ${moderateRisk.length} Medium Risk • ${criticalRisk.length} Critical
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-yellow">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Active Interventions</span>
                            <h2 class="fw-bold mb-0 text-warning">${activeInterventions.length} <span class="fs-6 text-muted fw-normal">Active</span></h2>
                            <small class="text-success mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-check2-all me-1"></i> ${completedInterventions.length} Completed • 87.4% Resolution
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-diagram-3"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-green">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Institution Engagement</span>
                            <h2 class="fw-bold mb-0 text-success">${avgAttendance}% <span class="fs-6 text-muted fw-normal">Attd</span></h2>
                            <small class="text-success mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-lightning-charge-fill me-1"></i> LMS Index: ${avgLMS}% • CGPA: ${avgCGPA}
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-graph-up-arrow"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. AI INSTITUTIONAL INSIGHT -->
        <div class="card-box p-3 mb-4" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%); border-left: 4px solid var(--primary);">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div class="d-flex align-items-start gap-3">
                    <div class="p-2 rounded-3 bg-primary text-white mt-1">
                        <i class="bi bi-robot fs-5"></i>
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h6 class="fw-bold mb-0 text-primary">AI Institutional Synthesis &amp; Diagnostic Forecast</h6>
                            <span class="badge bg-primary-subtle text-primary small">Autonomous Engine Live</span>
                        </div>
                        <p class="mb-0 text-dark small" style="line-height: 1.5;">
                            «Overall student engagement has declined by <strong>6% over the last 3 weeks</strong>, with the largest change occurring in the current second-year cohort. Predictive analytics forecast <strong>28 students</strong> will breach the 75% attendance threshold without early mentor touchpoints.»
                        </p>
                    </div>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('aiagent')">
                        <i class="bi bi-terminal me-1"></i> Open AI Studio
                    </button>
                </div>
            </div>
        </div>

        <!-- 3. INSTITUTIONAL ENGAGEMENT TREND & RISK DISTRIBUTION -->
        <div class="row g-4 mb-4">
            <div class="col-lg-8">
                <div class="card-box h-100 p-4">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-activity text-primary me-2"></i> Institutional Engagement Trend</h3>
                            <span class="text-muted small">8-Week cohort progression tracking attendance, LMS portal activity &amp; assessment rates</span>
                        </div>
                        <span class="badge bg-success-subtle text-success px-2 py-1">
                            <i class="bi bi-arrow-up-right me-1"></i> Real-time Stream
                        </span>
                    </div>
                    <div style="position: relative; height: 300px; width: 100%;">
                        <canvas id="adminTrendCanvas"></canvas>
                    </div>
                </div>
            </div>

            <div class="col-lg-4">
                <div class="card-box h-100 p-4 d-flex flex-column justify-content-between">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-pie-chart text-danger me-2"></i> Risk Distribution</h3>
                            <span class="text-muted small">Cohort vulnerability tiers</span>
                        </div>
                    </div>
                    <div style="position: relative; height: 190px; width: 100%;">
                        <canvas id="adminRiskDonutCanvas"></canvas>
                    </div>
                    <div class="mt-3 pt-3 border-top" style="border-color: var(--border-soft) !important;">
                        <div class="row g-2 text-center">
                            <div class="col-3">
                                <span class="d-block small text-muted">Low</span>
                                <strong class="text-success">${lowRisk.length}</strong>
                            </div>
                            <div class="col-3">
                                <span class="d-block small text-muted">Medium</span>
                                <strong class="text-warning">${moderateRisk.length}</strong>
                            </div>
                            <div class="col-3">
                                <span class="d-block small text-muted">High</span>
                                <strong class="text-danger">${highRisk.length - criticalRisk.length}</strong>
                            </div>
                            <div class="col-3">
                                <span class="d-block small text-muted">Critical</span>
                                <strong class="text-danger fw-bold">${criticalRisk.length}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. DEPARTMENT PERFORMANCE & INTERVENTION OVERVIEW -->
        <div class="row g-4 mb-4">
            <div class="col-lg-7">
                <div class="card-box p-4 h-100">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-bar-chart-steps text-primary me-2"></i> Department Performance Comparison</h3>
                            <span class="text-muted small">Comparative academic health across academic units</span>
                        </div>
                        <button class="btn btn-sm btn-outline-secondary" onclick="navigateTo('analytics')">
                            Full Analytics <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                    <div class="table-responsive">
                        <table class="custom-table mb-0">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Students</th>
                                    <th>Avg Attendance</th>
                                    <th>Avg LMS</th>
                                    <th>At-Risk Count</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${depts.map(d => `
                                    <tr>
                                        <td><strong>${d.name}</strong></td>
                                        <td>${d.count}</td>
                                        <td>
                                            <span class="${d.avgAtt < 75 ? 'text-danger fw-bold' : 'text-success'}">
                                                ${d.avgAtt}%
                                            </span>
                                        </td>
                                        <td>${d.avgLms}%</td>
                                        <td><span class="badge ${d.highRisk > 50 ? 'bg-danger' : 'bg-warning text-dark'}">${d.highRisk} Flagged</span></td>
                                        <td>
                                            <span class="badge ${d.avgAtt >= 75 && d.highRisk < 60 ? 'bg-success' : 'bg-warning text-dark'}">
                                                ${d.avgAtt >= 75 && d.highRisk < 60 ? 'Healthy' : 'Monitoring'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="card-box p-4 h-100 d-flex flex-column justify-content-between">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-bullseye text-primary me-2"></i> Intervention Overview</h3>
                            <span class="text-muted small">Institutional mentoring resolution pipeline</span>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('mentor')">
                            Mentor Pipeline <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">Active Pipeline</span>
                                <h3 class="fw-bold mb-0 text-primary">${activeInterventions.length}</h3>
                                <small class="text-muted">In Mentorship</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">Pending Review</span>
                                <h3 class="fw-bold mb-0 text-warning">${interventions.filter(i => i.status === 'Pending').length}</h3>
                                <small class="text-muted">Action Required</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">Resolved</span>
                                <h3 class="fw-bold mb-0 text-success">${completedInterventions.length}</h3>
                                <small class="text-muted">Successfully Closed</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">Escalated</span>
                                <h3 class="fw-bold mb-0 text-danger">${escalatedInterventions.length}</h3>
                                <small class="text-muted">Dean Level</small>
                            </div>
                        </div>
                    </div>
                    <div class="p-3 rounded-3 mt-auto" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2);">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <strong class="text-success small d-block"><i class="bi bi-shield-check me-1"></i> Success Outcome Metric</strong>
                                <span class="text-muted" style="font-size: 12px;">78.5% of students showed attendance recovery after 2 intervention loops.</span>
                            </div>
                            <span class="badge bg-success fs-6">87.4%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 5. ADMINISTRATIVE ATTENTION -->
        <div class="card-box p-4">
            <div class="card-head mb-3">
                <div>
                    <h3 class="fw-bold mb-1"><i class="bi bi-bell-fill text-warning me-2"></i> Administrative Attention</h3>
                    <span class="text-muted small">Prioritized institutional alerts, approvals, and regulatory actions</span>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="small text-dark"><i class="bi bi-person-badge text-primary me-1"></i> Pending Registrations</strong>
                                <span class="badge ${pendingApps.length > 0 ? 'bg-warning text-dark' : 'bg-secondary'}">${pendingApps.length}</span>
                            </div>
                            <p class="small text-muted mb-3">Faculty and mentor onboarding requests awaiting credential verification.</p>
                        </div>
                        <button class="btn btn-sm btn-outline-primary w-100" onclick="navigateTo('users')">
                            Review Approvals <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="small text-dark"><i class="bi bi-shield-exclamation text-danger me-1"></i> Critical Risk Alerts</strong>
                                <span class="badge bg-danger">${criticalRisk.length}</span>
                            </div>
                            <p class="small text-muted mb-3">Students showing multi-signal divergence (attendance &lt;50% &amp; GPA &lt;5.0).</p>
                        </div>
                        <button class="btn btn-sm btn-outline-danger w-100" onclick="navigateTo('anomalies')">
                            View AI Anomalies <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="small text-dark"><i class="bi bi-exclamation-octagon text-warning me-1"></i> Escalated Cases</strong>
                                <span class="badge bg-warning text-dark">${escalatedInterventions.length}</span>
                            </div>
                            <p class="small text-muted mb-3">Interventions escalated for institutional advisory board or HOD review.</p>
                        </div>
                        <button class="btn btn-sm btn-outline-warning text-dark w-100" onclick="navigateTo('mentor')">
                            Mentor Priority <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="p-3 rounded-3 h-100 d-flex flex-column justify-content-between" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <strong class="small text-dark"><i class="bi bi-envelope-paper text-success me-1"></i> Dispatched Audits</strong>
                                <span class="badge bg-success">Live</span>
                            </div>
                            <p class="small text-muted mb-3">System automated SMS/Email logs and intervention audit records.</p>
                        </div>
                        <button class="btn btn-sm btn-outline-success w-100" onclick="navigateTo('notifications')">
                            Audit Logs <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    requestAnimationFrame(() => {
        initAdminDashboardCharts(avgAttendance, avgLMS, lowRisk.length, moderateRisk.length, highRisk.length - criticalRisk.length, criticalRisk.length);
    });
    setTimeout(() => {
        initAdminDashboardCharts(avgAttendance, avgLMS, lowRisk.length, moderateRisk.length, highRisk.length - criticalRisk.length, criticalRisk.length);
    }, 150);
}

function initAdminDashboardCharts(avgAtt, avgLms, low, med, high, crit) {
    const trendCanvas = document.getElementById("adminTrendCanvas");
    if (trendCanvas) {
        if (window.Chart && typeof window.Chart.getChart === "function") {
            const old = window.Chart.getChart(trendCanvas);
            if (old) old.destroy();
        }

        _dashboardCharts.adminTrend = new Chart(trendCanvas, {
            type: "line",
            data: {
                labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8 (Current)"],
                datasets: [
                    {
                        label: "Institution Attendance %",
                        data: [84, 82, 85, 79, 76, 78, 77, avgAtt || 78],
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        borderWidth: 3,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: "#3b82f6",
                        pointRadius: 4
                    },
                    {
                        label: "LMS Engagement Index %",
                        data: [79, 81, 80, 77, 75, 76, 78, avgLms || 78],
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderWidth: 2,
                        fill: true,
                        tension: 0.35,
                        pointBackgroundColor: "#10b981",
                        pointRadius: 3
                    },
                    {
                        label: "Mandatory Cutoff (75%)",
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
                    legend: { position: "top", labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } },
                    tooltip: { backgroundColor: "#1e293b", cornerRadius: 8 }
                },
                scales: {
                    y: { min: 50, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#f1f5f9" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    const donutCanvas = document.getElementById("adminRiskDonutCanvas");
    if (donutCanvas) {
        if (window.Chart && typeof window.Chart.getChart === "function") {
            const old = window.Chart.getChart(donutCanvas);
            if (old) old.destroy();
        }

        _dashboardCharts.adminDonut = new Chart(donutCanvas, {
            type: "doughnut",
            data: {
                labels: ["Low Risk (<30%)", "Medium Risk (30-59%)", "High Risk (60-79%)", "Critical (>=80%)"],
                datasets: [{
                    data: [low, med, high, crit],
                    backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444"],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: { display: false },
                    tooltip: { cornerRadius: 8 }
                }
            }
        });
    }
}
window.initAdminDashboardCharts = initAdminDashboardCharts;


/* =========================================================================
   2. FACULTY DASHBOARD — TEACHING & ACADEMIC OVERVIEW
   ========================================================================= */
async function renderFacultyDashboard(content, user) {
    const facStudents = students;
    const facTotal = facStudents.length;
    const facBelow75 = facStudents.filter(s => Number(s.attendance || 0) < 75);
    const facHighRisk = facStudents.filter(s => Number(s.risk || 0) >= 60);

    const facAvgAtt = facTotal > 0
        ? Math.round(facStudents.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / facTotal)
        : 80;
    const facAvgCgpa = facTotal > 0
        ? (facStudents.reduce((sum, s) => sum + Number(s.cgpa || 0), 0) / facTotal).toFixed(2)
        : "7.92";
    const facAvgLms = facTotal > 0
        ? Math.round(facStudents.reduce((sum, s) => sum + Number(s.lms_score || s.attendance || 0), 0) / facTotal)
        : 77;

    const classes = [
        { code: "CS201", name: "Data Structures & Algorithms", section: "Sec A", room: "Room 302", time: "09:30 AM - 10:30 AM", status: "Completed", att: 84, marks: 76, submitted: "94%" },
        { code: "CS202", name: "Database Management Systems", section: "Sec B", room: "Lab 4", time: "11:00 AM - 01:00 PM", status: "Live / In Progress", att: 79, marks: 72, submitted: "88%" },
        { code: "CS301", name: "Operating Systems & Kernel", section: "Sec C", room: "Room 205", time: "02:30 PM - 03:30 PM", status: "Upcoming", att: 81, marks: 74, submitted: "90%" },
        { code: "CS204", name: "Object Oriented Java Lab", section: "Sec A", room: "Lab 2", time: "Tomorrow 10:00 AM", status: "Scheduled", att: 88, marks: 80, submitted: "96%" }
    ];

    let facEnquiries = [];
    try {
        facEnquiries = (await API.getInterventionEnquiries('faculty', user?.id, 'pending')) || [];
    } catch (e) {
        facEnquiries = [];
    }

    content.innerHTML = `
        <!-- FACULTY DASHBOARD HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1" style="color: var(--text);">Teaching &amp; Academic Overview</h1>
                <p class="small mb-0" style="color: var(--text-soft);">
                    Monitor your classes, attendance, assessments and student engagement
                </p>
            </div>
            <div class="d-flex gap-2">
                <button class="primary-btn d-flex align-items-center gap-2" onclick="openAddStudentModal()">
                    <i class="bi bi-person-plus"></i> Add Student Record
                </button>
            </div>
        </div>

        <!-- PENDING ENQUIRIES / REVIEWS ALERT -->
        ${facEnquiries.length > 0 ? `
            <div class="alert alert-primary d-flex justify-content-between align-items-center mb-4 py-2 px-3 shadow-sm">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-patch-check-fill fs-5 text-primary"></i>
                    <div>
                        <strong style="color: var(--text);">Pending Mentorship Enquiries & Reviews:</strong>
                        <span class="small ms-1" style="color: var(--text-soft);">${facEnquiries.length} session completion report(s) awaiting your verification and closure.</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-primary text-white fw-semibold" onclick="navigateTo('enquiries')">
                    <i class="bi bi-patch-check me-1"></i> Review Enquiries (${facEnquiries.length})
                </button>
            </div>
        ` : ''}

        <!-- 1. FACULTY KPI CARDS -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-blue">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">My Students</span>
                            <h2 class="fw-bold mb-0 text-dark">${facTotal} <span class="fs-6 text-muted fw-normal">Assigned</span></h2>
                            <small class="text-primary mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-grid-fill me-1"></i> 4 Active Classes / Sections
                            </small>
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
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Attendance Rate</span>
                            <h2 class="fw-bold mb-0 text-dark">${facAvgAtt}% <span class="fs-6 text-muted fw-normal">Avg</span></h2>
                            <small class="text-danger mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i> ${facBelow75.length} Below 75% Cutoff
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-green">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Academic Performance</span>
                            <h2 class="fw-bold mb-0 text-success">${facAvgCgpa} <span class="fs-6 text-muted fw-normal">CGPA</span></h2>
                            <small class="text-success mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-arrow-up-right me-1"></i> +2.4% vs Mid-Term 1
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-award"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-yellow">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Class Engagement</span>
                            <h2 class="fw-bold mb-0 text-warning">${facAvgLms}% <span class="fs-6 text-muted fw-normal">LMS Index</span></h2>
                            <small class="text-warning mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-clock-history me-1"></i> ${facHighRisk.length || 1} Students Flagging
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-lightning-charge"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. AI FACULTY INSIGHT -->
        <div class="card-box p-3 mb-4" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%); border-left: 4px solid var(--primary);">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div class="d-flex align-items-start gap-3">
                    <div class="p-2 rounded-3 bg-primary text-white mt-1">
                        <i class="bi bi-lightbulb fs-5"></i>
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h6 class="fw-bold mb-0 text-primary">AI Teaching &amp; Diagnostic Insight</h6>
                            <span class="badge bg-primary-subtle text-primary small">Curriculum Diagnostic</span>
                        </div>
                        <p class="mb-0 text-dark small" style="line-height: 1.5;">
                            «<strong>5 students in CS201 (Sec A)</strong> show a simultaneous decline in lecture attendance and assignment scores over the last 14 days. Recommending a focused problem-solving tutorial on <strong>Binary Search Trees</strong> before the upcoming assessment.»
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. TODAY'S / UPCOMING CLASSES & ATTENDANCE TREND -->
        <div class="row g-4 mb-4">
            <!-- Today's Classes -->
            <div class="col-lg-6">
                <div class="card-box p-4 h-100">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-calendar-event text-primary me-2"></i> Today's / Upcoming Classes</h3>
                            <span class="text-muted small">Daily lecture schedule and classroom locations</span>
                        </div>
                    </div>
                    <div class="list-group list-group-flush">
                        ${classes.map(c => `
                            <div class="list-group-item px-0 py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <div class="d-flex align-items-center gap-2">
                                        <code class="fw-bold text-primary">${c.code}</code>
                                        <strong class="text-dark">${c.name}</strong>
                                    </div>
                                    <small class="text-muted d-block mt-1">
                                        <i class="bi bi-geo-alt me-1"></i> ${c.room} • ${c.section} • <i class="bi bi-clock ms-1 me-1"></i> ${c.time}
                                    </small>
                                </div>
                                <div class="text-end">
                                    <span class="badge ${c.status === 'Completed' ? 'bg-success' : (c.status.includes('Live') ? 'bg-danger' : 'bg-secondary')} mb-1 d-inline-block">
                                        ${c.status}
                                    </span>
                                    <div class="small text-muted">Attd: <strong>${c.att}%</strong></div>
                                </div>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>

            <!-- Attendance & Engagement Trend -->
            <div class="col-lg-6">
                <div class="card-box p-4 h-100">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-graph-up text-primary me-2"></i> Class Attendance &amp; Engagement Trend</h3>
                            <span class="text-muted small">8-Week lecture progression vs minimum 75% regulatory cutoff</span>
                        </div>
                    </div>
                    <div style="position: relative; height: 260px; width: 100%;">
                        <canvas id="facultyTrendCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. CLASS PERFORMANCE OVERVIEW & STUDENTS NEEDING ATTENTION -->
        <div class="row g-4 mb-4">
            <div class="col-lg-7">
                <div class="card-box p-4 h-100">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-journal-check text-primary me-2"></i> Class Performance Overview</h3>
                            <span class="text-muted small">Assigned courses, assessment metrics and completion rates</span>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="custom-table mb-0">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Section</th>
                                    <th>Attendance</th>
                                    <th>Avg Score</th>
                                    <th>Assignments</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${classes.map(c => `
                                    <tr>
                                        <td><strong>${c.code}</strong> - <span class="small text-muted">${c.name}</span></td>
                                        <td><span class="badge bg-light text-dark">${c.section}</span></td>
                                        <td>
                                            <span class="${c.att < 75 ? 'text-danger fw-bold' : 'text-success'}">
                                                ${c.att}%
                                            </span>
                                        </td>
                                        <td><strong>${c.marks}%</strong></td>
                                        <td><span class="badge bg-primary-subtle text-primary">${c.submitted}</span></td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="card-box p-4 h-100 d-flex flex-column justify-content-between">
                    <div class="card-head mb-2">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-person-exclamation text-danger me-2"></i> Students Needing Attention</h3>
                            <span class="text-muted small">Low attendance or declining academic signals</span>
                        </div>
                        <span class="badge bg-danger">${facBelow75.length} Flagged</span>
                    </div>
                    <div class="list-group list-group-flush flex-grow-1" style="max-height: 250px; overflow-y: auto;">
                        ${facBelow75.slice(0, 5).map(s => `
                            <div class="list-group-item px-0 py-2 border-bottom d-flex justify-content-between align-items-center">
                                <div>
                                    <strong class="d-block text-dark small">${s.name} <code>${s.id}</code></strong>
                                    <small class="text-danger">Attd: ${s.attendance}% • CGPA: ${s.cgpa} • Risk: ${s.risk}%</small>
                                </div>
                                <button class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 12px;" onclick="viewStudent360('${s.id}')">
                                    View Student
                                </button>
                            </div>
                        `).join("")}
                    </div>
                    <div class="pt-2 border-top mt-2 d-flex justify-content-between align-items-center">
                        <small class="text-muted">Showing top flagged students</small>
                        <button class="btn btn-light btn-sm text-primary fw-semibold" onclick="navigateTo('students')">
                            All Students <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 5. RECENT ACADEMIC ACTIVITY -->
        <div class="card-box p-4">
            <div class="card-head mb-3">
                <div>
                    <h3 class="fw-bold mb-1"><i class="bi bi-clock-history text-primary me-2"></i> Recent Academic Activity</h3>
                    <span class="text-muted small">Assessment submissions, attendance logging, and performance updates</span>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="p-3 rounded-3" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <span class="badge bg-success mb-2">Assignment 3</span>
                        <strong class="d-block text-dark small mb-1">Binary Search Trees Submissions</strong>
                        <p class="small text-muted mb-0">94% submission rate across Sec A &amp; Sec B.</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="p-3 rounded-3" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <span class="badge bg-primary mb-2">Mid-Term 1</span>
                        <strong class="d-block text-dark small mb-1">Assessment Marks Published</strong>
                        <p class="small text-muted mb-0">Class average improved to 76.4% (+2.4%).</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="p-3 rounded-3" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <span class="badge bg-warning text-dark mb-2">Attendance</span>
                        <strong class="d-block text-dark small mb-1">Consecutive Absence Notice</strong>
                        <p class="small text-muted mb-0">4 students flagged for 3 consecutive lecture absences.</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="p-3 rounded-3" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <span class="badge bg-info text-dark mb-2">Lab Evaluation</span>
                        <strong class="d-block text-dark small mb-1">Database Queries Viva</strong>
                        <p class="small text-muted mb-0">Lab 4 viva scheduled for Thursday batch.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    requestAnimationFrame(() => {
        initFacultyDashboardCharts(facAvgAtt, facAvgLms);
    });
    setTimeout(() => {
        initFacultyDashboardCharts(facAvgAtt, facAvgLms);
    }, 150);
}

function initFacultyDashboardCharts(avgAtt, avgLms) {
    const trendCanvas = document.getElementById("facultyTrendCanvas");
    if (!trendCanvas) {
        console.warn("[Faculty Trend Canvas]: Not found in DOM");
        return;
    }

    if (window.Chart && typeof window.Chart.getChart === "function") {
        const oldChart = window.Chart.getChart(trendCanvas);
        if (oldChart) oldChart.destroy();
    }

    try {
        _dashboardCharts.facultyTrend = new Chart(trendCanvas, {
        type: "line",
        data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
            datasets: [
                {
                    label: "Class Attendance %",
                    data: [86, 84, 85, 80, 78, 81, 80, avgAtt || 82],
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.15)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: "#3b82f6",
                    pointRadius: 4
                },
                {
                    label: "Required Cutoff (75%)",
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
                legend: { position: "top", labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } },
                tooltip: { cornerRadius: 8 }
            },
            scales: {
                y: { min: 50, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#f1f5f9" } },
                x: { grid: { display: false } }
            }
        }
    });
    } catch (err) {
        console.error("[Faculty Chart Creation Failed]:", err);
    }
}
window.initFacultyDashboardCharts = initFacultyDashboardCharts;


/* =========================================================================
   3. MENTOR DASHBOARD — MENTEE INTERVENTION OVERVIEW
   ========================================================================= */
async function renderMentorDashboard(content, user) {
    const menteeList = students;
    const menteeCount = menteeList.length;

    const highPriorityMentees = menteeList.filter(s => Number(s.risk || 0) >= 60).sort((a, b) => Number(b.risk || 0) - Number(a.risk || 0));
    const medPriorityMentees = menteeList.filter(s => Number(s.risk || 0) >= 30 && Number(s.risk || 0) < 60);

    // Filter interventions to only show this mentor's sessions
    const mentorId = user?.id || null;
    let interventions = [];
    try {
        interventions = (await API.getInterventions(mentorId)) || [];
    } catch (e) {
        interventions = [];
    }

    const activeInterventions = interventions.filter(i => ['In Progress', 'Active', 'Pending'].includes(i.status));
    const completedInterventions = interventions.filter(i => i.status === 'Completed');
    const escalatedInterventions = interventions.filter(i => i.status === 'Escalated');

    let mentorEnquiries = [];
    try {
        mentorEnquiries = (await API.getInterventionEnquiries('mentor', user?.id)) || [];
    } catch (e) {
        mentorEnquiries = [];
    }
    const revisionReqs = mentorEnquiries.filter(e => e.status === 'Revision Needed');
    const pendingReviews = mentorEnquiries.filter(e => e.status === 'Completion Requested');

    content.innerHTML = `
        <!-- MENTOR DASHBOARD HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1" style="color: var(--text);">Mentee Intervention Overview</h1>
                <p class="small mb-0" style="color: var(--text-soft);">
                    Prioritized student risks, active interventions and follow-ups
                </p>
            </div>
            <div class="d-flex gap-2">
                <button class="secondary-btn d-flex align-items-center gap-2" onclick="navigateTo('enquiries')">
                    <i class="bi bi-patch-check text-primary"></i> Enquiries & Reviews ${pendingReviews.length ? `(${pendingReviews.length})` : ''}
                </button>
                <button class="primary-btn d-flex align-items-center gap-2" onclick="navigateTo('mentor')">
                    <i class="bi bi-radar"></i> Open Mentor Priority Radar
                </button>
            </div>
        </div>

        <!-- REVISION FEEDBACK ALERT (IF REJECTED) -->
        ${revisionReqs.length > 0 ? `
            <div class="alert alert-danger d-flex justify-content-between align-items-center mb-3 py-2 px-3 shadow-sm">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-exclamation-octagon-fill fs-5 text-danger"></i>
                    <div>
                        <strong style="color: var(--text);">Revision Required on Completion Reports:</strong>
                        <span class="small ms-1" style="color: var(--text-soft);">${revisionReqs.length} session completion report(s) returned with feedback for student follow-up.</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger fw-semibold" onclick="navigateTo('enquiries')">
                    <i class="bi bi-arrow-repeat me-1"></i> View Feedback & Re-Submit
                </button>
            </div>
        ` : ''}

        <!-- PENDING REVIEWS STATUS BANNER -->
        ${pendingReviews.length > 0 ? `
            <div class="alert alert-warning d-flex justify-content-between align-items-center mb-4 py-2 px-3 shadow-sm">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-hourglass-split fs-5 text-warning"></i>
                    <div>
                        <strong style="color: var(--text);">Submitted Completion Reviews:</strong>
                        <span class="small ms-1" style="color: var(--text-soft);">${pendingReviews.length} session completion request(s) under verification by session initiators.</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-warning text-dark fw-semibold" onclick="navigateTo('enquiries')">
                    <i class="bi bi-patch-check me-1"></i> View Enquiry Queue
                </button>
            </div>
        ` : ''}

        <!-- 1. MENTOR KPI CARDS -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-blue">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">My Mentees</span>
                            <h2 class="fw-bold mb-0 text-dark">${menteeCount} <span class="fs-6 text-muted fw-normal">Assigned</span></h2>
                            <small class="text-primary mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-people-fill me-1"></i> Active Mentee Cohort
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-person-heart"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-red">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Students Needing Attention</span>
                            <h2 class="fw-bold mb-0 text-danger">${highPriorityMentees.length} <span class="fs-6 text-muted fw-normal">High Priority</span></h2>
                            <small class="text-danger mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i> ${medPriorityMentees.length} Moderate Priority
                            </small>
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
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Active Interventions</span>
                            <h2 class="fw-bold mb-0 text-warning">${activeInterventions.length} <span class="fs-6 text-muted fw-normal">Active</span></h2>
                            <small class="text-warning mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-clock-history me-1"></i> ${interventions.length} Total Sessions
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-chat-heart"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-xl-3 col-md-6">
                <div class="stat-card-modern accent-green">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Intervention Outcomes</span>
                            <h2 class="fw-bold mb-0 text-success">${interventions.length > 0 ? Math.round(completedInterventions.length / interventions.length * 100) : 0}% <span class="fs-6 text-muted fw-normal">Recovery</span></h2>
                            <small class="text-success mt-2 d-inline-flex align-items-center">
                                <i class="bi bi-check2-circle me-1"></i> ${completedInterventions.length} Resolved • ${escalatedInterventions.length} Escalated
                            </small>
                        </div>
                        <div class="stat-icon-box">
                            <i class="bi bi-graph-up-arrow"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. AI MENTOR BRIEFING -->
        <div class="card-box p-3 mb-4" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%); border-left: 4px solid var(--warning);">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div class="d-flex align-items-start gap-3">
                    <div class="p-2 rounded-3 bg-warning text-dark mt-1">
                        <i class="bi bi-chat-quote-fill fs-5"></i>
                    </div>
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1">
                            <h6 class="fw-bold mb-0 text-dark">Today's Mentor Briefing</h6>
                            <span class="badge bg-warning text-dark small">Priority Action Radar</span>
                        </div>
                        <p class="mb-0 text-dark small" style="line-height: 1.5;">
                            «<strong>${highPriorityMentees.length} priority mentees require attention</strong>. ${highPriorityMentees.length > 0 ? highPriorityMentees.slice(0, 2).map(s => s.name).join(' &amp; ') + (highPriorityMentees.length > 2 ? ` and ${highPriorityMentees.length - 2} more` : '') + ' flagged with risk scores above 60%.' : 'No high-risk mentees detected at this time.'} ${activeInterventions.length > 0 ? `${activeInterventions.length} active intervention(s) in progress.` : 'No active interventions scheduled.'}»
                        </p>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-warning text-dark" onclick="navigateTo('mentor')">
                    Action Center <i class="bi bi-arrow-right ms-1"></i>
                </button>
            </div>
        </div>

        <!-- 3. AI PRIORITY MENTEES & MENTEE ENGAGEMENT TREND -->
        <div class="row g-4 mb-4">
            <div class="col-lg-7">
                <div class="card-box p-4 h-100 d-flex flex-column justify-content-between">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-shield-shaded text-danger me-2"></i> AI Priority Mentees</h3>
                            <span class="text-muted small">Mentees ranked by composite academic &amp; attendance risk score</span>
                        </div>
                        <span class="badge bg-danger">${highPriorityMentees.length} Urgent Cases</span>
                    </div>

                    <div class="list-group list-group-flush flex-grow-1" style="max-height: 290px; overflow-y: auto; padding-right: 4px;">
                        ${highPriorityMentees.length === 0 ? '<p class="text-muted small text-center py-4">No high-risk mentees found.</p>' :
                            highPriorityMentees.slice(0, 6).map((s, idx) => `
                                <div class="list-group-item px-0 py-2 border-bottom d-flex justify-content-between align-items-center">
                                    <div style="min-width: 0; flex: 1; padding-right: 8px;">
                                        <div class="d-flex align-items-center gap-2">
                                            <strong class="text-dark small">${s.name}</strong>
                                            <code>${s.id}</code>
                                        </div>
                                        <small class="text-danger fw-semibold" style="font-size: 11.5px;">
                                            Risk: ${s.risk}% • Attd: ${s.attendance}% • CGPA: ${s.cgpa} • LMS: ${s.lms_score || s.attendance}%
                                        </small>
                                    </div>
                                    <div class="d-flex gap-1">
                                        <button class="btn btn-sm btn-outline-danger py-1 px-2" style="font-size: 12px;" onclick="viewStudent360('${s.id}')">
                                            Intervene
                                        </button>
                                        <button class="btn btn-sm btn-outline-primary py-1 px-2" style="font-size: 12px;" onclick="viewStudent360('${s.id}')">
                                            360°
                                        </button>
                                    </div>
                                </div>
                            `).join("")
                        }
                    </div>

                    <div class="pt-3 border-top mt-2 d-flex justify-content-between align-items-center">
                        <small class="text-muted">Showing top prioritized mentees</small>
                        <button class="btn btn-light btn-sm text-primary fw-semibold" onclick="navigateTo('mentor')">
                            Open Full Radar <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div class="col-lg-5">
                <div class="card-box p-4 h-100">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-activity text-primary me-2"></i> Mentee Engagement Trend</h3>
                            <span class="text-muted small">8-Week average tracking of assigned mentees</span>
                        </div>
                    </div>
                    <div style="position: relative; height: 280px; width: 100%;">
                        <canvas id="mentorTrendCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. ACTIVE INTERVENTIONS & FOLLOW-UP REQUIRED -->
        <div class="row g-4 mb-4">
            <div class="col-lg-6">
                <div class="card-box p-4 h-100 d-flex flex-column justify-content-between">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-diagram-3 text-primary me-2"></i> Active Interventions</h3>
                            <span class="text-muted small">Mentorship stage distribution</span>
                        </div>
                        <button class="btn btn-sm btn-outline-primary" onclick="navigateTo('mentor')">
                            Manage Pipeline <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">New Intake</span>
                                <h3 class="fw-bold mb-0 text-info">${interventions.filter(i => i.status === 'Pending').length}</h3>
                                <small class="text-muted">Awaiting Intake</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">In Progress</span>
                                <h3 class="fw-bold mb-0 text-primary">${activeInterventions.length}</h3>
                                <small class="text-muted">Active Sessions</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">Follow-up Required</span>
                                <h3 class="fw-bold mb-0 text-warning">${interventions.filter(i => i.status === 'In Progress').length}</h3>
                                <small class="text-muted">Touchpoints Due</small>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-3 rounded-3 text-center" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                                <span class="text-muted small d-block">Completed</span>
                                <h3 class="fw-bold mb-0 text-success">${completedInterventions.length}</h3>
                                <small class="text-muted">Stabilized</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-lg-6">
                <div class="card-box p-4 h-100">
                    <div class="card-head mb-3">
                        <div>
                            <h3 class="fw-bold mb-1"><i class="bi bi-clock-history text-warning me-2"></i> Follow-Up Required</h3>
                            <span class="text-muted small">Pending and in-progress mentee touchpoints</span>
                        </div>
                    </div>
                    <div class="list-group list-group-flush">
                        ${activeInterventions.length === 0 ? '<p class="text-muted small text-center py-4">No pending follow-ups at this time.</p>' :
                            activeInterventions.slice(0, 4).map(inter => {
                                const studentName = students.find(s => s.id === inter.student_id)?.name || inter.student_id;
                                const statusIcon = inter.status === 'Pending' ? 'bi-exclamation-circle-fill me-1 text-danger' : 'bi-calendar-event me-1 text-primary';
                                const statusColor = inter.status === 'Pending' ? 'text-danger' : 'text-dark';
                                return `
                                <div class="list-group-item px-0 py-2 border-bottom d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong class="${statusColor} small d-block"><i class="bi ${statusIcon}"></i> ${studentName} <code>${inter.student_id}</code></strong>
                                        <small class="text-muted">${inter.date} \u2022 ${inter.action} ${inter.subject_code ? '(' + inter.subject_code + ')' : ''}</small>
                                    </div>
                                    <button class="btn btn-sm btn-outline-primary" onclick="viewStudent360('${inter.student_id}')">View</button>
                                </div>`;
                            }).join('')
                        }
                    </div>
                </div>
            </div>
        </div>

        <!-- 5. INTERVENTION OUTCOME SNAPSHOT -->
        <div class="card-box p-4">
            <div class="card-head mb-3">
                <div>
                    <h3 class="fw-bold mb-1"><i class="bi bi-arrow-left-right text-success me-2"></i> Intervention Outcome Snapshot</h3>
                    <span class="text-muted small">Measured metric recovery before vs after structured mentor touchpoints</span>
                </div>
            </div>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="p-3 rounded-3 h-100" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong class="text-dark small">Attendance Recovery</strong>
                            <span class="badge bg-success">+17% Gain</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-2">
                            <span class="text-danger fw-bold fs-5">61%</span>
                            <i class="bi bi-arrow-right text-muted fs-5"></i>
                            <span class="text-success fw-bold fs-5">78%</span>
                        </div>
                        <small class="text-muted mt-2 d-block">Average improvement across 14 closed cases</small>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="p-3 rounded-3 h-100" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong class="text-dark small">LMS Engagement Boost</strong>
                            <span class="badge bg-success">+26% Gain</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-2">
                            <span class="text-danger fw-bold fs-5">42%</span>
                            <i class="bi bi-arrow-right text-muted fs-5"></i>
                            <span class="text-success fw-bold fs-5">68%</span>
                        </div>
                        <small class="text-muted mt-2 d-block">Portal log activity &amp; assignment completion</small>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="p-3 rounded-3 h-100" style="background: var(--bg-sunken); border: 1px solid var(--border);">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong class="text-dark small">Cohort Risk De-escalation</strong>
                            <span class="badge bg-success">De-escalated</span>
                        </div>
                        <div class="d-flex align-items-center gap-2 mt-2">
                            <span class="text-danger fw-bold fs-5">High (72%)</span>
                            <i class="bi bi-arrow-right text-muted fs-5"></i>
                            <span class="text-success fw-bold fs-5">Medium (38%)</span>
                        </div>
                        <small class="text-muted mt-2 d-block">Students safely restored to good academic standing</small>
                    </div>
                </div>
            </div>
        </div>
    `;

    requestAnimationFrame(() => {
        initMentorDashboardCharts();
    });
    setTimeout(() => {
        initMentorDashboardCharts();
    }, 150);
}

function initMentorDashboardCharts() {
    const trendCanvas = document.getElementById("mentorTrendCanvas");
    if (!trendCanvas) return;

    if (window.Chart && typeof window.Chart.getChart === "function") {
        const oldChart = window.Chart.getChart(trendCanvas);
        if (oldChart) oldChart.destroy();
    }

    _dashboardCharts.mentorTrend = new Chart(trendCanvas, {
        type: "line",
        data: {
            labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7", "Week 8"],
            datasets: [
                {
                    label: "Mentee Avg Attendance %",
                    data: [72, 70, 68, 65, 64, 69, 73, 76],
                    borderColor: "#f59e0b",
                    backgroundColor: "rgba(245, 158, 11, 0.15)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: "#f59e0b",
                    pointRadius: 4
                },
                {
                    label: "Regulatory Cutoff (75%)",
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
                legend: { position: "top", labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } },
                tooltip: { cornerRadius: 8 }
            },
            scales: {
                y: { min: 50, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#f1f5f9" } },
                x: { grid: { display: false } }
            }
        }
    });
}
window.initMentorDashboardCharts = initMentorDashboardCharts;


/* =========================================================================
   4. STUDENT DASHBOARD — PERSONALIZED PORTAL
   ========================================================================= */
async function renderStudentDashboard(content, user) {
    const studentId = user.linked_student_id || user.id;
    let studentDetail = null;
    try {
        studentDetail = await API.getStudentDetail(studentId);
    } catch (e) {
        studentDetail = null;
    }

    if (!studentDetail || studentDetail.error) {
        content.innerHTML = `<div class="alert alert-warning">Student profile [${studentId}] record not found in system.</div>`;
        return;
    }

    let studentEnquiries = [];
    try {
        studentEnquiries = await API.getInterventionEnquiries('student', studentId) || [];
    } catch (e) {
        studentEnquiries = [];
    }
    const activeSessions = studentEnquiries.filter(e => ['In Progress', 'Pending', 'Active'].includes(e.status));

    const s = studentDetail;
    const marks = s.subject_marks || [];
    const activities = s.activities || [];

    const badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
    const riskStatus = s.risk >= 60 ? "Academic Risk Warning" : (s.risk >= 30 ? "Moderate Attention" : "Good Academic Standing");

    content.innerHTML = `
        <!-- STUDENT WELCOME HEADER -->
        <div class="profile-header mb-4">
            <div class="profile-avatar-box">
                <div class="profile-avatar">${(s.name || 'S').charAt(0)}</div>
                <div class="profile-info">
                    <h2>Welcome, ${s.name}! <span class="badge bg-light text-dark fs-6 ms-2 border">${s.id}</span></h2>
                    <p class="mb-0"><i class="bi bi-book me-1 text-primary"></i> ${s.course} • ${s.year} • CGPA: <strong>${s.cgpa}</strong> • Credits: <strong>${s.credits || 24}</strong></p>
                </div>
            </div>
            <div class="text-end">
                <div class="d-inline-flex flex-column align-items-md-end align-items-start gap-1">
                    <span class="risk-badge ${badgeClass} fs-6 cursor-pointer" onclick="openStudentRiskBreakdownModal('${s.id}')" title="Click to view full AI risk calculation formula & breakdown">
                        <i class="bi ${s.risk >= 60 ? 'bi-exclamation-octagon-fill' : (s.risk >= 30 ? 'bi-exclamation-triangle-fill' : 'bi-shield-check')}"></i>
                        ${s.risk}% Risk (${riskStatus})
                    </span>
                    <button type="button" class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 risk-calc-trigger" onclick="openStudentRiskBreakdownModal('${s.id}')" style="font-size: 11.5px; border-radius: 20px; padding: 4px 12px; font-weight: 600;">
                        <i class="bi bi-calculator"></i> How is this calculated?
                    </button>
                </div>
            </div>
        </div>

        ${activeSessions.length > 0 ? `
            <div class="alert alert-primary d-flex justify-content-between align-items-center mb-4 p-3 rounded-3 shadow-sm">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-patch-check-fill fs-3 text-primary"></i>
                    <div>
                        <strong>Active Mentoring Guidance Scheduled:</strong>
                        <p class="small mb-0 mt-1" style="color: var(--text-soft);">You have <strong>${activeSessions.length}</strong> active 1-on-1 counseling session(s) scheduled with your assigned academic mentor.</p>
                    </div>
                </div>
                <button class="primary-btn btn-sm" onclick="navigateTo('enquiries')">
                    <i class="bi bi-calendar-check me-1"></i> View Mentorship Details
                </button>
            </div>
        ` : ''}

        ${s.risk >= 30 ? `
            <div class="alert ${s.risk >= 60 ? 'alert-danger' : 'alert-warning'} d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 p-3 rounded-3 shadow-sm">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi ${s.risk >= 60 ? 'bi-exclamation-octagon-fill fs-3' : 'bi-exclamation-triangle-fill fs-3'}"></i>
                    <div>
                        <strong>Academic Risk Indicator: ${s.risk}% (${riskStatus})</strong>
                        <p class="small mb-0 mt-1" style="color: var(--text-soft);">${s.risk >= 60 ? 'Multi-signal analysis detected metric deficits. Check formula breakdown for remediation steps.' : 'Your academic signals require monitoring to ensure optimal exam eligibility.'}</p>
                    </div>
                </div>
                <button class="btn btn-sm ${s.risk >= 60 ? 'btn-danger' : 'btn-warning'} fw-semibold d-flex align-items-center gap-1" onclick="openStudentRiskBreakdownModal('${s.id}')">
                    <i class="bi bi-info-circle-fill"></i> View Calculation Details
                </button>
            </div>
        ` : ''}

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
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Academic Status</span>
                    <h2 class="fw-bold mb-0 text-success">${s.status || 'Active'}</h2>
                    <small class="text-muted mt-2 d-inline-flex align-items-center"><i class="bi bi-mortarboard text-success me-1"></i> Enrolled Student</small>
                </div>
            </div>
        </div>

        <!-- MY SUBJECTS & MARKS BREAKDOWN -->
        <div class="card-box p-4 mb-4">
            <div class="card-head">
                <div>
                    <h3 class="fw-bold"><i class="bi bi-journal-check text-primary me-2"></i> My Enrolled Subjects &amp; Performance</h3>
                    <span class="text-muted small">Semester Subject attendance, internal assessment scores, and grades</span>
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

        <!-- MY EXTRACURRICULAR ACTIVITIES -->
        <div class="card-box p-4 mb-4">
            <div class="card-head">
                <h3 class="fw-bold"><i class="bi bi-trophy text-warning me-2"></i> My Extracurricular &amp; Club Engagements</h3>
            </div>
            ${activities.length === 0 ? '<p class="text-muted small mb-0">No extracurricular activities registered yet.</p>' : `
                <div class="d-flex flex-wrap gap-2">
                    ${activities.map(a => `
                        <div class="activity-tag ${(a.category || '').toLowerCase()} p-2 rounded">
                            <strong>${a.activity_name}</strong> (${a.category})
                            <span class="badge bg-light text-dark ms-1">${a.role}</span>
                            ${a.notes ? `<small class="d-block text-muted mt-1">${a.notes}</small>` : ''}
                        </div>
                    `).join("")}
                </div>
            `}
        </div>

        <!-- MY MENTORSHIP & ACADEMIC SUPPORT SESSIONS -->
        <div class="card-box p-4 mb-4">
            <div class="card-head">
                <div>
                    <h3 class="fw-bold"><i class="bi bi-chat-heart text-primary me-2"></i> My 1-on-1 Mentoring &amp; Support Sessions</h3>
                    <span class="text-muted small">Academic counseling, remedial classes, and touchpoints with faculty mentors</span>
                </div>
                <span class="badge bg-primary">${(s.interventions || []).length} Sessions</span>
            </div>
            ${(s.interventions || []).length === 0 ? `
                <div class="p-4 rounded text-center" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                    <i class="bi bi-shield-check text-success fs-3 d-block mb-1"></i>
                    <strong class="text-dark small d-block">No Active Mentoring Interventions</strong>
                    <span class="text-muted small">You are in good academic standing. Scheduled 1-on-1 counseling sessions with your mentor will appear here.</span>
                </div>
            ` : `
                <div class="row g-3">
                    ${(s.interventions || []).map(i => {
                        const statusClass = i.status === 'Completed' ? 'badge bg-success text-white' : (i.status === 'In Progress' ? 'badge bg-primary text-white' : 'badge bg-warning text-dark');
                        return `
                        <div class="col-md-6">
                            <div class="p-3 rounded h-100" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <strong class="text-dark small d-block">${i.action}</strong>
                                        <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> Date: ${i.date} ${i.subject_code ? `• Subject: ${i.subject_code}` : ''}</small>
                                    </div>
                                    <span class="${statusClass}">${i.status}</span>
                                </div>
                                ${i.mentor_name ? `<p class="small mb-2 text-primary" style="font-size: 12px;"><i class="bi bi-person-badge me-1"></i> Mentor: <strong>${i.mentor_name}</strong></p>` : ''}
                                ${i.notes ? `<p class="small mb-0 text-muted p-2 rounded" style="background: var(--bg-elevated); font-size: 11.5px;"><i class="bi bi-sticky me-1 text-secondary"></i> ${i.notes}</p>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `}
        </div>
    `;
}
window.renderStudentDashboard = renderStudentDashboard;

// Global Autonomous Diagnostic Trigger
async function triggerAutonomousCycle(btn, event) {
    if (event && typeof event.preventDefault === "function") {
        event.preventDefault();
        event.stopPropagation();
    }
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Reasoning AI Loop...`;
    }
    try {
        const res = await API.runAutonomousLoop();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-robot text-primary"></i> Run Autonomous AI Diagnostic`;
        }
        if (res && res.success) {
            const count = res.actions_count || (res.traces ? res.traces.length : 0);
            
            const toast = document.createElement("div");
            toast.className = "alert alert-success position-fixed top-0 end-0 m-4 shadow-lg d-flex align-items-center gap-3";
            toast.style.zIndex = "9999";
            toast.style.borderRadius = "12px";
            toast.innerHTML = `
                <i class="bi bi-check-circle-fill fs-4 text-success"></i>
                <div>
                    <strong class="d-block">Autonomous Cycle Completed</strong>
                    <span class="small text-muted">Evaluated cohort &amp; dispatched ${count} diagnostic interventions.</span>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.transition = "opacity 0.5s ease";
                toast.style.opacity = "0";
                setTimeout(() => toast.remove(), 500);
            }, 3500);

            if (typeof loadLatestStudents === "function") {
                await loadLatestStudents();
            }
            if (typeof currentActivePage === "undefined" || currentActivePage === "dashboard") {
                renderDashboard();
            }
        }
    } catch (err) {
        console.error("Autonomous cycle error:", err);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-robot text-primary"></i> Run Autonomous AI Diagnostic`;
        }
    }
}
window.triggerAutonomousCycle = triggerAutonomousCycle;
