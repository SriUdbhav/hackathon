/* =====================================================
   MENTOR.JS
   Faculty & Mentor Prioritization, Action Scheduling,
   and Real-Time Intervention Lifecycle Tracking
===================================================== */

async function renderMentor() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    if (students.length === 0) {
        await loadLatestStudents();
    }

    const priorityList = students.filter(s => s.risk >= 30);
    const liveInterventions = await API.getInterventions() || [];

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">🤝 Faculty Mentor Prioritization & Action Queue</h1>
                <p class="text-muted small mb-0">Prioritized intervention queue with lifecycle status tracking (Pending → In Progress → Completed)</p>
            </div>
            <button class="primary-btn" onclick="openCustomInterventionModal()">
                <i class="bi bi-calendar-plus"></i> Schedule New Intervention
            </button>
        </div>

        <!-- TWO PANELS: PRIORITY STUDENTS & ACTIVE LIFECYCLE TRACKER -->
        <div class="row g-4 mb-4">
            <!-- LEFT: PRIORITY AT-RISK WATCHLIST -->
            <div class="col-lg-6">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-exclamation-octagon-fill text-danger me-2"></i> Students Flagged for Intervention</h3>
                        <span class="badge bg-danger">${priorityList.length} Students</span>
                    </div>

                    <div class="d-flex flex-column gap-3">
                        ${priorityList.map(s => {
                            let badgeClass = s.risk >= 60 ? "high" : "medium";
                            return `
                                <div class="p-3 border rounded-3 bg-light">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            <h5 class="fw-bold mb-0 text-dark">${s.name}</h5>
                                            <span class="text-muted small">ID: <code>${s.id}</code> • ${s.course} (${s.year || '2nd Year'})</span>
                                        </div>
                                        <span class="risk-badge ${badgeClass}">${s.risk}% Risk</span>
                                    </div>
                                    <div class="small text-secondary mb-3 d-flex gap-3">
                                        <span><i class="bi bi-clock-history me-1"></i> Attendance: <strong>${s.attendance}%</strong></span>
                                        <span><i class="bi bi-award me-1"></i> CGPA: <strong>${s.cgpa}</strong></span>
                                        <span><i class="bi bi-cpu me-1"></i> LMS: <strong>${s.lms_score || s.attendance}%</strong></span>
                                    </div>
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-sm btn-primary w-50" onclick="quickCreateIntervention('${s.id}', '1-on-1 Academic Mentoring', 'CS201', 'Critical')">
                                            <i class="bi bi-person-video"></i> Start 1-on-1
                                        </button>
                                        <button class="btn btn-sm btn-outline-secondary w-50" onclick="viewStudent360('${s.id}')">
                                            <i class="bi bi-person-vcard"></i> Full 360° Profile
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            </div>

            <!-- RIGHT: ACTIVE INTERVENTIONS PIPELINE -->
            <div class="col-lg-6">
                <div class="card-box h-100">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-kanban-fill text-primary me-2"></i> Active Mentoring Pipeline</h3>
                        <span class="badge bg-primary">${liveInterventions.length} Total Logged</span>
                    </div>

                    ${liveInterventions.length === 0 ? '<p class="text-muted small py-4 text-center">No interventions recorded yet. Click "Start 1-on-1" to launch one.</p>' : `
                        <div class="list-group list-group-flush" style="max-height: 520px; overflow-y: auto;">
                            ${liveInterventions.map(i => {
                                const statusClass = i.status === 'Completed' ? 'bg-success' : (i.status === 'In Progress' ? 'bg-primary' : 'bg-warning text-dark');
                                const studentName = students.find(s => s.id === i.student_id)?.name || i.student_id;
                                return `
                                    <div class="list-group-item px-0 py-3 border-bottom">
                                        <div class="d-flex justify-content-between align-items-start mb-1">
                                            <div>
                                                <strong class="d-block text-dark">${i.action}</strong>
                                                <small class="text-muted">Student: <strong>${studentName}</strong> (<code>${i.student_id}</code>) ${i.subject_code ? `• Subject: ${i.subject_code}` : ''}</small>
                                            </div>
                                            <span class="badge ${statusClass}">${i.status}</span>
                                        </div>
                                        <div class="d-flex justify-content-between align-items-center mt-2 small">
                                            <span class="text-muted"><i class="bi bi-calendar3 me-1"></i> Logged: ${i.date} ${i.completed_date ? `| Done: ${i.completed_date}` : ''}</span>
                                            ${i.status !== 'Completed' ? `
                                                <button class="btn btn-sm btn-outline-success py-0 px-2" onclick="markInterventionComplete(${i.id})">
                                                    <i class="bi bi-check-lg"></i> Mark Complete
                                                </button>
                                            ` : '<span class="text-success"><i class="bi bi-check-circle-fill"></i> Resolved</span>'}
                                        </div>
                                    </div>
                                `;
                            }).join("")}
                        </div>
                    `}
                </div>
            </div>
        </div>

        <!-- MODAL FOR CUSTOM INTERVENTION -->
        <div id="customInterventionModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 480px;">
                <div class="modal-head">
                    <div>
                        <span>MENTORING DISPATCH</span>
                        <h2>Schedule Intervention</h2>
                    </div>
                    <button class="modal-close" onclick="closeCustomInterventionModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="customInterventionForm" class="p-3">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Select Student</label>
                        <select id="intStudentId" class="form-select" required>
                            ${students.map(s => `<option value="${s.id}">${s.name} (${s.id}) - ${s.risk}% Risk</option>`).join("")}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Intervention Action</label>
                        <select id="intActionType" class="form-select">
                            <option value="1-on-1 Academic Counseling">1-on-1 Academic Counseling</option>
                            <option value="Assign Peer Tutor">Assign Peer Tutor</option>
                            <option value="Attendance Recovery Contract">Attendance Recovery Contract</option>
                            <option value="Subject Remedial Class">Subject Remedial Class</option>
                            <option value="Parent-Faculty Conference">Parent-Faculty Conference</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Associated Subject</label>
                        <select id="intSubjectCode" class="form-select">
                            <option value="CS201">DBMS (CS201)</option>
                            <option value="CS202">OS (CS202)</option>
                            <option value="MA201">Discrete Mathematics (MA201)</option>
                            <option value="CS203">Computer Networks (CS203)</option>
                            <option value="CS204">Software Engineering (CS204)</option>
                            <option value="General">General / All Subjects</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Urgency</label>
                        <select id="intUrgency" class="form-select">
                            <option value="Critical">Critical (Immediate Outreach)</option>
                            <option value="Moderate" selected>Moderate (Within 3 Days)</option>
                            <option value="Low">Low (Routine Monitoring)</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Notes / Strategy</label>
                        <textarea id="intNotes" class="form-control" rows="2" placeholder="e.g. Schedule remedial lab session on SQL queries"></textarea>
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeCustomInterventionModal()">Cancel</button>
                        <button type="submit" class="primary-btn">Schedule Intervention</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Bind form
    const form = document.getElementById("customInterventionForm");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            const payload = {
                student_id: document.getElementById("intStudentId").value,
                action: document.getElementById("intActionType").value,
                subject_code: document.getElementById("intSubjectCode").value,
                urgency: document.getElementById("intUrgency").value,
                status: "In Progress",
                notes: document.getElementById("intNotes").value.trim()
            };
            const res = await API.createIntervention(payload);
            if (res && res.success) {
                alert("Intervention scheduled and logged in live database!");
                closeCustomInterventionModal();
                renderMentor();
            }
        });
    }
}

async function quickCreateIntervention(studentId, action, subject, urgency) {
    const res = await API.createIntervention({
        student_id: studentId,
        action: action,
        subject_code: subject,
        urgency: urgency,
        status: "In Progress",
        notes: "Initiated via Faculty Quick Action Panel"
    });
    if (res && res.success) {
        alert(`Intervention "${action}" started for student ${studentId}!`);
        renderMentor();
    }
}

async function markInterventionComplete(interventionId) {
    const res = await API.updateIntervention(interventionId, { status: "Completed" });
    if (res && res.success) {
        alert("Intervention marked as Completed! Recorded in student audit log.");
        renderMentor();
    }
}

function openCustomInterventionModal() {
    document.getElementById("customInterventionModal")?.classList.add("active");
}
function closeCustomInterventionModal() {
    document.getElementById("customInterventionModal")?.classList.remove("active");
}
