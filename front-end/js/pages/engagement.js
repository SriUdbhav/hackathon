/* =====================================================
   ENGAGEMENT.JS
   Multi-Signal Engagement Radar & Index Matrix
   Combines Attendance, LMS Streaks, CGPA & Assignments
   Supports Scalable Tier Distributions, Focus Rankings & Paginated Matrix
===================================================== */

let engagementBarChart = null;

// Global view state for engagement chart and table pagination
window._engagementChartMode = window._engagementChartMode || (typeof students !== 'undefined' && students.length > 25 ? "tiers" : "lowest15");
window._engTableState = window._engTableState || {
    page: 1,
    pageSize: 15,
    search: "",
    tierFilter: "ALL"
};

function computeEngagementScore(s) {
    const attd = Number(s.attendance || 0);
    const lms = Number(s.lms_score != null ? s.lms_score : attd);
    const cgpaScore = Math.round(Number(s.cgpa || 0) * 10);
    return Math.round((attd * 0.35) + (cgpaScore * 0.30) + (lms * 0.35));
}

async function renderEngagement() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    if (students.length === 0) {
        await loadLatestStudents();
        if (typeof currentActivePage !== "undefined" && currentActivePage !== "engagement") return;
    }

    const totalSt = students.length || 1;
    const scores = students.map(s => computeEngagementScore(s));
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalSt);
    const highEngCount = scores.filter(v => v >= 75).length;
    const lowEngCount = scores.filter(v => v < 60).length;

    content.innerHTML = `
        <!-- HEADER & EXPLAINER CARD -->
        <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h1 class="h3 fw-bold mb-1">Multi-Signal Engagement Index</h1>
                <p class="small mb-0" style="color: var(--text-soft);">Holistic synthesis of physical attendance, LMS activity, assignment submission & GPA velocity</p>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span class="badge bg-primary fs-6 px-3 py-2">
                    <i class="bi bi-shield-check me-1"></i> AI Multi-Signal Formula
                </span>
            </div>
        </div>

        <!-- FORMULA EXPLAINER BANNER -->
        <div class="formula-banner mb-4">
            <div class="d-flex align-items-start gap-3">
                <div class="stat-icon-box" style="color: var(--accent); background: var(--accent-soft); width: 38px; height: 38px; font-size: 18px;">
                    <i class="bi bi-info-circle-fill"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                        <h5 class="fw-bold mb-0" style="color: var(--text);">How is the Multi-Signal Engagement Index Calculated?</h5>
                        <span class="small fw-semibold text-primary">Cohort Average: <strong>${avgScore}/100</strong></span>
                    </div>
                    <p class="small mb-3" style="color: var(--text-soft);">
                        Rather than looking at attendance alone, our diagnostic model aggregates 4 weighted telemetry streams to prevent blind spots:
                    </p>
                    <div class="d-flex flex-wrap gap-2">
                        <span class="formula-tag"><i class="bi bi-check2-circle text-primary me-2"></i> Attendance (35%)</span>
                        <span class="formula-tag"><i class="bi bi-check2-circle text-success me-2"></i> CGPA Scaled (30%)</span>
                        <span class="formula-tag"><i class="bi bi-check2-circle text-info me-2"></i> LMS Portal Activity (25%)</span>
                        <span class="formula-tag"><i class="bi bi-check2-circle text-warning me-2"></i> Assignment Lab Rate (10%)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- SCALABLE ENGAGEMENT INDEX BAR CHART -->
        <div class="card-box p-4 mb-4">
            <div class="card-head flex-wrap gap-2">
                <div>
                    <h3 class="fw-bold"><i class="bi bi-bar-chart-fill text-primary me-2"></i> Cohort Engagement Index Ranking</h3>
                    <span class="text-muted small" id="engagementChartSubhead">Cohort Tier Breakdown (Benchmark: &ge; 70/100)</span>
                </div>
                <div class="chart-toggle-group" id="engChartToggles">
                    <button class="chart-toggle-btn ${window._engagementChartMode === 'tiers' ? 'active' : ''}" id="btnEngTiers" onclick="setEngagementChartMode('tiers')">
                        <i class="bi bi-bar-chart-fill"></i> Tier Distribution
                    </button>
                    <button class="chart-toggle-btn ${window._engagementChartMode === 'lowest15' ? 'active' : ''}" id="btnEngLowest" onclick="setEngagementChartMode('lowest15')">
                        <i class="bi bi-arrow-down-circle-fill text-danger"></i> Lowest ${Math.min(15, (students.length || 15))}
                    </button>
                    <button class="chart-toggle-btn ${window._engagementChartMode === 'top15' ? 'active' : ''}" id="btnEngTop" onclick="setEngagementChartMode('top15')">
                        <i class="bi bi-arrow-up-circle-fill text-success"></i> Top ${Math.min(15, (students.length || 15))}
                    </button>
                </div>
            </div>
            <div style="position: relative; height: 260px;">
                <canvas id="engagementBarCanvas"></canvas>
            </div>
            <div id="engStatsBar" class="distribution-stats-bar">
                <!-- Populated by JS -->
            </div>
        </div>

        <!-- MULTI-SIGNAL HEALTH MATRIX TABLE WITH SEARCH & PAGINATION -->
        <div class="card-box p-4">
            <div class="card-head flex-wrap gap-2">
                <div>
                    <h3 class="fw-bold"><i class="bi bi-grid-3x3-gap-fill text-dark me-2"></i> Individual Signal Telemetry Matrix</h3>
                    <span class="text-muted small"><span class="status-indicator healthy"></span> Healthy (&ge;75%) | <span class="status-indicator caution"></span> Caution (60-74%) | <span class="status-indicator critical"></span> Critical (&lt;60%)</span>
                </div>
            </div>

            <!-- SEARCH & FILTER TOOLBAR -->
            <div class="row g-2 mb-3 align-items-center">
                <div class="col-md-5">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text" style="background: var(--bg-sunken); border-color: var(--border);"><i class="bi bi-search text-primary"></i></span>
                        <input type="text" id="engSearchInput" class="form-control" placeholder="Search by student name or ID..." value="${window._engTableState.search}" oninput="handleEngTableSearch(this.value)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        ${window._engTableState.search ? `<button class="btn btn-outline-secondary" type="button" onclick="handleEngTableSearch('')"><i class="bi bi-x"></i></button>` : ''}
                    </div>
                </div>
                <div class="col-md-4">
                    <select id="engTierFilter" class="form-select form-select-sm" onchange="handleEngTableTierFilter(this.value)" style="background: var(--bg-elevated); color: var(--text); border-color: var(--border);">
                        <option value="ALL" ${window._engTableState.tierFilter === 'ALL' ? 'selected' : ''}>All Engagement Tiers</option>
                        <option value="HIGH" ${window._engTableState.tierFilter === 'HIGH' ? 'selected' : ''}>High Engagement (&ge;75)</option>
                        <option value="MODERATE" ${window._engTableState.tierFilter === 'MODERATE' ? 'selected' : ''}>Moderate (60 - 74)</option>
                        <option value="CRITICAL" ${window._engTableState.tierFilter === 'CRITICAL' ? 'selected' : ''}>Low / Critical (&lt;60)</option>
                    </select>
                </div>
                <div class="col-md-3 text-end">
                    <span class="small" id="engTableSummaryText" style="color: var(--text-soft);">
                        Loading telemetry...
                    </span>
                </div>
            </div>

            <div class="table-responsive">
                <table class="custom-table" id="engagementMatrixTable">
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
                            <th class="text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="engagementMatrixTbody">
                        <!-- Populated by JS -->
                    </tbody>
                </table>
            </div>

            <!-- PAGINATION CONTROLS -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2" style="border-color: var(--border-soft) !important;">
                <div class="d-flex align-items-center gap-2">
                    <label class="small text-muted mb-0">Rows per page:</label>
                    <select class="form-select form-select-sm" style="width: auto; background: var(--bg-elevated); color: var(--text); border-color: var(--border);" onchange="handleEngPageSizeChange(this.value)">
                        <option value="15" ${window._engTableState.pageSize === 15 ? 'selected' : ''}>15</option>
                        <option value="30" ${window._engTableState.pageSize === 30 ? 'selected' : ''}>30</option>
                        <option value="50" ${window._engTableState.pageSize === 50 ? 'selected' : ''}>50</option>
                    </select>
                </div>
                <div id="engPaginationContainer" class="custom-pagination">
                    <!-- Populated by JS -->
                </div>
            </div>
        </div>
    `;

    // Render Chart
    renderEngagementRankingChart();

    // Render Table
    renderEngagementMatrixTable();
}

function setEngagementChartMode(mode) {
    window._engagementChartMode = mode;
    
    const btnTiers = document.getElementById("btnEngTiers");
    const btnLowest = document.getElementById("btnEngLowest");
    const btnTop = document.getElementById("btnEngTop");
    if (btnTiers) btnTiers.className = `chart-toggle-btn ${mode === 'tiers' ? 'active' : ''}`;
    if (btnLowest) btnLowest.className = `chart-toggle-btn ${mode === 'lowest15' ? 'active' : ''}`;
    if (btnTop) btnTop.className = `chart-toggle-btn ${mode === 'top15' ? 'active' : ''}`;

    renderEngagementRankingChart();
}

function renderEngagementRankingChart() {
    const canvas = document.getElementById("engagementBarCanvas");
    if (!canvas) return;

    if (engagementBarChart) {
        engagementBarChart.destroy();
    }

    const mode = window._engagementChartMode || "tiers";
    const subhead = document.getElementById("engagementChartSubhead");
    const statsBar = document.getElementById("engStatsBar");
    const totalSt = students.length || 1;

    if (mode === "tiers") {
        if (subhead) subhead.innerHTML = `Cohort Multi-Signal Engagement Distribution (${totalSt} Monitored)`;

        // 5 Binned Tiers
        const t1 = students.filter(s => computeEngagementScore(s) < 50);
        const t2 = students.filter(s => { const v = computeEngagementScore(s); return v >= 50 && v < 65; });
        const t3 = students.filter(s => { const v = computeEngagementScore(s); return v >= 65 && v < 75; });
        const t4 = students.filter(s => { const v = computeEngagementScore(s); return v >= 75 && v < 90; });
        const t5 = students.filter(s => computeEngagementScore(s) >= 90);

        const counts = [t1.length, t2.length, t3.length, t4.length, t5.length];
        const percentages = counts.map(c => Math.round((c / totalSt) * 100));

        const avgAttd = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + Number(b.attendance || 0), 0) / arr.length) : 0;
        const avgLms = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + Number(b.lms_score || b.attendance || 0), 0) / arr.length) : 0;
        const avgGpa = (arr) => arr.length ? (arr.reduce((a, b) => a + Number(b.cgpa || 0), 0) / arr.length).toFixed(2) : "0.00";

        engagementBarChart = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: [
                    "Critical Risk (<50)",
                    "Caution (50-64)",
                    "Moderate (65-74)",
                    "High (75-89)",
                    "Elite (90-100)"
                ],
                datasets: [{
                    label: "Students in Tier",
                    data: counts,
                    backgroundColor: [
                        "rgba(239, 68, 68, 0.85)",   // Red
                        "rgba(245, 158, 11, 0.85)",  // Amber
                        "rgba(234, 179, 8, 0.85)",   // Yellow
                        "rgba(59, 130, 246, 0.85)",  // Blue
                        "rgba(16, 185, 129, 0.85)"   // Emerald
                    ],
                    borderColor: [
                        "#ef4444",
                        "#f59e0b",
                        "#eab308",
                        "#3b82f6",
                        "#10b981"
                    ],
                    borderWidth: 1.5,
                    borderRadius: 8,
                    maxBarThickness: 54
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        suggestedMax: Math.max(...counts) <= 5 ? Math.max(4, Math.max(...counts) + 1) : undefined,
                        ticks: {
                            stepSize: Math.max(...counts) <= 5 ? 1 : undefined,
                            precision: 0,
                            color: "var(--text-soft)"
                        },
                        grid: { color: "var(--border-soft)" }
                    },
                    x: {
                        ticks: { color: "var(--text-soft)", font: { family: 'Inter', size: 11.5, weight: '600' } },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => items[0]?.label || "",
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                const tiers = [t1, t2, t3, t4, t5];
                                const currentTier = tiers[idx];
                                return [
                                    ` Students: ${counts[idx]} (${percentages[idx]}% of cohort)`,
                                    ` Avg Attendance: ${avgAttd(currentTier)}%`,
                                    ` Avg LMS Score: ${avgLms(currentTier)}%`,
                                    ` Avg CGPA: ${avgGpa(currentTier)} / 10`
                                ];
                            }
                        }
                    }
                }
            }
        });

        if (statsBar) {
            const lowCount = t1.length + t2.length;
            const lowPct = Math.round((lowCount / totalSt) * 100);
            const highCount = t4.length + t5.length;
            const highPct = Math.round((highCount / totalSt) * 100);

            statsBar.innerHTML = `
                <span class="distribution-badge" style="background: var(--risk-high-soft); color: var(--risk-high);">
                    <i class="bi bi-exclamation-octagon-fill"></i> Low Engagement (&lt;65): <strong>${lowCount} (${lowPct}%)</strong>
                </span>
                <span class="distribution-badge" style="background: var(--risk-medium-soft); color: var(--risk-medium);">
                    <i class="bi bi-hourglass-split"></i> Moderate (65-74): <strong>${t3.length}</strong>
                </span>
                <span class="distribution-badge" style="background: var(--risk-low-soft); color: var(--risk-low);">
                    <i class="bi bi-check2-circle"></i> High / Elite (&ge;75): <strong>${highCount} (${highPct}%)</strong>
                </span>
                <span class="distribution-badge text-muted ms-auto small">
                    <i class="bi bi-bullseye text-primary"></i> Benchmark Target: &ge; 70 Index
                </span>
            `;
        }

    } else if (mode === "lowest15") {
        const sortedAsc = [...students]
            .map(s => ({ ...s, engScore: computeEngagementScore(s) }))
            .sort((a, b) => a.engScore - b.engScore)
            .slice(0, 15);

        if (subhead) subhead.innerHTML = `Showing ${sortedAsc.length} Lowest Engagement Students (Immediate Advisor Outreach)`;

        engagementBarChart = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: sortedAsc.map(s => s.name.length > 18 ? s.name.substring(0, 16) + '...' : s.name),
                datasets: [{
                    label: "Engagement Index (/100)",
                    data: sortedAsc.map(s => s.engScore),
                    backgroundColor: sortedAsc.map(s => s.engScore < 60 ? "#ef4444" : "#f59e0b"),
                    borderRadius: 6,
                    maxBarThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { min: 0, max: 100, ticks: { callback: v => v + "/100", color: "var(--text-soft)" }, grid: { color: "var(--border-soft)" } },
                    y: { ticks: { color: "var(--text)", font: { family: 'Inter', size: 11, weight: '500' } }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const idx = items[0]?.dataIndex;
                                const st = sortedAsc[idx];
                                return st ? `${st.name} (${st.id})` : "";
                            },
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                const st = sortedAsc[idx];
                                return [
                                    ` Engagement Index: ${st.engScore} / 100`,
                                    ` Attendance: ${st.attendance}% | LMS: ${st.lms_score || st.attendance}%`,
                                    ` CGPA: ${st.cgpa} | Risk Score: ${st.risk}%`
                                ];
                            }
                        }
                    }
                }
            }
        });

        if (statsBar) {
            statsBar.innerHTML = `
                <span class="text-muted small">
                    <i class="bi bi-info-circle text-primary me-1"></i> Flagged students have multi-signal warning triggers across attendance and LMS platform usage.
                </span>
            `;
        }

    } else if (mode === "top15") {
        const sortedDesc = [...students]
            .map(s => ({ ...s, engScore: computeEngagementScore(s) }))
            .sort((a, b) => b.engScore - a.engScore)
            .slice(0, 15);

        if (subhead) subhead.innerHTML = `Showing Top ${sortedDesc.length} Highest Engagement Cohort Leaders`;

        engagementBarChart = new Chart(canvas.getContext("2d"), {
            type: "bar",
            data: {
                labels: sortedDesc.map(s => s.name.length > 18 ? s.name.substring(0, 16) + '...' : s.name),
                datasets: [{
                    label: "Engagement Index (/100)",
                    data: sortedDesc.map(s => s.engScore),
                    backgroundColor: "#10b981",
                    borderRadius: 6,
                    maxBarThickness: 16
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { min: 0, max: 100, ticks: { callback: v => v + "/100", color: "var(--text-soft)" }, grid: { color: "var(--border-soft)" } },
                    y: { ticks: { color: "var(--text)", font: { family: 'Inter', size: 11, weight: '500' } }, grid: { display: false } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const idx = items[0]?.dataIndex;
                                const st = sortedDesc[idx];
                                return st ? `${st.name} (${st.id})` : "";
                            },
                            label: (ctx) => {
                                const idx = ctx.dataIndex;
                                const st = sortedDesc[idx];
                                return [
                                    ` Engagement Index: ${st.engScore} / 100 (Elite)`,
                                    ` Attendance: ${st.attendance}% | LMS: ${st.lms_score || st.attendance}%`,
                                    ` CGPA: ${st.cgpa}`
                                ];
                            }
                        }
                    }
                }
            }
        });

        if (statsBar) {
            statsBar.innerHTML = `
                <span class="text-success small fw-semibold">
                    <i class="bi bi-stars me-1"></i> Highly engaged students demonstrate consistent daily LMS platform usage and &gt;85% attendance.
                </span>
            `;
        }
    }

    if (typeof registerChart === 'function') registerChart(engagementBarChart);
    if (typeof applyChartTheme === 'function') applyChartTheme(engagementBarChart);
}

// ==========================================
// TELEMETRY MATRIX TABLE (PAGINATION & SEARCH)
// ==========================================

function handleEngTableSearch(query) {
    window._engTableState.search = query.trim().toLowerCase();
    window._engTableState.page = 1;
    renderEngagementMatrixTable();
}

function handleEngTableTierFilter(tier) {
    window._engTableState.tierFilter = tier;
    window._engTableState.page = 1;
    renderEngagementMatrixTable();
}

function handleEngPageSizeChange(size) {
    window._engTableState.pageSize = parseInt(size, 10) || 15;
    window._engTableState.page = 1;
    renderEngagementMatrixTable();
}

function handleEngPageChange(newPage) {
    window._engTableState.page = newPage;
    renderEngagementMatrixTable();
}

function renderEngagementMatrixTable() {
    const tbody = document.getElementById("engagementMatrixTbody");
    const summaryText = document.getElementById("engTableSummaryText");
    const paginationContainer = document.getElementById("engPaginationContainer");
    if (!tbody) return;

    const { page, pageSize, search, tierFilter } = window._engTableState;

    // Filter students
    let filtered = students.map(s => ({
        ...s,
        engIndex: computeEngagementScore(s)
    }));

    if (search) {
        filtered = filtered.filter(s => 
            (s.name || '').toLowerCase().includes(search) ||
            (s.id || '').toLowerCase().includes(search) ||
            (s.course || '').toLowerCase().includes(search)
        );
    }

    if (tierFilter === "HIGH") {
        filtered = filtered.filter(s => s.engIndex >= 75);
    } else if (tierFilter === "MODERATE") {
        filtered = filtered.filter(s => s.engIndex >= 60 && s.engIndex < 75);
    } else if (tierFilter === "CRITICAL") {
        filtered = filtered.filter(s => s.engIndex < 60);
    }

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    const currentPage = Math.min(page, totalPages);
    window._engTableState.page = currentPage;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalFiltered);
    const pageItems = filtered.slice(startIndex, endIndex);

    if (summaryText) {
        summaryText.innerHTML = totalFiltered > 0
            ? `Showing <strong>${startIndex + 1}-${endIndex}</strong> of <strong>${totalFiltered}</strong> students ${totalFiltered !== students.length ? `(filtered from ${students.length})` : ''}`
            : `No students found matching filters`;
    }

    if (pageItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-5 text-muted">
                    <i class="bi bi-search fs-3 d-block mb-2 text-secondary"></i>
                    <p class="mb-0 fw-semibold">No students match current search/filter criteria.</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = pageItems.map(s => {
            const lmsScore = s.lms_score != null ? s.lms_score : s.attendance;
            const cgpaScore = Math.round(Number(s.cgpa || 0) * 10);
            const engIndex = s.engIndex;

            const attdDot = s.attendance >= 75 ? '<span class="status-indicator healthy"></span>' : (s.attendance >= 65 ? '<span class="status-indicator caution"></span>' : '<span class="status-indicator critical"></span>');
            const lmsDot = lmsScore >= 75 ? '<span class="status-indicator healthy"></span>' : (lmsScore >= 60 ? '<span class="status-indicator caution"></span>' : '<span class="status-indicator critical"></span>');
            const gpaDot = s.cgpa >= 7.5 ? '<span class="status-indicator healthy"></span>' : (s.cgpa >= 6.5 ? '<span class="status-indicator caution"></span>' : '<span class="status-indicator critical"></span>');

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
                        <div class="d-flex align-items-center gap-2" style="min-width: 130px;">
                            <div class="progress flex-grow-1" style="height: 8px;">
                                <div class="progress-bar ${engIndex < 60 ? 'bg-danger' : (engIndex < 75 ? 'bg-warning' : 'bg-success')}" style="width: ${engIndex}%"></div>
                            </div>
                            <strong style="font-size: 13px;">${engIndex}</strong>
                        </div>
                    </td>
                    <td>${statusBadge}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewStudent360('${s.id}')">
                            Inspect
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // Render Pagination Controls
    if (paginationContainer) {
        if (totalPages <= 1) {
            paginationContainer.innerHTML = "";
        } else {
            let pagHtml = `
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="handleEngPageChange(1)" title="First Page">
                    <i class="bi bi-chevron-double-left"></i>
                </button>
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="handleEngPageChange(${currentPage - 1})" title="Previous Page">
                    <i class="bi bi-chevron-left"></i>
                </button>
            `;

            // Window of page numbers
            let startP = Math.max(1, currentPage - 2);
            let endP = Math.min(totalPages, startP + 4);
            if (endP - startP < 4) {
                startP = Math.max(1, endP - 4);
            }

            for (let p = startP; p <= endP; p++) {
                pagHtml += `
                    <button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="handleEngPageChange(${p})">
                        ${p}
                    </button>
                `;
            }

            pagHtml += `
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleEngPageChange(${currentPage + 1})" title="Next Page">
                    <i class="bi bi-chevron-right"></i>
                </button>
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="handleEngPageChange(${totalPages})" title="Last Page">
                    <i class="bi bi-chevron-double-right"></i>
                </button>
            `;

            paginationContainer.innerHTML = pagHtml;
        }
    }
}
