/* =====================================================
   REPORTS.JS
   Comprehensive Academic Intelligence Report Generator
   Supports: Configurable Report Sections, Risk Filters,
             Print-Optimized PDF Export, Custom CSV Export,
             Markdown (.md) Export & System Log (.log)
===================================================== */

let reportConfig = {
    includeRoster: true,
    includeSubjects: true,
    includeInterventions: true,
    includeDemographics: true,
    includeAiEngagement: true,
    riskFilter: "ALL" // ALL, HIGH, AT_RISK
};

async function renderReports() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    if (students.length === 0) {
        await loadLatestStudents();
    }

    const interventions = await API.getInterventions() || [];
    const agentLogs = await API.getAgentLogs() || [];
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    content.innerHTML = `
        <!-- HEADER & EXPORT ACTION BUTTONS -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 no-print">
            <div>
                <h1 class="h3 fw-bold mb-1">Academic Intelligence & Executive Reports</h1>
                <p class="text-muted small mb-0">Generate institutional risk dossiers, accreditation audits, and exportable datasets</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
                <button class="primary-btn" onclick="exportReportPDF()">
                    <i class="bi bi-printer"></i> Print / Save PDF
                </button>
                <button class="secondary-btn" onclick="exportReportCSV()">
                    <i class="bi bi-filetype-csv text-success"></i> Download CSV
                </button>
                <button class="secondary-btn" onclick="exportReportMarkdown()">
                    <i class="bi bi-markdown text-primary"></i> Download Markdown (.md)
                </button>
                <button class="secondary-btn" onclick="exportReportLog()">
                    <i class="bi bi-file-earmark-text text-secondary"></i> System Log (.log)
                </button>
            </div>
        </div>

        <!-- REPORT CONFIGURATION SETTINGS PANEL -->
        <div class="card-box p-4 mb-4 no-print" style="border-left: 4px solid var(--accent);">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0 text-dark">
                    <i class="bi bi-sliders text-primary me-2"></i> Report Inclusions & Configuration
                </h5>
                <span class="badge bg-primary">Dynamic Customizer</span>
            </div>
            <p class="small mb-3" style="color: var(--text-soft);">
                Customize which sections and data attributes are included in the generated audit report and export files.
            </p>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" id="cfgIncludeRoster" ${reportConfig.includeRoster ? 'checked' : ''} onchange="updateReportConfig()">
                        <label class="form-check-label fw-semibold" for="cfgIncludeRoster">1. Student Risk Roster</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="cfgIncludeDemographics" ${reportConfig.includeDemographics ? 'checked' : ''} onchange="updateReportConfig()">
                        <label class="form-check-label small text-muted" for="cfgIncludeDemographics">↳ Include Demographics (Parents/City)</label>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" id="cfgIncludeSubjects" ${reportConfig.includeSubjects ? 'checked' : ''} onchange="updateReportConfig()">
                        <label class="form-check-label fw-semibold" for="cfgIncludeSubjects">2. Subject Performance Table</label>
                    </div>
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="cfgIncludeAiEngagement" ${reportConfig.includeAiEngagement ? 'checked' : ''} onchange="updateReportConfig()">
                        <label class="form-check-label small text-muted" for="cfgIncludeAiEngagement">↳ Include LMS & Multi-Signal Telemetry</label>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="form-check form-switch mb-2">
                        <input class="form-check-input" type="checkbox" id="cfgIncludeInterventions" ${reportConfig.includeInterventions ? 'checked' : ''} onchange="updateReportConfig()">
                        <label class="form-check-label fw-semibold" for="cfgIncludeInterventions">3. Intervention Log & Pipeline</label>
                    </div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <label class="small text-muted mb-0">Cohort Scope:</label>
                        <select id="cfgRiskFilter" class="form-select form-select-sm" style="width: auto;" onchange="updateReportConfig()">
                            <option value="ALL" ${reportConfig.riskFilter === 'ALL' ? 'selected' : ''}>All Students</option>
                            <option value="AT_RISK" ${reportConfig.riskFilter === 'AT_RISK' ? 'selected' : ''}>At-Risk Only (&ge; 30%)</option>
                            <option value="HIGH" ${reportConfig.riskFilter === 'HIGH' ? 'selected' : ''}>High Risk Only (&ge; 60%)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- REPORT CANVAS (Printable Document Container) -->
        <div id="printableReportContainer" class="card-box p-5 shadow-sm">
            ${generateReportHtml(today, interventions)}
        </div>
    `;
}

function updateReportConfig() {
    reportConfig.includeRoster = document.getElementById("cfgIncludeRoster")?.checked ?? true;
    reportConfig.includeDemographics = document.getElementById("cfgIncludeDemographics")?.checked ?? true;
    reportConfig.includeSubjects = document.getElementById("cfgIncludeSubjects")?.checked ?? true;
    reportConfig.includeAiEngagement = document.getElementById("cfgIncludeAiEngagement")?.checked ?? true;
    reportConfig.includeInterventions = document.getElementById("cfgIncludeInterventions")?.checked ?? true;
    reportConfig.riskFilter = document.getElementById("cfgRiskFilter")?.value || "ALL";

    const container = document.getElementById("printableReportContainer");
    if (container) {
        API.getInterventions().then(interventions => {
            const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            container.innerHTML = generateReportHtml(today, interventions || []);
        });
    }
}

function getFilteredReportStudents() {
    let list = [...students];
    if (reportConfig.riskFilter === "HIGH") {
        list = list.filter(s => s.risk >= 60);
    } else if (reportConfig.riskFilter === "AT_RISK") {
        list = list.filter(s => s.risk >= 30);
    }
    return list;
}

function generateReportHtml(today, interventions) {
    const filteredStudents = getFilteredReportStudents();
    const total = filteredStudents.length;
    const highRisk = filteredStudents.filter(s => s.risk >= 60);
    const avgAttendance = total ? Math.round(filteredStudents.reduce((a, b) => a + Number(b.attendance || 0), 0) / total) : 0;
    const avgCGPA = total ? (filteredStudents.reduce((a, b) => a + Number(b.cgpa || 0), 0) / total).toFixed(2) : "0.00";

    return `
        <!-- REPORT HEADER -->
        <div class="border-bottom pb-4 mb-4 d-flex justify-content-between align-items-center">
            <div>
                <h2 class="fw-bold mb-1 text-primary">VIGNAN UNIVERSITY</h2>
                <h5 class="fw-semibold text-dark mb-1">Department of Computer Science & Engineering</h5>
                <p class="text-muted small mb-0">Cohort Academic Risk & Early Intervention Intelligence Report</p>
            </div>
            <div class="text-end">
                <span class="badge bg-dark fs-6 mb-1">OFFICIAL AUDIT REPORT</span>
                <p class="text-muted small mb-0">Generated: <strong>${today}</strong></p>
                <p class="text-muted small mb-0">Scope: <strong>${reportConfig.riskFilter === 'ALL' ? 'Full Cohort' : (reportConfig.riskFilter === 'HIGH' ? 'High Risk Cohort' : 'At-Risk Watchlist')}</strong></p>
            </div>
        </div>

        <!-- EXECUTIVE SUMMARY TILES -->
        <div class="row g-3 mb-4">
            <div class="col-3">
                <div class="p-3 border rounded bg-light">
                    <small class="text-muted d-block">MONITORED SCOPE</small>
                    <h4 class="fw-bold mb-0 text-dark">${total} Students</h4>
                </div>
            </div>
            <div class="col-3">
                <div class="p-3 border rounded bg-light">
                    <small class="text-muted d-block">HIGH RISK (CRITICAL)</small>
                    <h4 class="fw-bold mb-0 text-danger">${highRisk.length} (${total ? Math.round((highRisk.length/total)*100) : 0}%)</h4>
                </div>
            </div>
            <div class="col-3">
                <div class="p-3 border rounded bg-light">
                    <small class="text-muted d-block">AVG ATTENDANCE</small>
                    <h4 class="fw-bold mb-0 ${avgAttendance < 75 ? 'text-danger' : 'text-success'}">${avgAttendance}%</h4>
                </div>
            </div>
            <div class="col-3">
                <div class="p-3 border rounded bg-light">
                    <small class="text-muted d-block">AVG CGPA</small>
                    <h4 class="fw-bold mb-0 text-primary">${avgCGPA} / 10</h4>
                </div>
            </div>
        </div>

        <!-- SECTION 1: DETAILED STUDENT ROSTER -->
        ${reportConfig.includeRoster ? `
            <div class="mb-5">
                <h4 class="fw-bold border-bottom pb-2 mb-3">1. Cohort Risk & Performance Roster (${total} records)</h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm" style="font-size: 12px;">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Student Name</th>
                                <th>Course/Year</th>
                                <th>Attendance</th>
                                <th>CGPA</th>
                                ${reportConfig.includeAiEngagement ? '<th>LMS Score</th>' : ''}
                                <th>Risk Score</th>
                                ${reportConfig.includeDemographics ? '<th>Parent / Location</th>' : ''}
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredStudents.map(s => {
                                const isHigh = s.risk >= 60;
                                return `
                                    <tr style="${isHigh ? 'background-color: var(--risk-high-soft);' : ''}">
                                        <td><strong style="color: ${isHigh ? 'var(--risk-high)' : 'var(--text)'};">${s.id}</strong></td>
                                        <td style="color: var(--text);">${s.name}</td>
                                        <td style="color: var(--text-soft);">${s.course} (${s.year || '2nd Year'})</td>
                                        <td style="color: var(--text);">${s.attendance}%</td>
                                        <td style="color: var(--text);">${s.cgpa}</td>
                                        ${reportConfig.includeAiEngagement ? `<td style="color: var(--text);">${s.lms_score || s.attendance}%</td>` : ''}
                                        <td><strong style="color: ${isHigh ? 'var(--risk-high)' : (s.risk >= 30 ? 'var(--risk-medium)' : 'var(--risk-low)')};">${s.risk}%</strong></td>
                                        ${reportConfig.includeDemographics ? `<td style="color: var(--text-soft);">${s.father || 'N/A'} • ${s.place || 'Hyderabad'}</td>` : ''}
                                        <td>${s.risk >= 60 ? '<span style="color:var(--risk-high); font-weight: 700;"><i class="bi bi-exclamation-triangle me-1"></i>Critical Action</span>' : (s.risk >= 30 ? '<span style="color:var(--risk-medium); font-weight: 600;"><i class="bi bi-exclamation-circle me-1"></i>Moderate</span>' : '<span style="color:var(--risk-low); font-weight: 600;"><i class="bi bi-check-circle me-1"></i>Healthy</span>')}</td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}

        <!-- SECTION 2: SUBJECT-WISE PERFORMANCE ANALYSIS -->
        ${reportConfig.includeSubjects ? `
            <div class="mb-5">
                <h4 class="fw-bold border-bottom pb-2 mb-3">2. 2nd Year CSE Subject Academic Performance</h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm" style="font-size: 12px;">
                        <thead class="table-light">
                            <tr>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th>Semester</th>
                                <th>Credits</th>
                                <th>Avg Attendance</th>
                                <th>Avg Internal (/30)</th>
                                <th>Academic Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>CS201</strong></td>
                                <td>Database Management Systems</td>
                                <td>Sem 3</td>
                                <td>4</td>
                                <td class="text-danger fw-bold">73.4%</td>
                                <td>19.4 / 30</td>
                                <td><span class="badge bg-warning text-dark">Attention Needed</span></td>
                            </tr>
                            <tr>
                                <td><strong>CS202</strong></td>
                                <td>Operating Systems</td>
                                <td>Sem 3</td>
                                <td>4</td>
                                <td class="text-success fw-bold">74.8%</td>
                                <td>20.4 / 30</td>
                                <td><span class="badge bg-success">Stable</span></td>
                            </tr>
                            <tr>
                                <td><strong>MA201</strong></td>
                                <td>Discrete Mathematics</td>
                                <td>Sem 3</td>
                                <td>3</td>
                                <td class="text-danger fw-bold">71.2%</td>
                                <td>17.8 / 30</td>
                                <td><span class="badge bg-danger">Remedial Classes Recommended</span></td>
                            </tr>
                            <tr>
                                <td><strong>CS203</strong></td>
                                <td>Computer Networks</td>
                                <td>Sem 4</td>
                                <td>4</td>
                                <td class="text-success fw-bold">77.4%</td>
                                <td>22.6 / 30</td>
                                <td><span class="badge bg-success">Healthy</span></td>
                            </tr>
                            <tr>
                                <td><strong>CS204</strong></td>
                                <td>Software Engineering</td>
                                <td>Sem 4</td>
                                <td>3</td>
                                <td class="text-success fw-bold">75.4%</td>
                                <td>21.4 / 30</td>
                                <td><span class="badge bg-success">Healthy</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        ` : ''}

        <!-- SECTION 3: RECENT AUTONOMOUS INTERVENTIONS & AUDIT TRAIL -->
        ${reportConfig.includeInterventions ? `
            <div class="mb-4">
                <h4 class="fw-bold border-bottom pb-2 mb-3">3. Intervention Log & Action Pipeline</h4>
                ${interventions.length === 0 ? '<p class="text-muted small">No interventions logged.</p>' : `
                    <div class="table-responsive">
                        <table class="table table-bordered table-sm" style="font-size: 12px;">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Student ID</th>
                                    <th>Intervention Action</th>
                                    <th>Urgency</th>
                                    <th>Status</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${interventions.slice(0, 15).map(i => `
                                    <tr>
                                        <td>${i.date}</td>
                                        <td><strong>${i.student_id}</strong></td>
                                        <td>${i.action}</td>
                                        <td>${i.urgency || 'Moderate'}</td>
                                        <td><strong>${i.status}</strong></td>
                                        <td>${i.notes || 'N/A'}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        ` : ''}

        <!-- REPORT FOOTER SIGN-OFF -->
        <div class="pt-4 border-top mt-5 d-flex justify-content-between align-items-center text-muted small">
            <div>
                <span>Report prepared autonomously by <strong>EduStudent Sight AI</strong></span><br>
                <span>Approved by Department Academic Advisory Board</span>
            </div>
            <div class="text-end">
                <div style="width: 160px; border-bottom: 1px solid #333; margin-bottom: 4px;"></div>
                <span>Authorized Faculty Signature</span>
            </div>
        </div>
    `;
}

// 1. PDF Export via Print Dialogue
function exportReportPDF() {
    window.print();
}

// 2. CSV Export via Client-Side Blob (Respects Settings)
function exportReportCSV() {
    const list = getFilteredReportStudents();
    let csvContent = "data:text/csv;charset=utf-8,";
    
    let headers = ["Student ID", "Full Name", "Gender", "Course", "Year", "Attendance %", "CGPA", "Credits", "Risk %"];
    if (reportConfig.includeAiEngagement) headers.push("LMS Score");
    if (reportConfig.includeDemographics) headers.push("Father", "Mother", "Mother Tongue", "Place", "Region", "Country");
    
    csvContent += headers.join(",") + "\n";

    list.forEach(s => {
        let row = [
            `"${s.id}"`,
            `"${s.name}"`,
            `"${s.gender || 'Male'}"`,
            `"${s.course}"`,
            `"${s.year || '2nd Year'}"`,
            s.attendance,
            s.cgpa,
            s.credits || 24,
            s.risk
        ];
        if (reportConfig.includeAiEngagement) row.push(s.lms_score || s.attendance);
        if (reportConfig.includeDemographics) {
            row.push(
                `"${s.father || ''}"`,
                `"${s.mother || ''}"`,
                `"${s.mother_tongue || s.motherTongue || ''}"`,
                `"${s.place || ''}"`,
                `"${s.region || ''}"`,
                `"${s.country || 'India'}"`
            );
        }
        csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduStudent_Sight_Report_${reportConfig.riskFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 3. Markdown Export (Respects Settings)
function exportReportMarkdown() {
    const list = getFilteredReportStudents();
    const today = new Date().toISOString().split('T')[0];
    let md = `# EduStudent Sight — Academic Intelligence Report (${today})\n\n`;
    md += `**Scope**: ${reportConfig.riskFilter === 'ALL' ? 'Full Cohort' : (reportConfig.riskFilter === 'HIGH' ? 'High Risk Only' : 'At-Risk Watchlist')}\n\n`;
    md += `## Cohort Overview\n- Total Records: **${list.length} Students**\n- High Risk Count: **${list.filter(s => s.risk >= 60).length}**\n\n`;

    if (reportConfig.includeRoster) {
        md += `## Student Risk Roster\n\n`;
        md += `| ID | Name | Course | Year | Attendance | CGPA | Risk Score |\n`;
        md += `|---|---|---|---|---|---|---|\n`;

        list.forEach(s => {
            md += `| ${s.id} | ${s.name} | ${s.course} | ${s.year || '2nd Year'} | ${s.attendance}% | ${s.cgpa} | **${s.risk}%** |\n`;
        });
        md += `\n`;
    }

    if (reportConfig.includeSubjects) {
        md += `## Subject Performance\n- DBMS (CS201): 73.4% Avg Attendance\n- OS (CS202): 74.8% Avg Attendance\n- Math-III (MA201): 71.2% Avg Attendance\n\n`;
    }

    md += `\n---\n*Report generated by EduStudent Sight Autonomous AI Platform.*`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Academic_Report_${reportConfig.riskFilter}_${today}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 4. System Log Export (Respects Settings)
function exportReportLog() {
    const list = getFilteredReportStudents();
    const today = new Date().toISOString();
    let log = `[${today}] [SYSTEM_AUDIT] EduStudent Sight Academic Report Exported\n`;
    log += `[INFO] Scope=${reportConfig.riskFilter} Count=${list.length}\n`;
    list.forEach(s => {
        log += `[STUDENT_RECORD] ID=${s.id} NAME="${s.name}" ATTD=${s.attendance}% CGPA=${s.cgpa} RISK=${s.risk}%\n`;
    });

    const blob = new Blob([log], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `academic_telemetry_${Date.now()}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Window Exports for Reports Page
window.renderReports = renderReports;
window.exportReportPDF = exportReportPDF;
window.exportReportCSV = exportReportCSV;
window.exportReportMarkdown = exportReportMarkdown;
window.exportReportLog = exportReportLog;
window.updateReportConfig = updateReportConfig;
