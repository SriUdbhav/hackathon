/* =====================================================
   STUDENT360.JS
   Holistic Student 360° Profile & Explainable Diagnostic View
   Supports: Fuzzy Search Student Switcher, Demographics,
             Per-Subject Marks, Extracurriculars, Multi-Signal Radar
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

    const subjectCodeNames = {
        "CS201": "Data Structures & Algorithms",
        "CS202": "Database Management Systems",
        "CS203": "Computer Org. & Architecture",
        "CS204": "Discrete Mathematics",
        "MA201": "Probability & Statistics",
        "CS301": "Operating Systems",
        "CS302": "Computer Networks"
    };

    const highCount = students.filter(s => s.risk >= 60).length;
    const medCount = students.filter(s => s.risk >= 30 && s.risk < 60).length;
    const lowCount = students.filter(s => s.risk < 30).length;
    if (!window._s360RiskFilter) window._s360RiskFilter = 'ALL';

    content.innerHTML = `
        <!-- TOP CONTROLS: ADVANCED STUDENT SWITCHER (for faculty/admin/mentor) -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">Student 360° Academic Intelligence Profile</h1>
                <p class="small mb-0" style="color: var(--text-soft);">Demographic factors, subject-wise internal tests, extracurricular engagement & AI diagnostic</p>
            </div>
            ${role !== 'student' ? `
                <div class="d-flex flex-column gap-1" style="min-width: 360px;">
                    <div class="position-relative">
                        <div class="input-group">
                            <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search" style="color: var(--accent);"></i></span>
                            <input type="text" id="student360SearchInput" class="form-control" 
                                placeholder="Search student by name, ID, place..." 
                                value=""
                                oninput="filterStudent360Switcher(this.value)"
                                onfocus="showStudent360Dropdown()"
                                onclick="showStudent360Dropdown()"
                                autocomplete="off"
                                style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                            <button class="btn btn-outline-secondary" type="button" id="student360RegexToggle" onclick="toggleStudent360Regex()" title="Toggle Regex Search">
                                <i class="bi bi-code-slash"></i>
                            </button>
                        </div>
                        <div id="student360Dropdown" class="student360-dropdown d-none">
                            <!-- Dynamic results populated by JS -->
                        </div>
                    </div>
                    <div class="d-flex gap-1 flex-wrap mt-1">
                        <button class="btn btn-sm s360-filter-btn ${window._s360RiskFilter === 'ALL' ? 'btn-dark active' : 'btn-outline-secondary'}" data-level="ALL" onclick="filterStudent360ByRisk('ALL')">All (${students.length})</button>
                        <button class="btn btn-sm s360-filter-btn ${window._s360RiskFilter === 'HIGH' ? 'btn-danger active' : 'btn-outline-danger'}" data-level="HIGH" onclick="filterStudent360ByRisk('HIGH')">High Risk (${highCount})</button>
                        <button class="btn btn-sm s360-filter-btn ${window._s360RiskFilter === 'MEDIUM' ? 'btn-warning text-dark active' : 'btn-outline-warning'}" data-level="MEDIUM" onclick="filterStudent360ByRisk('MEDIUM')">Moderate (${medCount})</button>
                        <button class="btn btn-sm s360-filter-btn ${window._s360RiskFilter === 'LOW' ? 'btn-success active' : 'btn-outline-success'}" data-level="LOW" onclick="filterStudent360ByRisk('LOW')">Low Risk (${lowCount})</button>
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- HEADER BANNER -->
        <div class="profile-header mb-4">
            <div class="profile-avatar-box">
                <div class="profile-avatar">${s.name.charAt(0)}</div>
                <div class="profile-info">
                    <h2>${s.name} <span class="badge bg-light text-dark fs-6 ms-2 border">${s.id}</span></h2>
                    <p style="color: var(--text-soft);"><i class="bi bi-mortarboard me-1 text-primary"></i> ${s.course} • ${s.year || '2nd Year'} • CGPA: <strong>${s.cgpa}</strong> • Credits: <strong>${s.credits || 24}</strong></p>
                </div>
            </div>
            <div class="text-end">
                <span class="risk-badge ${badgeClass} fs-6 mb-2">
                    <i class="bi ${s.risk >= 60 ? 'bi-exclamation-octagon-fill' : (s.risk >= 30 ? 'bi-exclamation-triangle-fill' : 'bi-shield-check')}"></i>
                    ${s.risk}% (${riskStatus})
                </span>
                <p class="small mb-0" style="color: var(--text-soft);"><i class="bi bi-cpu me-1 text-primary"></i> Monitored by Autonomous AI Engine</p>
            </div>
        </div>

        <div class="row g-4 mb-4">
            <!-- LEFT COLUMN: SUBJECT MARKS & MULTI-SIGNAL RADAR -->
            <div class="col-lg-8">
                <!-- SUBJECT-WISE MARKS & ATTENDANCE -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-journal-text text-primary me-2"></i> Semester 3 Subject Performance & Grades</h3>
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
                                ${marks.length === 0 ? '<tr><td colspan="7" class="text-center text-muted">No subject marks recorded.</td></tr>' : marks.map(m => {
                                    const subName = m.subject_name || m.short_name || subjectCodeNames[m.subject_code] || m.subject_code;
                                    return `
                                        <tr>
                                            <td><code>${m.subject_code}</code></td>
                                            <td><strong>${subName}</strong></td>
                                            <td><span class="${m.attendance < 75 ? 'text-danger fw-bold' : 'text-success'}">${m.attendance}%</span></td>
                                            <td><strong>${m.internal_marks}</strong> / 30</td>
                                            <td>${m.external_marks} / 70</td>
                                            <td>${m.assignment_score}%</td>
                                            <td><span class="badge bg-primary">${m.grade}</span></td>
                                        </tr>
                                    `;
                                }).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- RADAR CHART & MULTI-SIGNAL TELEMETRY -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-diagram-3 text-info me-2"></i> Multi-Signal Diagnostic Profile</h3>
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
                                <div class="d-flex justify-content-between mb-1 small" style="color: var(--text);">
                                    <span>Class Attendance</span>
                                    <strong>${s.attendance}%</strong>
                                </div>
                                <div class="progress" style="height: 7px; background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                    <div class="progress-bar ${s.attendance < 75 ? 'bg-danger' : 'bg-success'}" style="width: ${s.attendance}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1 small" style="color: var(--text);">
                                    <span>LMS Engagement</span>
                                    <strong>${s.lms_score || s.attendance}%</strong>
                                </div>
                                <div class="progress" style="height: 7px; background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                    <div class="progress-bar bg-info" style="width: ${s.lms_score || s.attendance}%"></div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <div class="d-flex justify-content-between mb-1 small" style="color: var(--text);">
                                    <span>Academic CGPA</span>
                                    <strong>${s.cgpa} / 10</strong>
                                </div>
                                <div class="progress" style="height: 7px; background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                    <div class="progress-bar bg-warning" style="width: ${s.cgpa * 10}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- EXPLAINABLE AI RISK DIAGNOSIS -->
                <div class="card-box">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-shield-exclamation text-danger me-2"></i> Explainable AI Risk Reason Analysis</h3>
                    </div>
                    <div class="d-flex flex-column gap-2">
                        ${(aiAnalysis.reasons || []).length === 0 ? '<p class="text-muted small mb-0"><i class="bi bi-check-circle text-success me-1"></i> No critical academic risk anomalies detected.</p>' : (aiAnalysis.reasons || []).map(r => `
                            <div class="p-3 rounded d-flex align-items-center gap-3" style="background: var(--bg-sunken); border: 1px solid var(--border-soft); color: var(--text);">
                                <i class="bi bi-exclamation-triangle-fill text-warning fs-5 flex-shrink-0"></i>
                                <span class="small fw-medium">${r}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>

            <!-- RIGHT COLUMN: DEMOGRAPHICS, ACTIVITIES, INTERVENTIONS -->
            <div class="col-lg-4">
                <!-- PERSONAL & PARENTAL DEMOGRAPHICS -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-person-vcard text-secondary me-2"></i> Demographics & Contact</h3>
                    </div>
                    <div class="d-flex flex-column gap-1 small">
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Institutional Email</span>
                            <strong style="color: var(--text);"><code>${s.email || `${s.id.toLowerCase()}@vignan.ac.in`}</code></strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Phone Number</span>
                            <strong style="color: var(--text);">${s.phone || 'Unknown'}</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Father's Name</span>
                            <strong style="color: var(--text);">${s.father || 'Unknown'}</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Mother's Name</span>
                            <strong style="color: var(--text);">${s.mother || 'Unknown'}</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Mother Tongue</span>
                            <strong style="color: var(--text);">${s.mother_tongue || s.motherTongue || 'Unknown'}</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Location / City</span>
                            <strong style="color: var(--text);">${s.place || 'Unknown'}</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2 border-bottom" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Region</span>
                            <strong style="color: var(--text);">${s.region || 'Unknown'}</strong>
                        </div>
                        <div class="d-flex justify-content-between py-2" style="border-color: var(--border-soft) !important;">
                            <span style="color: var(--text-muted);">Country</span>
                            <strong style="color: var(--text);">${s.country || 'Unknown'}</strong>
                        </div>
                    </div>
                </div>

                <!-- EXTRACURRICULAR ENGAGEMENTS -->
                <div class="card-box mb-4">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-award text-warning me-2"></i> Extracurricular & Clubs</h3>
                    </div>
                    ${activities.length === 0 ? '<p class="text-muted small mb-0">No extracurricular activity registered.</p>' : `
                        <div class="d-flex flex-column gap-2">
                            ${activities.map(a => `
                                <div class="p-3 rounded" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                    <div class="d-flex justify-content-between align-items-center mb-1">
                                        <strong class="small" style="color: var(--text);">${a.activity_name}</strong>
                                        <span class="badge bg-primary" style="font-size: 11px;">${a.role}</span>
                                    </div>
                                    <small style="color: var(--text-muted); font-size: 11.5px;">${a.category} ${a.notes ? `• ${a.notes}` : ''}</small>
                                </div>
                            `).join("")}
                        </div>
                    `}
                </div>

                <!-- INTERVENTIONS & ACTIONS -->
                <div class="card-box">
                    <div class="card-head">
                        <h3 class="fw-bold"><i class="bi bi-chat-left-text text-primary me-2"></i> Mentoring Interventions</h3>
                    </div>
                    ${interventions.length === 0 ? '<p class="text-muted small mb-3">No active interventions logged.</p>' : `
                        <div class="d-flex flex-column gap-2 mb-3">
                            ${interventions.map(i => `
                                <div class="py-2 border-bottom d-flex justify-content-between align-items-center" style="border-color: var(--border-soft) !important;">
                                    <div>
                                        <strong class="small d-block" style="color: var(--text);">${i.action}</strong>
                                        <small style="color: var(--text-muted);"><i class="bi bi-calendar3 me-1"></i> ${i.date}</small>
                                    </div>
                                    <span class="badge ${i.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}">${i.status}</span>
                                </div>
                            `).join("")}
                        </div>
                    `}
                    ${role !== 'student' ? `
                        <button class="primary-btn w-100 btn-sm d-flex align-items-center justify-content-center gap-2" onclick="quickCreateIntervention('${s.id}', '1-on-1 Academic Counseling', 'CS201', 'Moderate')">
                            <i class="bi bi-plus-circle"></i> Launch New Mentoring Action
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

// =====================================================
// ADVANCED STUDENT SEARCH FOR 360° SWITCHER
// =====================================================

window._s360RegexMode = false;
window._s360RiskFilter = 'ALL';

function toggleStudent360Regex() {
    window._s360RegexMode = !window._s360RegexMode;
    const btn = document.getElementById("student360RegexToggle");
    if (btn) {
        btn.className = window._s360RegexMode
            ? "btn btn-primary"
            : "btn btn-outline-secondary";
    }
    const input = document.getElementById("student360SearchInput");
    if (input) filterStudent360Switcher(input.value);
}

function filterStudent360ByRisk(level) {
    window._s360RiskFilter = level;
    
    // Update button styles using data-level attribute
    const buttons = document.querySelectorAll('.s360-filter-btn');
    buttons.forEach(btn => {
        const btnLevel = btn.getAttribute('data-level');
        if (btnLevel === level) {
            btn.className = `btn btn-sm s360-filter-btn active ${
                level === 'HIGH' ? 'btn-danger' : 
                level === 'MEDIUM' ? 'btn-warning text-dark' : 
                level === 'LOW' ? 'btn-success' : 'btn-dark'
            }`;
        } else {
            btn.className = `btn btn-sm s360-filter-btn ${
                btnLevel === 'HIGH' ? 'btn-outline-danger' : 
                btnLevel === 'MEDIUM' ? 'btn-outline-warning' : 
                btnLevel === 'LOW' ? 'btn-outline-success' : 'btn-outline-secondary'
            }`;
        }
    });

    const input = document.getElementById("student360SearchInput");
    showStudent360Dropdown();
}

function showStudent360Dropdown() {
    const dropdown = document.getElementById("student360Dropdown");
    if (dropdown) {
        dropdown.classList.remove("d-none");
        const input = document.getElementById("student360SearchInput");
        filterStudent360Switcher(input?.value || "");
    }
}

function filterStudent360Switcher(query) {
    const dropdown = document.getElementById("student360Dropdown");
    if (!dropdown) return;

    query = (query || "").trim();

    let filtered = [...students];

    // Risk filter
    if (window._s360RiskFilter === 'HIGH') filtered = filtered.filter(s => s.risk >= 60);
    else if (window._s360RiskFilter === 'MEDIUM') filtered = filtered.filter(s => s.risk >= 30 && s.risk < 60);
    else if (window._s360RiskFilter === 'LOW') filtered = filtered.filter(s => s.risk < 30);

    // Text search (fuzzy or regex)
    if (query) {
        if (window._s360RegexMode) {
            try {
                const regex = new RegExp(query, 'i');
                filtered = filtered.filter(s =>
                    regex.test(s.name) || regex.test(s.id) || regex.test(s.course || '') || regex.test(s.place || '')
                );
            } catch (e) {
                filtered = filtered.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
            }
        } else {
            const lowerQuery = query.toLowerCase();
            filtered = filtered.map(s => {
                const fields = [s.name, s.id, s.course || '', s.place || '', s.mother_tongue || s.motherTongue || ''].map(f => f.toLowerCase());
                let score = 0;
                for (const field of fields) {
                    if (field.includes(lowerQuery)) score += 100;
                    else if (fuzzyMatch(lowerQuery, field)) score += 60;
                }
                return { ...s, _score: score };
            }).filter(s => s._score > 0).sort((a, b) => b._score - a._score);
        }
    }

    const results = filtered.slice(0, 30);

    if (results.length === 0) {
        dropdown.innerHTML = `<div class="p-3 text-center small" style="color: var(--text-soft);"><i class="bi bi-search me-1 text-primary"></i>No matching students found in this filter</div>`;
    } else {
        dropdown.innerHTML = results.map(s => {
            const riskBadgeClass = s.risk >= 60 ? "high" : (s.risk >= 30 ? "medium" : "low");
            const isSelected = s.id === selectedStudentId;
            return `
                <div class="student360-result ${isSelected ? 'active' : ''}" onclick="selectStudent360('${s.id}')">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div>
                            <strong style="color: var(--text);">${highlightMatch(s.name, query)}</strong>
                            <code class="ms-1">${s.id}</code>
                        </div>
                        <span class="risk-badge ${riskBadgeClass}">${s.risk}% Risk</span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center small" style="color: var(--text-soft); font-size: 11.5px;">
                        <span><i class="bi bi-mortarboard me-1 text-primary"></i>${s.course || 'CSE'} (${s.year || '2nd Yr'}) ${s.place ? `• ${s.place}` : ''}</span>
                        <span>Attd: <strong>${s.attendance}%</strong> • CGPA: <strong>${s.cgpa}</strong></span>
                    </div>
                </div>
            `;
        }).join("");
    }

    dropdown.classList.remove("d-none");
}

function selectStudent360(studentId) {
    const dropdown = document.getElementById("student360Dropdown");
    if (dropdown) dropdown.classList.add("d-none");
    viewStudent360(studentId);
}

// Close dropdown on outside click
document.addEventListener("click", function(e) {
    const dropdown = document.getElementById("student360Dropdown");
    const input = document.getElementById("student360SearchInput");
    const filterBtns = document.querySelectorAll('.s360-filter-btn');
    let clickedFilterBtn = false;
    filterBtns.forEach(b => { if (b.contains(e.target)) clickedFilterBtn = true; });

    if (dropdown && !dropdown.contains(e.target) && input && !input.contains(e.target) && !clickedFilterBtn) {
        dropdown.classList.add("d-none");
    }
});

// =====================================================
// FUZZY MATCHING UTILITIES
// =====================================================

function fuzzyMatch(pattern, text) {
    if (!pattern || !text) return false;
    let pi = 0;
    for (let ti = 0; ti < text.length && pi < pattern.length; ti++) {
        if (text[ti] === pattern[pi]) pi++;
    }
    return pi === pattern.length;
}

function highlightMatch(text, query) {
    if (!query) return text;
    try {
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
    } catch {
        return text;
    }
}
