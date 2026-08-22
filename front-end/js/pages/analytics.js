/* =====================================================
   ANALYTICS.JS
   Advanced Academic Intelligence & Visualizations
   Supports: 4 Interactive Chart.js Visualizations (Doughnut,
             Ranked Bar, Subject Comparison, Multi-Signal Radar),
             Cohort Benchmark KPIs, Persona-specific Insights
===================================================== */

let riskDoughnutChart = null;
let attendanceRankChart = null;
let subjectMarksBarChart = null;
let signalsRadarChart = null;

async function renderAnalytics() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    if (students.length === 0) {
        await loadLatestStudents();
    }

    if (role === "student") {
        renderStudentAnalytics(content, user);
        return;
    }

    renderFacultyAnalytics(content, user);
}

function renderFacultyAnalytics(content, user) {
    const total = students.length;
    const highRisk = students.filter(s => s.risk >= 60).length;
    const medRisk = students.filter(s => s.risk >= 30 && s.risk < 60).length;
    const lowRisk = students.filter(s => s.risk < 30).length;

    const avgAttendance = total ? Math.round(students.reduce((a, b) => a + Number(b.attendance || 0), 0) / total) : 0;
    const avgCGPA = total ? (students.reduce((a, b) => a + Number(b.cgpa || 0), 0) / total).toFixed(2) : "0.00";
    const maxCGPA = total ? Math.max(...students.map(s => Number(s.cgpa || 0))) : 0;
    const minCGPA = total ? Math.min(...students.map(s => Number(s.cgpa || 0))) : 0;

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">📈 Advanced Cohort Analytics & Trends</h1>
                <p class="text-muted small mb-0">Multi-dimensional visual intelligence, risk distributions & subject-level signals</p>
            </div>
            <button class="secondary-btn" onclick="navigateTo('reports')">
                <i class="bi bi-file-earmark-pdf text-danger"></i> Generate Corporate Report
            </button>
        </div>

        <!-- KPI SUMMARY TILES -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">COHORT STRENGTH</span>
                    <h3 class="fw-bold mb-0">${total} Students</h3>
                    <small class="text-primary"><i class="bi bi-mortarboard me-1"></i> B.Tech CSE (2nd Year)</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">AVERAGE ATTENDANCE</span>
                    <h3 class="fw-bold mb-0 ${avgAttendance < 75 ? 'text-danger' : 'text-success'}">${avgAttendance}%</h3>
                    <small class="text-muted">Cutoff benchmark: 75%</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">CGPA SPREAD</span>
                    <h3 class="fw-bold mb-0">${avgCGPA} <span class="fs-6 text-muted">Avg</span></h3>
                    <small class="text-success">High: ${maxCGPA} | Low: ${minCGPA}</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card-box p-3">
                    <span class="text-muted small d-block mb-1">AT-RISK RATIO</span>
                    <h3 class="fw-bold mb-0 text-danger">${Math.round((highRisk / (total || 1)) * 100)}%</h3>
                    <small class="text-danger">${highRisk} High / ${medRisk} Moderate</small>
                </div>
            </div>
        </div>

        <!-- 4 INTERACTIVE CHARTS GRID -->
        <div class="row g-4 mb-4">
            <!-- 1. RISK DOUGHNUT -->
            <div class="col-lg-5">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-pie-chart-fill text-danger me-2"></i> Risk Category Distribution</h3>
                        <span class="text-muted small">Live calculated ratio</span>
                    </div>
                    <div style="position: relative; height: 260px;">
                        <canvas id="riskDoughnutCanvas"></canvas>
                    </div>
                </div>
            </div>

            <!-- 2. ATTENDANCE RANKING HORIZONTAL BAR -->
            <div class="col-lg-7">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-bar-chart-steps text-primary me-2"></i> Student Attendance Ranking</h3>
                        <span class="badge bg-danger">Cutoff Line: 75%</span>
                    </div>
                    <div style="position: relative; height: 260px;">
                        <canvas id="attendanceRankCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <!-- 3. SUBJECT-WISE AVERAGE MARKS COMPARISON -->
            <div class="col-lg-7">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-diagram-3-fill text-info me-2"></i> Subject Performance Breakdown</h3>
                        <span class="text-muted small">Internal (30) vs Assignment (100) vs Attendance (%)</span>
                    </div>
                    <div style="position: relative; height: 280px;">
                        <canvas id="subjectMarksBarCanvas"></canvas>
                    </div>
                </div>
            </div>

            <!-- 4. MULTI-SIGNAL RADAR BENCHMARK -->
            <div class="col-lg-5">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-bullseye text-warning me-2"></i> Cohort Signal Balance Radar</h3>
                        <span class="text-muted small">Multi-signal weight overlay</span>
                    </div>
                    <div style="position: relative; height: 280px;">
                        <canvas id="signalsRadarCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    initFacultyCharts(highRisk, medRisk, lowRisk);
}

function initFacultyCharts(highRisk, medRisk, lowRisk) {
    // 1. DOUGHNUT CHART
    const doughnutEl = document.getElementById("riskDoughnutCanvas");
    if (doughnutEl) {
        if (riskDoughnutChart) riskDoughnutChart.destroy();
        riskDoughnutChart = new Chart(doughnutEl.getContext("2d"), {
            type: "doughnut",
            data: {
                labels: ["High Risk (>=60%)", "Moderate Risk (30-59%)", "Low Risk (<30%)"],
                datasets: [{
                    data: [highRisk, medRisk, lowRisk],
                    backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
                    borderWidth: 2,
                    borderColor: "#ffffff"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom", labels: { boxWidth: 12, font: { family: 'Inter', size: 12 } } }
                }
            }
        });
    }

    // 2. ATTENDANCE RANKING (Sorted)
    const rankEl = document.getElementById("attendanceRankCanvas");
    if (rankEl) {
        if (attendanceRankChart) attendanceRankChart.destroy();
        const sortedStudents = [...students].sort((a, b) => a.attendance - b.attendance);
        attendanceRankChart = new Chart(rankEl.getContext("2d"), {
            type: "bar",
            data: {
                labels: sortedStudents.map(s => s.name.split(" ")[0]),
                datasets: [{
                    label: "Attendance %",
                    data: sortedStudents.map(s => s.attendance),
                    backgroundColor: sortedStudents.map(s => s.attendance < 75 ? "#ef4444" : "#3b82f6"),
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { min: 0, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#f1f5f9" } },
                    y: { grid: { display: false } }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    // 3. SUBJECT-WISE GROUPED BAR
    const subjectEl = document.getElementById("subjectMarksBarCanvas");
    if (subjectEl) {
        if (subjectMarksBarChart) subjectMarksBarChart.destroy();
        subjectMarksBarChart = new Chart(subjectEl.getContext("2d"), {
            type: "bar",
            data: {
                labels: ["DBMS (CS201)", "OS (CS202)", "Math-III (MA201)", "CN (CS203)", "SE (CS204)"],
                datasets: [
                    {
                        label: "Avg Attendance %",
                        data: [73.4, 74.8, 71.2, 77.4, 75.4],
                        backgroundColor: "#3b82f6",
                        borderRadius: 4
                    },
                    {
                        label: "Avg Internal Score (Scaled to 100)",
                        data: [64.6, 68.0, 59.3, 75.3, 71.3],
                        backgroundColor: "#10b981",
                        borderRadius: 4
                    },
                    {
                        label: "Avg Assignment %",
                        data: [70.0, 71.4, 65.4, 74.4, 72.2],
                        backgroundColor: "#f59e0b",
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 100, ticks: { callback: v => v + "%" }, grid: { color: "#f1f5f9" } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { position: "top", labels: { boxWidth: 12 } }
                }
            }
        });
    }

    // 4. RADAR BENCHMARK
    const radarEl = document.getElementById("signalsRadarCanvas");
    if (radarEl) {
        if (signalsRadarChart) signalsRadarChart.destroy();
        signalsRadarChart = new Chart(radarEl.getContext("2d"), {
            type: "radar",
            data: {
                labels: ["Attendance %", "CGPA (x10)", "LMS Activity %", "Internal Exams", "Assignment Score"],
                datasets: [
                    {
                        label: "Cohort Benchmark",
                        data: [79, 78, 73, 68, 71],
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59, 130, 246, 0.2)",
                        borderWidth: 2,
                        pointBackgroundColor: "#3b82f6"
                    },
                    {
                        label: "At-Risk Benchmark",
                        data: [61, 69, 50, 40, 48],
                        borderColor: "#ef4444",
                        backgroundColor: "rgba(239, 68, 68, 0.2)",
                        borderWidth: 2,
                        pointBackgroundColor: "#ef4444"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: { min: 0, max: 100, ticks: { stepSize: 20 } }
                },
                plugins: {
                    legend: { position: "bottom", labels: { boxWidth: 12 } }
                }
            }
        });
    }
}

async function renderStudentAnalytics(content, user) {
    const studentId = user.linked_student_id || user.id;
    const s = await API.getStudentDetail(studentId);

    if (!s || s.error) {
        content.innerHTML = `<div class="alert alert-warning">Student profile not found.</div>`;
        return;
    }

    const marks = s.subject_marks || [];

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">📊 My Personal Performance Analytics</h1>
            <p class="text-muted small mb-0">Multi-signal analysis and subject-wise benchmark comparison</p>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-radar text-primary me-2"></i> My Academic Signals vs Cohort Average</h3>
                    </div>
                    <div style="position: relative; height: 300px;">
                        <canvas id="studentPersonalRadarCanvas"></canvas>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-bar-chart-fill text-success me-2"></i> My Subject Internal Scores (out of 30)</h3>
                    </div>
                    <div style="position: relative; height: 300px;">
                        <canvas id="studentSubjectBarCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Render Student Specific Charts
    setTimeout(() => {
        const radarCanvas = document.getElementById("studentPersonalRadarCanvas");
        if (radarCanvas) {
            new Chart(radarCanvas.getContext("2d"), {
                type: "radar",
                data: {
                    labels: ["Attendance %", "CGPA (x10)", "LMS Activity", "Assignments", "Credits (% of 30)"],
                    datasets: [
                        {
                            label: `${s.name} (Me)`,
                            data: [s.attendance, s.cgpa * 10, s.lms_score || s.attendance, s.cgpa * 10, (s.credits / 30) * 100],
                            borderColor: "#10b981",
                            backgroundColor: "rgba(16, 185, 129, 0.25)",
                            borderWidth: 2
                        },
                        {
                            label: "Class Average",
                            data: [79, 78, 73, 75, 80],
                            borderColor: "#94a3b8",
                            backgroundColor: "rgba(148, 163, 184, 0.15)",
                            borderWidth: 1,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { r: { min: 0, max: 100 } }
                }
            });
        }

        const barCanvas = document.getElementById("studentSubjectBarCanvas");
        if (barCanvas && marks.length > 0) {
            new Chart(barCanvas.getContext("2d"), {
                type: "bar",
                data: {
                    labels: marks.map(m => m.short_name || m.subject_code),
                    datasets: [{
                        label: "Internal Exam Score (/30)",
                        data: marks.map(m => m.internal_marks),
                        backgroundColor: marks.map(m => m.internal_marks < 12 ? "#ef4444" : "#3b82f6"),
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 30, ticks: { stepSize: 5 } }
                    }
                }
            });
        }
    }, 100);
}
