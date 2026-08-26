/* =====================================================
   ANOMALIES.JS
   Executive AI-Driven Anomaly Detection & Triage Radar
   Supports Scalable Cohort Telemetry, Category Analytics,
   Multi-Filter Triage, Paginated Cards & Compact Table View
===================================================== */

let anomalyCategoryChart = null;
let anomalySeverityChart = null;

// Global UI State
window._anomalyState = window._anomalyState || {
    page: 1,
    pageSize: 12,
    search: "",
    filterTab: "ALL", // "ALL", "HIGH", "MODERATE", "ATTENDANCE", "LMS", "SUBJECT"
    sortBy: "risk_desc", // "risk_desc", "risk_asc", "attd_asc", "name_asc"
    viewMode: "cards" // "cards" | "table"
};

window._cachedAnomalyItems = [];

async function renderAnomalies() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    if (students.length === 0) {
        await loadLatestStudents();
        if (typeof currentActivePage !== "undefined" && currentActivePage !== "anomalies") return;
    }

    // Fetch live anomalies from backend
    const rawRecords = await API.getAnomalies() || [];

    // Flatten into individual anomaly items for granular triage
    const flattened = [];
    rawRecords.forEach(item => {
        (item.anomalies || []).forEach(ano => {
            let cat = "Subject";
            const lowerType = (ano.type || "").toLowerCase();
            if (lowerType.includes("attendance drop") || lowerType.includes("attendance severely") || lowerType.includes("overall attendance")) {
                cat = "Attendance";
            } else if (lowerType.includes("lms") || lowerType.includes("inactivity")) {
                cat = "LMS";
            } else if (lowerType.includes("subject") || lowerType.includes("exam") || lowerType.includes("failure")) {
                cat = "Subject";
            }

            flattened.push({
                student_id: item.student_id,
                student_name: item.student_name,
                attendance: Number(item.attendance || 0),
                cgpa: Number(item.cgpa || 0),
                lms_score: Number(item.lms_score != null ? item.lms_score : item.attendance || 0),
                course: item.course || "CSE",
                year: item.year || "2nd Year",
                risk: Number(item.risk || 0),
                type: ano.type || "Academic Anomaly",
                severity: ano.severity || (item.risk >= 60 ? "High" : "Moderate"),
                message: ano.message || "Anomalous metric breach detected.",
                category: cat
            });
        });
    });

    window._cachedAnomalyItems = flattened;

    const totalAnomaliesCount = flattened.length;
    const totalStudentsFlagged = new Set(flattened.map(i => i.student_id)).size;
    const totalCohort = students.length || 1;
    const anomalyRate = Math.round((totalStudentsFlagged / totalCohort) * 100);

    const highCount = flattened.filter(i => i.severity === 'High').length;
    const modCount = flattened.filter(i => i.severity !== 'High').length;
    const attdCount = flattened.filter(i => i.category === 'Attendance').length;
    const lmsCount = flattened.filter(i => i.category === 'LMS').length;
    const subjCount = flattened.filter(i => i.category === 'Subject').length;

    // Update sidebar badge
    const badge = document.getElementById("anomalyBadge");
    if (badge) badge.textContent = totalAnomaliesCount;

    // Primary driver determination for dynamic AI banner
    let primaryDriver = "physical attendance drops";
    if (lmsCount > attdCount && lmsCount > subjCount) {
        primaryDriver = "digital LMS platform inactivity";
    } else if (subjCount > attdCount && subjCount > lmsCount) {
        primaryDriver = "subject-specific exam score breaches";
    }

    content.innerHTML = `
        <!-- HEADER -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">AI-Detected Academic Anomalies</h1>
                <p class="text-muted small mb-0">Autonomous telemetry radar detecting acute drops in attendance, LMS streaks & exam signals</p>
            </div>
            <div class="d-flex gap-2 flex-wrap align-items-center">
                <button class="secondary-btn" onclick="exportAnomaliesCSV()">
                    <i class="bi bi-file-earmark-arrow-down text-success"></i> Export Audit CSV
                </button>
                <span class="badge ${highCount > 0 ? 'bg-danger' : 'bg-success'} fs-6 px-3 py-2">
                    <i class="bi bi-bell-fill me-1"></i> ${totalAnomaliesCount} Signals (${totalStudentsFlagged} Students)
                </span>
            </div>
        </div>

        <!-- 1. EXECUTIVE KPI SUMMARY TILES -->
        <div class="row g-3 mb-4">
            <div class="col-xl-3 col-md-6">
                <div class="anomaly-kpi-card kpi-total">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Active Triggers</span>
                    <h2 class="fw-bold mb-0 text-dark">${totalAnomaliesCount} <span class="fs-6 text-muted fw-normal">Signals</span></h2>
                    <small class="text-primary mt-2 d-inline-flex align-items-center"><i class="bi bi-people-fill me-1"></i> Across ${totalStudentsFlagged} Students</small>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="anomaly-kpi-card kpi-critical">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Critical Severity</span>
                    <h2 class="fw-bold mb-0 text-danger">${highCount} <span class="fs-6 text-muted fw-normal">Urgent</span></h2>
                    <small class="text-danger mt-2 d-inline-flex align-items-center"><i class="bi bi-shield-slash-fill me-1"></i> Action Required</small>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="anomaly-kpi-card kpi-warning">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Early Warnings</span>
                    <h2 class="fw-bold mb-0 text-warning">${modCount} <span class="fs-6 text-muted fw-normal">Moderate</span></h2>
                    <small class="text-warning mt-2 d-inline-flex align-items-center"><i class="bi bi-clock-history me-1"></i> Under Observation</small>
                </div>
            </div>
            <div class="col-xl-3 col-md-6">
                <div class="anomaly-kpi-card kpi-rate">
                    <span class="text-muted small d-block mb-1 text-uppercase fw-semibold" style="letter-spacing: 0.5px;">Cohort Anomaly Rate</span>
                    <h2 class="fw-bold mb-0" style="color: #8b5cf6;">${anomalyRate}% <span class="fs-6 text-muted fw-normal">Affected</span></h2>
                    <small style="color: #8b5cf6;" class="mt-2 d-inline-flex align-items-center"><i class="bi bi-pie-chart-fill me-1"></i> ${totalCohort} Total Enrolled</small>
                </div>
            </div>
        </div>

        <!-- 2. AI COHORT DIAGNOSTIC SYNTHESIS BANNER -->
        <div class="anomaly-insight-banner mb-4">
            <div class="d-flex align-items-start gap-3">
                <div class="stat-icon-box" style="background: rgba(37, 99, 235, 0.15); color: var(--accent); width: 42px; height: 42px; font-size: 20px;">
                    <i class="bi bi-cpu-fill"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                        <h5 class="fw-bold mb-0" style="color: var(--text);">
                            <i class="bi bi-stars text-warning me-1"></i> Autonomous Cohort Diagnostic Summary
                        </h5>
                        <span class="badge bg-primary-subtle text-primary fw-semibold">Real-time Telemetry Synthesis</span>
                    </div>
                    <p class="small mb-3" style="color: var(--text-soft); line-height: 1.6;">
                        ${totalAnomaliesCount > 0 
                            ? `Continuous telemetry scans identified <strong>${totalAnomaliesCount}</strong> metric breaches across <strong>${totalStudentsFlagged}</strong> students. Primary cohort vulnerability is driven by <strong>${primaryDriver}</strong> (${attdCount} attendance drops, ${lmsCount} LMS inactivity streaks, ${subjCount} course-level risks). Recommended triage: dispatch batch warnings and initiate 1-on-1 advisor sessions.`
                            : `All academic indicators across the ${totalCohort} monitored students are currently operating within nominal departmental thresholds. No severe attendance drops or exam failures detected.`
                        }
                    </p>
                    <div class="d-flex flex-wrap gap-2 align-items-center">
                        <button class="primary-btn btn-sm d-inline-flex align-items-center gap-1" onclick="navigateTo('mentor')">
                            <i class="bi bi-person-lines-fill"></i> Open Mentorship Priority
                        </button>
                        <button class="secondary-btn btn-sm d-inline-flex align-items-center gap-1" onclick="exportAnomaliesCSV()">
                            <i class="bi bi-download"></i> Download Full Anomaly Dataset
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 3. VISUAL ANALYTICS BREAKDOWN -->
        <div class="row g-4 mb-4">
            <div class="col-lg-5">
                <div class="card-box h-100">
                    <div class="card-head d-flex justify-content-between align-items-center mb-3">
                        <h3 class="fw-bold mb-0 fs-6">
                            <i class="bi ${totalAnomaliesCount === 0 ? 'bi-shield-check text-success' : 'bi-pie-chart text-primary'} me-2"></i>
                            ${totalAnomaliesCount === 0 ? 'Cohort Telemetry Health' : 'Triggers by Category'}
                        </h3>
                        <span class="text-muted small">${totalAnomaliesCount === 0 ? '100% Nominal Status' : 'Distribution breakdown'}</span>
                    </div>
                    <div style="position: relative; height: 230px;">
                        <canvas id="anomalyCategoryCanvas"></canvas>
                    </div>
                </div>
            </div>

            <div class="col-lg-7">
                <div class="card-box h-100">
                    <div class="card-head d-flex justify-content-between align-items-center mb-3">
                        <h3 class="fw-bold mb-0 fs-6">
                            <i class="bi ${totalAnomaliesCount === 0 ? 'bi-graph-up-arrow text-success' : 'bi-bar-chart-fill text-danger'} me-2"></i>
                            ${totalAnomaliesCount === 0 ? 'Metric Safety Margins vs Cutoffs' : 'Severity & Trigger Class Breakdown'}
                        </h3>
                        <span class="text-muted small">${totalAnomaliesCount === 0 ? 'Benchmark Compliance (%)' : 'High vs Moderate signals'}</span>
                    </div>
                    <div style="position: relative; height: 230px;">
                        <canvas id="anomalySeverityCanvas"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. INTERACTIVE MULTI-FILTER & SEARCH TOOLBAR -->
        <div class="card-box p-3 mb-4">
            <div class="row g-3 align-items-center">
                <!-- Search -->
                <div class="col-xl-4 col-lg-5">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search text-primary"></i></span>
                        <input type="text" id="anomalySearchInput" class="form-control" placeholder="Search student name, ID, course, or metric..." value="${window._anomalyState.search}" oninput="handleAnomalySearch(this.value)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        ${window._anomalyState.search ? `<button class="btn btn-outline-secondary" type="button" onclick="handleAnomalySearch('')"><i class="bi bi-x"></i></button>` : ''}
                    </div>
                </div>

                <!-- Sort -->
                <div class="col-xl-3 col-lg-3 col-md-6">
                    <select id="anomalySortSelect" class="form-select form-select-sm" onchange="handleAnomalySort(this.value)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="risk_desc" ${window._anomalyState.sortBy === 'risk_desc' ? 'selected' : ''}>Risk: Highest First</option>
                        <option value="risk_asc" ${window._anomalyState.sortBy === 'risk_asc' ? 'selected' : ''}>Risk: Lowest First</option>
                        <option value="attd_asc" ${window._anomalyState.sortBy === 'attd_asc' ? 'selected' : ''}>Attendance: Lowest First</option>
                        <option value="name_asc" ${window._anomalyState.sortBy === 'name_asc' ? 'selected' : ''}>Student Name (A-Z)</option>
                    </select>
                </div>

                <!-- View Mode (Cards vs Table) -->
                <div class="col-xl-5 col-lg-4 col-md-6 text-end">
                    <div class="chart-toggle-group">
                        <button class="chart-toggle-btn ${window._anomalyState.viewMode === 'cards' ? 'active' : ''}" onclick="setAnomalyViewMode('cards')" title="Card Grid View">
                            <i class="bi bi-grid-fill"></i> Grid View
                        </button>
                        <button class="chart-toggle-btn ${window._anomalyState.viewMode === 'table' ? 'active' : ''}" onclick="setAnomalyViewMode('table')" title="Compact Table View">
                            <i class="bi bi-table"></i> Compact Table
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filter Tabs Pills -->
            <div class="d-flex flex-wrap gap-2 mt-3 pt-3 border-top" style="border-color: var(--border-soft) !important;">
                <button class="anomaly-filter-pill ${window._anomalyState.filterTab === 'ALL' ? 'active' : ''}" data-tab="ALL" onclick="setAnomalyFilterTab('ALL', this)">
                    All Signals <span class="pill-count">${totalAnomaliesCount}</span>
                </button>
                <button class="anomaly-filter-pill ${window._anomalyState.filterTab === 'HIGH' ? 'active' : ''}" data-tab="HIGH" onclick="setAnomalyFilterTab('HIGH', this)">
                    <i class="bi bi-exclamation-octagon-fill text-danger"></i> Critical <span class="pill-count">${highCount}</span>
                </button>
                <button class="anomaly-filter-pill ${window._anomalyState.filterTab === 'MODERATE' ? 'active' : ''}" data-tab="MODERATE" onclick="setAnomalyFilterTab('MODERATE', this)">
                    <i class="bi bi-exclamation-triangle-fill text-warning"></i> Moderate <span class="pill-count">${modCount}</span>
                </button>
                <button class="anomaly-filter-pill ${window._anomalyState.filterTab === 'ATTENDANCE' ? 'active' : ''}" data-tab="ATTENDANCE" onclick="setAnomalyFilterTab('ATTENDANCE', this)">
                    <i class="bi bi-clock-history text-primary"></i> Attendance Drops <span class="pill-count">${attdCount}</span>
                </button>
                <button class="anomaly-filter-pill ${window._anomalyState.filterTab === 'LMS' ? 'active' : ''}" data-tab="LMS" onclick="setAnomalyFilterTab('LMS', this)">
                    <i class="bi bi-cpu text-info"></i> LMS Inactivity <span class="pill-count">${lmsCount}</span>
                </button>
                <button class="anomaly-filter-pill ${window._anomalyState.filterTab === 'SUBJECT' ? 'active' : ''}" data-tab="SUBJECT" onclick="setAnomalyFilterTab('SUBJECT', this)">
                    <i class="bi bi-book text-success"></i> Subject Risks <span class="pill-count">${subjCount}</span>
                </button>
            </div>
        </div>

        <!-- 5. ANOMALIES CONTENT CONTAINER (Cards or Table with Pagination) -->
        <div id="anomalyListContainer">
            <!-- Populated by JS -->
        </div>

        <!-- 6. PAGINATION CONTROLS -->
        <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top flex-wrap gap-2" style="border-color: var(--border-soft) !important;">
            <div class="d-flex align-items-center gap-2">
                <label class="small text-muted mb-0">Items per page:</label>
                <select class="form-select form-select-sm" style="width: auto; background: var(--bg-elevated); color: var(--text); border-color: var(--border);" onchange="handleAnomalyPageSize(this.value)">
                    <option value="12" ${window._anomalyState.pageSize === 12 ? 'selected' : ''}>12</option>
                    <option value="24" ${window._anomalyState.pageSize === 24 ? 'selected' : ''}>24</option>
                    <option value="48" ${window._anomalyState.pageSize === 48 ? 'selected' : ''}>48</option>
                </select>
            </div>
            <div id="anomalyPaginationContainer" class="custom-pagination">
                <!-- Populated by JS -->
            </div>
        </div>
    `;

    // Render Charts
    initAnomalyCharts(attdCount, lmsCount, subjCount, highCount, modCount);

    // Render List Items
    renderFilteredAnomalyItems();
}

function initAnomalyCharts(attdCount, lmsCount, subjCount, highCount, modCount) {
    const totalAnomalies = attdCount + lmsCount + subjCount;
    const studentList = (typeof students !== 'undefined' && students.length) ? students : [];
    const totalCohort = studentList.length || 1;

    const items = window._cachedAnomalyItems || [];
    const attdHigh = items.filter(i => i.category === 'Attendance' && i.severity === 'High').length;
    const attdMod = items.filter(i => i.category === 'Attendance' && i.severity !== 'High').length;
    
    const lmsHigh = items.filter(i => i.category === 'LMS' && i.severity === 'High').length;
    const lmsMod = items.filter(i => i.category === 'LMS' && i.severity !== 'High').length;
    
    const subjHigh = items.filter(i => i.category === 'Subject' && i.severity === 'High').length;
    const subjMod = items.filter(i => i.category === 'Subject' && i.severity !== 'High').length;

    // 1. Category / Health Donut Chart
    const catCanvas = document.getElementById("anomalyCategoryCanvas");
    if (catCanvas) {
        if (anomalyCategoryChart) {
            try { anomalyCategoryChart.destroy(); } catch (e) {}
        }
        try {
            let donutLabels, donutData, donutColors;
            if (totalAnomalies === 0) {
                donutLabels = [`Nominal & Healthy: ${totalCohort} Students (100%)`];
                donutData = [totalCohort];
                donutColors = ["#10b981"];
            } else {
                const flaggedStudentIds = new Set(items.map(i => i.student_id));
                const healthyCount = Math.max(0, totalCohort - flaggedStudentIds.size);
                
                if (healthyCount > 0) {
                    donutLabels = [
                        `Attendance Drops: ${attdCount}`,
                        `LMS Inactivity: ${lmsCount}`,
                        `Subject Exam Risks: ${subjCount}`,
                        `Nominal Cohort: ${healthyCount}`
                    ];
                    donutData = [attdCount, lmsCount, subjCount, healthyCount];
                    donutColors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981"];
                } else {
                    donutLabels = [
                        `Attendance Drops: ${attdCount}`,
                        `LMS Inactivity: ${lmsCount}`,
                        `Subject Exam Risks: ${subjCount}`
                    ];
                    donutData = [attdCount, lmsCount, subjCount];
                    donutColors = ["#ef4444", "#3b82f6", "#10b981"];
                }
            }

            anomalyCategoryChart = new Chart(catCanvas.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: donutLabels,
                    datasets: [{
                        data: donutData,
                        backgroundColor: donutColors,
                        borderWidth: 2,
                        borderColor: "#ffffff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                boxWidth: 12,
                                font: { family: 'Inter', size: 11.5 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => {
                                    if (totalAnomalies === 0) {
                                        return ` 100% Operational (All ${totalCohort} students meet safety benchmarks)`;
                                    }
                                    return ` ${ctx.label}`;
                                }
                            }
                        }
                    }
                }
            });
            if (typeof registerChart === 'function') registerChart(anomalyCategoryChart);
            if (typeof applyChartTheme === 'function') applyChartTheme(anomalyCategoryChart);
        } catch (err) {
            console.error("Failed to render anomalyCategoryChart:", err);
        }
    }

    // 2. Severity & Class Bar / Benchmark Comparison
    const sevCanvas = document.getElementById("anomalySeverityCanvas");
    if (sevCanvas) {
        if (anomalySeverityChart) {
            try { anomalySeverityChart.destroy(); } catch (e) {}
        }
        try {
            let barLabels, barDatasets, barScales;
            
            if (totalAnomalies === 0) {
                // When 0 anomalies or low students with all healthy: Show Telemetry vs Safety Cutoffs
                const avgAttd = studentList.length ? Math.round(studentList.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / studentList.length) : 85;
                const avgLms = studentList.length ? Math.round(studentList.reduce((sum, s) => sum + Number(s.lms_score || s.attendance || 0), 0) / studentList.length) : 80;
                const avgCgpaPct = studentList.length ? Math.round(studentList.reduce((sum, s) => sum + Number(s.cgpa || 0) * 10, 0) / studentList.length) : 78;

                barLabels = ["Overall Attendance", "LMS Engagement", "Academic CGPA (x10)"];
                barDatasets = [
                    {
                        label: "Current Cohort Average (%)",
                        data: [avgAttd, avgLms, avgCgpaPct],
                        backgroundColor: "#10b981",
                        borderRadius: 6,
                        maxBarThickness: 42
                    },
                    {
                        label: "Mandatory Safety Cutoff (%)",
                        data: [75, 55, 70],
                        backgroundColor: "rgba(239, 68, 68, 0.45)",
                        borderColor: "#ef4444",
                        borderWidth: 1,
                        borderRadius: 6,
                        maxBarThickness: 42
                    }
                ];
                barScales = {
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            callback: v => v + "%",
                            stepSize: 20
                        },
                        grid: {
                            color: "var(--border-soft)"
                        }
                    },
                    x: {
                        ticks: {
                            font: { family: 'Inter', size: 11.5, weight: '600' }
                        },
                        grid: {
                            display: false
                        }
                    }
                };
            } else {
                // Standard Severity Breakdown
                const maxVal = Math.max(attdHigh, lmsHigh, subjHigh, attdMod, lmsMod, subjMod);
                barLabels = ["Overall Attendance", "LMS Engagement", "Course Exams / Labs"];
                barDatasets = [
                    {
                        label: "Critical Severity (Immediate Action)",
                        data: [attdHigh, lmsHigh, subjHigh],
                        backgroundColor: "#ef4444",
                        borderRadius: 6,
                        maxBarThickness: maxVal <= 10 ? 32 : 44
                    },
                    {
                        label: "Moderate Warning (Monitor)",
                        data: [attdMod, lmsMod, subjMod],
                        backgroundColor: "#f59e0b",
                        borderRadius: 6,
                        maxBarThickness: maxVal <= 10 ? 32 : 44
                    }
                ];
                barScales = {
                    y: {
                        beginAtZero: true,
                        suggestedMax: maxVal <= 5 ? Math.max(4, maxVal + 1) : undefined,
                        ticks: {
                            stepSize: maxVal <= 5 ? 1 : undefined,
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            font: { family: 'Inter', size: 11.5, weight: '600' }
                        },
                        grid: {
                            display: false
                        }
                    }
                };
            }

            anomalySeverityChart = new Chart(sevCanvas.getContext("2d"), {
                type: "bar",
                data: {
                    labels: barLabels,
                    datasets: barDatasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: barScales,
                    plugins: {
                        legend: {
                            position: "top",
                            labels: {
                                boxWidth: 12
                            }
                        }
                    }
                }
            });
            if (typeof registerChart === 'function') registerChart(anomalySeverityChart);
            if (typeof applyChartTheme === 'function') applyChartTheme(anomalySeverityChart);
        } catch (err) {
            console.error("Failed to render anomalySeverityChart:", err);
        }
    }
}

// ==========================================
// TRIAGE CONTROLS & FILTER HANDLERS
// ==========================================

function handleAnomalySearch(query) {
    window._anomalyState.search = (query || "").trim().toLowerCase();
    window._anomalyState.page = 1;
    renderFilteredAnomalyItems();
}

function handleAnomalySort(sortKey) {
    window._anomalyState.sortBy = sortKey;
    renderFilteredAnomalyItems();
}

function setAnomalyFilterTab(tab, btnEl) {
    window._anomalyState.filterTab = tab;
    window._anomalyState.page = 1;

    // Update pill styling
    const pills = document.querySelectorAll(".anomaly-filter-pill");
    pills.forEach(p => p.classList.remove("active"));
    if (btnEl) {
        btnEl.classList.add("active");
    } else {
        const found = document.querySelector(`.anomaly-filter-pill[data-tab="${tab}"]`);
        if (found) found.classList.add("active");
    }

    renderFilteredAnomalyItems();
}

function setAnomalyViewMode(mode) {
    window._anomalyState.viewMode = mode;
    renderFilteredAnomalyItems();
}

function handleAnomalyPageSize(size) {
    window._anomalyState.pageSize = parseInt(size, 10) || 12;
    window._anomalyState.page = 1;
    renderFilteredAnomalyItems();
}

function handleAnomalyPageChange(page) {
    window._anomalyState.page = page;
    renderFilteredAnomalyItems();
    
    // Smooth scroll to container top
    const container = document.getElementById("anomalyListContainer");
    if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderFilteredAnomalyItems() {
    const container = document.getElementById("anomalyListContainer");
    const pagContainer = document.getElementById("anomalyPaginationContainer");
    if (!container) return;

    const { search, filterTab, sortBy, page, pageSize, viewMode } = window._anomalyState;

    let items = [...(window._cachedAnomalyItems || [])];

    // Filter by Tab
    if (filterTab === "HIGH") {
        items = items.filter(i => i.severity === "High");
    } else if (filterTab === "MODERATE") {
        items = items.filter(i => i.severity !== "High");
    } else if (filterTab === "ATTENDANCE") {
        items = items.filter(i => i.category === "Attendance");
    } else if (filterTab === "LMS") {
        items = items.filter(i => i.category === "LMS");
    } else if (filterTab === "SUBJECT") {
        items = items.filter(i => i.category === "Subject");
    }

    // Filter by Search Query
    if (search) {
        items = items.filter(i => 
            (i.student_name || "").toLowerCase().includes(search) ||
            (i.student_id || "").toLowerCase().includes(search) ||
            (i.type || "").toLowerCase().includes(search) ||
            (i.message || "").toLowerCase().includes(search) ||
            (i.course || "").toLowerCase().includes(search)
        );
    }

    // Sort Items
    if (sortBy === "risk_desc") {
        items.sort((a, b) => b.risk - a.risk);
    } else if (sortBy === "risk_asc") {
        items.sort((a, b) => a.risk - b.risk);
    } else if (sortBy === "attd_asc") {
        items.sort((a, b) => a.attendance - b.attendance);
    } else if (sortBy === "name_asc") {
        items.sort((a, b) => (a.student_name || "").localeCompare(b.student_name || ""));
    }

    const totalFiltered = items.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const currentPage = Math.min(page, totalPages);
    window._anomalyState.page = currentPage;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalFiltered);
    const pageItems = items.slice(startIndex, endIndex);

    if (totalFiltered === 0) {
        if (!window._cachedAnomalyItems || window._cachedAnomalyItems.length === 0) {
            const studentList = (typeof students !== 'undefined' && students.length) ? students : [];
            container.innerHTML = `
                <div class="card-box p-4 text-center mb-4">
                    <div class="d-inline-flex p-3 rounded-circle mb-3" style="background: rgba(16, 185, 129, 0.12); color: var(--risk-low);">
                        <i class="bi bi-shield-check fs-1"></i>
                    </div>
                    <h4 class="fw-bold mb-1" style="color: var(--text);">Autonomous Telemetry Shield: 100% Nominal</h4>
                    <p class="small text-muted mb-4" style="max-width: 600px; margin: 0 auto;">
                        All ${studentList.length} monitored students are operating safely above minimum institutional thresholds. No acute drops in attendance, LMS streaks, or exam failure patterns detected.
                    </p>
                    <div class="table-responsive text-start">
                        <table class="custom-table" style="white-space: nowrap;">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>Course</th>
                                    <th>Attendance</th>
                                    <th>LMS Score</th>
                                    <th>CGPA</th>
                                    <th>Risk Level</th>
                                    <th>Telemetry Status</th>
                                    <th class="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${studentList.slice(0, 10).map(s => `
                                    <tr>
                                        <td><code>${s.id}</code></td>
                                        <td><strong>${s.name}</strong></td>
                                        <td>${s.course || 'CSE'}</td>
                                        <td><span class="badge bg-success-subtle text-success fw-semibold">${s.attendance || 0}%</span></td>
                                        <td><span class="badge bg-primary-subtle text-primary fw-semibold">${s.lms_score || s.attendance || 0}%</span></td>
                                        <td><strong>${s.cgpa || 0}</strong></td>
                                        <td><span class="risk-badge low">Low Risk (${s.risk || 0}%)</span></td>
                                        <td><span class="badge bg-success-subtle text-success"><i class="bi bi-check-circle-fill me-1"></i> Nominal</span></td>
                                        <td class="text-center">
                                            <button class="primary-btn btn-sm" onclick="navigateTo('student360')">View 360°</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            if (pagContainer) pagContainer.innerHTML = "";
            return;
        } else {
            container.innerHTML = `
                <div class="card-box text-center py-5">
                    <i class="bi bi-search text-muted fs-1 d-block mb-3"></i>
                    <h4 class="fw-bold" style="color: var(--text);">No Matching Anomalies Found</h4>
                    <p class="small text-muted">No anomaly triggers matched your filter or search keywords "${search}".</p>
                    <button class="secondary-btn btn-sm mt-2" onclick="handleAnomalySearch(''); setAnomalyFilterTab('ALL');">
                        <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
                    </button>
                </div>
            `;
            if (pagContainer) pagContainer.innerHTML = "";
            return;
        }
    }

    if (viewMode === "table") {
        // COMPACT TABLE VIEW
        container.innerHTML = `
            <div class="card-box p-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <span class="small" style="color: var(--text-soft);">
                        Showing <strong>${startIndex + 1}-${endIndex}</strong> of <strong>${totalFiltered}</strong> anomaly triggers
                    </span>
                </div>
                <div class="table-responsive">
                    <table class="custom-table" style="white-space: nowrap;">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Course</th>
                                <th>Anomaly Type</th>
                                <th>Severity</th>
                                <th>Attendance</th>
                                <th>CGPA</th>
                                <th>LMS Score</th>
                                <th>Risk %</th>
                                <th>Diagnostic Message</th>
                                <th class="text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pageItems.map(item => {
                                const isHigh = item.severity === 'High';
                                const badgeClass = isHigh ? 'bg-danger text-white' : 'bg-warning text-dark';
                                const riskBadgeClass = item.risk >= 60 ? 'high' : (item.risk >= 30 ? 'medium' : 'low');

                                return `
                                    <tr>
                                        <td><code>${item.student_id}</code></td>
                                        <td><strong>${item.student_name}</strong></td>
                                        <td>${item.course}</td>
                                        <td><span class="fw-semibold" style="color: var(--text);">${item.type}</span></td>
                                        <td><span class="badge ${badgeClass}">${item.severity}</span></td>
                                        <td><span class="${item.attendance < 75 ? 'text-danger fw-bold' : ''}">${item.attendance}%</span></td>
                                        <td>${item.cgpa}</td>
                                        <td>${item.lms_score}%</td>
                                        <td><span class="risk-badge ${riskBadgeClass}">${item.risk}%</span></td>
                                        <td style="max-width: 320px; white-space: normal; font-size: 12px; color: var(--text-soft);">
                                            ${item.message}
                                        </td>
                                        <td class="text-center">
                                            <div class="d-inline-flex gap-1">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="viewStudent360('${item.student_id}')" title="Student 360° Profile">
                                                    <i class="bi bi-person-vcard"></i>
                                                </button>
                                                <button class="btn btn-sm btn-outline-primary" onclick="quickCreateIntervention('${item.student_id}', 'Intervene on ${item.type.replace(/'/g, "\\'")}', 'General', '${item.severity}')" title="Outreach">
                                                    <i class="bi bi-calendar-plus"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } else {
        // CARD GRID VIEW (12 per page)
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="small" style="color: var(--text-soft);">
                    Showing <strong>${startIndex + 1}-${endIndex}</strong> of <strong>${totalFiltered}</strong> anomaly triggers ${totalFiltered !== window._cachedAnomalyItems.length ? `(filtered from ${window._cachedAnomalyItems.length})` : ''}
                </span>
            </div>
            <div class="row g-3">
                ${pageItems.map(item => {
                    const isHigh = item.severity === 'High';
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
                                            <h5 class="fw-bold mb-0" style="color: var(--text); font-size: 14.5px;">${item.type}</h5>
                                        </div>
                                        <span class="badge ${badgeClass}" style="font-size: 11px;">${item.severity}</span>
                                    </div>

                                    <!-- Student Info Row -->
                                    <div class="p-2 px-3 rounded mb-3 d-flex justify-content-between align-items-center" style="background: var(--bg-sunken); border: 1px solid var(--border-soft);">
                                        <div>
                                            <strong style="color: var(--text); font-size: 13px;">${item.student_name}</strong>
                                            <code class="ms-1">${item.student_id}</code>
                                        </div>
                                        <span class="risk-badge ${riskBadgeClass}">${item.risk}% Risk</span>
                                    </div>

                                    <!-- Signal Badges -->
                                    <div class="d-flex justify-content-between align-items-center mb-3 small" style="color: var(--text-soft); font-size: 12px;">
                                        <span><i class="bi bi-clock me-1 text-primary"></i> Attd: <strong class="${item.attendance < 75 ? 'text-danger' : 'text-success'}">${item.attendance}%</strong></span>
                                        <span><i class="bi bi-award me-1 text-warning"></i> CGPA: <strong>${item.cgpa}</strong></span>
                                        <span><i class="bi bi-cpu me-1 text-info"></i> LMS: <strong>${item.lms_score}%</strong></span>
                                    </div>

                                    <!-- Anomaly Message Box -->
                                    <div class="p-3 rounded mb-3" style="background: var(--bg-sunken); border: 1px solid var(--border-soft); color: var(--text); font-size: 12.5px; line-height: 1.5;">
                                        <i class="bi bi-info-circle text-primary me-1"></i> ${item.message}
                                    </div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="d-flex gap-2 pt-3 border-top" style="border-color: var(--border-soft) !important;">
                                    <button class="btn btn-sm btn-outline-secondary w-50 d-flex align-items-center justify-content-center gap-1" onclick="viewStudent360('${item.student_id}')">
                                        <i class="bi bi-person-vcard"></i> 360° Profile
                                    </button>
                                    <button class="primary-btn btn-sm w-50 d-flex align-items-center justify-content-center gap-1" onclick="quickCreateIntervention('${item.student_id}', 'Intervene on ${item.type.replace(/'/g, "\\'")}', 'General', '${item.severity}')">
                                        <i class="bi bi-calendar-plus"></i> Outreach
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
        `;
    }

    // Render Pagination Controls
    if (pagContainer) {
        if (totalPages <= 1) {
            pagContainer.innerHTML = "";
        } else {
            let pagHtml = `
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="handleAnomalyPageChange(1)" title="First Page">
                    <i class="bi bi-chevron-double-left"></i>
                </button>
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="handleAnomalyPageChange(${currentPage - 1})" title="Previous Page">
                    <i class="bi bi-chevron-left"></i>
                </button>
            `;

            let startP = Math.max(1, currentPage - 2);
            let endP = Math.min(totalPages, startP + 4);
            if (endP - startP < 4) {
                startP = Math.max(1, endP - 4);
            }

            for (let p = startP; p <= endP; p++) {
                pagHtml += `
                    <button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="handleAnomalyPageChange(${p})">
                        ${p}
                    </button>
                `;
            }

            pagHtml += `
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleAnomalyPageChange(${currentPage + 1})" title="Next Page">
                    <i class="bi bi-chevron-right"></i>
                </button>
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleAnomalyPageChange(${totalPages})" title="Last Page">
                    <i class="bi bi-chevron-double-right"></i>
                </button>
            `;

            pagContainer.innerHTML = pagHtml;
        }
    }
}

// CSV Export for Anomalies
function exportAnomaliesCSV() {
    const records = window._cachedAnomalyItems || [];
    if (records.length === 0) {
        alert("No anomalies available to export.");
        return;
    }

    let csv = "Student ID,Student Name,Course,Year,Attendance %,CGPA,LMS Score %,Risk %,Anomaly Type,Severity,Message\n";
    records.forEach(r => {
        csv += `"${r.student_id}","${r.student_name}","${r.course}","${r.year}",${r.attendance},${r.cgpa},${r.lms_score},${r.risk},"${r.type}","${r.severity}","${(r.message || "").replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `EduStudentSight_AI_Anomalies_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

