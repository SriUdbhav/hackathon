/* =====================================================
   ENGAGEMENT.JS
   Multi-signal engagement breakdown page
===================================================== */

function renderEngagement() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Multi-Signal Engagement Dashboard</h1>
            <p class="text-muted small mb-0">Combining Attendance, LMS login streaks, Assessment scores & Assignments</p>
        </div>

        <div class="card-box p-4">
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Attendance Signal</th>
                            <th>LMS Activity</th>
                            <th>Assignment Signal</th>
                            <th>Engagement Index</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                            const lmsScore = s.lms_score || Math.min(100, s.attendance + 5);
                            const engIndex = Math.round((s.attendance * 0.35) + (s.cgpa * 10 * 0.30) + (lmsScore * 0.35));
                            return `
                                <tr>
                                    <td><strong>${s.id}</strong></td>
                                    <td>${s.name}</td>
                                    <td>${s.attendance}%</td>
                                    <td>${lmsScore}%</td>
                                    <td>${Math.round(s.cgpa * 10)}%</td>
                                    <td><span class="badge bg-primary fs-6">${engIndex}/100</span></td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}
