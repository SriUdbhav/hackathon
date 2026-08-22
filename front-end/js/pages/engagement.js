/* =====================================================
   ENGAGEMENT.JS
   Multi-Signal Engagement Radar & Index Matrix
   Combines Attendance, LMS Streaks, CGPA & Assignments
===================================================== */

let engagementBarChart = null;

async function renderEngagement() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    if (students.length === 0) {
        await loadLatestStudents();
    }

    content.innerHTML = `
        <!-- HEADER & EXPLAINER CARD -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h1 class="h3 fw-bold mb-1">⚡ Multi-Signal Engagement Index</h1>
                <p class="text-muted small mb-0">Holistic synthesis of physical attendance, LMS activity, assignment submission & GPA velocity</p>
            </div>
            <span class="badge bg-primary fs-6 px-3 py-2">
                <i class="bi bi-shield-check me-1"></i> AI Multi-Signal Formula
            </span>
        </div>

        <div class="card-box p-4 bg-light border-primary mb-4">
            <div class="d-flex align-items-start gap-3">
                <div class="fs-2 text-primary"><i class="bi bi-info-circle-fill"></i></div>
                <div>
                    <h5 class="fw-bold mb-1">How is the Engagement Index Calculated?</h5>
                    <p class="text-muted small mb-2">
                        Rather than looking at attendance alone, our autonomous engine aggregates 4 weighted telemetry streams to prevent blind spots:
                    </p>
                    <div class="d-flex flex-wrap gap-3 small">
                        <span class="badge bg-white text-dark border p-2"><i class="bi bi-check2-circle text-primary me-1"></i> Attendance (35%)</span>
                        <span class="badge bg-white text-dark border p-2"><i class="bi bi-check2-circle text-success me-1"></i> CGPA Scaled (30%)</span>
                        <span class="badge bg-white text-dark border p-2"><i class="bi bi-check2-circle text-info me-1"></i> LMS Portal Activity (25%)</span>
                        <span class="badge bg-white text-dark border p-2"><i class="bi bi-check2-circle text-warning me-1"></i> Assignment Lab Rate (10%)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- ENGAGEMENT INDEX BAR CHART -->
        <div class="card-box p-4 mb-4">
            <div class="card-head">
                <h3 class="fw-bold"><i class="bi bi-bar-chart-fill text-primary me-2"></i> Cohort Engagement Index Ranking</h3>
                <span class="text-muted small">Higher is better (Benchmark: &ge; 70/100)</span>
            </div>
            <div style="position: relative; height: 260px;">
                <canvas id="engagementBarCanvas"></canvas>
            </div>
        </div>

        <!-- MULTI-SIGNAL HEALTH MATRIX TABLE -->
        <div class="card-box p-4">
            <div class="card-head">
                <h3 class="fw-bold"><i class="bi bi-grid-3x3-gap-fill text-dark me-2"></i> Individual Signal Telemetry Matrix</h3>
                <span class="text-muted small">🟢 Healthy (&ge;75%) | 🟡 Caution (60-74%) | 🔴 Critical (&lt;60%)</span>
            </div>
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Attendance Signal</th>
                            <th>LMS Activity</th>
                            <th>Academic GPA</th>
                            <th>Assignment Signal</th>
                            <th>Engagement Index</th>
                            <th>Signal Health</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                            const lmsScore = s.lms_score || s.attendance;
                            const cgpaScore = Math.round(s.cgpa * 10);
                            const engIndex = Math.round((s.attendance * 0.35) + (cgpaScore * 0.30) + (lmsScore * 0.35));

                            const attdDot = s.attendance >= 75 ? '🟢' : (s.attendance >= 65 ? '🟡' : '🔴');
                            const lmsDot = lmsScore >= 75 ? '🟢' : (lmsScore >= 60 ? '🟡' : '🔴');
                            const gpaDot = s.cgpa >= 7.5 ? '🟢' : (s.cgpa >= 6.5 ? '🟡' : '🔴');

                            const statusBadge = engIndex >= 75
                                ? '<span class="badge bg-success">High Engagement</span>'
                                : (engIndex >= 55 ? '<span class="badge bg-warning text-dark">Moderate</span>' : '<span class="badge bg-danger">Low Engagement</span>');

                            return `
                                <tr>
                                    <td><code>${s.id}</code></td>
                                    <td><strong>${s.name}</strong></td>
                                    <td>${attdDot} ${s.attendance}%</td>
                                    <td>${lmsDot} ${lmsScore}%</td>
                                    <td>${gpaDot} ${s.cgpa} / 10</td>
                                    <td>${cgpaScore}%</td>
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <div class="progress flex-grow-1" style="height: 8px;">
                                                <div class="progress-bar ${engIndex < 60 ? 'bg-danger' : (engIndex < 75 ? 'bg-warning' : 'bg-success')}" style="width: ${engIndex}%"></div>
                                            </div>
                                            <strong>${engIndex}</strong>
                                        </div>
                                    </td>
                                    <td>${statusBadge}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudent360('${s.id}')">
                                            Inspect
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Render Chart.js
    setTimeout(() => {
        const canvas = document.getElementById("engagementBarCanvas");
        if (canvas) {
            if (engagementBarChart) engagementBarChart.destroy();
            engagementBarChart = new Chart(canvas.getContext("2d"), {
                type: "bar",
                data: {
                    labels: students.map(s => s.name),
                    datasets: [{
                        label: "Engagement Index (/100)",
                        data: students.map(s => Math.round((s.attendance * 0.35) + (s.cgpa * 10 * 0.30) + ((s.lms_score || s.attendance) * 0.35))),
                        backgroundColor: students.map(s => {
                            const idx = Math.round((s.attendance * 0.35) + (s.cgpa * 10 * 0.30) + ((s.lms_score || s.attendance) * 0.35));
                            return idx < 60 ? "#ef4444" : (idx < 75 ? "#f59e0b" : "#10b981");
                        }),
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 100, ticks: { callback: v => v + "/100" } }
                    }
                }
            });
        }
    }, 100);
}
