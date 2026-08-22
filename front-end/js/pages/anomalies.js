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
                <h1 class="h3 fw-bold mb-1">AI-Detected Engagement Anomalies</h1>
                <p class="text-muted small mb-0">Autonomous telemetry triggers flagging sudden drops in subject attendance, exam scores & platform inactivity</p>
            </div>
            <span class="badge bg-danger fs-6 px-3 py-2">
                <i class="bi bi-bell-fill me-1"></i> ${totalAnomaliesCount} Active Signals
            </span>
        </div>

        <!-- EXPLAINER CARD -->
        <div class="card-box p-4 mb-4" style="border-left: 4px solid var(--danger);">
            <div class="d-flex align-items-start gap-3">
                <div class="fs-2 text-danger"><i class="bi bi-shield-exclamation"></i></div>
                <div>
                    <h5 class="fw-bold mb-1" style="color: var(--text);">What are AI Academic Anomalies?</h5>
                    <p class="small mb-0" style="color: var(--text-soft);">
                        Our background autonomous engine continuously compares individual student indicators against historical trends and department threshold rules. When a metric breaches safe thresholds (e.g. subject attendance falling below cutoff or internal test scores below passing marks), an anomaly trigger is generated to alert advisors before mid-semester exams.
                    </p>
                </div>
            </div>
        </div>

        <!-- ANOMALIES LIST -->
        ${totalAnomaliesCount === 0 ? `
            <div class="card-box text-center py-5">
                <i class="bi bi-check-circle-fill text-success fs-1 d-block mb-3"></i>
                <h4 class="fw-bold" style="color: var(--text);">All Telemetry Signals are Healthy!</h4>
                <p class="small" style="color: var(--text-soft);">No attendance drops or score anomalies detected across the monitored cohort.</p>
            </div>
        ` : `
            <div class="row g-4">
                ${anomalyRecords.flatMap(item => {
                    return (item.anomalies || []).map(ano => {
                        const isHigh = ano.severity === 'High';
                        const badgeClass = isHigh ? 'bg-danger text-white' : 'bg-warning text-dark';
                        const iconClass = isHigh ? 'bi-exclamation-octagon-fill text-danger' : 'bi-exclamation-triangle-fill text-warning';
                        const riskBadgeClass = item.risk >= 60 ? 'high' : (item.risk >= 30 ? 'medium' : 'low');

                        return `
                            <div class="col-xl-4 col-md-6">
                                <div class="card-box p-4 h-100 d-flex flex-column justify-content-between anomaly-card-modern mb-0" style="border-top: 4px solid ${isHigh ? 'var(--risk-high)' : 'var(--warning)'};">
                                    <div>
                                        <!-- Header -->
                                        <div class="d-flex justify-content-between align-items-start mb-3">
                                            <div class="d-flex align-items-center gap-2">
                                                <i class="bi ${iconClass} fs-5"></i>
                                                <h5 class="fw-bold mb-0" style="color: var(--text); font-size: 15px;">${ano.type}</h5>
                                            </div>
                                            <span class="badge ${badgeClass}" style="font-size: 11px;">${ano.severity}</span>
                                        </div>

                                        <!-- Student Info Row -->
                                        <div class="p-2 px-3 rounded mb-3 d-flex justify-content-between align-items-center" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                            <div>
                                                <strong style="color: var(--text); font-size: 13px;">${item.student_name}</strong>
                                                <code class="ms-1">${item.student_id}</code>
                                            </div>
                                            <span class="risk-badge ${riskBadgeClass}">${item.risk}%</span>
                                        </div>

                                        <!-- Signal Badges -->
                                        <div class="d-flex justify-content-between align-items-center mb-3 small" style="color: var(--text-soft); font-size: 12px;">
                                            <span><i class="bi bi-clock me-1 text-primary"></i> Attd: <strong>${item.attendance}%</strong></span>
                                            <span><i class="bi bi-award me-1 text-warning"></i> CGPA: <strong>${item.cgpa}</strong></span>
                                            <span><i class="bi bi-cpu me-1 text-info"></i> LMS: <strong>${item.lms_score || item.attendance}%</strong></span>
                                        </div>

                                        <!-- Anomaly Message Box -->
                                        <div class="p-3 rounded mb-3" style="background: var(--bg-sunken); border: 1px solid var(--border-soft); color: var(--text); font-size: 12.5px; line-height: 1.5;">
                                            <i class="bi bi-info-circle text-primary me-1"></i> ${ano.message}
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div class="d-flex gap-2 pt-3 border-top" style="border-color: var(--border-soft) !important;">
                                        <button class="btn btn-sm btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-1" onclick="viewStudent360('${item.student_id}')">
                                            <i class="bi bi-person-vcard"></i> 360° Profile
                                        </button>
                                        <button class="primary-btn btn-sm w-50 d-flex align-items-center justify-content-center gap-1" onclick="quickCreateIntervention('${item.student_id}', 'Intervene on ${ano.type}', 'General', '${ano.severity}')">
                                            <i class="bi bi-calendar-plus"></i> Outreach
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }).join("")}
            </div>
        `}
    `;
}
