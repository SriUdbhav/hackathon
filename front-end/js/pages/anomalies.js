/* =====================================================
   ANOMALIES.JS
   AI-Driven Anomaly Detection Radar
   Fetches live telemetry triggers (Overall & Subject-level)
===================================================== */

async function renderAnomalies() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    // Fetch live anomalies from backend
    const anomalyRecords = await API.getAnomalies() || [];

    // Calculate total anomalies count
    let totalAnomaliesCount = 0;
    anomalyRecords.forEach(r => totalAnomaliesCount += (r.anomalies || []).length);

    // Update sidebar badge
    const badge = document.getElementById("anomalyBadge");
    if (badge) badge.textContent = totalAnomaliesCount;

    content.innerHTML = `
        <!-- HEADER -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">🔍 AI-Detected Engagement Anomalies</h1>
                <p class="text-muted small mb-0">Autonomous telemetry triggers flagging sudden drops in subject attendance, exam scores & platform inactivity</p>
            </div>
            <span class="badge bg-danger fs-6 px-3 py-2">
                <i class="bi bi-bell-fill me-1"></i> ${totalAnomaliesCount} Active Signals
            </span>
        </div>

        <!-- EXPLAINER CARD -->
        <div class="card-box p-4 bg-light border-danger mb-4">
            <div class="d-flex align-items-start gap-3">
                <div class="fs-2 text-danger"><i class="bi bi-shield-exclamation"></i></div>
                <div>
                    <h5 class="fw-bold mb-1 text-dark">What are AI Academic Anomalies?</h5>
                    <p class="text-muted small mb-0">
                        Our background autonomous engine continuously compares individual student indicators against historical trends and department threshold rules. When a metric breaches safe thresholds (e.g. subject attendance falling below cutoff or internal test scores below passing marks), an anomaly trigger is generated to alert advisors before mid-semester exams.
                    </p>
                </div>
            </div>
        </div>

        <!-- ANOMALIES LIST -->
        ${totalAnomaliesCount === 0 ? `
            <div class="card-box text-center py-5">
                <i class="bi bi-check-circle-fill text-success fs-1 d-block mb-3"></i>
                <h4 class="fw-bold text-dark">All Telemetry Signals are Healthy!</h4>
                <p class="text-muted small">No attendance drops or score anomalies detected across the monitored cohort.</p>
            </div>
        ` : `
            <div class="d-flex flex-column gap-3">
                ${anomalyRecords.map(item => {
                    return item.anomalies.map(ano => {
                        const isHigh = ano.severity === 'High';
                        const borderClass = isHigh ? 'border-danger' : 'border-warning';
                        const badgeClass = isHigh ? 'bg-danger' : 'bg-warning text-dark';
                        const iconClass = isHigh ? 'bi-exclamation-octagon-fill text-danger' : 'bi-exclamation-triangle-fill text-warning';

                        return `
                            <div class="card-box p-4 border-start border-4 ${borderClass} mb-0">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <h5 class="fw-bold mb-1 text-dark">
                                            <i class="bi ${iconClass} me-2"></i> ${ano.type}
                                        </h5>
                                        <span class="text-muted small">
                                            Student: <strong>${item.student_name}</strong> (<code>${item.student_id}</code>) • Attendance: <strong>${item.attendance}%</strong> • Risk: <strong>${item.risk}%</strong>
                                        </span>
                                    </div>
                                    <span class="badge ${badgeClass}">${ano.severity} Severity</span>
                                </div>
                                <p class="text-dark small mb-3 bg-white p-2 border rounded">
                                    <i class="bi bi-info-circle text-primary me-1"></i> ${ano.message}
                                </p>
                                <div class="d-flex gap-2 justify-content-end">
                                    <button class="btn btn-sm btn-outline-danger" onclick="viewStudent360('${item.student_id}')">
                                        <i class="bi bi-person-vcard"></i> Review 360° Profile
                                    </button>
                                    <button class="btn btn-sm btn-primary" onclick="quickCreateIntervention('${item.student_id}', 'Intervene on ${ano.type}', 'General', '${ano.severity}')">
                                        <i class="bi bi-person-video"></i> Immediate Outreach
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join("");
                }).join("")}
            </div>
        `}
    `;
}
