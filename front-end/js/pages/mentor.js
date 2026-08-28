/* =====================================================
   MENTOR.JS
   Faculty & Mentor Prioritization, Action Scheduling,
   Intelligent Year/Dept Mentor Assignment & Session Lifecycle
   UAC: Multi-tier session completion review & verification workflow
===================================================== */

let _availableMentors = [];
window._cachedLiveInterventions = [];
window._cachedEnquiries = [];
window._mentorPipelineFilter = window._mentorPipelineFilter || { mentor: "ALL", status: "ALL", page: 1, pageSize: 6 };

async function renderMentor() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    if (students.length === 0) {
        await loadLatestStudents();
        if (typeof currentActivePage !== "undefined" && currentActivePage !== "mentor") return;
    }

    // 1. Fetch available mentors for smart assignment
    try {
        _availableMentors = await API.getMentors() || [];
    } catch (e) {
        console.error("Failed to load mentors list:", e);
        _availableMentors = [];
    }

    const priorityList = students.filter(s => s.risk >= 30);
    
    // 2. Fetch live interventions based on role
    let liveInterventions = [];
    try {
        if (role === 'admin') {
            liveInterventions = (await API.getInterventions()) || [];
        } else if (role === 'mentor') {
            liveInterventions = (await API.getInterventions(user?.id, null, 'mentor', user?.id)) || [];
        } else {
            // Faculty
            liveInterventions = (await API.getInterventions(null, null, 'faculty', user?.id)) || [];
        }
    } catch (e) {
        console.error("Failed to load interventions:", e);
        liveInterventions = [];
    }
    window._cachedLiveInterventions = liveInterventions;

    // 3. Fetch pending completion enquiries / reviews for Admin & Faculty
    let enquiries = [];
    if (role === 'admin' || role === 'faculty') {
        try {
            enquiries = await API.getInterventionEnquiries(role, user?.id) || [];
        } catch (e) {
            console.error("Failed to load enquiries:", e);
            enquiries = [];
        }
    }
    window._cachedEnquiries = enquiries;

    // Role-aware heading
    const pageTitle = role === 'mentor' 
        ? `Mentorship Dashboard • ${user?.display_name || user?.id}` 
        : (role === 'admin' ? 'Institutional Mentorship & Intervention Command Center' : 'Faculty Mentorship & Intervention Queue');
        
    const pageSubtitle = role === 'mentor'
        ? `Managing ${user?.assigned_year || '2nd Year'} ${user?.department || 'CSE'} cohort • Track 1-on-1 sessions, submit completion requests & mentee progress`
        : 'Schedule 1-on-1 sessions, review pending completion enquiries, and oversee institutional student recovery';

    content.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1" style="color: var(--text);">
                    <i class="bi bi-compass-fill me-2" style="color: var(--accent);"></i>${pageTitle}
                </h1>
                <p class="text-muted small mb-0">${pageSubtitle}</p>
            </div>
            <div class="d-flex gap-2">
                <button class="primary-btn" onclick="openCustomInterventionModal()">
                    <i class="bi bi-calendar-plus me-1"></i> Book 1-on-1 Session
                </button>
            </div>
        </div>

        <!-- STATS BAR -->
        <div class="row g-3 mb-4">
            <div class="col-6 col-md-3">
                <div class="card-box p-3 border-start border-4 border-danger">
                    <span class="text-muted small d-block mb-1">AT-RISK STUDENTS</span>
                    <h3 class="fw-bold mb-0 text-danger">${priorityList.length}</h3>
                    <small class="text-muted">Flagged for intervention</small>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card-box p-3 border-start border-4 border-primary">
                    <span class="text-muted small d-block mb-1">TOTAL SESSIONS</span>
                    <h3 class="fw-bold mb-0 text-primary">${liveInterventions.length}</h3>
                    <small class="text-muted">${role === 'mentor' ? 'Assigned to you' : 'All logged sessions'}</small>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card-box p-3 border-start border-4 border-warning">
                    <span class="text-muted small d-block mb-1">PENDING ENQUIRIES / REVIEWS</span>
                    <h3 class="fw-bold mb-0 text-warning">${enquiries.length || liveInterventions.filter(i => i.status === 'Completion Requested').length}</h3>
                    <small class="text-muted">Awaiting verification</small>
                </div>
            </div>
            <div class="col-6 col-md-3">
                <div class="card-box p-3 border-start border-4 border-success">
                    <span class="text-muted small d-block mb-1">COMPLETED</span>
                    <h3 class="fw-bold mb-0 text-success">${liveInterventions.filter(i => i.status === 'Completed').length}</h3>
                    <small class="text-muted">Verified & closed</small>
                </div>
            </div>
        </div>

        <!-- PENDING ENQUIRIES & COMPLETION REVIEWS SECTION (FOR ADMIN & FACULTY) -->
        ${(role === 'admin' || role === 'faculty') && enquiries.length > 0 ? `
            <div class="card-box mb-4 p-3 border border-warning" style="background: var(--bg-elevated);">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <div class="p-2 rounded-circle bg-warning text-dark"><i class="bi bi-patch-check-fill fs-5"></i></div>
                        <div>
                            <h4 class="fw-bold mb-0" style="font-size: 16px; color: var(--text);">Pending Enquiries & Completion Reviews</h4>
                            <span class="small text-muted">Mentors have conducted these sessions and submitted them for verification & closure</span>
                        </div>
                    </div>
                    <span class="badge bg-warning text-dark px-3 py-2 fs-6 fw-bold">${enquiries.length} Pending Review</span>
                </div>
                <div class="d-flex flex-column gap-3">
                    ${enquiries.map(eq => `
                        <div class="p-3 rounded-3 border" style="background: var(--bg-sunken); border-color: var(--border) !important;">
                            <div class="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                                <div>
                                    <div class="d-flex align-items-center gap-2 mb-1">
                                        <strong style="font-size: 14.5px; color: var(--text);">${eq.action}</strong>
                                        <span class="badge bg-warning text-dark"><i class="bi bi-hourglass-split me-1"></i>Awaiting Approval</span>
                                    </div>
                                    <div class="small text-muted" style="font-size: 12px;">
                                        Student: <strong>${eq.student_name}</strong> (<code>${eq.student_id}</code>) • ${eq.student_course} (${eq.student_year || '2nd Year'})
                                        • Mentor: <strong class="text-primary">${eq.mentor_name}</strong>
                                        ${eq.creator_name ? `• Initiated by: <strong>${eq.creator_name}</strong>` : ''}
                                    </div>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-sm btn-success px-3" onclick="handleApproveCompletion(${eq.id})">
                                        <i class="bi bi-check-circle-fill me-1"></i> Approve & Complete
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger px-3" onclick="openRejectCompletionModal(${eq.id}, '${(eq.student_name || '').replace(/'/g, "\\'")}', '${(eq.action || '').replace(/'/g, "\\'")}')">
                                        <i class="bi bi-x-circle me-1"></i> Reject with Reason
                                    </button>
                                </div>
                            </div>
                            <div class="p-2 rounded mt-2" style="background: var(--bg-elevated); border-left: 3px solid var(--warning); font-size: 12px; color: var(--text);">
                                <strong class="d-block mb-1 text-warning"><i class="bi bi-card-text me-1"></i> Mentor's Outcome Summary & Verification Notes:</strong>
                                ${eq.completion_request_notes || eq.notes || 'Session conducted successfully as scheduled.'}
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        ` : ''}

        <!-- TWO PANELS: PRIORITY STUDENTS & ACTIVE LIFECYCLE TRACKER -->
        <div class="row g-4 mb-4">
            <!-- LEFT: PRIORITY AT-RISK WATCHLIST -->
            <div class="col-lg-6">
                <div class="card-box h-100 d-flex flex-column p-3">
                    <div class="card-head flex-wrap gap-2 mb-3">
                        <div>
                            <h3 class="fw-bold mb-0" style="font-size: 16px;"><i class="bi bi-exclamation-octagon-fill text-danger me-2"></i> Flagged Students Watchlist</h3>
                            <span class="text-muted small" id="mentorPrioritySubhead">${priorityList.length} At-Risk Students</span>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <input type="text" id="mentorPrioritySearch" class="form-control form-control-sm" placeholder="Search student name / ID..." style="width: 170px; font-size: 12px; background: var(--bg-sunken); color: var(--text); border-color: var(--border);" oninput="handleMentorPrioritySearch(this.value)">
                        </div>
                    </div>

                    <div id="mentorPriorityListContainer" class="d-flex flex-column gap-3 flex-grow-1" style="max-height: 540px; overflow-y: auto;">
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top flex-wrap gap-2" id="mentorPriorityPagination">
                    </div>
                </div>
            </div>

            <!-- RIGHT: ACTIVE INTERVENTIONS PIPELINE -->
            <div class="col-lg-6">
                <div class="card-box h-100 d-flex flex-column p-3">
                    <div class="card-head flex-wrap gap-2 mb-3">
                        <div>
                            <h3 class="fw-bold mb-0" style="font-size: 16px;"><i class="bi bi-kanban-fill text-primary me-2"></i> 1-on-1 Mentorship Pipeline</h3>
                            <span class="text-muted small" id="mentorPipelineCount">${liveInterventions.length} Total Sessions</span>
                        </div>
                        <div class="d-flex gap-2 align-items-center flex-wrap">
                            ${role === 'admin' || role === 'faculty' ? `
                                <select id="pipelineMentorFilter" class="form-select form-select-sm" style="width: 140px; font-size: 12px; background: var(--bg-sunken); color: var(--text); border-color: var(--border);" onchange="filterPipelineList()">
                                    <option value="ALL" ${window._mentorPipelineFilter.mentor === 'ALL' ? 'selected' : ''}>All Mentors</option>
                                    ${_availableMentors.map(m => `<option value="${m.id}" ${window._mentorPipelineFilter.mentor === m.id ? 'selected' : ''}>${m.display_name}</option>`).join("")}
                                </select>
                            ` : ''}
                            <select id="pipelineStatusFilter" class="form-select form-select-sm" style="width: 130px; font-size: 12px; background: var(--bg-sunken); color: var(--text); border-color: var(--border);" onchange="filterPipelineList()">
                                <option value="ALL" ${window._mentorPipelineFilter.status === 'ALL' ? 'selected' : ''}>All Status</option>
                                <option value="In Progress" ${window._mentorPipelineFilter.status === 'In Progress' ? 'selected' : ''}>Active / Progress</option>
                                <option value="Completion Requested" ${window._mentorPipelineFilter.status === 'Completion Requested' ? 'selected' : ''}>Review Pending</option>
                                <option value="Revision Needed" ${window._mentorPipelineFilter.status === 'Revision Needed' ? 'selected' : ''}>Revision Needed</option>
                                <option value="Completed" ${window._mentorPipelineFilter.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </div>
                    </div>

                    <div id="mentorPipelineListContainer" class="d-flex flex-column gap-2 flex-grow-1" style="max-height: 540px; overflow-y: auto;">
                    </div>

                    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top flex-wrap gap-2" id="mentorPipelinePagination">
                    </div>
                </div>
            </div>
        </div>

        <!-- MODAL FOR SMART 1-ON-1 INTERVENTION & SESSION BOOKING -->
        <div id="customInterventionModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 560px;">
                <div class="modal-head">
                    <div>
                        <span style="color: var(--accent); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">MENTORSHIP & EARLY INTERVENTION</span>
                        <h2 style="color: var(--text); font-size: 18px; margin-top: 2px;">Schedule 1-on-1 Mentorship Session</h2>
                    </div>
                    <button class="modal-close" onclick="closeCustomInterventionModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="customInterventionForm" class="p-3">
                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">Select Student <span class="text-danger">*</span></label>
                        <select id="intStudentId" class="form-select" required onchange="handleInterventionStudentChange()">
                            ${students.map(s => `<option value="${s.id}" data-dept="${s.course || 'CSE'}" data-year="${s.year || '2nd Year'}">${s.name} (${s.id}) • ${s.course} (${s.year || '2nd Year'}) — ${s.risk}% Risk</option>`).join("")}
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold small d-flex justify-content-between align-items-center" style="color: var(--text);">
                            <span>Assigned Mentor <span class="text-danger">*</span></span>
                            <span id="mentorAutoMatchBadge" class="badge bg-primary-subtle text-primary border border-primary-subtle" style="font-size: 10.5px; font-weight: 500;">
                                Auto-routing enabled
                            </span>
                        </label>
                        
                        ${role === 'mentor' ? `
                            <div class="p-2 rounded d-flex align-items-center justify-content-between border" style="background: var(--bg-sunken); border-color: var(--border) !important;">
                                <div class="d-flex align-items-center gap-2">
                                    <div class="faculty-avatar-sm" style="background: #7c3aed; width: 32px; height: 32px; font-size: 12px;">ME</div>
                                    <div>
                                        <strong style="color: var(--text); font-size: 13px;">${user?.display_name || user?.id} (You)</strong>
                                        <div class="text-muted" style="font-size: 11px;">Designated ${user?.assigned_year || '2nd Year'} ${user?.department || 'CSE'} Mentor</div>
                                    </div>
                                </div>
                                <input type="hidden" id="intMentorId" value="${user?.id}">
                                <span class="badge bg-success">Direct Assignment</span>
                            </div>
                        ` : `
                            <select id="intMentorId" class="form-select" required>
                                <option value="auto">✨ Auto-Assign by Student Department & Cohort</option>
                                ${_availableMentors.map(m => `
                                    <option value="${m.id}" data-dept="${m.department || 'CSE'}" data-year="${m.assigned_year || '2nd Year'}">
                                        ${m.role === 'mentor' ? '⭐ ' : ''}${m.display_name} (${m.id}) • ${m.department} ${m.assigned_year} ${m.role === 'mentor' ? 'Mentor' : 'Faculty'}
                                    </option>
                                `).join("")}
                                ${role === 'faculty' ? `<option value="${user?.id}">👤 Assign to Myself (${user?.display_name || user?.id})</option>` : ''}
                            </select>
                            <small class="text-muted" style="font-size: 11px;">Select a designated mentor or choose auto-assignment based on student's year & department.</small>
                        `}
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small" style="color: var(--text);">Session Type</label>
                            <select id="intActionType" class="form-select">
                                <option value="1-on-1 Academic Counseling">1-on-1 Academic Counseling</option>
                                <option value="Attendance Recovery Review">Attendance Recovery Review</option>
                                <option value="Subject Remedial Tutoring">Subject Remedial Tutoring</option>
                                <option value="Exam & Internal Assessment Prep">Exam & Assessment Prep</option>
                                <option value="Career & Placement Guidance">Career & Placement Guidance</option>
                                <option value="Parent-Mentor Conference">Parent-Mentor Conference</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-semibold small" style="color: var(--text);">Subject Focus</label>
                            <select id="intSubjectCode" class="form-select">
                                <option value="General">General / All Subjects</option>
                                <option value="CS201">DBMS (CS201)</option>
                                <option value="CS202">OS (CS202)</option>
                                <option value="MA201">Discrete Mathematics (MA201)</option>
                                <option value="CS203">Computer Networks (CS203)</option>
                                <option value="CS204">Software Engineering (CS204)</option>
                            </select>
                        </div>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-md-4">
                            <label class="form-label fw-semibold small" style="color: var(--text);">Session Date</label>
                            <input type="date" id="intSessionDate" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-semibold small" style="color: var(--text);">Time</label>
                            <select id="intSessionTime" class="form-select">
                                <option value="09:30 AM">09:30 AM</option>
                                <option value="10:30 AM" selected>10:30 AM</option>
                                <option value="11:45 AM">11:45 AM</option>
                                <option value="02:00 PM">02:00 PM</option>
                                <option value="03:30 PM">03:30 PM</option>
                                <option value="04:45 PM">04:45 PM</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label fw-semibold small" style="color: var(--text);">Urgency</label>
                            <select id="intUrgency" class="form-select">
                                <option value="Critical">🔴 Critical (Immediate)</option>
                                <option value="Moderate" selected>🟡 Moderate (Within 3 Days)</option>
                                <option value="Low">🟢 Routine Follow-up</option>
                            </select>
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">Venue / Cabin / Meeting Link</label>
                        <input type="text" id="intSessionLocation" class="form-control" value="Mentorship Cabin 204, CSE Block" placeholder="e.g. Cabin 204 or Google Meet Link">
                    </div>

                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">Intervention Strategy & Notes</label>
                        <textarea id="intNotes" class="form-control" rows="2" placeholder="e.g. Conduct root-cause discussion on attendance slump and assign peer review modules."></textarea>
                    </div>

                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeCustomInterventionModal()">Cancel</button>
                        <button type="submit" class="primary-btn"><i class="bi bi-calendar-check me-1"></i> Confirm & Book Session</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL FOR MENTOR TO REQUEST COMPLETION REVIEW -->
        <div id="requestCompletionModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span style="color: var(--accent); font-weight: 600; font-size: 11px;">SESSION VERIFICATION & APPROVAL</span>
                        <h2 style="color: var(--text); font-size: 17px; margin-top: 2px;">Submit for Completion Review</h2>
                    </div>
                    <button class="modal-close" onclick="closeRequestCompletionModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="requestCompletionForm" class="p-3" onsubmit="handleRequestCompletionSubmit(event)">
                    <input type="hidden" id="reqCompInterventionId" value="">
                    <div class="p-2 mb-3 rounded" style="background: var(--bg-sunken); font-size: 12.5px; border: 1px solid var(--border);">
                        <div id="reqCompStudentInfo" class="fw-bold text-primary mb-1">Student: Arjun Patel (25CS005)</div>
                        <div id="reqCompActionInfo" class="text-muted">Action: 1-on-1 Academic Counseling</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">
                            Outcome Summary & Student Progress Notes <span class="text-danger">*</span>
                        </label>
                        <textarea id="reqCompNotes" class="form-control" rows="3" placeholder="Describe the outcome of the session, student engagement, commitments made, and post-session progress..." required></textarea>
                        <div class="form-text small">This report will be sent to the initiator (Admin / Faculty) for verification and closure.</div>
                    </div>
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeRequestCompletionModal()">Cancel</button>
                        <button type="submit" class="primary-btn" id="reqCompSubmitBtn">
                            <i class="bi bi-send-check me-1"></i> Submit Review Request
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- MODAL FOR ADMIN/FACULTY TO REJECT COMPLETION WITH REASON -->
        <div id="rejectCompletionModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span style="color: var(--danger); font-weight: 600; font-size: 11px;">REVIEW VERIFICATION FEEDBACK</span>
                        <h2 style="color: var(--text); font-size: 17px; margin-top: 2px;">Return Session for Revision</h2>
                    </div>
                    <button class="modal-close" onclick="closeRejectCompletionModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="rejectCompletionForm" class="p-3" onsubmit="handleRejectCompletionSubmit(event)">
                    <input type="hidden" id="rejCompInterventionId" value="">
                    <div class="p-2 mb-3 rounded border border-danger-subtle bg-danger-subtle text-danger" style="font-size: 12.5px;">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                        <span id="rejCompSessionInfo">Session requires additional verification before closing.</span>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">
                            Reason for Rejection / Revision Instructions <span class="text-danger">*</span>
                        </label>
                        <textarea id="rejCompReason" class="form-control" rows="3" placeholder="Specify why the completion was not approved (e.g. Student attendance did not improve in week 4, or remedial quiz marks missing)..." required></textarea>
                        <div class="form-text small text-danger">A clear description is mandatory so the mentor understands what actions are needed.</div>
                    </div>
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeRejectCompletionModal()">Cancel</button>
                        <button type="submit" class="btn btn-danger" id="rejCompSubmitBtn">
                            <i class="bi bi-x-circle me-1"></i> Confirm Rejection & Send Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Render initial lists
    renderMentorPriorityList();
    renderMentorPipelineList();

    // Initial student change trigger for auto-matching
    handleInterventionStudentChange();

    // Bind session booking form submission
    const form = document.getElementById("customInterventionForm");
    if (form) {
        form.addEventListener("submit", async function(e) {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Booking Session...';
            }

            const studentId = document.getElementById("intStudentId").value;
            let mentorId = document.getElementById("intMentorId")?.value;
            if (!mentorId || mentorId === "auto") {
                mentorId = "auto";
            }

            const payload = {
                student_id: studentId,
                action: document.getElementById("intActionType").value,
                subject_code: document.getElementById("intSubjectCode").value,
                urgency: document.getElementById("intUrgency").value,
                date: document.getElementById("intSessionDate").value,
                session_time: document.getElementById("intSessionTime").value,
                location: document.getElementById("intSessionLocation").value.trim(),
                status: "In Progress",
                notes: document.getElementById("intNotes").value.trim(),
                mentor_id: mentorId,
                created_by: user?.id || null
            };

            const res = await API.createIntervention(payload);

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-calendar-check me-1"></i> Confirm & Book Session';
            }

            if (res && res.success) {
                closeCustomInterventionModal();
                showSuccessToast(res.message || "1-on-1 Mentorship session booked successfully!");
                await renderMentor();
            } else {
                showErrorToast(res?.message || "Failed to schedule session.");
            }
        });
    }
}

function handleInterventionStudentChange() {
    const studentSelect = document.getElementById("intStudentId");
    const mentorSelect = document.getElementById("intMentorId");
    const badge = document.getElementById("mentorAutoMatchBadge");
    if (!studentSelect || !mentorSelect || mentorSelect.type === "hidden") return;

    const selectedOption = studentSelect.options[studentSelect.selectedIndex];
    if (!selectedOption) return;

    const dept = (selectedOption.getAttribute("data-dept") || "CSE").toLowerCase();
    const year = (selectedOption.getAttribute("data-year") || "2nd Year").toLowerCase();

    // Find recommended mentor
    const matchedMentor = _availableMentors.find(m => {
        const mDept = (m.department || "CSE").toLowerCase();
        const mYear = (m.assigned_year || "2nd Year").toLowerCase();
        return (mDept === dept || mDept === "all") && (mYear === year || mYear === "all years");
    });

    if (matchedMentor) {
        if (mentorSelect.value === "auto" || !mentorSelect.value) {
            mentorSelect.value = matchedMentor.id;
        }
        if (badge) {
            badge.innerHTML = `⭐ Recommended: ${matchedMentor.display_name} (${matchedMentor.department} ${matchedMentor.assigned_year})`;
            badge.className = "badge bg-success-subtle text-success border border-success-subtle";
        }
    } else {
        if (badge) {
            badge.innerHTML = "Auto-routing enabled";
            badge.className = "badge bg-primary-subtle text-primary border border-primary-subtle";
        }
    }
}
window.handleInterventionStudentChange = handleInterventionStudentChange;

function filterPipelineList() {
    const mentorFilter = document.getElementById("pipelineMentorFilter")?.value || "ALL";
    const statusFilter = document.getElementById("pipelineStatusFilter")?.value || "ALL";
    window._mentorPipelineFilter.mentor = mentorFilter;
    window._mentorPipelineFilter.status = statusFilter;
    window._mentorPipelineFilter.page = 1;
    renderMentorPipelineList();
}
window.filterPipelineList = filterPipelineList;

window._mentorPriorityState = window._mentorPriorityState || { page: 1, pageSize: 6, search: "" };

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
    if (!window._mentorPipelineFilter) window._mentorPipelineFilter = { mentor: "ALL", status: "ALL", page: 1, pageSize: 6 };
    window._mentorPipelineFilter.page = newPage;
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
        let badgeClass = s.risk >= 65 ? "high" : "medium";
        return `
            <div class="p-3 rounded-3 mentor-student-card" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 class="fw-bold mb-0" style="color: var(--text); font-size: 14.5px;">${s.name}</h5>
                        <span class="small" style="color: var(--text-muted); font-size: 12px;">ID: <code>${s.id}</code> • ${s.course} (${s.year || '2nd Year'})</span>
                    </div>
                    <span class="risk-badge ${badgeClass}">${s.risk}% Risk</span>
                </div>
                <div class="small mb-3 d-flex gap-3" style="color: var(--text-soft); font-size: 12px;">
                    <span><i class="bi bi-clock me-1 text-primary"></i> Attd: <strong>${s.attendance}%</strong></span>
                    <span><i class="bi bi-award me-1 text-success"></i> CGPA: <strong>${s.cgpa}</strong></span>
                    <span><i class="bi bi-cpu me-1 text-info"></i> LMS: <strong>${s.lms_score || s.attendance}%</strong></span>
                </div>
                <div class="d-flex gap-2">
                    <button class="primary-btn btn-sm w-50 py-1" onclick="openCustomInterventionModal('${s.id}')">
                        <i class="bi bi-calendar-plus me-1"></i> Book 1-on-1
                    </button>
                    <button class="secondary-btn btn-sm w-50 py-1" onclick="viewStudent360('${s.id}')">
                        <i class="bi bi-person-vcard me-1"></i> 360° Profile
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
                <span class="small px-2 my-auto fw-semibold" style="color: var(--text);">${currentPage} / ${totalPages}</span>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleMentorPriorityPage(${currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;
    }
}

function renderMentorPipelineList() {
    const container = document.getElementById("mentorPipelineListContainer");
    const pagContainer = document.getElementById("mentorPipelinePagination");
    const countBadge = document.getElementById("mentorPipelineCount");
    if (!container) return;

    const rawList = window._cachedLiveInterventions || [];
    const { mentor, status, page, pageSize } = window._mentorPipelineFilter || { mentor: "ALL", status: "ALL", page: 1, pageSize: 6 };

    // Apply filtering
    const list = rawList.filter(i => {
        const matchesMentor = mentor === "ALL" || (i.mentor_id && i.mentor_id.toLowerCase() === mentor.toLowerCase());
        
        let matchesStatus = true;
        if (status === "In Progress" || status === "Active") {
            matchesStatus = (i.status === "In Progress" || i.status === "Pending" || i.status === "Scheduled");
        } else if (status === "Completion Requested") {
            matchesStatus = (i.status === "Completion Requested");
        } else if (status === "Revision Needed") {
            matchesStatus = (i.status === "Revision Needed");
        } else if (status === "Completed") {
            matchesStatus = (i.status === "Completed");
        } else if (status !== "ALL") {
            matchesStatus = (i.status === status);
        }
        return matchesMentor && matchesStatus;
    });

    if (countBadge) {
        countBadge.textContent = `${list.length} Sessions ${list.length !== rawList.length ? `(filtered from ${rawList.length})` : ''}`;
    }

    if (list.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-calendar-plus fs-1 d-block mb-3 text-muted"></i>
                <h6 class="fw-bold" style="color: var(--text);">No Matching Sessions</h6>
                <p class="text-muted small mb-3">No mentorship sessions match current filters (${status} • ${mentor === 'ALL' ? 'All Mentors' : mentor}).</p>
                <button class="secondary-btn btn-sm" onclick="resetPipelineFilters()">
                    <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
                </button>
            </div>
        `;
        if (pagContainer) pagContainer.innerHTML = "";
        return;
    }

    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    window._mentorPipelineFilter.page = currentPage;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, list.length);
    const items = list.slice(start, end);

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    container.innerHTML = items.map(i => {
        const isCompleted = i.status === 'Completed';
        const isCompletionRequested = i.status === 'Completion Requested';
        const isRevisionNeeded = i.status === 'Revision Needed';
        
        let statusClass = 'bg-primary text-white';
        if (isCompleted) statusClass = 'bg-success text-white';
        else if (isCompletionRequested) statusClass = 'bg-warning text-dark';
        else if (isRevisionNeeded) statusClass = 'bg-danger text-white';

        const studentName = i.student_name || students.find(s => s.id === i.student_id)?.name || i.student_id;
        const urgencyBadge = i.urgency === 'Critical' 
            ? `<span class="badge bg-danger">Critical</span>` 
            : (i.urgency === 'Moderate' ? `<span class="badge bg-warning text-dark">Moderate</span>` : `<span class="badge bg-info text-dark">Routine</span>`);

        const isInitiator = !i.created_by || i.created_by.toLowerCase() === (user?.id || "").toLowerCase();

        return `
            <div class="p-3 rounded-3 mentor-pipeline-item" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <strong style="color: var(--text); font-size: 14px;">${i.action}</strong>
                            ${urgencyBadge}
                        </div>
                        <div class="small" style="color: var(--text-soft); font-size: 12px;">
                            Student: <strong>${studentName}</strong> (<code>${i.student_id}</code>)
                            ${i.student_course ? `• ${i.student_course}` : ''}
                            ${i.mentor_name ? `• Mentor: <strong class="text-primary">${i.mentor_name}</strong>` : ''}
                        </div>
                    </div>
                    <span class="badge ${statusClass}" style="font-size: 11px;">
                        ${isCompletionRequested ? '⏳ Review Pending' : (isRevisionNeeded ? '⚠️ Revision Needed' : i.status)}
                    </span>
                </div>

                <div class="d-flex flex-wrap gap-3 small mb-2 p-2 rounded" style="background: var(--bg-elevated); border: 1px solid var(--border-soft); color: var(--text); font-size: 11.5px;">
                    <span><i class="bi bi-clock me-1 text-primary"></i> ${i.session_time || '10:00 AM'}</span>
                    <span><i class="bi bi-geo-alt me-1 text-danger"></i> ${i.location || 'Cabin 204'}</span>
                    ${i.subject_code ? `<span><i class="bi bi-book me-1 text-success"></i> ${i.subject_code}</span>` : ''}
                    ${i.creator_name ? `<span class="text-muted"><i class="bi bi-person-check me-1"></i> Booked by: <strong>${i.creator_name}</strong></span>` : ''}
                </div>

                ${i.notes ? `<p class="small mb-2 p-2 rounded text-muted" style="font-size: 11.5px; background: rgba(0,0,0,0.06);"><i class="bi bi-sticky me-1 text-warning"></i> ${i.notes}</p>` : ''}

                <!-- REVISION REASON NOTICE (IF REJECTED) -->
                ${isRevisionNeeded && i.rejection_reason ? `
                    <div class="p-2 mb-2 rounded bg-danger-subtle text-danger border border-danger-subtle small" style="font-size: 11.5px;">
                        <strong><i class="bi bi-exclamation-octagon-fill me-1"></i> Reviewer Feedback / Reason for Rejection:</strong>
                        <div>${i.rejection_reason}</div>
                    </div>
                ` : ''}

                <!-- COMPLETION REQUEST SUMMARY NOTICE -->
                ${isCompletionRequested && i.completion_request_notes ? `
                    <div class="p-2 mb-2 rounded bg-warning-subtle text-dark border border-warning-subtle small" style="font-size: 11.5px;">
                        <strong><i class="bi bi-hourglass-top me-1"></i> Mentor's Submitted Report:</strong>
                        <div>${i.completion_request_notes}</div>
                    </div>
                ` : ''}

                <div class="d-flex justify-content-between align-items-center mt-2 small" style="color: var(--text-muted); font-size: 11.5px;">
                    <span><i class="bi bi-calendar3 me-1"></i> Date: ${i.date} ${i.completed_date ? `| Completed: ${i.completed_date}` : ''}</span>
                    <div class="d-flex gap-2 align-items-center flex-wrap">
                        <button class="secondary-btn btn-sm py-0 px-2" style="font-size: 11.5px;" onclick="viewStudent360('${i.student_id}')">
                            <i class="bi bi-person-vcard me-1"></i> 360°
                        </button>

                        <!-- ROLE AWARE LIFECYCLE ACTION BUTTONS -->
                        ${isCompleted ? `
                            <span class="text-success fw-semibold"><i class="bi bi-check-circle-fill me-1"></i> Completed</span>
                        ` : (
                            role === 'admin' || role === 'faculty' ? `
                                ${isCompletionRequested ? `
                                    <button class="btn btn-sm btn-success py-1 px-2 d-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="handleApproveCompletion(${i.id})">
                                        <i class="bi bi-check-lg"></i> Approve
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="openRejectCompletionModal(${i.id}, '${(studentName || '').replace(/'/g, "\\'")}', '${(i.action || '').replace(/'/g, "\\'")}')">
                                        <i class="bi bi-x-lg"></i> Reject
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-success py-1 px-3 d-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="markInterventionCompleteDirect(${i.id})">
                                        <i class="bi bi-check2"></i> Mark Complete
                                    </button>
                                `}
                            ` : `
                                <!-- MENTOR VIEW -->
                                ${isCompletionRequested ? `
                                    <span class="badge bg-warning text-dark py-1 px-2"><i class="bi bi-hourglass-split me-1"></i> Review in Progress</span>
                                ` : (
                                    isRevisionNeeded ? `
                                        <button class="btn btn-sm btn-warning py-1 px-2 fw-semibold" style="font-size: 11.5px;" onclick="openRequestCompletionModal(${i.id}, '${(studentName || '').replace(/'/g, "\\'")}', '${(i.action || '').replace(/'/g, "\\'")}')">
                                            <i class="bi bi-arrow-repeat me-1"></i> Re-submit Review
                                        </button>
                                    ` : (
                                        isInitiator ? `
                                            <button class="btn btn-sm btn-success py-1 px-3 d-flex align-items-center gap-1" style="font-size: 11.5px;" onclick="markInterventionCompleteDirect(${i.id})">
                                                <i class="bi bi-check2"></i> Mark Complete
                                            </button>
                                        ` : `
                                            <button class="btn btn-sm btn-outline-primary py-1 px-2 fw-semibold" style="font-size: 11.5px;" onclick="openRequestCompletionModal(${i.id}, '${(studentName || '').replace(/'/g, "\\'")}', '${(i.action || '').replace(/'/g, "\\'")}')">
                                                <i class="bi bi-send-check me-1"></i> Request Completion Review
                                            </button>
                                        `
                                    )
                                )}
                            `
                        )}
                    </div>
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
                <span class="small px-2 my-auto fw-semibold" style="color: var(--text);">${currentPage} / ${totalPages}</span>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleMentorPipelinePage(${currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;
    }
}

function resetPipelineFilters() {
    window._mentorPipelineFilter = { mentor: "ALL", status: "ALL", page: 1, pageSize: 6 };
    const mSelect = document.getElementById("pipelineMentorFilter");
    const sSelect = document.getElementById("pipelineStatusFilter");
    if (mSelect) mSelect.value = "ALL";
    if (sSelect) sSelect.value = "ALL";
    renderMentorPipelineList();
}
window.resetPipelineFilters = resetPipelineFilters;

// =====================================================
// COMPLETION REVIEW WORKFLOW HANDLERS
// =====================================================

function openRequestCompletionModal(interventionId, studentName, action) {
    const modal = document.getElementById("requestCompletionModal");
    if (!modal) return;

    document.getElementById("reqCompInterventionId").value = interventionId;
    document.getElementById("reqCompStudentInfo").textContent = `Student: ${studentName}`;
    document.getElementById("reqCompActionInfo").textContent = `Session: ${action}`;
    document.getElementById("reqCompNotes").value = "";
    modal.classList.add("active");
}
window.openRequestCompletionModal = openRequestCompletionModal;

function closeRequestCompletionModal() {
    document.getElementById("requestCompletionModal")?.classList.remove("active");
}
window.closeRequestCompletionModal = closeRequestCompletionModal;

async function handleRequestCompletionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("reqCompInterventionId").value;
    const notes = document.getElementById("reqCompNotes").value.trim();
    const user = getCurrentUser();
    const btn = document.getElementById("reqCompSubmitBtn");

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Submitting...';
    }

    const res = await API.requestInterventionCompletion(id, {
        mentor_id: user?.id,
        notes: notes
    });

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send-check me-1"></i> Submit Review Request';
    }

    if (res && res.success) {
        closeRequestCompletionModal();
        showSuccessToast(res.message || "Completion review request dispatched to initiator!");
        await renderMentor();
    } else {
        showErrorToast(res?.message || "Failed to submit review request.");
    }
}
window.handleRequestCompletionSubmit = handleRequestCompletionSubmit;

async function handleApproveCompletion(interventionId) {
    const user = getCurrentUser();
    const ok = await showConfirmModal({
        title: "Approve Session Completion",
        message: "Verify and approve this mentorship session as completed? The session will be closed.",
        confirmText: "Approve & Complete",
        confirmBtnClass: "btn btn-success",
        icon: "bi-check-circle-fill text-success"
    });
    if (!ok) return;

    const res = await API.approveInterventionCompletion(interventionId, {
        reviewer_id: user?.id
    });

    if (res && res.success) {
        showSuccessToast("Mentorship session verified and marked as Completed!");
        await renderMentor();
    } else {
        showErrorToast(res?.message || "Failed to approve completion.");
    }
}
window.handleApproveCompletion = handleApproveCompletion;

function openRejectCompletionModal(interventionId, studentName, action) {
    const modal = document.getElementById("rejectCompletionModal");
    if (!modal) return;

    document.getElementById("rejCompInterventionId").value = interventionId;
    document.getElementById("rejCompSessionInfo").textContent = `Reviewing: ${action} for ${studentName}`;
    document.getElementById("rejCompReason").value = "";
    modal.classList.add("active");
}
window.openRejectCompletionModal = openRejectCompletionModal;

function closeRejectCompletionModal() {
    document.getElementById("rejectCompletionModal")?.classList.remove("active");
}
window.closeRejectCompletionModal = closeRejectCompletionModal;

async function handleRejectCompletionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("rejCompInterventionId").value;
    const reason = document.getElementById("rejCompReason").value.trim();
    const user = getCurrentUser();
    const btn = document.getElementById("rejCompSubmitBtn");

    if (!reason) {
        showErrorToast("Please specify a description/reason for rejection.");
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Returning...';
    }

    const res = await API.rejectInterventionCompletion(id, {
        reviewer_id: user?.id,
        reason: reason
    });

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-x-circle me-1"></i> Confirm Rejection & Send Feedback';
    }

    if (res && res.success) {
        closeRejectCompletionModal();
        showSuccessToast("Completion request returned for revision with feedback.");
        await renderMentor();
    } else {
        showErrorToast(res?.message || "Failed to reject completion request.");
    }
}
window.handleRejectCompletionSubmit = handleRejectCompletionSubmit;

async function markInterventionCompleteDirect(interventionId) {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();

    const ok = await showConfirmModal({
        title: "Complete Intervention Session",
        message: "Mark this mentorship session as successfully completed and resolved?",
        confirmText: "Mark Completed",
        confirmBtnClass: "btn btn-success",
        icon: "bi-check-circle-fill text-success"
    });
    if (!ok) return;

    const res = await API.updateIntervention(interventionId, {
        status: "Completed",
        caller_role: role,
        user_id: user?.id
    });

    if (res && res.success) {
        showSuccessToast("Intervention marked as Completed!");
        await renderMentor();
    } else {
        showErrorToast(res?.message || "Could not complete session.");
    }
}
window.markInterventionCompleteDirect = markInterventionCompleteDirect;

async function quickCreateIntervention(studentId, action, subject, urgency) {
    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const res = await API.createIntervention({
        student_id: studentId,
        action: action || "1-on-1 Academic Counseling",
        subject_code: subject || "General",
        urgency: urgency || "Moderate",
        status: "In Progress",
        notes: `Initiated via Quick Action Panel by ${user?.display_name || user?.id}`,
        mentor_id: role === "mentor" ? user.id : "auto",
        created_by: user?.id || null
    });
    if (res && res.success) {
        showSuccessToast(res.message || `1-on-1 Session booked for student ${studentId}!`);
        if (typeof currentActivePage !== "undefined") {
            if (currentActivePage === "mentor") renderMentor();
            else if (currentActivePage === "student360") renderStudent360();
            else if (currentActivePage === "anomalies") renderAnomalies();
            else if (currentActivePage === "dashboard") renderDashboard();
        }
    }
}
window.quickCreateIntervention = quickCreateIntervention;

function openCustomInterventionModal(preselectedStudentId) {
    const modal = document.getElementById("customInterventionModal");
    if (modal) {
        modal.classList.add("active");
        if (preselectedStudentId) {
            const select = document.getElementById("intStudentId");
            if (select) {
                select.value = preselectedStudentId;
                handleInterventionStudentChange();
            }
        }
    }
}
window.openCustomInterventionModal = openCustomInterventionModal;

function closeCustomInterventionModal() {
    document.getElementById("customInterventionModal")?.classList.remove("active");
}
window.closeCustomInterventionModal = closeCustomInterventionModal;

// Window Exports
window.renderMentor = renderMentor;
window.renderMentorPriorityList = renderMentorPriorityList;
window.renderMentorPipelineList = renderMentorPipelineList;
