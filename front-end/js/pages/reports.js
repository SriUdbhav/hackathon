/* =====================================================
   REPORTS.JS
   Comprehensive Academic Intelligence Report Generator
   Supports: Print-Optimized PDF Export, CSV Export,
             Markdown (.md) Export & System Log (.log)
===================================================== */

async function renderReports() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    if (students.length === 0) {
        await loadLatestStudents();
    }

    const total = students.length;
    const highRisk = students.filter(s => s.risk >= 60);
    const medRisk = students.filter(s => s.risk >= 30 && s.risk < 60);
    const lowRisk = students.filter(s => s.risk < 30);
    const avgAttendance = total ? Math.round(students.reduce((a, b) => a + Number(b.attendance || 0), 0) / total) : 0;
    const avgCGPA = total ? (students.reduce((a, b) => a + Number(b.cgpa || 0), 0) / total).toFixed(2) : "0.00";

    const interventions = await API.getInterventions() || [];
    const agentLogs = await API.getAgentLogs() || [];
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    content.innerHTML = `
        <!-- HEADER & EXPORT ACTION BUTTONS -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 no-print">
            <div>
                <h1 class="h3 fw-bold mb-1">📑 Academic Intelligence & Executive Reports</h1>
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

        <!-- REPORT CANVAS (Printable Document Container) -->
        <div id="printableReportContainer" class="card-box p-5 bg-white shadow-sm border">
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
                    <p class="text-muted small mb-0">System: <strong>EduStudent Sight AI v2.4</strong></p>
                </div>
            </div>

            <!-- EXECUTIVE SUMMARY TILES -->
            <div class="row g-3 mb-4">
                <div class="col-3">
                    <div class="p-3 border rounded bg-light">
                        <small class="text-muted d-block">TOTAL MONITORED</small>
                        <h4 class="fw-bold mb-0 text-dark">${total} Students</h4>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-3 border rounded bg-light">
                        <small class="text-muted d-block">HIGH RISK (CRITICAL)</small>
                        <h4 class="fw-bold mb-0 text-danger">${highRisk.length} (${Math.round((highRisk.length/total)*100)}%)</h4>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-3 border rounded bg-light">
                        <small class="text-muted d-block">CLASS AVG ATTENDANCE</small>
                        <h4 class="fw-bold mb-0 ${avgAttendance < 75 ? 'text-danger' : 'text-success'}">${avgAttendance}%</h4>
                    </div>
                </div>
                <div class="col-3">
                    <div class="p-3 border rounded bg-light">
                        <small class="text-muted d-block">CLASS AVG CGPA</small>
                        <h4 class="fw-bold mb-0 text-primary">${avgCGPA} / 10</h4>
                    </div>
                </div>
            </div>

            <!-- SECTION 1: DETAILED STUDENT ROSTER -->
            <div class="mb-5">
                <h4 class="fw-bold border-bottom pb-2 mb-3">1. Cohort Risk & Performance Roster</h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-sm" style="font-size: 12px;">
                        <thead class="table-light">
                            <tr>
                                <th>ID</th>
                                <th>Student Name</th>
                                <th>Course/Year</th>
                                <th>Attendance</th>
                                <th>CGPA</th>
                                <th>LMS Score</th>
                                <th>Risk Score</th>
                                <th>Parent / Location</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(s => {
                                const isHigh = s.risk >= 60;
                                return `
                                    <tr class="${isHigh ? 'table-danger' : ''}">
                                        <td><strong>${s.id}</strong></td>
                                        <td>${s.name}</td>
                                        <td>${s.course} (${s.year})</td>
                                        <td>${s.attendance}%</td>
                                        <td>${s.cgpa}</td>
                                        <td>${s.lms_score || s.attendance}%</td>
                                        <td><strong>${s.risk}%</strong></td>
                                        <td>${s.father || 'N/A'} • ${s.place || 'Hyderabad'}</td>
                                        <td>${s.risk >= 60 ? '🚨 Critical Action' : (s.risk >= 30 ? '⚠️ Moderate' : '✅ Healthy')}</td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- SECTION 2: SUBJECT-WISE PERFORMANCE ANALYSIS -->
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

            <!-- SECTION 3: RECENT AUTONOMOUS INTERVENTIONS & AUDIT TRAIL -->
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
                                ${interventions.slice(0, 10).map(i => `
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
        </div>
    `;
}

// 1. PDF Export via Print Dialogue
function exportReportPDF() {
    window.print();
}

// 2. CSV Export via Client-Side Blob
function exportReportCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student ID,Full Name,Gender,Course,Year,Attendance %,CGPA,Credits,LMS Score,Risk %,Father,Mother,Mother Tongue,Place,Region,Country\n";

    students.forEach(s => {
        csvContent += `"${s.id}","${s.name}","${s.gender || 'Male'}","${s.course}","${s.year || '2nd Year'}",${s.attendance},${s.cgpa},${s.credits || 24},${s.lms_score || s.attendance},${s.risk},"${s.father || ''}","${s.mother || ''}","${s.mother_tongue || s.motherTongue || ''}","${s.place || ''}","${s.region || ''}","${s.country || 'India'}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EduStudent_Sight_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 3. Markdown Export
function exportReportMarkdown() {
    const today = new Date().toISOString().split('T')[0];
    let md = `# EduStudent Sight — Academic Intelligence Report (${today})\n\n`;
    md += `## Cohort Overview\n- Total Monitored: **${students.length} Students**\n- High Risk Count: **${students.filter(s => s.risk >= 60).length}**\n\n`;
    md += `## Student Risk Roster\n\n`;
    md += `| ID | Name | Course | Year | Attendance | CGPA | Risk Score |\n`;
    md += `|---|---|---|---|---|---|---|\n`;

    students.forEach(s => {
        md += `| ${s.id} | ${s.name} | ${s.course} | ${s.year || '2nd Year'} | ${s.attendance}% | ${s.cgpa} | **${s.risk}%** |\n`;
    });

    md += `\n\n---\n*Report generated by EduStudent Sight Autonomous AI Platform.*`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Academic_Report_${today}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 4. System Log Export
function exportReportLog() {
    const today = new Date().toISOString();
    let log = `[${today}] [SYSTEM_AUDIT] EduStudent Sight Academic Report Exported\n`;
    log += `[INFO] Monitored Student Count: ${students.length}\n`;
    students.forEach(s => {
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
