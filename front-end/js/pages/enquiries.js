/* =====================================================
   ENQUIRIES.JS
   Executive Mentorship Completion Review & Enquiry Center
   Handles Persistent Tracking of Session Completion Requests,
   Role-Aware Verification, Mandatory Rejection Feedback & Real-Time Sync
===================================================== */

window._enquiriesState = window._enquiriesState || {
    tab: "ALL", // "ALL", "PENDING", "REVISION", "COMPLETED"
    search: "",
    page: 1,
    pageSize: 8
};
window._cachedEnquiriesData = [];

async function renderEnquiries() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const studentId = user?.linked_student_id || user?.id;
    const userId = role === "student" ? studentId : user?.id;

    // Fetch live enquiries from backend
    let rawEnquiries = [];
    try {
        rawEnquiries = await API.getInterventionEnquiries(role, userId) || [];
    } catch (e) {
        console.error("Failed to load enquiries:", e);
        rawEnquiries = [];
    }
    window._cachedEnquiriesData = rawEnquiries;

    const pendingCount = rawEnquiries.filter(e => e.status === 'Completion Requested').length;
    const revisionCount = rawEnquiries.filter(e => e.status === 'Revision Needed').length;
    const completedCount = rawEnquiries.filter(e => e.status === 'Completed').length;
    const activeCount = rawEnquiries.filter(e => ['In Progress', 'Pending', 'Active'].includes(e.status)).length;

    // Update navigation badge
    if (role !== "student") {
        refreshEnquiriesBadge(pendingCount);
    }

    let pageTitle = `Faculty Mentorship Enquiries & Reviews`;
    let pageSubtitle = `Review and verify session completion reports submitted by mentors before marking cases as resolved`;

    if (role === 'mentor') {
        pageTitle = `My Mentorship Enquiries & Verification Queue`;
        pageSubtitle = `Track your submitted session completion reports, monitor initiator verification, and review revision feedback`;
    } else if (role === 'admin') {
        pageTitle = `Institutional Mentorship Enquiries & Review Center`;
        pageSubtitle = `Institutional oversight of all faculty and mentor 1-on-1 sessions, review queues, and closure audit trails`;
    } else if (role === 'student') {
        pageTitle = `My Mentorship Sessions & Academic Guidance`;
        pageSubtitle = `Track your scheduled 1-on-1 counseling sessions, mentor notes, and resolution progress`;
    }

    content.innerHTML = `
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1" style="color: var(--text);">
                    <i class="bi bi-patch-check-fill me-2" style="color: var(--accent);"></i>${pageTitle}
                </h1>
                <p class="text-muted small mb-0">${pageSubtitle}</p>
            </div>
            <div class="d-flex gap-2">
                <button class="secondary-btn" onclick="renderEnquiries()">
                    <i class="bi bi-arrow-clockwise me-1"></i> Refresh Queue
                </button>
                ${role === 'student' ? `
                    <button class="primary-btn" onclick="navigateTo('student360')">
                        <i class="bi bi-person-vcard me-1"></i> View My 360° Profile
                    </button>
                ` : (role === 'mentor' ? `
                    <button class="primary-btn" onclick="navigateTo('mentor')">
                        <i class="bi bi-calendar-plus me-1"></i> Go to Mentorship Pipeline
                    </button>
                ` : `
                    <button class="primary-btn" onclick="openCustomInterventionModal()">
                        <i class="bi bi-calendar-plus me-1"></i> Book 1-on-1 Session
                    </button>
                `)}
            </div>
        </div>

        <!-- 1. SUMMARY STAT TILES -->
        <div class="row g-3 mb-4">
            ${role === 'student' ? `
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-primary">
                        <span class="text-muted small d-block mb-1">ACTIVE / SCHEDULED</span>
                        <h3 class="fw-bold mb-0 text-primary">${activeCount}</h3>
                        <small class="text-muted">In-progress sessions</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-warning">
                        <span class="text-muted small d-block mb-1">UNDER REVIEW</span>
                        <h3 class="fw-bold mb-0 text-warning">${pendingCount + revisionCount}</h3>
                        <small class="text-muted">Completion review</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-success">
                        <span class="text-muted small d-block mb-1">VERIFIED & COMPLETED</span>
                        <h3 class="fw-bold mb-0 text-success">${completedCount}</h3>
                        <small class="text-muted">Successfully closed</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-secondary">
                        <span class="text-muted small d-block mb-1">TOTAL SESSIONS</span>
                        <h3 class="fw-bold mb-0 text-dark">${rawEnquiries.length}</h3>
                        <small class="text-muted">All mentoring records</small>
                    </div>
                </div>
            ` : `
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-warning">
                        <span class="text-muted small d-block mb-1">AWAITING APPROVAL</span>
                        <h3 class="fw-bold mb-0 text-warning">${pendingCount}</h3>
                        <small class="text-muted">${role === 'mentor' ? 'Under Review' : 'Action Required'}</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-danger">
                        <span class="text-muted small d-block mb-1">REVISIONS REQUESTED</span>
                        <h3 class="fw-bold mb-0 text-danger">${revisionCount}</h3>
                        <small class="text-muted">Feedback provided</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-success">
                        <span class="text-muted small d-block mb-1">VERIFIED & COMPLETED</span>
                        <h3 class="fw-bold mb-0 text-success">${completedCount}</h3>
                        <small class="text-muted">Successfully closed</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card-box p-3 border-start border-4 border-primary">
                        <span class="text-muted small d-block mb-1">TOTAL ENQUIRIES</span>
                        <h3 class="fw-bold mb-0 text-primary">${rawEnquiries.length}</h3>
                        <small class="text-muted">All tracked records</small>
                    </div>
                </div>
            `}
        </div>

        <!-- 2. TOOLBAR: SEARCH & FILTER TABS -->
        <div class="card-box p-3 mb-4">
            <div class="row g-3 align-items-center">
                <div class="col-md-6 col-lg-5">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search text-primary"></i></span>
                        <input type="text" id="enquirySearchInput" class="form-control" placeholder="${role === 'student' ? 'Search by mentor, action, subject or notes...' : 'Search by student name, ID, mentor, or action...'}" value="${window._enquiriesState.search}" oninput="handleEnquirySearch(this.value)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        ${window._enquiriesState.search ? `<button class="btn btn-outline-secondary" type="button" onclick="handleEnquirySearch('')"><i class="bi bi-x"></i></button>` : ''}
                    </div>
                </div>
                <div class="col-md-6 col-lg-7 text-md-end">
                    <span class="small text-muted me-2">Persistent Verification Storage:</span>
                    <span class="badge bg-success-subtle text-success border border-success-subtle"><i class="bi bi-database-check me-1"></i> Audit-Preserved</span>
                </div>
            </div>

            <!-- TABS -->
            <div class="d-flex flex-wrap gap-2 mt-3 pt-3 border-top" style="border-color: var(--border-soft) !important;">
                <button class="anomaly-filter-pill ${window._enquiriesState.tab === 'ALL' ? 'active' : ''}" onclick="setEnquiryTab('ALL')">
                    ${role === 'student' ? 'All Sessions' : 'All Enquiries'} <span class="pill-count">${rawEnquiries.length}</span>
                </button>
                <button class="anomaly-filter-pill ${window._enquiriesState.tab === 'PENDING' ? 'active' : ''}" onclick="setEnquiryTab('PENDING')">
                    <i class="bi bi-hourglass-split text-warning"></i> ${role === 'student' ? 'Active / In Progress' : 'Awaiting Approval'} <span class="pill-count">${role === 'student' ? (activeCount + pendingCount) : pendingCount}</span>
                </button>
                ${role !== 'student' ? `
                    <button class="anomaly-filter-pill ${window._enquiriesState.tab === 'REVISION' ? 'active' : ''}" onclick="setEnquiryTab('REVISION')">
                        <i class="bi bi-exclamation-octagon text-danger"></i> Revisions Requested <span class="pill-count">${revisionCount}</span>
                    </button>
                ` : ''}
                <button class="anomaly-filter-pill ${window._enquiriesState.tab === 'COMPLETED' ? 'active' : ''}" onclick="setEnquiryTab('COMPLETED')">
                    <i class="bi bi-check-circle-fill text-success"></i> Completed <span class="pill-count">${completedCount}</span>
                </button>
            </div>
        </div>

        <!-- 3. ENQUIRIES LIST CONTAINER -->
        <div id="enquiriesListContainer" class="d-flex flex-column gap-3">
            <!-- Rendered by JS -->
        </div>

        <!-- 4. PAGINATION -->
        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top flex-wrap gap-2" id="enquiriesPaginationContainer" style="border-color: var(--border-soft) !important;">
        </div>

        <!-- REJECT WITH REASON MODAL -->
        <div id="enquiryRejectModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span style="color: var(--danger); font-weight: 600; font-size: 11px;">REVISION FEEDBACK</span>
                        <h2 style="color: var(--text); font-size: 17px; margin-top: 2px;">Reject Completion Request</h2>
                    </div>
                    <button class="modal-close" onclick="closeEnquiryRejectModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="enquiryRejectForm" class="p-3" onsubmit="handleEnquiryRejectSubmit(event)">
                    <input type="hidden" id="enqRejId" value="">
                    <div class="p-2 mb-3 rounded border border-danger-subtle bg-danger-subtle text-danger" style="font-size: 12.5px;">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i>
                        <span id="enqRejSessionSummary">Please provide clear instructions on why this session cannot be approved.</span>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">
                            Reason for Rejection / Revision Instructions <span class="text-danger">*</span>
                        </label>
                        <textarea id="enqRejReason" class="form-control" rows="3" placeholder="Specify why the completion was not approved (e.g. Student attendance did not improve in week 4, or remedial quiz marks missing)..." required></textarea>
                        <div class="form-text small text-danger">A description is required so the mentor can address this issue.</div>
                    </div>
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeEnquiryRejectModal()">Cancel</button>
                        <button type="submit" class="btn btn-danger" id="enqRejSubmitBtn">
                            <i class="bi bi-x-circle me-1"></i> Confirm Rejection & Send Feedback
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- RESUBMIT REVIEW MODAL FOR MENTORS -->
        <div id="enquiryResubmitModal" class="modal-overlay">
            <div class="student-modal" style="max-width: 520px;">
                <div class="modal-head">
                    <div>
                        <span style="color: var(--accent); font-weight: 600; font-size: 11px;">RE-SUBMIT FOR APPROVAL</span>
                        <h2 style="color: var(--text); font-size: 17px; margin-top: 2px;">Update & Re-Submit Completion Review</h2>
                    </div>
                    <button class="modal-close" onclick="closeEnquiryResubmitModal()"><i class="bi bi-x"></i></button>
                </div>
                <form id="enquiryResubmitForm" class="p-3" onsubmit="handleEnquiryResubmitSubmit(event)">
                    <input type="hidden" id="enqResubId" value="">
                    <div class="p-2 mb-3 rounded" style="background: var(--bg-sunken); font-size: 12.5px; border: 1px solid var(--border);">
                        <div id="enqResubTitle" class="fw-bold text-primary mb-1">Session Update</div>
                        <div id="enqResubPrevFeedback" class="text-danger small"></div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small" style="color: var(--text);">
                            Updated Outcome Summary & Verification Notes <span class="text-danger">*</span>
                        </label>
                        <textarea id="enqResubNotes" class="form-control" rows="3" placeholder="Detail how the reviewer's feedback was resolved (e.g. Conducted follow-up quiz, verified week 4 attendance)..." required></textarea>
                    </div>
                    <div class="d-flex justify-content-end gap-2 pt-2 border-top">
                        <button type="button" class="secondary-btn" onclick="closeEnquiryResubmitModal()">Cancel</button>
                        <button type="submit" class="primary-btn" id="enqResubSubmitBtn">
                            <i class="bi bi-send-check me-1"></i> Re-Submit for Verification
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    renderFilteredEnquiries();
}

function setEnquiryTab(tab) {
    window._enquiriesState.tab = tab;
    window._enquiriesState.page = 1;
    document.querySelectorAll(".anomaly-filter-pill").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${tab}'`)) {
            btn.classList.add("active");
        }
    });
    renderFilteredEnquiries();
}
window.setEnquiryTab = setEnquiryTab;

function handleEnquirySearch(val) {
    window._enquiriesState.search = (val || "").trim().toLowerCase();
    window._enquiriesState.page = 1;
    renderFilteredEnquiries();
}
window.handleEnquirySearch = handleEnquirySearch;

function handleEnquiryPageChange(p) {
    window._enquiriesState.page = p;
    renderFilteredEnquiries();
    const container = document.getElementById("enquiriesListContainer");
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.handleEnquiryPageChange = handleEnquiryPageChange;

function renderFilteredEnquiries() {
    const container = document.getElementById("enquiriesListContainer");
    const pagContainer = document.getElementById("enquiriesPaginationContainer");
    if (!container) return;

    const user = getCurrentUser();
    const role = (user?.role || "faculty").toLowerCase();
    const { tab, search, page, pageSize } = window._enquiriesState;

    let list = [...(window._cachedEnquiriesData || [])];

    // Filter by Tab
    if (role === "student") {
        if (tab === "PENDING") {
            list = list.filter(e => ['In Progress', 'Pending', 'Active', 'Completion Requested', 'Revision Needed'].includes(e.status));
        } else if (tab === "COMPLETED") {
            list = list.filter(e => e.status === "Completed");
        }
    } else {
        if (tab === "PENDING") {
            list = list.filter(e => e.status === "Completion Requested");
        } else if (tab === "REVISION") {
            list = list.filter(e => e.status === "Revision Needed");
        } else if (tab === "COMPLETED") {
            list = list.filter(e => e.status === "Completed");
        }
    }

    // Filter by Search
    if (search) {
        list = list.filter(e =>
            (e.student_name || "").toLowerCase().includes(search) ||
            (e.student_id || "").toLowerCase().includes(search) ||
            (e.mentor_name || "").toLowerCase().includes(search) ||
            (e.action || "").toLowerCase().includes(search) ||
            (e.notes || "").toLowerCase().includes(search) ||
            (e.subject_code || "").toLowerCase().includes(search) ||
            (e.completion_request_notes || "").toLowerCase().includes(search) ||
            (e.rejection_reason || "").toLowerCase().includes(search)
        );
    }

    if (list.length === 0) {
        container.innerHTML = `
            <div class="card-box p-5 text-center text-muted">
                <i class="bi bi-inbox fs-1 d-block mb-3 text-secondary"></i>
                <h5 class="fw-semibold" style="color: var(--text);">${role === 'student' ? 'No Mentorship Sessions Found' : 'No Enquiries in this View'}</h5>
                <p class="small text-muted mb-0">${role === 'student' ? 'You have no mentoring sessions matching this filter.' : 'No mentorship session completion enquiries match the current filter or search criteria.'}</p>
            </div>
        `;
        if (pagContainer) pagContainer.innerHTML = "";
        return;
    }

    const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    window._enquiriesState.page = currentPage;

    const start = (currentPage - 1) * pageSize;
    const end = Math.min(start + pageSize, list.length);
    const pageItems = list.slice(start, end);

    container.innerHTML = pageItems.map(eq => {
        const isPending = eq.status === 'Completion Requested';
        const isRevision = eq.status === 'Revision Needed';
        const isCompleted = eq.status === 'Completed';
        const isActive = ['In Progress', 'Pending', 'Active'].includes(eq.status);

        let badgeClass = 'bg-warning text-dark';
        let badgeIcon = 'bi-hourglass-split';
        let badgeText = 'Awaiting Review';

        if (role === 'student') {
            if (isCompleted) {
                badgeClass = 'bg-success text-white';
                badgeIcon = 'bi-check-circle-fill';
                badgeText = 'Verified & Completed';
            } else if (isPending) {
                badgeClass = 'bg-info text-white';
                badgeIcon = 'bi-clock-history';
                badgeText = 'Review in Progress';
            } else if (isRevision) {
                badgeClass = 'bg-warning text-dark';
                badgeIcon = 'bi-arrow-repeat';
                badgeText = 'Follow-up Active';
            } else {
                badgeClass = 'bg-primary text-white';
                badgeIcon = 'bi-calendar-check';
                badgeText = 'Scheduled / Active';
            }
        } else {
            if (isRevision) {
                badgeClass = 'bg-danger text-white';
                badgeIcon = 'bi-exclamation-octagon-fill';
                badgeText = 'Revision Requested';
            } else if (isCompleted) {
                badgeClass = 'bg-success text-white';
                badgeIcon = 'bi-check-circle-fill';
                badgeText = 'Verified & Completed';
            }
        }

        const studentRiskClass = eq.student_risk >= 65 ? 'high' : (eq.student_risk >= 30 ? 'medium' : 'low');

        return `
            <div class="card-box p-3 enquiry-card" style="border-left: 4px solid ${isCompleted ? 'var(--success)' : (isRevision ? 'var(--risk-high)' : (isPending ? 'var(--warning)' : 'var(--primary)'))};">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                    <div>
                        <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                            <strong style="font-size: 15px; color: var(--text);">${eq.action}</strong>
                            <span class="badge ${badgeClass} d-inline-flex align-items-center gap-1" style="font-size: 11px;">
                                <i class="bi ${badgeIcon}"></i> ${badgeText}
                            </span>
                            ${eq.urgency ? `<span class="badge bg-secondary" style="font-size: 10px;">${eq.urgency}</span>` : ''}
                        </div>
                        <div class="small text-muted d-flex align-items-center gap-2 flex-wrap" style="font-size: 12px;">
                            ${role === 'student' ? `
                                <span>Assigned Mentor: <strong class="text-primary">${eq.mentor_name || 'Academic Mentor'}</strong></span>
                                ${eq.creator_name ? `<span>• Scheduled by: <strong>${eq.creator_name}</strong></span>` : ''}
                            ` : `
                                <span>Student: <strong class="text-dark">${eq.student_name}</strong> (<code>${eq.student_id}</code>)</span>
                                <span>• ${eq.student_course} (${eq.student_year || '2nd Year'})</span>
                                <span>• <span class="risk-badge ${studentRiskClass}" style="font-size: 10.5px; padding: 2px 6px;">${eq.student_risk || 0}% Risk</span></span>
                                <span>• Mentor: <strong class="text-primary">${eq.mentor_name}</strong></span>
                                ${eq.creator_name ? `<span>• Booked by: <strong>${eq.creator_name}</strong></span>` : ''}
                            `}
                        </div>
                    </div>

                    <!-- ACTIONS -->
                    <div class="d-flex gap-2 align-items-center flex-wrap">
                        ${role === 'student' ? `
                            <button class="primary-btn btn-sm py-1 px-2" onclick="navigateTo('student360')" title="View My 360° Profile">
                                <i class="bi bi-person-vcard me-1"></i> My 360° Profile
                            </button>
                            ${isCompleted ? `
                                <span class="text-success small fw-semibold d-inline-flex align-items-center gap-1">
                                    <i class="bi bi-check-circle-fill"></i> Completed on ${eq.completed_date || eq.date}
                                </span>
                            ` : ''}
                        ` : `
                            <button class="secondary-btn btn-sm py-1 px-2" onclick="viewStudent360('${eq.student_id}')" title="Student 360° Profile">
                                <i class="bi bi-person-vcard me-1"></i> 360°
                            </button>

                            ${isPending ? (
                                role === 'admin' || role === 'faculty' ? `
                                    <button class="btn btn-sm btn-success py-1 px-3 d-flex align-items-center gap-1" onclick="handleEnquiryApprove(${eq.id})">
                                        <i class="bi bi-check-circle-fill"></i> Approve & Complete
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger py-1 px-2 d-flex align-items-center gap-1" onclick="openEnquiryRejectModal(${eq.id}, '${(eq.student_name || '').replace(/'/g, "\\'")}', '${(eq.action || '').replace(/'/g, "\\'")}')">
                                        <i class="bi bi-x-circle"></i> Reject with Reason
                                    </button>
                                ` : `
                                    <span class="badge bg-warning text-dark py-1 px-2"><i class="bi bi-hourglass-top me-1"></i> Under Review by Initiator</span>
                                `
                            ) : ''}

                            ${isRevision ? (
                                role === 'mentor' ? `
                                    <button class="btn btn-sm btn-warning py-1 px-3 fw-bold d-flex align-items-center gap-1" onclick="openEnquiryResubmitModal(${eq.id}, '${(eq.student_name || '').replace(/'/g, "\\'")}', '${(eq.action || '').replace(/'/g, "\\'")}', '${(eq.rejection_reason || '').replace(/'/g, "\\'")}')">
                                        <i class="bi bi-arrow-repeat"></i> Update & Re-submit
                                    </button>
                                ` : `
                                    <button class="btn btn-sm btn-outline-success py-1 px-2" onclick="handleEnquiryApprove(${eq.id})">
                                        <i class="bi bi-check2"></i> Override & Approve
                                    </button>
                                `
                            ) : ''}

                            ${isCompleted ? `
                                <span class="text-success small fw-semibold d-inline-flex align-items-center gap-1">
                                    <i class="bi bi-check-circle-fill"></i> Verified by ${eq.reviewer_name || 'Admin'} ${eq.completed_date ? `(${eq.completed_date})` : ''}
                                </span>
                            ` : ''}
                        `}
                    </div>
                </div>

                <!-- SESSION DETAILS & TIME/VENUE -->
                <div class="d-flex flex-wrap gap-3 small mb-2 p-2 rounded" style="background: var(--bg-sunken); border: 1px solid var(--border-soft); color: var(--text); font-size: 11.5px;">
                    <span><i class="bi bi-calendar3 me-1 text-primary"></i> Date: <strong>${eq.date}</strong></span>
                    <span><i class="bi bi-clock me-1 text-primary"></i> ${eq.session_time || '10:00 AM'}</span>
                    <span><i class="bi bi-geo-alt me-1 text-danger"></i> ${eq.location || 'Mentorship Cabin 204'}</span>
                    ${eq.subject_code ? `<span><i class="bi bi-book me-1 text-success"></i> ${eq.subject_code}</span>` : ''}
                    ${eq.completion_requested_at ? `<span><i class="bi bi-send me-1 text-info"></i> Submitted: ${new Date(eq.completion_requested_at).toLocaleDateString()}</span>` : ''}
                </div>

                <!-- MENTOR'S SUBMITTED OUTCOME REPORT -->
                ${eq.completion_request_notes || eq.notes ? `
                    <div class="p-2 mb-2 rounded" style="background: var(--bg-elevated); border-left: 3px solid var(--primary); font-size: 12px; color: var(--text);">
                        <strong class="d-block mb-1 text-primary"><i class="bi bi-card-text me-1"></i> Mentor's Outcome Summary & Verification Notes:</strong>
                        <div>${eq.completion_request_notes || eq.notes}</div>
                    </div>
                ` : ''}

                <!-- REVIEWER'S REJECTION FEEDBACK (IF APPLICABLE) -->
                ${isRevision && eq.rejection_reason ? `
                    <div class="p-2 rounded bg-danger-subtle text-danger border border-danger-subtle" style="font-size: 12px;">
                        <strong><i class="bi bi-exclamation-octagon-fill me-1"></i> Reviewer Feedback & Reason for Rejection:</strong>
                        <div class="mt-1">${eq.rejection_reason}</div>
                        ${eq.reviewer_name ? `<div class="small mt-1 text-muted">— Reviewed by <strong>${eq.reviewer_name}</strong></div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }).join("");

    if (pagContainer) {
        pagContainer.innerHTML = `
            <span class="small text-muted">Showing ${start + 1}-${end} of ${list.length}</span>
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === 1 ? 'disabled' : ''} onclick="handleEnquiryPageChange(${currentPage - 1})">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <span class="small px-2 my-auto fw-semibold" style="color: var(--text);">${currentPage} / ${totalPages}</span>
                <button class="btn btn-sm btn-outline-secondary py-0 px-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleEnquiryPageChange(${currentPage + 1})">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
        `;
    }
}

async function handleEnquiryApprove(id) {
    const user = getCurrentUser();
    const ok = await showConfirmModal({
        title: "Approve Mentorship Completion",
        message: "Confirm verification of this session? It will be marked as Completed and resolved.",
        confirmText: "Approve & Complete",
        confirmBtnClass: "btn btn-success",
        icon: "bi-check-circle-fill text-success"
    });
    if (!ok) return;

    const res = await API.approveInterventionCompletion(id, {
        reviewer_id: user?.id
    });

    if (res && res.success) {
        showSuccessToast("Mentorship session verified and marked as Completed!");
        await renderEnquiries();
    } else {
        showErrorToast(res?.message || "Failed to approve completion.");
    }
}
window.handleEnquiryApprove = handleEnquiryApprove;

function openEnquiryRejectModal(id, studentName, action) {
    const modal = document.getElementById("enquiryRejectModal");
    if (!modal) return;

    document.getElementById("enqRejId").value = id;
    document.getElementById("enqRejSessionSummary").textContent = `Reviewing: ${action} for ${studentName}`;
    document.getElementById("enqRejReason").value = "";
    modal.classList.add("active");
}
window.openEnquiryRejectModal = openEnquiryRejectModal;

function closeEnquiryRejectModal() {
    document.getElementById("enquiryRejectModal")?.classList.remove("active");
}
window.closeEnquiryRejectModal = closeEnquiryRejectModal;

async function handleEnquiryRejectSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("enqRejId").value;
    const reason = document.getElementById("enqRejReason").value.trim();
    const user = getCurrentUser();
    const btn = document.getElementById("enqRejSubmitBtn");

    if (!reason) {
        showErrorToast("A clear reason/description is required when rejecting.");
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
        closeEnquiryRejectModal();
        showSuccessToast("Session returned for revision. Feedback delivered to mentor.");
        await renderEnquiries();
    } else {
        showErrorToast(res?.message || "Failed to reject completion.");
    }
}
window.handleEnquiryRejectSubmit = handleEnquiryRejectSubmit;

function openEnquiryResubmitModal(id, studentName, action, prevFeedback) {
    const modal = document.getElementById("enquiryResubmitModal");
    if (!modal) return;

    document.getElementById("enqResubId").value = id;
    document.getElementById("enqResubTitle").textContent = `${action} for ${studentName}`;
    document.getElementById("enqResubPrevFeedback").textContent = prevFeedback ? `Reviewer Feedback: "${prevFeedback}"` : "";
    document.getElementById("enqResubNotes").value = "";
    modal.classList.add("active");
}
window.openEnquiryResubmitModal = openEnquiryResubmitModal;

function closeEnquiryResubmitModal() {
    document.getElementById("enquiryResubmitModal")?.classList.remove("active");
}
window.closeEnquiryResubmitModal = closeEnquiryResubmitModal;

async function handleEnquiryResubmitSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("enqResubId").value;
    const notes = document.getElementById("enqResubNotes").value.trim();
    const user = getCurrentUser();
    const btn = document.getElementById("enqResubSubmitBtn");

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
        btn.innerHTML = '<i class="bi bi-send-check me-1"></i> Re-Submit for Verification';
    }

    if (res && res.success) {
        closeEnquiryResubmitModal();
        showSuccessToast("Updated completion review re-submitted to initiator!");
        await renderEnquiries();
    } else {
        showErrorToast(res?.message || "Failed to re-submit review.");
    }
}
window.handleEnquiryResubmitSubmit = handleEnquiryResubmitSubmit;

function refreshEnquiriesBadge(count) {
    const badge = document.getElementById("enquiriesBadge");
    if (badge) {
        if (count > 0) {
            badge.classList.remove("d-none");
            badge.textContent = count;
        } else {
            badge.classList.add("d-none");
        }
    }
}
window.refreshEnquiriesBadge = refreshEnquiriesBadge;

// Window Exports
window.renderEnquiries = renderEnquiries;
window.handleEnquiryApprove = handleEnquiryApprove;
window.handleEnquiryRejectSubmit = handleEnquiryRejectSubmit;
window.handleEnquiryResubmitSubmit = handleEnquiryResubmitSubmit;
