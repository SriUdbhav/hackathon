/* =====================================================
   ANALYTICS.JS
   Performance analytics & distribution graphs overview
===================================================== */

function renderAnalytics() {
    const content = document.getElementById("pageContent");
    if (!content) return;

    content.innerHTML = `
        <div class="mb-4">
            <h1 class="h3 fw-bold mb-1">Academic Analytics & Trends</h1>
            <p class="text-muted small mb-0">Aggregate performance analytics across sections and courses</p>
        </div>

        <div class="row g-4 mb-4">
            <div class="col-md-6">
                <div class="card-box">
                    <div class="card-head">
                        <h3>Risk Category Distribution</h3>
                    </div>
                    <div class="p-3 text-center">
                        <div class="d-flex justify-content-around align-items-center my-4">
                            <div>
                                <h3 class="text-danger fw-bold mb-0">${students.filter(s => s.risk >= 60).length}</h3>
                                <small class="text-muted">High Risk</small>
                            </div>
                            <div>
                                <h3 class="text-warning fw-bold mb-0">${students.filter(s => s.risk >= 30 && s.risk < 60).length}</h3>
                                <small class="text-muted">Moderate</small>
                            </div>
                            <div>
                                <h3 class="text-success fw-bold mb-0">${students.filter(s => s.risk < 30).length}</h3>
                                <small class="text-muted">Low Risk</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="card-box">
                    <div class="card-head">
                        <h3>Course Academic Averages</h3>
                    </div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Computer Science (CSE)</span>
                            <strong>8.1 CGPA / 78% Attd</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Information Technology (IT)</span>
                            <strong>7.8 CGPA / 82% Attd</strong>
                        </li>
                        <li class="list-group-item d-flex justify-content-between">
                            <span>Electronics (ECE)</span>
                            <strong>7.5 CGPA / 74% Attd</strong>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}
