/* =====================================================
   STUDENT360.JS
   Holistic Student 360° Profile & Explainable Diagnostic View
   Supports: Live Student Switcher, Demographics, Per-Subject
             Marks, Extracurriculars, Multi-Signal Radar Chart
===================================================== */

let selectedStudentId = "25CS001";
let student360RadarChart = null;

function viewStudent360(id) {
    selectedStudentId = id;
    if (typeof navigateTo === "function") {
        navigateTo("student360");
    } else {
        renderStudent360();
    }
}

async function renderStudent360() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    // Lock to own profile if student
    if (role === "student") {
        selectedStudentId = user.linked_student_id || user.id;
    }

    if (students.length === 0) {
        await loadLatestStudents();
    }

    // Fetch full detail from backend API
    const s = await API.getStudentDetail(selectedStudentId) || students.find(item => item.id === selectedStudentId);
    if (!s) {
        content.innerHTML = `<div class="alert alert-warning">Student profile [${selectedStudentId}] not found.</div>`;
        return;
    }

    const marks = s.subject_marks || [];
    const activities = s.activities || [];
    const interventions = s.interventions || [];
    const aiAnalysis = s.ai_analysis || { risk_score: s.risk, risk_level: s.risk >= 60 ? "High Risk" : "Moderate", reasons: [] };

    let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
    let riskStatus = s.risk >= 60 ? "High Academic Risk" : (s.risk >= 30 ? "Moderate Warning" : "Low Risk / Healthy");

    content.innerHTML = `
        <!-- TOP CONTROLS: STUDENT SWITCHER (for faculty/admin) -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">👤 Student 360° Academic Intelligence Profile</h1>
                <p class="text-muted small mb-0">Demographic factors, subject-wise internal tests, extracurricular engagement & AI diagnostic</p>
            </div>
            ${role !== 'student' ? `
                <div class="d-flex align-items-center gap-2">
                    <span class="text-muted small fw-semibold">Switch Student:</span>
                    <select id="student360Switcher" class="form-select form-select-sm" style="min-width: 220px;" onchange="viewStudent360(this.value)">
                        ${students.map(st => `
                            <option value="${st.id}" ${st.id === selectedStudentId ? 'selected' : ''}>
                                ${st.name} (${st.id}) - ${st.risk}% Risk
                            </option>
                        `).join("")}
                    </select>
                </div>
            ` : ''}
        </div>

        <!-- HEADER BANNER -->
        <div class="profile-header mb-4">
            <div class="profile-avatar-box">
                <div class="profile-avatar">${s.name.charAt(0)}</div>
                <div class="profile-info">
                    <h2>${s.name} <span class="badge bg-light text-dark fs-6 ms-2">${s.id}</span></h2>
                    <p><i class="bi bi-mortarboard me-1"></i> ${s.course} • ${s.year || '2nd Year'} • CGPA: <strong>${s.cgpa}</strong> • Credits: <strong>${s.credits || 24}</strong></p>
                </div>
            </div>
            <div class="text-end">
                <span class="risk-badge ${badgeClass} fs-6 mb-2">${s.risk}% (${riskStatus})</span>
                <p class="text-light-50 small mb-0"><i class="bi bi-robot me-1"></i> Monitored by Autonomous AI Agent</p>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <!-- LEFT COLUMN: SUBJECT MARKS & MULTI-SIGNAL RADAR -->
            <div class="col-lg-8">
                <!-- SUBJECT-WISE MARKS & ATTENDANCE -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-journal-bookmark-fill text-primary me-2"></i> Semester 3 Subject Performance & Grades</h3>
                        <span class="text-muted small">Internal tests (30) | End-sem (70)</span>
                    </div>
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Subject</th>
                                    <th>Attendance</th>
                                    <th>Internal (30)</th>
                                    <th>End-Sem (70)</th>
                                    <th>Lab / Assign</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${marks.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No subject marks recorded.</td></tr>' : marks.map(m => `
                                    <tr>
                                        <td><code>${m.subject_code}</code></td>
                                        <td><strong>${m.subject_name || m.short_name}</strong></td>
                                        <td><span class="${m.attendance < 75 ? 'text-danger fw-bold' : 'text-success'}">${m.attendance}%</span></td>
                                        <td><strong>${m.internal_marks}</strong> / 30</td>
                                        <td>${m.external_marks} / 70</td>
                                        <td>${m.assignment_score}%</td>
                                        <td><span class="badge bg-primary">${m.grade}</span></td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- RADAR CHART & MULTI-SIGNAL TELEMETRY -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-radar text-info me-2"></i> Multi-Signal Diagnostic Profile</h3>
                        <span class="text-muted small">Signals benchmarked to cohort baseline</span>
                    </div>
                    <div class="row align-items-center">
                        <div class="col-md-7">
                            <div style="position: relative; height: 240px;">
                                <canvas id="student360RadarCanvas"></canvas>
                            </div>
                        </div>
                        <div class="col-md-5">
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1 small">
                                    <span>Class Attendance</span>
                                    <strong>${s.attendance}%</strong>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar ${s.attendance < 75 ? 'bg-danger' : 'bg-success'}" style="width: ${s.attendance}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1 small">
                                    <span>LMS Engagement</span>
                                    <strong>${s.lms_score || s.attendance}%</strong>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-info" style="width: ${s.lms_score || s.attendance}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1 small">
                                    <span>Academic CGPA</span>
                                    <strong>${s.cgpa} / 10</strong>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-warning" style="width: ${s.cgpa * 10}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- EXPLAINABLE AI RISK DIAGNOSIS -->
                <div class="card-box">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-cpu text-danger me-2"></i> Explainable AI Risk Reason Analysis</h3>
                    </div>
                    <ul class="list-group list-group-flush">
                        ${(aiAnalysis.reasons || []).map(r => `
                            <li class="list-group-item d-flex align-items-center text-dark py-2">
                                <i class="bi bi-exclamation-triangle-fill text-warning me-3 fs-5"></i>
                                ${r}
                            </li>
                        `).join("")}
                    </ul>
                </div>
            </div>

            <!-- RIGHT COLUMN: DEMOGRAPHICS, ACTIVITIES, INTERVENTIONS -->
            <div class="col-lg-4">
                <!-- PERSONAL & PARENTAL DEMOGRAPHICS -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-person-lines-fill text-secondary me-2"></i> Demographics & Contact</h3>
                    </div>
                    <ul class="list-group list-group-flush small">
                        <li class="list-group-item d-flex justify-content-between px-0">
                            <span class="text-muted">Father's Name</span>
                            <strong>${s.father || 'N/A'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between px-0">
                            <span class="text-muted">Mother's Name</span>
                            <strong>${s.mother || 'N/A'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between px-0">
                            <span class="text-muted">Mother Tongue</span>
                            <strong>${s.mother_tongue || s.motherTongue || 'Telugu'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between px-0">
                            <span class="text-muted">Location / City</span>
                            <strong>${s.place || 'Hyderabad'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between px-0">
                            <span class="text-muted">Region</span>
                            <strong>${s.region || 'South India'}</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between px-0">
                            <span class="text-muted">Country</span>
                            <strong>${s.country || 'India'}</strong>
                        </li>
                    </ul>
                </div>

                <!-- EXTRACURRICULAR ENGAGEMENTS -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-trophy text-warning me-2"></i> Extracurricular & Clubs</h3>
                    </div>
                    ${activities.length === 0 ? '<p class="text-muted small">No extracurricular activity registered.</p>' : `
                        <div class="d-flex flex-column gap-2">
                            ${activities.map(a => `
                                <div class="p-2 border rounded bg-light">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <strong class="text-dark small">${a.activity_name}</strong>
                                        <span class="badge bg-primary">${a.role}</span>
                                    </div>
                                    <small class="text-muted d-block">${a.category} ${a.notes ? `• ${a.notes}` : ''}</small>
                                </div>
                            `).join("")}
                        </div>
                    `}
                </div>

                <!-- INTERVENTIONS & ACTIONS -->
                <div class="card-box">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-chat-heart text-danger me-2"></i> Mentoring Interventions</h3>
                    </div>
                    ${interventions.length === 0 ? '<p class="text-muted small">No active interventions logged.</p>' : `
                        <div class="list-group list-group-flush mb-3">
                            ${interventions.map(i => `
                                <div class="list-group-item px-0 py-2 border-bottom">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <strong class="text-dark small">${i.action}</strong>
                                        <span class="badge ${i.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}">${i.status}</span>
                                    </div>
                                    <small class="text-muted"><i class="bi bi-calendar3 me-1"></i> ${i.date}</small>
                                </div>
                            `).join("")}
                        </div>
                    `}
                    ${role !== 'student' ? `
                        <button class="primary-btn w-100 btn-sm" onclick="quickCreateIntervention('${s.id}', '1-on-1 Academic Counseling', 'CS201', 'Moderate')">
                            <i class="bi bi-plus-lg"></i> Launch New Mentoring Action
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    // Render Radar Chart for Student 360
    setTimeout(() => {
        const canvas = document.getElementById("student360RadarCanvas");
        if (canvas) {
            if (student360RadarChart) student360RadarChart.destroy();
            student360RadarChart = new Chart(canvas.getContext("2d"), {
                type: "radar",
                data: {
                    labels: ["Attendance", "CGPA x10", "LMS Activity", "Assignment Rate", "Credit Score"],
                    datasets: [
                        {
                            label: s.name,
                            data: [s.attendance, s.cgpa * 10, s.lms_score || s.attendance, s.cgpa * 10, (s.credits / 30) * 100],
                            borderColor: s.risk >= 60 ? "#ef4444" : "#3b82f6",
                            backgroundColor: s.risk >= 60 ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                            borderWidth: 2
                        },
                        {
                            label: "Class Average",
                            data: [79, 78, 73, 75, 80],
                            borderColor: "#94a3b8",
                            backgroundColor: "rgba(148, 163, 184, 0.1)",
                            borderWidth: 1,
                            borderDash: [4, 4]
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { r: { min: 0, max: 100 } },
                    plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } }
                }
            });
        }
    }, 100);
}
