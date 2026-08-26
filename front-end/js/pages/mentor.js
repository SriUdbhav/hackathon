/* =====================================================
   MENTOR.JS
   Faculty & Mentor Prioritization, Action Scheduling,
   and Real-Time Intervention Lifecycle Tracking
   UAC: Only admin can mark interventions as complete
===================================================== */

async function renderMentor() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    if (students.length === 0) {
        await loadLatestStudents();
        if (typeof currentActivePage !== "undefined" && currentActivePage !== "mentor") return;
    }

    const priorityList = students.filter(s => s.risk >= 30);
    const liveInterventions = await API.getInterventions() || [];

    // Role-aware heading
    const pageTitle = role === 'mentor' ? 'Mentor Dashboard & Session Queue' : 'Faculty Mentor Prioritization & Action Queue';
    const pageSubtitle = role === 'mentor'
        ? 'Your mentoring sessions, student assignments, and intervention progress'
        : 'Prioritized intervention queue with lifecycle status tracking (Pending → In Progress → Completed)';

    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">${pageTitle}</h1>
                <p class="text-muted small mb-0">${pageSubtitle}</p>
            </div>
            <button class="primary-btn" onclick="openCustomInterventionModal()">
                <i class="bi bi-calendar-plus"></i> Schedule New Session
            </button>
        </div>

        <!-- STATS BAR -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="card-box p-3 border-start border-4 border-danger">
                    <span class="text-muted small d-block mb-1">AT-RISK STUDENTS</span>
                    <h3 class="fw-bold mb-0 text-danger">${priorityList.length}</h3>
                    <small class="text-muted">Flagged for intervention</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card-box p-3 border-start border-4 border-primary">
                    <span class="text-muted small d-block mb-1">TOTAL SESSIONS</span>
                    <h3 class="fw-bold mb-0 text-primary">${liveInterventions.length}</h3>
                    <small class="text-muted">All logged interventions</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card-box p-3 border-start border-4 border-warning">
                    <span class="text-muted small d-block mb-1">IN PROGRESS</span>
                    <h3 class="fw-bold mb-0 text-warning">${liveInterventions.filter(i => i.status === 'In Progress' || i.status === 'Pending').length}</h3>
                    <small class="text-muted">Active sessions</small>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card-box p-3 border-start border-4 border-success">
                    <span class="text-muted small d-block mb-1">COMPLETED</span>
                    <h3 class="fw-bold mb-0 text-success">${liveInterventions.filter(i => i.status === 'Completed').length}</h3>
                    <small class="text-muted">Resolved interventions</small>
                </div>
            </div>
        </div>

        <!-- TWO PANELS: PRIORITY STUDENTS & ACTIVE LIFECYCLE TRACKER -->
        <div class="row g-4 mb-4">
            <!-- LEFT: PRIORITY AT-RISK WATCHLIST -->
            <div class="col-lg-6">
                <div class="card-box h-100 d-flex flex-column">
                    <div class="card-head flex-wrap gap-2">
                        <div>
                            <h3 class="fw-bold"><i class="bi bi-exclamation-octagon-fill text-danger me-2"></i> Students Flagged for Intervention</h3>
                            <span class="text-muted small" id="mentorPrioritySubhead">${priorityList.length} At-Risk Students</span>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <input type="text" id="mentorPrioritySearch" class="form-control form-control-sm" placeholder="Search flagged..." style="width: 140px; font-size: 12px; background: var(--bg-sunken); color: var(--text); border-color: var(--border);" oninput="handleMentorPrioritySearch(this.value)">
                        </div>
                    </div>

                    <div id="mentorPriorityListContainer" class="d-flex flex-column gap-3 flex-grow-1" style="max-height: 520px; overflow-y: auto;">
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top flex-wrap gap-2" id="mentorPriorityPagination">
                    </div>
                </div>
            </div>

            <!-- RIGHT: ACTIVE INTERVENTIONS PIPELINE -->
            <div class="col-lg-6">
                <div class="card-box h-100 d-flex flex-column">
                    <div class="card-head flex-wrap gap-2">
                        <div>
                            <h3 class="fw-bold"><i class="bi bi-kanban-fill text-primary me-2"></i> Mentoring Pipeline</h3>
                            <span class="text-muted small">${liveInterventions.length} Total Sessions</span>
                        </div>
                    </div>

                    <div id="mentorPipelineListContainer" class="d-flex flex-column gap-2 flex-grow-1" style="max-height: 520px; overflow-y: auto;">
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top flex-wrap gap-2" id="mentorPipelinePagination">
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL FOR CUSTOM INTERVENTION -->
        <div id="customInterventionModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span>MENTORING SESSION</span>
                        <h2>Schedule New Session</h2>
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
                        <label class="form-label fw-semibold">Session Type</label>
                        <select id="intActionType" class="form-select">
                            <option value="1-on-1 Academic Counseling">1-on-1 Academic Counseling</option>
                            <option value="Assign Peer Tutor">Assign Peer Tutor</option>
                            <option value="Attendance Recovery Contract">Attendance Recovery Contract</option>
                            <option value="Subject Remedial Class">Subject Remedial Class</option>
                            <option value="Parent-Faculty Conference">Parent-Faculty Conference</option>
                            <option value="Study Plan Review">Study Plan Review</option>
                            <option value="Career Guidance Session">Career Guidance Session</option>
                        </select>
                    </div>
                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Subject</label>
                            <select id="intSubjectCode" class="form-select">
                                <option value="CS201">DBMS (CS201)</option>
                                <option value="CS202">OS (CS202)</option>
                                <option value="MA201">Discrete Mathematics (MA201)</option>
                                <option value="CS203">Computer Networks (CS203)</option>
                                <option value="CS204">Software Engineering (CS204)</option>
                                <option value="General">General / All Subjects</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold">Urgency</label>
                            <select id="intUrgency" class="form-select">
                                <option value="Critical">Critical (Immediate)</option>
                                <option value="Moderate" selected>Moderate (Within 3 Days)</option>
                                <option value="Low">Low (Routine)</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Session Date</label>
                        <input type="date" id="intSessionDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Notes / Strategy</label>
                        <textarea id="intNotes" class="form-control" rows="2" placeholder="e.g. Schedule remedial lab session on SQL queries"></textarea>
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button type="button" class="secondary-btn" onclick="closeCustomInterventionModal()">Cancel</button>
                        <button type="submit" class="primary-btn"><i class="bi bi-calendar-check me-1"></i> Schedule Session</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Render initial paginated lists
    renderMentorPriorityList();
    renderMentorPipelineList(liveInterventions);

    // Bind form
    const form = document.getElementById("customInterventionForm");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Scheduling...';
            }

            const payload = {
                student_id: document.getElementById("intStudentId").value,
                action: document.getElementById("intActionType").value,
                subject_code: document.getElementById("intSubjectCode").value,
                urgency: document.getElementById("intUrgency").value,
                status: "In Progress",
                notes: document.getElementById("intNotes").value.trim(),
                mentor_id: user?.id || null
            };
            const res = await API.createIntervention(payload);

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-calendar-check me-1"></i> Schedule Session';
            }

            if (res && res.success) {
                closeCustomInterventionModal();
                renderMentor();
                // Show success toast instead of alert
                showToast("Session scheduled successfully!", "success");
            }
        });
    }
}

window._mentorPriorityState = window._mentorPriorityState || { page: 1, pageSize: 6, search: "" };
window._mentorPipelineState = window._mentorPipelineState || { page: 1, pageSize: 6 };

function handleMentorPrioritySearch(val) {
    if (!window._mentorPriorityState) window._mentorPriorityState = { page: 1, pageSize: 6, search: "" };
    window._mentorPriorityState.search = (val || "").trim().toLowerCase();
    window._mentorPriorityState.page = 1;
    renderMentorPriorityList();
}
window.handleMentorPrioritySearch = handleMentorPrioritySearch;

function handleMentorPriorityPage(newPage) {
    if (!window._mentorPriorityState) window._mentorPriorityState = { page: 1, pageSize: 6, search: "" };
    window._mentorPriorityState.page = newPage;
    renderMentorPriorityList();
}
window.handleMentorPriorityPage = handleMentorPriorityPage;

function handleMentorPipelinePage(newPage) {
    if (!window._mentorPipelineState) window._mentorPipelineState = { page: 1, pageSize: 6 };
    window._mentorPipelineState.page = newPage;
    renderMentorPipelineList();
}
window.handleMentorPipelinePage = handleMentorPipelinePage;

function renderMentorPriorityList() {
    const container = document.getElementById("mentorPriorityListContainer");
    const pagContainer = document.getElementById("mentorPriorityPagination");
    const subhead = document.getElementById("mentorPrioritySubhead");
    if (!container) return;

    const priorityList = students.filter(s => s.risk >= 30);
    const search = window._mentorPriorityState?.search || "";
    let filtered = priorityList;
    if (search) {
        filtered = priorityList.filter(s => 
            s.name.toLowerCase().includes(search) ||
            s.id.toLowerCase().includes(search) ||
            (s.course && s.course.toLowerCase().includes(search))
        );
    }

    if (subhead) {
        subhead.textContent = `${filtered.length} Flagged Students ${filtered.length !== priorityList.length ? `(filtered from ${priorityList.length})` : ''}`;
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search text-muted fs-2 d-block mb-2"></i>
                <h6 class="text-muted">No flagged students match search.</h6>
            </div>
        `;
        if (pagContainer) pagContainer.innerHTML = "";
        return;
    }

    const { page, pageSize } = window._mentorPriorityState;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    window._mentorPriorityState.page = currentPage;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, filtered.length);
    const items = filtered.slice(start, end);

    container.innerHTML = items.map(s => {
        let badgeClass = s.risk >= 60 ? "high" : "medium";
        return `
            <div class="p-3 rounded-3 mentor-student-card" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 class="fw-bold mb-0" style="color: var(--text);">${s.name}</h5>
                        <span class="small" style="color: var(--text-muted);">ID: <code>${s.id}</code> • ${s.course} (${s.year || '2nd Year'})</span>
                    </div>
                    <span class="risk-badge ${badgeClass}">${s.risk}% Risk</span>
                </div>
                <div class="small mb-3 d-flex gap-3" style="color: var(--text-soft);">
                    <span><i class="bi bi-clock me-1"></i> Attendance: <strong>${s.attendance}%</strong></span>
                    <span><i class="bi bi-award me-1"></i> CGPA: <strong>${s.cgpa}</strong></span>
                    <span><i class="bi bi-cpu me-1"></i> LMS: <strong>${s.lms_score || s.attendance}%</strong></span>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-primary w-50" onclick="quickCreateIntervention('${s.id}', '1-on-1 Academic Mentoring', 'CS201', 'Critical')">
                        <i class="bi bi-calendar-plus"></i> Book 1-on-1
                    </button>
                    <button class="btn btn-sm btn-outline-secondary w-50" onclick="viewStudent360('${s.id}')">
                        <i class="bi bi-person-vcard"></i> Full 360° Profile
                    </button>
                </div>
            </div>
        `;
    }).join("");

    if (pagContainer) {
        pagContainer.innerHTML = `
            <span class="small text-muted">Showing ${start + 1}-${end} of ${filtered.length}</span>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === 1 ? 'disabled' : ''} onclick="handleMentorPriorityPage(${currentPage - 1})">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <span class="small px-2 my-auto fw-semibold">${currentPage} / ${totalPages}</span>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleMentorPriorityPage(${currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;
    }
}

function renderMentorPipelineList(interventionsList) {
    const container = document.getElementById("mentorPipelineListContainer");
    const pagContainer = document.getElementById("mentorPipelinePagination");
    if (!container) return;

    if (interventionsList) window._cachedLiveInterventions = interventionsList;
    const list = window._cachedLiveInterventions || [];

    if (list.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-plus fs-1 d-block mb-3 text-muted"></i>
                <h5 class="text-dark">No Sessions Yet</h5>
                <p class="text-muted small mb-3">Click "Book 1-on-1" on a student or "Schedule New Session" to get started.</p>
                <button class="primary-btn btn-sm" onclick="openCustomInterventionModal()">
                    <i class="bi bi-plus-lg"></i> Schedule First Session
                </button>
            </div>
        `;
        if (pagContainer) pagContainer.innerHTML = "";
        return;
    }

    const { page, pageSize } = window._mentorPipelineState || { page: 1, pageSize: 6 };
    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    if (window._mentorPipelineState) window._mentorPipelineState.page = currentPage;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, list.length);
    const items = list.slice(start, end);

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    container.innerHTML = items.map(i => {
        const statusClass = i.status === 'Completed' ? 'bg-success text-white' : (i.status === 'In Progress' ? 'bg-primary text-white' : 'bg-warning text-dark');
        const studentName = students.find(s => s.id === i.student_id)?.name || i.student_id;
        return `
            <div class="p-3 rounded-3 mentor-pipeline-item" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <strong class="d-block" style="color: var(--text); font-size: 13.5px;">${i.action}</strong>
                        <small style="color: var(--text-soft);">Student: <strong>${studentName}</strong> (<code>${i.student_id}</code>) ${i.subject_code ? `• Subject: ${i.subject_code}` : ''}</small>
                    </div>
                    <span class="badge ${statusClass}" style="font-size: 11px;">${i.status}</span>
                </div>
                ${i.notes ? `<p class="small mb-2 p-2 rounded" style="background: var(--bg-elevated); border: 1px solid var(--border-soft); color: var(--text); font-size: 12px;"><i class="bi bi-sticky me-1 text-primary"></i> ${i.notes}</p>` : ''}
                <div class="d-flex justify-content-between align-items-center mt-2 small" style="color: var(--text-muted); font-size: 12px;">
                    <span><i class="bi bi-calendar3 me-1"></i> Logged: ${i.date} ${i.completed_date ? `| Done: ${i.completed_date}` : ''}</span>
                    ${i.status !== 'Completed' ? (
                        role === 'admin' ? `
                            <button class="btn btn-sm btn-outline-success py-1 px-3 d-flex align-items-center gap-1" onclick="markInterventionComplete(${i.id})">
                                <i class="bi bi-check2"></i> Mark Complete
                            </button>
                        ` : `
                            <span style="color: var(--text-soft);"><i class="bi bi-hourglass-split me-1 text-warning"></i> Awaiting Completion</span>
                        `
                    ) : '<span class="text-success fw-semibold"><i class="bi bi-check-circle-fill me-1"></i> Resolved</span>'}
                </div>
            </div>
        `;
    }).join("");

    if (pagContainer) {
        pagContainer.innerHTML = `
            <span class="small text-muted">Showing ${start + 1}-${end} of ${list.length}</span>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === 1 ? 'disabled' : ''} onclick="handleMentorPipelinePage(${currentPage - 1})">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <span class="small px-2 my-auto fw-semibold">${currentPage} / ${totalPages}</span>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleMentorPipelinePage(${currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;
    }
}

async function quickCreateIntervention(studentId, action, subject, urgency) {
    const user = getCurrentUser();
    const res = await API.createIntervention({
        student_id: studentId,
        action: action,
        subject_code: subject,
        urgency: urgency,
        status: "In Progress",
        notes: "Initiated via Quick Action Panel",
        mentor_id: user?.id || null
    });
    if (res && res.success) {
        showToast(`Session "${action}" booked for student ${studentId}!`, "success");
        renderMentor();
    }
}

async function markInterventionComplete(interventionId) {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    const res = await API.updateIntervention(interventionId, {
        status: "Completed",
        caller_role: role
    });

    if (res && res.success) {
        showToast("Intervention marked as Completed!", "success");
        renderMentor();
    } else {
        showToast(res?.message || "Only administrators can mark interventions as completed.", "danger");
    }
}

function openCustomInterventionModal() {
    document.getElementById("customInterventionModal")?.classList.add("active");
}
function closeCustomInterventionModal() {
    document.getElementById("customInterventionModal")?.classList.remove("active");
}

// Simple toast notification helper
function showToast(message, type = "info") {
    const existing = document.getElementById("appToast");
    if (existing) existing.remove();

    const bgClass = type === "success" ? "bg-success" : (type === "danger" ? "bg-danger" : "bg-primary");
    const toast = document.createElement("div");
    toast.id = "appToast";
    toast.className = `position-fixed bottom-0 end-0 m-3 p-3 ${bgClass} text-white rounded-3 shadow-lg d-flex align-items-center gap-2`;
    toast.style.cssText = "z-index: 10000; animation: slideInRight 0.3s ease; max-width: 400px;";
    toast.innerHTML = `
        <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : (type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill')} fs-5"></i>
        <span class="small fw-semibold">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
