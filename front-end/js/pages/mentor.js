/* =====================================================
   MENTOR.JS
   Faculty Mentor Prioritization & Action Tracking UI
===================================================== */

function renderMentor() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    // Filter high & medium risk students
    const priorityList = students.filter(s => s.risk >= 30);

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Faculty Mentor Prioritization Dashboard</h1>
            <p class="text-muted small mb-0">Prioritized list of students requiring immediate intervention</p>
        </div>

        <div class="row g-4">
            ${priorityList.map(s => {
                let badgeClass = s.risk >= 60 ? "high" : "medium";
                return `
                    <div class="col-md-6">
                        <div class="card-box h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h4 class="fw-bold mb-0">${s.name}</h4>
                                        <span class="text-muted small">ID: ${s.id} • ${s.course}</span>
                                    </div>
                                    <span class="risk-badge ${badgeClass}">${s.risk}% Risk</span>
                                </div>
                                <p class="small text-secondary mb-3">
                                    <i class="bi bi-info-circle me-1"></i> Attendance: <strong>${s.attendance}%</strong> | CGPA: <strong>${s.cgpa}</strong>
                                </p>
                            </div>
                            <div class="pt-3 border-top d-flex gap-2">
                                <button class="btn btn-sm btn-outline-danger w-50" onclick="triggerMentorAction('${s.id}', '1-on-1 Mentoring')">
                                    <i class="bi bi-person-video"></i> Start Intervention
                                </button>
                                <button class="btn btn-sm btn-outline-secondary w-50" onclick="viewStudent360('${s.id}')">
                                    Full 360° Profile
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}
