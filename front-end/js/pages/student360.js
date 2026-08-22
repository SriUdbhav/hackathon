/* =====================================================
   STUDENT360.JS
   Renders detailed 360° Profile view for a selected student
===================================================== */

let selectedStudentId = "25CS001";

function viewStudent360(id) {
    selectedStudentId = id;
    if (typeof navigateTo === "function") {
        navigateTo("student360");
    } else {
        renderStudent360();
    }
}

function renderStudent360() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const s = students.find(item => item.id === selectedStudentId) || students[0];
    if (!s) return;

    let badgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
    let riskStatus = s.risk >= 60 ? "High Academic Risk" : (s.risk >= 30 ? "Moderate Warning" : "Low Risk / Healthy");

    content.innerHTML = `
        <!-- HEADER CARD -->
        <div class="profile-header">
            <div class="profile-avatar-box">
                <div class="profile-avatar">${s.name.charAt(0)}</div>
                <div class="profile-info">
                    <h2>${s.name} <span class="badge bg-primary fs-6 ms-2">${s.id}</span></h2>
                    <p><i class="bi bi-book me-1"></i> ${s.course} • ${s.year} • CGPA: <strong>${s.cgpa}</strong></p>
                </div>
            </div>
            <div class="text-end">
                <span class="risk-badge ${badgeClass} fs-6 mb-2">${s.risk}% (${riskStatus})</span>
                <p class="text-light-50 small mb-0">Monitored by AI Academic Agent</p>
            </div>
        </div>

        <div class="row g-4">
            <!-- ACADEMIC SIGNALS & BREAKDOWN -->
            <div class="col-md-8">
                <div class="card-box">
                    <div class="card-head">
                        <h3><i class="bi bi-activity text-primary me-2"></i> Multi-Signal Engagement Indicators</h3>
                    </div>
                    
                    <div class="mb-4">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="fw-semibold">Class Attendance</span>
                            <span class="fw-bold">${s.attendance}%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar ${s.attendance < 75 ? 'bg-danger' : 'bg-success'}" style="width: ${s.attendance}%"></div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="fw-semibold">LMS Platform Activity</span>
                            <span class="fw-bold">${s.lms_score || Math.min(100, s.attendance + 5)}%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar bg-info" style="width: ${s.lms_score || Math.min(100, s.attendance + 5)}%"></div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="d-flex justify-content-between mb-1">
                            <span class="fw-semibold">Assignment Submission Rate</span>
                            <span class="fw-bold">${Math.round(s.cgpa * 10)}%</span>
                        </div>
                        <div class="progress" style="height: 10px;">
                            <div class="progress-bar bg-warning" style="width: ${Math.round(s.cgpa * 10)}%"></div>
                        </div>
                    </div>
                </div>

                <!-- EXPLAINABLE AI RISK REASONS -->
                <div class="card-box">
                    <div class="card-head">
                        <h3><i class="bi bi-cpu text-danger me-2"></i> Explainable Risk Factor Analysis</h3>
                    </div>
                    <ul class="list-group list-group-flush">
                        ${s.attendance < 75 ? `
                            <li class="list-group-item d-flex align-items-center text-danger">
                                <i class="bi bi-exclamation-triangle-fill me-3 fs-5"></i>
                                Attendance is below college mandatory threshold (75%).
                            </li>
                        ` : ''}
                        ${s.cgpa < 7.5 ? `
                            <li class="list-group-item d-flex align-items-center text-warning">
                                <i class="bi bi-info-circle-fill me-3 fs-5"></i>
                                Mid-term assessment scores indicate learning gap in core subjects.
                            </li>
                        ` : ''}
                        <li class="list-group-item d-flex align-items-center text-success">
                            <i class="bi bi-check-circle-fill me-3 fs-5"></i>
                            Student active on LMS discussion boards.
                        </li>
                    </ul>
                </div>
            </div>

            <!-- PERSONAL INFORMATION & RECOMMENDED INTERVENTIONS -->
            <div class="col-md-4">
                <div class="card-box">
                    <div class="card-head">
                        <h3>Personal & Contact Info</h3>
                    </div>
                    <p class="mb-2"><strong>Father:</strong> ${s.father || 'N/A'}</p>
                    <p class="mb-2"><strong>Mother:</strong> ${s.mother || 'N/A'}</p>
                    <p class="mb-2"><strong>Mother Tongue:</strong> ${s.motherTongue || 'Telugu'}</p>
                    <p class="mb-2"><strong>Location:</strong> ${s.place || 'Hyderabad'}, ${s.country || 'India'}</p>
                </div>

                <div class="card-box bg-light">
                    <div class="card-head">
                        <h3><i class="bi bi-shield-check text-success me-2"></i> Recommended Interventions</h3>
                    </div>
                    <p class="small text-muted mb-3">AI Agent suggested actions for faculty mentor:</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-danger btn-sm text-start" onclick="triggerMentorAction('${s.id}', 'Schedule 1-on-1 Mentoring')">
                            <i class="bi bi-calendar-event me-2"></i> Schedule 1-on-1 Mentoring
                        </button>
                        <button class="btn btn-outline-warning btn-sm text-start" onclick="triggerMentorAction('${s.id}', 'Assign Peer Tutor')">
                            <i class="bi bi-people me-2"></i> Assign Peer Tutor
                        </button>
                        <button class="btn btn-outline-primary btn-sm text-start" onclick="triggerMentorAction('${s.id}', 'Send Attendance Warning')">
                            <i class="bi bi-envelope me-2"></i> Send Attendance Alert
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function triggerMentorAction(studentId, actionName) {
    API.updateIntervention(studentId, "In Progress", actionName);
    alert(`Intervention "${actionName}" logged for student ${studentId}!`);
}
